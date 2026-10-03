"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import {
  attachCheckoutSession,
  createPendingOrder,
  getOrderBySessionId,
  releaseAbandonedOrders,
  releaseOrder,
} from "@/db/orders";
import { readBagEntries, resolveBag, writeBagEntries } from "@/lib/bag";
import {
  cancelOwnCheckout,
  forgetCheckout,
  getOwnCheckout,
  rememberCheckout,
  syncPendingOrder,
} from "@/lib/checkout";
import { getSession } from "@/lib/session";
import { getStripe, siteUrl } from "@/lib/stripe";

// Labels these sessions in the Stripe Dashboard.
const INTEGRATION_IDENTIFIER = "atelier-bag-checkout-qhzkwmtr";

// Takes the bag to Stripe. It has no parameters on purpose: what is bought
// comes from the bag cookie, and every name, price and stock figure comes
// from the database.
export async function startCheckout() {
  // An earlier checkout from this browser gives its stock back first, so a
  // customer is never refused by their own hold.
  const ended = await cancelOwnCheckout();
  // It was completed at Stripe after all, so this bag is already bought:
  // show that order instead of selling the same pieces twice.
  if (ended.state === "bought" && ended.order.stripeCheckoutSessionId) {
    await writeBagEntries([]);
    redirect(
      `/checkout/success?session_id=${encodeURIComponent(ended.order.stripeCheckoutSessionId)}`,
    );
  }
  // Stripe cannot be reached, so a new payment page could not be opened
  // either. The earlier checkout keeps its hold until it can be closed.
  if (ended.state === "open") redirect("/checkout?status=error");

  // Holds left by a checkout that died before it reached Stripe would
  // otherwise never be given back.
  await releaseAbandonedOrders();

  const bag = await resolveBag(await readBagEntries());
  // Empty, or something was dropped or reduced: the bag page explains it.
  if (bag.lines.length === 0 || bag.notices.length > 0) redirect("/bag");

  const session = await getSession();
  const order = await createPendingOrder({
    lines: bag.lines,
    userId: session ? Number(session.user.id) : null,
  });
  // Someone else took the stock between the check above and the write.
  if (!order) redirect("/bag?checkout=stock");

  let checkout: { id: string; url: string | null } | null = null;
  try {
    const created = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: bag.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: order.currency,
            unit_amount: line.product.priceCents,
            product_data: {
              name: line.product.name,
              images: line.product.images.slice(0, 1).map((image) => image.src),
            },
          },
        })),
        client_reference_id: order.reference,
        metadata: { order_reference: order.reference },
        customer_email: session?.user.email,
        shipping_address_collection: { allowed_countries: ["US"] },
        expires_at: Math.floor(order.expiresAt.getTime() / 1000),
        success_url: siteUrl(
          "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        ),
        cancel_url: siteUrl("/checkout/cancel"),
        integration_identifier: INTEGRATION_IDENTIFIER,
      },
      // A retry of this request cannot create a second session for the order.
      { idempotencyKey: `checkout-${order.reference}` },
    );

    await attachCheckoutSession(order.id, created.id);
    checkout = created;
  } catch (error) {
    console.error(`[checkout] ${order.reference}: could not start`, error);
  }

  if (!checkout?.url) {
    await releaseOrder(order.id, "failed");
    redirect("/checkout?status=error");
  }

  await rememberCheckout(checkout.id);
  redirect(checkout.url);
}

// Empties the bag once its order is bought. The confirmation page calls this,
// since a page cannot write cookies. It only acts for the checkout this
// browser started, so an old confirmation link cannot empty a new bag, and
// only when the order is bought: the database says it is paid, or Stripe says
// its checkout is complete and the bank has still to release the money.
export async function finishCheckout(sessionId: string) {
  if (typeof sessionId !== "string") return;

  const [order, own] = await Promise.all([
    getOrderBySessionId(sessionId),
    getOwnCheckout(),
  ]);
  if (!order || own?.id !== order.id) return;

  const bought =
    order.status === "paid" ||
    (await syncPendingOrder(order))?.status === "complete";
  if (!bought) return;

  await writeBagEntries([]);
  await forgetCheckout();
  refresh();
}

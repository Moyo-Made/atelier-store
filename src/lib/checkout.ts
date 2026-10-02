// The server's side of checkout: what Stripe says about a session, turned
// into the state of our order. Nothing here takes the browser's word for
// whether a payment happened.
import { cookies } from "next/headers";
import type Stripe from "stripe";

import {
  getOrderByReference,
  getOrderBySessionId,
  markOrderPaid,
  releaseOrder,
  type Order,
} from "@/db/orders";
import type { ShippingAddress } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

// Names the order this browser last took to Stripe, so that coming back can
// cancel it. HttpOnly: unlike the bag cookie, the page has no use for it.
const CHECKOUT_COOKIE = "atelier_checkout";

export async function rememberCheckout(reference: string) {
  (await cookies()).set(CHECKOUT_COOKIE, reference, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function forgetCheckout() {
  (await cookies()).delete(CHECKOUT_COOKIE);
}

export async function getOwnCheckout() {
  const reference = (await cookies()).get(CHECKOUT_COOKIE)?.value;
  if (!reference || !/^AT-[2-9A-Z]{10}$/.test(reference)) return undefined;
  return getOrderByReference(reference);
}

// Units this browser's open checkout is holding. The bag adds them back to
// what is available, so a customer's own hold does not make their bag look
// sold out.
export async function getHeldQuantities() {
  const held = new Map<number, number>();
  const order = await getOwnCheckout();
  if (order?.status !== "pending") return held;

  for (const item of order.items) {
    if (item.reservedStock) held.set(item.productId, item.quantity);
  }
  return held;
}

function shippingFrom(session: Stripe.Checkout.Session) {
  const details = session.collected_information?.shipping_details;
  const address = details?.address;
  if (!details || !address) return { name: null, address: null };

  const shippingAddress: ShippingAddress = {
    line1: address.line1 ?? "",
    line2: address.line2 ?? null,
    city: address.city ?? "",
    state: address.state ?? "",
    postalCode: address.postal_code ?? "",
    country: address.country ?? "",
  };
  return { name: details.name, address: shippingAddress };
}

// Brings our order in line with a Checkout Session that came from Stripe (a
// retrieve with our key, or a verified webhook event). This is the one place
// an order becomes paid, and it is safe to call any number of times.
export async function settleFromSession(session: Stripe.Checkout.Session) {
  const order = await getOrderBySessionId(session.id);
  if (!order || order.status === "paid") return order;

  // `complete` with `unpaid` is a delayed payment method still in flight.
  const paid = session.status === "complete" && session.payment_status !== "unpaid";
  if (!paid) return order;

  if (
    session.amount_total !== order.totalCents ||
    session.currency !== order.currency
  ) {
    console.error(
      `[checkout] ${order.reference}: Stripe charged ${session.amount_total} ${session.currency}, the order is ${order.totalCents} ${order.currency}. Left unpaid for review.`,
    );
    return order;
  }

  const shipping = shippingFrom(session);
  const details = {
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    email: session.customer_details?.email ?? null,
    shippingName: shipping.name,
    shippingAddress: shipping.address,
  };

  if (!(await markOrderPaid(order.id, details))) {
    // Not pending any more. If it was released, the money has still arrived:
    // record that, and leave the stock for a person to check.
    if (await markOrderPaid(order.id, details, ["expired", "failed"])) {
      console.error(
        `[checkout] ${order.reference}: paid after its stock was released. Check stock by hand.`,
      );
    }
  }

  return getOrderBySessionId(session.id);
}

// Stripe has closed a session without payment: it expired, or a delayed
// payment failed. Gives the order's stock back. Returns whether this call was
// the one that released it; a repeat, or a session that is not ours, is false.
export async function releaseFromSession(
  sessionId: string,
  status: "expired" | "failed",
) {
  const order = await getOrderBySessionId(sessionId);
  if (!order) return false;
  return releaseOrder(order.id, status);
}

// Ends a checkout that has not been paid: closes the Stripe session so it
// cannot be paid later, then gives the stock back. If Stripe says it was paid
// after all, the order is settled instead. Returns the order as it now is.
export async function cancelCheckout(order: Order) {
  if (order.status !== "pending") return order;

  if (order.stripeCheckoutSessionId) {
    const stripe = getStripe();
    try {
      await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch {
      // Only an open session can be expired. Find out which way it closed.
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeCheckoutSessionId,
      );
      if (session.status === "complete") {
        return (await settleFromSession(session)) ?? order;
      }
      if (session.status === "open") {
        throw new Error(`Could not close the checkout for ${order.reference}`);
      }
    }
  }

  await releaseOrder(order.id, "expired");
  return (await getOrderByReference(order.reference)) ?? order;
}

// The same, for whatever checkout this browser has open. Called before the
// bag changes or a new checkout starts: a customer never competes with their
// own hold, and an open Stripe page never outlives the bag it was made from.
export async function cancelOwnCheckout() {
  const order = await getOwnCheckout();
  if (!order) return;
  await cancelCheckout(order);
  await forgetCheckout();
}

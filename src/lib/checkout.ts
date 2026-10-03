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
//
// It holds the Checkout Session id, not the order's reference. Whoever sends
// this value can cancel the checkout, and a reference is no secret: it is the
// order number the customer reads out and forwards. The session id is long,
// random, and already what allows the confirmation page to be seen.
const CHECKOUT_COOKIE = "atelier_checkout";

// The shape of a Checkout Session id, `cs_test_…` or `cs_live_…`.
export const CHECKOUT_SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export async function rememberCheckout(sessionId: string) {
  (await cookies()).set(CHECKOUT_COOKIE, sessionId, {
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
  const sessionId = (await cookies()).get(CHECKOUT_COOKIE)?.value;
  if (!sessionId || !CHECKOUT_SESSION_ID.test(sessionId)) return undefined;
  return getOrderBySessionId(sessionId);
}

// Units this browser's open checkout (from `getOwnCheckout`) is holding. The
// bag adds them back to what is available, so a customer's own hold does not
// make their bag look sold out.
export function getHeldQuantities(order: Order | undefined) {
  const held = new Map<number, number>();
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
  if (!shipping.address) {
    console.error(
      `[checkout] ${order.reference}: paid, but the session has no delivery address. Check it in Stripe.`,
    );
  }
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

// What a pending order is waiting for, from the session Stripe returned.
//   confirming  the payment may have been made; we are waiting to hear
//   bank        Stripe has the payment, the bank has not released it yet
//   unpaid      Stripe's page is still open and nothing has been paid
export type PendingState = "confirming" | "bank" | "unpaid";

export function pendingState(
  session: Stripe.Checkout.Session | null,
): PendingState {
  // Stripe could not be asked. The webhook will still settle the order.
  if (!session) return "confirming";
  if (session.status === "open") return "unpaid";
  return session.payment_status === "unpaid" ? "bank" : "confirming";
}

// Brings a pending order in line with Stripe when a customer looks at it, in
// case the webhook has not arrived: a paid session settles the order and an
// expired one releases it, through the same guarded transitions the webhook
// uses. Returns the session, or null when the order is already decided or
// Stripe cannot be reached; the caller then shows what the database says.
export async function syncPendingOrder(
  order: Pick<Order, "status" | "reference" | "stripeCheckoutSessionId">,
) {
  if (order.status !== "pending" || !order.stripeCheckoutSessionId) return null;

  try {
    const session = await getStripe().checkout.sessions.retrieve(
      order.stripeCheckoutSessionId,
    );
    if (session.status === "expired") {
      await releaseFromSession(session.id, "expired");
    } else {
      await settleFromSession(session);
    }
    return session;
  } catch (error) {
    console.error(`[checkout] ${order.reference}: could not ask Stripe`, error);
    return null;
  }
}

// Stripe could not be reached, or would not close the session. The session
// may still be open, so it can still be paid: the order keeps its stock.
export class CheckoutNotClosed extends Error {}

// Ends a checkout that has not been paid: closes the Stripe session so it
// cannot be paid later, then gives the stock back. If Stripe says it was paid
// after all, the order is settled instead. Returns the order as it now is.
// Throws `CheckoutNotClosed`, with nothing changed, when the session could
// not be closed.
export async function cancelCheckout(order: Order) {
  if (order.status !== "pending") return order;

  if (order.stripeCheckoutSessionId) {
    const stripe = getStripe();
    try {
      await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch {
      // Only an open session can be expired. Find out which way it closed.
      const session = await stripe.checkout.sessions
        .retrieve(order.stripeCheckoutSessionId)
        .catch((cause: unknown) => {
          throw new CheckoutNotClosed(
            `Could not ask Stripe about the checkout for ${order.reference}`,
            { cause },
          );
        });
      if (session.status === "complete") {
        return (await settleFromSession(session)) ?? order;
      }
      if (session.status === "open") {
        throw new CheckoutNotClosed(
          `Could not close the checkout for ${order.reference}`,
        );
      }
    }
  }

  await releaseOrder(order.id, "expired");
  return (await getOrderByReference(order.reference)) ?? order;
}

// What became of this browser's checkout when it was asked to end.
//   closed  there was none, or it is cancelled and its stock is back
//   bought  it had been completed at Stripe: the order is paid, or still
//           pending with the bank yet to release the money (the one case
//           `cancelCheckout` leaves pending). It bought the bag it was made
//           from, so the caller empties the bag.
//   open    Stripe could not close it. It still holds its stock and is still
//           remembered, so the next change tries again.
export type EndedCheckout =
  | { state: "closed" }
  | { state: "bought"; order: Order }
  | { state: "open"; order: Order };

// The same, for whatever checkout this browser has open. Called before the
// bag changes or a new checkout starts: a customer never competes with their
// own hold, and an open Stripe page does not outlive the bag it was made from
// unless Stripe cannot be reached.
export async function cancelOwnCheckout(): Promise<EndedCheckout> {
  const order = await getOwnCheckout();
  if (!order) return { state: "closed" };

  let closed: Order;
  try {
    closed = await cancelCheckout(order);
  } catch (error) {
    if (!(error instanceof CheckoutNotClosed)) throw error;
    console.error(`[checkout] ${error.message}`, error.cause);
    return { state: "open", order };
  }

  await forgetCheckout();
  return closed.status === "paid" || closed.status === "pending"
    ? { state: "bought", order: closed }
    : { state: "closed" };
}

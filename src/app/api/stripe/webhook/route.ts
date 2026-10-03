import type Stripe from "stripe";

import { releaseFromSession, settleFromSession } from "@/lib/checkout";
import { getStripe } from "@/lib/stripe";

// Stripe's account of what happened to a checkout, sent server to server.
// This, not the customer's return to the site, is what settles an order: a
// customer can pay and never come back, or leave and never pay.
//
// Stripe delivers an event at least once and in no promised order. Both are
// safe here because every change below is guarded on the order's current
// status: a second delivery, or an event that arrives after the order has
// already moved on, changes nothing.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook is not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = getStripe();
  // The signature is computed over the exact bytes Stripe sent, so the body
  // is read as text and never re-serialised.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    // Not from Stripe, altered on the way, or older than the five minutes
    // the SDK allows. Nothing in the body is acted on.
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      // `completed` fires when the customer finishes Stripe's page. With a
      // delayed payment method it arrives unpaid and the second event follows
      // when the money does. `settleFromSession` only marks an order paid
      // when the session says it is.
      //
      // The session is read again with our key instead of taken from the
      // event: the event's copy has the shape of the endpoint's API version,
      // which can be older than the SDK's and keep the delivery address
      // somewhere `settleFromSession` does not look.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await settleFromSession(
          await stripe.checkout.sessions.retrieve(event.data.object.id),
        );
        break;

      // Nobody paid before the session ran out, including a customer who
      // closed the tab.
      case "checkout.session.expired":
        await releaseFromSession(event.data.object.id, "expired");
        break;

      case "checkout.session.async_payment_failed":
        await releaseFromSession(event.data.object.id, "failed");
        break;

      // Anything else the endpoint is subscribed to is acknowledged and ignored.
      default:
        break;
    }
  } catch (error) {
    // Most likely the database. A 500 makes Stripe deliver the event again.
    console.error(`[stripe webhook] ${event.type} ${event.id} failed`, error);
    return new Response("Could not process the event", { status: 500 });
  }

  return Response.json({ received: true });
}

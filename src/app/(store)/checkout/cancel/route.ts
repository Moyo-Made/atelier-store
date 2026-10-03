import { redirect } from "next/navigation";

import {
  cancelCheckout,
  CheckoutNotClosed,
  forgetCheckout,
  getOwnCheckout,
} from "@/lib/checkout";

// Where Stripe's "back" link lands. The checkout this browser started is
// closed at Stripe and its stock is given back; the bag is left as it was,
// and the customer lands on the checkout review to try again.
export async function GET() {
  const order = await getOwnCheckout();
  if (!order) redirect("/bag");

  let closed;
  try {
    closed = await cancelCheckout(order);
  } catch (error) {
    if (!(error instanceof CheckoutNotClosed)) throw error;
    // Stripe cannot be reached. The checkout stays as it is, still
    // remembered, and the next change to the bag tries to close it again.
    console.error(`[checkout] ${error.message}`, error.cause);
    redirect("/checkout");
  }

  // It turned out to be paid (or is being confirmed): show that instead.
  if (
    (closed.status === "paid" || closed.status === "pending") &&
    closed.stripeCheckoutSessionId
  ) {
    redirect(
      `/checkout/success?session_id=${encodeURIComponent(closed.stripeCheckoutSessionId)}`,
    );
  }

  await forgetCheckout();
  redirect("/checkout?status=cancelled");
}

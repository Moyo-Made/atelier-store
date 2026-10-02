import { redirect } from "next/navigation";

import { cancelCheckout, forgetCheckout, getOwnCheckout } from "@/lib/checkout";

// Where Stripe's "back" link lands. The checkout this browser started is
// closed at Stripe and its stock is given back; the bag is left as it was,
// and the customer lands on the checkout review to try again.
export async function GET() {
  const order = await getOwnCheckout();
  if (!order) redirect("/bag");

  const closed = await cancelCheckout(order);

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

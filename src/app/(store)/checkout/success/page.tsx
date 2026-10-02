import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type Stripe from "stripe";
import { FinishCheckout } from "@/components/finish-checkout";
import { OrderStatusWatcher } from "@/components/order-status-watcher";
import {
  orderSummaryLines,
  SummaryAddress,
  SummaryLines,
  SummaryTotals,
} from "@/components/order-summary";
import { getOrderBySessionId, type Order } from "@/db/orders";
import { pendingState, settleFromSession } from "@/lib/checkout";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Your order | Atelier Store",
  robots: { index: false },
};

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// What to tell a customer whose order is not (yet) paid.
//   confirming  the payment may have been made; we are waiting to hear
//   bank        Stripe has the payment, the bank has not released it yet
//   unpaid      the customer left Stripe's page without paying
//   ended       the checkout expired or the payment failed; stock was released
type Waiting = "confirming" | "bank" | "unpaid" | "ended";

function waitingState(
  order: Order,
  session: Stripe.Checkout.Session | null,
): Waiting {
  return order.status === "pending" ? pendingState(session) : "ended";
}

// Where Stripe sends the customer after its payment page. Arriving here
// proves nothing. What is shown is the order's state in our database, which
// only Stripe can move to paid: through the webhook, or through the check
// made below with our key. The session id in the address is what allows this
// order to be seen.
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) notFound();

  let order = await getOrderBySessionId(sessionId);
  if (!order) notFound();

  // Only an undecided order is worth asking Stripe about. If Stripe cannot
  // be reached the page still works: it shows the pending state and the
  // webhook settles the order.
  let session: Stripe.Checkout.Session | null = null;
  if (order.status === "pending") {
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
      order = (await settleFromSession(session)) ?? order;
    } catch (error) {
      console.error(`[checkout] ${order.reference}: could not ask Stripe`, error);
    }
  }

  const lines = orderSummaryLines(order.items);

  if (order.status !== "paid") {
    const waiting = waitingState(order, session);
    const copy = {
      confirming: {
        title: "Confirming your payment",
        text: "We are waiting for Stripe to confirm the payment. This usually takes a few seconds. Please do not pay again.",
        action: null,
      },
      bank: {
        title: "Your payment is being processed",
        text: "Your bank has not released the payment yet. With some payment methods this takes a few days. Your pieces are held for you, and nothing more is needed.",
        action: { label: "Continue shopping", href: "/new" },
      },
      unpaid: {
        title: "This order has not been paid",
        text: "The payment was not completed, so you have not been charged. Your pieces are still in your bag.",
        action: { label: "Return to checkout", href: "/checkout" },
      },
      ended: {
        title:
          order.status === "failed"
            ? "The payment did not go through"
            : "This checkout has ended",
        text: "You have not been charged, and the pieces are no longer held for you. You can check out again from your bag.",
        action: { label: "Return to your bag", href: "/bag" },
      },
    }[waiting];

    return (
      <main className="flex-1 pt-header">
        <div className="shell-reading py-section">
          <p className="type-caption text-muted">Order {order.reference}</p>
          <h1 className="type-headline mt-4">{copy.title}</h1>
          <p className="type-lead mt-4 text-muted">{copy.text}</p>

          {waiting === "confirming" ? <OrderStatusWatcher /> : null}
          {copy.action ? (
            <Link href={copy.action.href} className="btn btn-primary mt-10">
              {copy.action.label}
            </Link>
          ) : null}

          <section aria-labelledby="items-title" className="mt-12">
            <h2 id="items-title" className="type-ui mb-5">
              In this order
            </h2>
            <SummaryLines lines={lines} />
            {waiting === "confirming" || waiting === "bank" ? (
              <div className="py-5">
                <SummaryTotals subtotalCents={order.totalCents} />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  const address = order.shippingAddress;

  return (
    <main className="flex-1 pt-header">
      <FinishCheckout sessionId={sessionId} />

      <div className="shell-reading py-section">
        <p className="type-caption text-muted">Order confirmed</p>
        <h1 className="type-headline mt-4">Thank you for your order</h1>
        <p className="type-lead mt-4 text-muted">
          Your payment is confirmed. Keep the order number for any question
          about it.
        </p>

        <dl className="mt-10 grid gap-6 border-y py-6 md:grid-cols-3">
          <div>
            <dt className="type-caption text-muted">Order number</dt>
            <dd className="type-body mt-1">{order.reference}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted">Paid on</dt>
            <dd className="type-body mt-1">
              {order.paidAt ? dateFormat.format(order.paidAt) : null}
            </dd>
          </div>
          {order.email ? (
            <div className="min-w-0">
              <dt className="type-caption text-muted">Email</dt>
              <dd className="type-body mt-1 break-words">{order.email}</dd>
            </div>
          ) : null}
        </dl>

        <section aria-labelledby="items-title" className="mt-12">
          <h2 id="items-title" className="type-ui mb-5">
            Your pieces
          </h2>
          <SummaryLines lines={lines} />
          <div className="py-5">
            <SummaryTotals
              subtotalCents={order.totalCents}
              totalLabel="Total paid"
            />
          </div>
        </section>

        {address ? (
          <section
            aria-labelledby="shipping-title"
            className="mt-6 border-t pt-8"
          >
            <h2 id="shipping-title" className="type-ui">
              Delivering to
            </h2>
            <div className="mt-4">
              <SummaryAddress name={order.shippingName} address={address} />
            </div>
          </section>
        ) : null}

        <Link href="/new" className="btn btn-secondary mt-12">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

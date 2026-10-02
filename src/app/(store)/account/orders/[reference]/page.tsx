import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  orderSummaryLines,
  SummaryAddress,
  SummaryLines,
  SummaryTotals,
} from "@/components/order-summary";
import { getOrderForUser } from "@/db/orders";
import { pendingState, syncPendingOrder } from "@/lib/checkout";
import {
  formatOrderDate,
  ORDER_REFERENCE,
  orderHref,
  orderStatusLabel,
} from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order | Atelier Store",
  robots: { index: false },
};

// The order's state in the customer's words. A pending order is one of three
// things, told apart by what Stripe says about its checkout.
const states = {
  paid: {
    title: orderStatusLabel("paid"),
    text: "Your payment is confirmed. Keep the order number for any question about it.",
  },
  confirming: {
    title: "Confirming your payment",
    text: "We are waiting for Stripe to confirm the payment. This usually takes a few seconds. Please do not pay again.",
  },
  bank: {
    title: "Payment being processed",
    text: "Your bank has not released the payment yet. With some payment methods this takes a few days. Your pieces are held for you, and nothing more is needed.",
  },
  unpaid: {
    title: orderStatusLabel("pending"),
    text: "This order has not been paid, so you have not been charged. Your pieces are held for you while its checkout is open.",
  },
  failed: {
    title: orderStatusLabel("failed"),
    text: "The payment did not go through, so you have not been charged and the pieces are no longer held for you.",
  },
  expired: {
    title: orderStatusLabel("expired"),
    text: "This checkout ended without a payment. You have not been charged, and the pieces are no longer held for you.",
  },
};

// One order in the customer's account. It is found by its reference and the
// signed-in customer together: someone else's order is a 404, the same as one
// that does not exist. The state shown is the database's; only while the
// order is pending is Stripe asked first, so the page does not go on saying
// "awaiting payment" when a webhook is late or lost.
export default async function OrderPage({
  params,
}: PageProps<"/account/orders/[reference]">) {
  const { reference } = await params;
  if (!ORDER_REFERENCE.test(reference)) notFound();

  const { user } = await requireUser(orderHref({ reference }));
  const userId = Number(user.id);
  let order = await getOrderForUser(userId, reference);
  if (!order) notFound();

  const session = await syncPendingOrder(order);
  if (session?.status === "expired") {
    // Just released, which takes it out of the order history. It is shown
    // this once so the customer sees what became of it.
    order = { ...order, status: "expired" };
  } else if (session) {
    order = (await getOrderForUser(userId, reference)) ?? order;
  }

  const state =
    states[order.status === "pending" ? pendingState(session) : order.status];
  const closed = order.status === "failed" || order.status === "expired";
  const pieces = order.items.reduce((count, item) => count + item.quantity, 0);
  const address = order.shippingAddress;

  return (
    <article aria-labelledby="order-title" className="max-w-reading">
      <p className="type-caption text-muted">
        Placed on{" "}
        <time dateTime={order.createdAt.toISOString()}>
          {formatOrderDate(order.createdAt)}
        </time>
      </p>
      <h2 id="order-title" className="type-title mt-2">
        Order {order.reference}
      </h2>

      <section
        aria-labelledby="state-title"
        className={`mt-8 border-l-2 pl-4 ${closed ? "border-danger" : "border-foreground"}`}
      >
        <h3 id="state-title" className="type-heading">
          {state.title}
        </h3>
        <p className="type-body mt-2 text-muted">{state.text}</p>
      </section>

      {order.paidAt ? (
        <dl className="mt-8 grid gap-6 border-y py-6 md:grid-cols-2">
          <div>
            <dt className="type-caption text-muted">Paid on</dt>
            <dd className="type-body mt-1">
              <time dateTime={order.paidAt.toISOString()}>
                {formatOrderDate(order.paidAt)}
              </time>
            </dd>
          </div>
          {order.email ? (
            <div className="min-w-0">
              <dt className="type-caption text-muted">Email</dt>
              <dd className="type-body mt-1 break-words">{order.email}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <section aria-labelledby="items-title" className="mt-10">
        <div className="mb-5 flex items-baseline justify-between gap-6">
          <h3 id="items-title" className="type-ui">
            In this order
          </h3>
          <p className="type-ui shrink-0 text-muted">
            {pieces} {pieces === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <SummaryLines lines={orderSummaryLines(order.items)} />
        <div className="py-5">
          <SummaryTotals
            subtotalCents={order.totalCents}
            totalLabel={order.status === "paid" ? "Total paid" : "Total"}
          />
        </div>
      </section>

      {address ? (
        <section aria-labelledby="shipping-title" className="mt-6 border-t pt-8">
          <h3 id="shipping-title" className="type-ui">
            Delivering to
          </h3>
          <div className="mt-4">
            <SummaryAddress name={order.shippingName} address={address} />
          </div>
        </section>
      ) : null}

      <Link
        href="/account/orders"
        prefetch={false}
        className="btn btn-secondary mt-12"
      >
        All orders
      </Link>
    </article>
  );
}

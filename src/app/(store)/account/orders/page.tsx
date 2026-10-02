import type { Metadata } from "next";
import Link from "next/link";
import { getOrdersForUser } from "@/db/orders";
import { formatOrderDate, orderHref, orderStatusLabel } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Orders | Atelier Store",
  robots: { index: false },
};

// The signed-in customer's orders, newest first. Whose orders these are
// comes from the session alone.
export default async function OrdersPage() {
  const { user } = await requireUser("/account/orders");
  const orders = await getOrdersForUser(Number(user.id));

  return (
    <section aria-labelledby="orders-title">
      <div className="flex items-baseline justify-between gap-6">
        <h2 id="orders-title" className="type-title">
          Orders
        </h2>
        {orders.length > 0 ? (
          <p className="type-ui shrink-0 text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 border-t pt-6">
          <p className="type-body text-muted">
            You have not placed an order yet. Orders you place while signed in
            are kept here.
          </p>
          <Link href="/new" className="btn btn-primary mt-8">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y border-y">
          {orders.map((order) => (
            // Two columns on a phone (number and date, then status, beside
            // the total and the link); one row of four from `md`.
            <li
              key={order.reference}
              className="relative grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-2 py-5 md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,2fr)_auto] md:gap-x-grid"
            >
              <div className="min-w-0">
                <h3 className="type-body">{order.reference}</h3>
                <p className="type-caption mt-1 text-muted">
                  <time dateTime={order.createdAt.toISOString()}>
                    {formatOrderDate(order.createdAt)}
                  </time>
                </p>
              </div>
              <p className="type-caption order-3 md:order-none">
                {orderStatusLabel(order.status)}
              </p>
              <p className="order-2 text-right font-medium md:order-none">
                {formatPrice(order.totalCents)}
              </p>
              {/* The link's box is stretched over the row, so all of it opens the order. */}
              <Link
                href={orderHref(order)}
                prefetch={false}
                className="link type-ui order-4 text-right after:absolute after:inset-0 md:order-none"
              >
                View order
                <span className="sr-only"> {order.reference}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

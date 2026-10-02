// Order helpers with no database import, so client components can use them.
import type { OrderStatus } from "@/db/schema";

// The shape `newReference` in `src/db/orders.ts` writes.
export const ORDER_REFERENCE = /^AT-[2-9A-Z]{10}$/;

export const orderHref = (order: { reference: string }) =>
  `/account/orders/${order.reference}`;

// The payment state in the customer's words.
const statusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  expired: "Not paid",
  failed: "Payment failed",
};

export const orderStatusLabel = (status: OrderStatus) => statusLabels[status];

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatOrderDate = (date: Date) => dateFormat.format(date);

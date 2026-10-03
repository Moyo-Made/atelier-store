// Every read and write of orders goes through this file. Each change of
// status is a single guarded statement, so running it twice does nothing the
// second time.
import { randomBytes } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";

import type { BagLine } from "@/lib/bag";

import { constraintOf } from "./errors";
import { db } from "./index";
import {
  orderItems,
  orders,
  products,
  type ShippingAddress,
} from "./schema";

// Stripe keeps a Checkout Session open for at least 30 minutes. The extra
// minute covers the time between writing the order and creating the session.
const HOLD_MINUTES = 31;

// Without 0, 1, I and O, which are easy to misread aloud or in an email.
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function newReference() {
  const letters = Array.from(
    randomBytes(10),
    (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length],
  );
  return `AT-${letters.join("")}`;
}

const withItems = { items: true } as const;

export function getOrderByReference(reference: string) {
  return db.query.orders.findFirst({
    where: eq(orders.reference, reference),
    with: withItems,
  });
}

export function getOrderBySessionId(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeCheckoutSessionId, sessionId),
    with: withItems,
  });
}

export type Order = NonNullable<Awaited<ReturnType<typeof getOrderByReference>>>;

// What a customer's order history holds: their own orders that reached
// Stripe's payment page, without the checkouts they left unpaid. Every time
// the bag changes after checkout has started an order expires, and those
// would bury the real ones. Both reads below go through this, so an order
// that is not listed cannot be opened by its address either.
function inHistoryOf(userId: number) {
  return and(
    eq(orders.userId, userId),
    ne(orders.status, "expired"),
    isNotNull(orders.stripeCheckoutSessionId),
  );
}

// Newest first. `userId` comes from the session, never from the request.
export function getOrdersForUser(userId: number) {
  return db.query.orders.findMany({
    columns: { reference: true, status: true, totalCents: true, createdAt: true },
    where: inHistoryOf(userId),
    orderBy: [desc(orders.createdAt), desc(orders.id)],
  });
}

// Undefined when the order is not this customer's, exactly as when it does
// not exist. Each item brings its product's slug and images, for the link and
// the picture; what was bought and at what price is still the item's own copy.
export function getOrderForUser(userId: number, reference: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.reference, reference), inHistoryOf(userId)),
    with: {
      items: {
        orderBy: asc(orderItems.id),
        with: { product: { columns: { slug: true, images: true } } },
      },
    },
  });
}

// Writes the order, its items and the stock they take as one transaction.
// Prices and names come from `lines`, which the caller has just read from the
// database. Returns null when there is no longer enough stock: the
// `products_stock_check` constraint refuses the decrement and nothing is
// written.
export async function createPendingOrder({
  lines,
  userId,
}: {
  lines: BagLine[];
  userId: number | null;
}) {
  const reference = newReference();
  const orderId = sql<number>`(select ${orders.id} from ${orders} where ${orders.reference} = ${reference})`;

  try {
    await db.batch([
      db.insert(orders).values({
        reference,
        userId,
        totalCents: lines.reduce((total, line) => total + line.lineTotalCents, 0),
        expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
      }),
      db.insert(orderItems).values(
        lines.map((line) => ({
          orderId,
          productId: line.product.id,
          name: line.product.name,
          unitPriceCents: line.product.priceCents,
          quantity: line.quantity,
          reservedStock: !line.product.madeToOrder,
        })),
      ),
      ...lines
        .filter((line) => !line.product.madeToOrder)
        .map((line) =>
          db
            .update(products)
            .set({ stock: sql`${products.stock} - ${line.quantity}` })
            .where(eq(products.id, line.product.id)),
        ),
    ]);
  } catch (error) {
    if (constraintOf(error) === "products_stock_check") return null;
    throw error;
  }

  const order = await getOrderByReference(reference);
  if (!order) throw new Error(`Order ${reference} was not written`);
  return order;
}

export async function attachCheckoutSession(orderId: number, sessionId: string) {
  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId })
    .where(eq(orders.id, orderId));
}

export type PaymentDetails = {
  paymentIntentId: string | null;
  email: string | null;
  shippingName: string | null;
  shippingAddress: ShippingAddress | null;
};

// pending -> paid. Only called once Stripe has said the session is paid.
// Returns false when the order was not pending, so a repeat changes nothing.
export async function markOrderPaid(
  orderId: number,
  details: PaymentDetails,
  // Only for a payment that arrives after the order was released.
  from: ("pending" | "expired" | "failed")[] = ["pending"],
) {
  const updated = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: details.paymentIntentId,
      email: details.email,
      shippingName: details.shippingName,
      shippingAddress: details.shippingAddress,
    })
    .where(and(eq(orders.id, orderId), inArray(orders.status, from)))
    .returning({ id: orders.id });

  return updated.length > 0;
}

// pending -> expired or failed for the orders `which` matches, giving back the
// stock they were holding. One statement: the stock is returned only for the
// orders this call flipped, so it can never be returned twice. The quantities
// are summed per product first, because an update changes a row once however
// many of the released orders held that product. Returns how many orders
// were released.
async function release(which: SQL, status: "expired" | "failed") {
  const result = await db.execute<{ released: number }>(sql`
    with released as (
      update ${orders}
      set status = ${status}
      where ${which} and ${orders.status} = 'pending'
      returning ${orders.id}
    ),
    restocked as (
      update ${products} p
      set stock = p.stock + held.quantity
      from (
        select i.product_id, sum(i.quantity)::int as quantity
        from ${orderItems} i
        inner join released r on r.id = i.order_id
        where i.reserved_stock
        group by i.product_id
      ) held
      where p.id = held.product_id
      returning p.id
    )
    select (select count(*) from released)::int as released,
           (select count(*) from restocked)::int as restocked
  `);

  return result.rows[0]?.released ?? 0;
}

// Returns whether this call was the one that released the order.
export async function releaseOrder(
  orderId: number,
  status: "expired" | "failed",
) {
  return (await release(sql`${orders.id} = ${orderId}`, status)) === 1;
}

// Releases the pending orders whose hold has run out without a Checkout
// Session ever being attached: the request that wrote them ended before it
// reached Stripe. Nobody was given a payment page for them, so they cannot be
// paid and no webhook will ever release them. Called when a checkout starts.
export function releaseAbandonedOrders() {
  return release(
    sql`${orders.stripeCheckoutSessionId} is null and ${orders.expiresAt} < now()`,
    "expired",
  );
}

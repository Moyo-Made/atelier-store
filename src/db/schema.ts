// Drizzle table definitions go here.
// Better Auth's tables are generated into ./auth-schema by `pnpm auth:generate`
// and re-exported at the bottom of this file.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth-schema";

export type ProductImage = { src: string; alt: string };

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // The category page lives at `/${slug}`.
  slug: text().notNull().unique(),
  name: text().notNull(),
  // Set only for the categories shown as tiles on the homepage.
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // The product page lives at `/products/${slug}`.
    slug: text().notNull().unique(),
    name: text().notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    priceCents: integer("price_cents").notNull(),
    stock: integer().notNull().default(0),
    // Made after it is ordered, so it can be bought with no stock.
    madeToOrder: boolean("made_to_order").notNull().default(false),
    badge: text(),
    styleNumber: text("style_number").notNull().unique(),
    description: text().notNull(),
    details: text().array().notNull(),
    materials: text().notNull(),
    // The first image is the one shown on product cards.
    images: jsonb().$type<ProductImage[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    check("products_price_cents_check", sql`${table.priceCents} >= 0`),
    check("products_stock_check", sql`${table.stock} >= 0`),
  ],
);

// The payment state of an order. Only Stripe, through the server, moves an
// order out of `pending`.
//   pending  checkout started and stock is held; not paid yet
//   paid     Stripe confirmed the payment
//   expired  the customer left or the checkout timed out; stock was given back
//   failed   the payment was attempted and did not succeed; stock was given back
export const ORDER_STATUSES = ["pending", "paid", "expired", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const orders = pgTable(
  "orders",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // The order number the customer sees, and the only id used in a URL.
    reference: text().notNull().unique(),
    // The signed-in customer who placed it. Null for a guest order.
    userId: integer("user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    status: text({ enum: ORDER_STATUSES }).notNull().default("pending"),
    // The sum of the items, fixed when the order is created.
    totalCents: integer("total_cents").notNull(),
    currency: text().notNull().default("usd"),
    // Collected by Stripe and copied here when the order is paid.
    email: text(),
    shippingName: text("shipping_name"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    // `cs_...`: set once the Checkout Session exists.
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    // `pi_...`: set when the order is paid.
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    // When the checkout, and the hold on stock, runs out.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    check(
      "orders_status_check",
      sql`${table.status} in ('pending', 'paid', 'expired', 'failed')`,
    ),
    check("orders_total_cents_check", sql`${table.totalCents} >= 0`),
    // A paid order always says when, and nothing else carries a paid time.
    check(
      "orders_paid_at_check",
      sql`(${table.status} = 'paid') = (${table.paidAt} is not null)`,
    ),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Copied from the product when the order is created, so the order does
    // not change when the product is renamed or repriced.
    name: text().notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer().notNull(),
    // Whether this line took units out of `products.stock`. False for a
    // made-to-order piece, so releasing the order gives back only what it took.
    reservedStock: boolean("reserved_stock").notNull(),
  },
  (table) => [
    // One line per product in an order. Also the index for `order_id`.
    uniqueIndex("order_items_order_id_product_id_idx").on(
      table.orderId,
      table.productId,
    ),
    index("order_items_product_id_idx").on(table.productId),
    check(
      "order_items_unit_price_cents_check",
      sql`${table.unitPriceCents} >= 0`,
    ),
    check("order_items_quantity_check", sql`${table.quantity} > 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

// `users` has no `orders` relation of its own: its relations live in the
// generated auth schema, which `pnpm auth:generate` overwrites.
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export * from "./auth-schema";

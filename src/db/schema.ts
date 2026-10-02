// Drizzle table definitions go here.
// Better Auth's tables can be generated with `npm run auth:generate`.
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
} from "drizzle-orm/pg-core";

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

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

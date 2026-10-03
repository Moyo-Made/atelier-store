// Every catalogue read and write the admin makes goes through this file. It
// checks nothing about who is asking: it is imported only from
// `src/app/admin/`, where each page and Server Action calls `requireAdmin`
// first.
import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { NewProduct, ProductDetails } from "@/lib/admin";
import type { Product } from "@/lib/products";

import { db } from "./index";
import { categories, orderItems, orders, products } from "./schema";

// Newest first, as on the storefront.
export function getAdminProducts(): Promise<Product[]> {
  return db.query.products.findMany({
    with: { category: true },
    orderBy: [desc(products.createdAt), desc(products.id)],
  });
}

export function getAdminProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { category: true },
  });
}

// For the category menu on the product form.
export function getCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name), asc(categories.id));
}

// A slug or style number already in use, or a category that does not exist,
// breaks a constraint and throws; `constraintOf` names which.
export async function insertProduct(values: NewProduct) {
  const [created] = await db
    .insert(products)
    .values(values)
    .returning({ slug: products.slug });
  return created;
}

// Everything but the slug and the availability. Undefined when the product
// does not exist.
export async function updateProductDetails(id: number, values: ProductDetails) {
  const [updated] = await db
    .update(products)
    .set(values)
    .where(eq(products.id, id))
    .returning({ slug: products.slug });
  return updated;
}

// Every product for the stock screen, by name so that a row does not move
// when it is saved. `stock` is what can be bought now; `held` is what open
// checkouts have already taken out of it (pending orders' lines that reserved
// stock), which comes back if they end unpaid. On hand is the two together.
export function getStockLevels() {
  const held = sql<number>`coalesce((
    select sum(${orderItems.quantity})
    from ${orderItems}
    inner join ${orders} on ${orders.id} = ${orderItems.orderId}
    where ${orderItems.productId} = ${products.id}
      and ${orderItems.reservedStock}
      and ${orders.status} = 'pending'
  ), 0)::int`;

  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      styleNumber: products.styleNumber,
      category: categories.name,
      stock: products.stock,
      madeToOrder: products.madeToOrder,
      held,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(asc(products.name), asc(products.id));
}

// The only statement with which the admin changes stock. Stock is what can be
// bought now, and checkout takes units out of it at any moment. So the write
// is made only if stock is still `expectedStock`, the figure the admin was
// looking at: a sale in between is never overwritten. `madeToOrder` is
// written only when given, so the stock screen cannot change it. Returns
// false when the write was not made.
export async function setProductAvailability(
  id: number,
  expectedStock: number,
  { stock, madeToOrder }: { stock: number; madeToOrder?: boolean },
) {
  const updated = await db
    .update(products)
    .set(madeToOrder === undefined ? { stock } : { stock, madeToOrder })
    .where(and(eq(products.id, id), eq(products.stock, expectedStock)))
    .returning({ id: products.id });
  return updated.length > 0;
}

export async function getProductAvailability(id: number) {
  const [row] = await db
    .select({
      slug: products.slug,
      stock: products.stock,
      madeToOrder: products.madeToOrder,
    })
    .from(products)
    .where(eq(products.id, id));
  return row;
}

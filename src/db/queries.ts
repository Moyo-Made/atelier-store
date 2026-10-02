// Every catalogue read the storefront makes goes through this file.
import { asc, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { cache } from "react";

import type { Product } from "@/lib/products";

import { db } from "./index";
import { categories, products } from "./schema";

// Newest first; products seeded together keep the order they were inserted in.
const newestFirst = [desc(products.createdAt), asc(products.id)];

export function getNewArrivals(): Promise<Product[]> {
  return db.query.products.findMany({
    with: { category: true },
    orderBy: newestFirst,
  });
}

// The categories that have a tile image, in homepage order.
export async function getHomepageCategories() {
  const rows = await db
    .select()
    .from(categories)
    .where(isNotNull(categories.imageUrl))
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return rows.flatMap(({ imageUrl, imageAlt, ...category }) =>
    imageUrl ? [{ ...category, imageUrl, imageAlt: imageAlt ?? "" }] : [],
  );
}

// Cached per request: generateMetadata and the page both ask for the product.
export const getProductBySlug = cache(
  (slug: string): Promise<Product | undefined> =>
    db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: { category: true },
    }),
);

// Same category first, then the rest of the catalogue in its usual order.
export function getRelatedProducts(
  current: Pick<Product, "id" | "categoryId">,
  count = 4,
): Promise<Product[]> {
  return db.query.products.findMany({
    where: ne(products.id, current.id),
    with: { category: true },
    orderBy: [
      desc(sql`${products.categoryId} = ${current.categoryId}`),
      ...newestFirst,
    ],
    limit: count,
  });
}

export function getProductSlugs() {
  return db.select({ slug: products.slug }).from(products);
}

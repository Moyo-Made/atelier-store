// Every catalogue read the storefront makes goes through this file.
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { cache } from "react";

import type { Category, Product } from "@/lib/products";

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

// Cached per request: generateMetadata and the page both ask for the category.
export const getCategoryBySlug = cache(
  (slug: string): Promise<Category | undefined> =>
    db.query.categories.findFirst({ where: eq(categories.slug, slug) }),
);

export function getProductsByCategory(categoryId: number): Promise<Product[]> {
  return db.query.products.findMany({
    where: eq(products.categoryId, categoryId),
    with: { category: true },
    orderBy: newestFirst,
  });
}

export function getCategorySlugs() {
  return db.select({ slug: categories.slug }).from(categories);
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

const MAX_SEARCH_WORDS = 5;

// Every word has to appear in the name, description, materials, style number
// or category name. Products with all the words in their name come first.
export async function searchProducts(query: string): Promise<Product[]> {
  const patterns = query
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_WORDS)
    // % and _ are typed as text, not as LIKE wildcards.
    .map((word) => `%${word.replace(/[\\%_]/g, "\\$&")}%`);
  if (patterns.length === 0) return [];

  return db.query.products.findMany({
    where: and(
      ...patterns.map((pattern) =>
        or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
          ilike(products.materials, pattern),
          ilike(products.styleNumber, pattern),
          inArray(
            products.categoryId,
            db
              .select({ id: categories.id })
              .from(categories)
              .where(ilike(categories.name, pattern)),
          ),
        ),
      ),
    ),
    with: { category: true },
    orderBy: [
      desc(
        sql.join(
          patterns.map((pattern) => sql`${products.name} ilike ${pattern}`),
          sql` and `,
        ),
      ),
      ...newestFirst,
    ],
  });
}

export function getProductSlugs() {
  return db.select({ slug: products.slug }).from(products);
}

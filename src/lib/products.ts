// Product helpers with no database import, so client components can use them.
import type { categories, products } from "@/db/schema";

export type Category = typeof categories.$inferSelect;

export type Product = typeof products.$inferSelect & { category: Category };

export const productHref = (product: Pick<Product, "slug">) =>
  `/products/${product.slug}`;

export const categoryHref = (category: Pick<Category, "slug">) =>
  `/${category.slug}`;

// `level` is the state the storefront styles; `label` is its wording.
//   in             there is plenty
//   low            few enough left to say how many
//   out            none, and it cannot be bought
//   made-to-order  made after it is ordered, whatever the stock
export type StockLevel = "in" | "low" | "out" | "made-to-order";

export type StockState = {
  level: StockLevel;
  label: string;
  available: boolean;
};

const LOW_STOCK = 3;

export function getStockState(
  item: Pick<Product, "stock" | "madeToOrder">,
): StockState {
  if (item.madeToOrder) {
    return {
      level: "made-to-order",
      label: "Made to order, ready in three weeks",
      available: true,
    };
  }
  if (item.stock === 0) {
    return { level: "out", label: "Sold out", available: false };
  }
  if (item.stock <= LOW_STOCK) {
    return { level: "low", label: `Only ${item.stock} left`, available: true };
  }
  return { level: "in", label: "In stock", available: true };
}

// A made-to-order piece has no stock to run out of, so one bag line stops here.
export const MAX_MADE_TO_ORDER = 10;

// The most of one product a bag may hold. The bag's buttons and the server
// both use this, so they cannot disagree.
export function getMaxQuantity(item: Pick<Product, "stock" | "madeToOrder">) {
  return item.madeToOrder ? MAX_MADE_TO_ORDER : item.stock;
}

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatPrice = (priceCents: number) =>
  priceFormat.format(priceCents / 100);

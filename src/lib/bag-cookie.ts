// The bag cookie: which products, and how many of each. Nothing else is
// stored and nothing in it is trusted. Prices, names and stock always come
// from the database. No imports, so the header can read it in the browser.
export const BAG_COOKIE = "atelier_bag";
export const BAG_MAX_AGE = 60 * 60 * 24 * 30;
export const MAX_BAG_LINES = 50;

export type BagEntry = { productId: number; quantity: number };

// Written as `12x2.7x1`: product 12 twice, product 7 once.
const ENTRY = /^([1-9]\d{0,8})x([1-9]\d{0,3})$/;

// Anything that is not a well-formed entry is skipped, so a hand-edited or
// damaged cookie reads as a smaller bag, never as an error.
export function parseBag(value: string | null | undefined): BagEntry[] {
  const quantities = new Map<number, number>();

  for (const part of (value ?? "").split(".")) {
    const match = ENTRY.exec(part);
    if (!match) continue;
    const productId = Number(match[1]);
    if (quantities.has(productId)) continue;
    quantities.set(productId, Number(match[2]));
    if (quantities.size === MAX_BAG_LINES) break;
  }

  return Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function serializeBag(entries: BagEntry[]) {
  return entries
    .map((entry) => `${entry.productId}x${entry.quantity}`)
    .join(".");
}

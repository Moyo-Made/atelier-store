// The server's side of the bag. This is the only file that reads or writes
// the bag cookie on the server, so a move to a database cart stays in here.
import { cookies } from "next/headers";

import { getProductsByIds } from "@/db/queries";
import {
  BAG_COOKIE,
  BAG_MAX_AGE,
  parseBag,
  serializeBag,
  type BagEntry,
} from "@/lib/bag-cookie";
import { getHeldQuantities, getOwnCheckout } from "@/lib/checkout";
import { getMaxQuantity, type Product } from "@/lib/products";

export type BagLine = {
  product: Product;
  quantity: number;
  // The most this line may hold right now.
  max: number;
  lineTotalCents: number;
};

export type Bag = {
  lines: BagLine[];
  count: number;
  subtotalCents: number;
  // What had to change because stock moved since the cookie was written.
  notices: string[];
};

export async function readBagEntries() {
  return parseBag((await cookies()).get(BAG_COOKIE)?.value);
}

// Only callable from a Server Action or Route Handler: a page cannot set
// cookies.
export async function writeBagEntries(entries: BagEntry[]) {
  const store = await cookies();
  if (entries.length === 0) {
    store.delete(BAG_COOKIE);
    return;
  }

  // Readable by the page on purpose: the header counts the bag from it, and
  // it holds nothing secret or trusted.
  store.set(BAG_COOKIE, serializeBag(entries), {
    path: "/",
    sameSite: "lax",
    maxAge: BAG_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

// The most of a product this customer's bag may hold: `getMaxQuantity`, plus
// the units their own open checkout has already taken out of stock.
export function getBagMax(product: Product, held: Map<number, number>) {
  return product.madeToOrder
    ? getMaxQuantity(product)
    : getMaxQuantity(product) + (held.get(product.id) ?? 0);
}

// Checks entries against the catalogue as it is now: unknown and sold-out
// products are dropped, quantities are cut to what is available, and every
// price is the current one.
//
// `held` is what this browser's own open checkout has already taken out of
// stock, by product id. It still counts as available to this customer.
export async function resolveBag(
  entries: BagEntry[],
  held: Map<number, number> = new Map(),
): Promise<Bag> {
  const found = await getProductsByIds(entries.map((entry) => entry.productId));
  const byId = new Map(found.map((product) => [product.id, product]));

  const lines: BagLine[] = [];
  const notices: string[] = [];

  for (const entry of entries) {
    const product = byId.get(entry.productId);
    if (!product) {
      notices.push("A piece in your bag is no longer sold and was removed.");
      continue;
    }

    const max = getBagMax(product, held);
    if (max === 0) {
      notices.push(`${product.name} has sold out and was removed.`);
      continue;
    }

    const quantity = Math.min(entry.quantity, max);
    if (quantity < entry.quantity) {
      notices.push(
        `${product.name}: only ${max} available, so the quantity was reduced.`,
      );
    }

    lines.push({
      product,
      quantity,
      max,
      lineTotalCents: product.priceCents * quantity,
    });
  }

  return {
    lines,
    notices,
    count: lines.reduce((total, line) => total + line.quantity, 0),
    subtotalCents: lines.reduce(
      (total, line) => total + line.lineTotalCents,
      0,
    ),
  };
}

// The bag as its page shows it.
export async function getBag(): Promise<Bag> {
  const checkout = await getOwnCheckout();

  // Paid without the customer coming back to the confirmation page, which is
  // what empties the bag. Nothing has touched the bag since (any change
  // forgets the checkout), so what it holds is what that order bought. A page
  // cannot write cookies: the notice has `tidyBag` empty it.
  if (checkout?.status === "paid") {
    return {
      lines: [],
      count: 0,
      subtotalCents: 0,
      notices: [
        `Order ${checkout.reference} is paid, so its pieces were taken out of your bag.`,
      ],
    };
  }

  return resolveBag(await readBagEntries(), getHeldQuantities(checkout));
}

export const toEntries = (bag: Bag): BagEntry[] =>
  bag.lines.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
  }));

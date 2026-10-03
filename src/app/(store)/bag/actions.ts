"use server";

import { refresh } from "next/cache";

import { getProductsByIds } from "@/db/queries";
import {
  getBagMax,
  readBagEntries,
  resolveBag,
  toEntries,
  writeBagEntries,
} from "@/lib/bag";
import { MAX_BAG_LINES } from "@/lib/bag-cookie";
import { cancelOwnCheckout, getHeldQuantities } from "@/lib/checkout";

// `ok` is false when the bag does not hold what was asked for; `message`
// says why in words for the customer.
export type BagChange = { ok: boolean; message?: string };

const MAX_REQUEST = 9999;

// These are public endpoints: the arguments are whatever the caller sent.
const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

// The bag, once any checkout made from it has been ended and its stock
// returned. A checkout that turned out to be completed at Stripe has bought
// the bag, so it is emptied instead. One that Stripe could not close (Stripe
// is unreachable) does not stop the bag from changing: it keeps its stock,
// and those units still count as available to this customer.
async function bagAfterCheckout() {
  const ended = await cancelOwnCheckout();
  if (ended.state === "bought") {
    await writeBagEntries([]);
    return { bag: await resolveBag([]), held: new Map<number, number>() };
  }

  const held = getHeldQuantities(
    ended.state === "open" ? ended.order : undefined,
  );
  return { bag: await resolveBag(await readBagEntries(), held), held };
}

// Every change goes through here. The only things taken from the caller are a
// product id and a wanted quantity; the product, its price and its stock are
// read from the database, and the stored quantity never exceeds what is
// available.
async function changeLine(
  productId: unknown,
  wanted: (current: number) => number,
): Promise<BagChange> {
  if (!isId(productId)) {
    return { ok: false, message: "That piece could not be found." };
  }

  // The rest of the bag is re-checked too, so each change leaves the cookie
  // matching the catalogue.
  const { bag, held } = await bagAfterCheckout();
  const line = bag.lines.find((item) => item.product.id === productId);
  const product = line?.product ?? (await getProductsByIds([productId]))[0];
  const entries = toEntries(bag).filter(
    (entry) => entry.productId !== productId,
  );

  if (!product) {
    await writeBagEntries(entries);
    refresh();
    return { ok: false, message: "That piece is no longer sold." };
  }

  const max = getBagMax(product, held);
  const requested = wanted(line?.quantity ?? 0);
  const quantity = Math.max(0, Math.min(requested, max));

  if (quantity > 0 && !line && entries.length >= MAX_BAG_LINES) {
    return {
      ok: false,
      message: "Your bag is full. Remove a piece to add another.",
    };
  }

  if (quantity > 0) {
    // A changed line keeps its place; a new one goes to the end.
    const index = toEntries(bag).findIndex(
      (entry) => entry.productId === productId,
    );
    entries.splice(index === -1 ? entries.length : index, 0, {
      productId,
      quantity,
    });
  }

  await writeBagEntries(entries);
  refresh();

  if (requested <= max) return { ok: true };
  if (max === 0) {
    return { ok: false, message: `${product.name} has sold out.` };
  }
  return {
    ok: false,
    message: product.madeToOrder
      ? `A made-to-order piece is limited to ${max} per order.`
      : `Only ${max} available.`,
  };
}

export async function addToBag(productId: number) {
  return changeLine(productId, (current) => current + 1);
}

export async function setBagQuantity(productId: number, quantity: number) {
  if (
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_REQUEST
  ) {
    return { ok: false, message: "Enter a whole number." } satisfies BagChange;
  }
  return changeLine(productId, () => quantity);
}

export async function removeFromBag(productId: number) {
  return changeLine(productId, () => 0);
}

// Rewrites the cookie to match the catalogue. The bag page calls this when it
// had to drop or reduce a line, because a page cannot write cookies itself.
export async function tidyBag() {
  await writeBagEntries(toEntries((await bagAfterCheckout()).bag));
  refresh();
}

"use server";

import { refresh } from "next/cache";

import { getProductAvailability, setProductAvailability } from "@/db/admin";
import {
  checkStock,
  isId,
  isStockFigure,
  readStockForm,
  STOCK_ERROR,
  type StockFormState,
} from "@/lib/admin";
import { revalidateCatalogue } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/session";

// Sets one product's stock from its row on the stock screen. `expectedStock`
// is the figure the row was showing; the write happens only if it is still
// the stock, so a sale made while the page was open is not overwritten.
// Made-to-order is not touched from here.
export async function setStock(
  id: number,
  expectedStock: number,
  _previous: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  // An action is its own public endpoint: the page's check does not cover it.
  await requireAdmin();

  if (!(formData instanceof FormData)) return { message: "Nothing was sent." };
  if (!isId(id) || !isStockFigure(expectedStock)) {
    return { message: "This product no longer exists." };
  }

  const value = readStockForm(formData);
  const stock = checkStock(value);
  if (stock === null) {
    return { value, expected: expectedStock, error: STOCK_ERROR };
  }

  if (!(await setProductAvailability(id, expectedStock, { stock }))) {
    const current = await getProductAvailability(id);
    if (!current) return { message: "This product no longer exists." };
    // The page is read again, so the row shows the stock as it now is.
    refresh();
    return {
      expected: current.stock,
      message: `Stock changed to ${current.stock} while this page was open, so nothing was saved. Check the figure and save again.`,
    };
  }

  // The storefront's prerendered pages show the new figure on their next visit.
  revalidateCatalogue();
  refresh();
  return { saved: true, expected: stock };
}

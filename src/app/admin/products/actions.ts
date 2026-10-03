"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import {
  getProductAvailability,
  insertProduct,
  setProductAvailability,
  updateProductDetails,
} from "@/db/admin";
import { constraintOf } from "@/db/errors";
import {
  checkNewProduct,
  checkProductDetails,
  checkStock,
  emptyProductForm,
  isId,
  isStockFigure,
  readAvailabilityForm,
  readProductForm,
  STOCK_ERROR,
  type AvailabilityFormState,
  type ProductErrors,
  type ProductFormState,
} from "@/lib/admin";
import { revalidateCatalogue } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/session";

// Every action here starts with `requireAdmin`: an action is its own public
// endpoint, and the check its page made does not cover it. After that the
// arguments are still whatever the caller sent, so each is checked before use.

const GONE = "This product no longer exists.";

// What the database refused, as a message on the field it concerns.
function constraintErrors(error: unknown): ProductErrors | null {
  switch (constraintOf(error)) {
    case "products_slug_unique":
      return { slug: "Another product already uses this web address." };
    case "products_style_number_unique":
      return { styleNumber: "Another product already has this style number." };
    case "products_category_id_categories_id_fk":
      return { categoryId: "That category no longer exists. Choose another." };
    default:
      return null;
  }
}

export async function createProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  if (!(formData instanceof FormData)) {
    return { values: emptyProductForm(), errors: {}, message: "Nothing was sent." };
  }
  const values = readProductForm(formData);
  const checked = checkNewProduct(values);
  if (!checked.ok) return { values, errors: checked.errors };

  try {
    await insertProduct(checked.value);
  } catch (error) {
    const errors = constraintErrors(error);
    if (!errors) throw error;
    return { values, errors };
  }

  revalidateCatalogue();
  redirect("/admin/products");
}

// Name, category, price, copy and pictures. The slug never changes, and
// availability has its own action so that saving these cannot overwrite a
// sale.
export async function updateProduct(
  id: number,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  if (!(formData instanceof FormData)) {
    return { values: emptyProductForm(), errors: {}, message: "Nothing was sent." };
  }
  const values = readProductForm(formData);
  if (!isId(id)) return { values, errors: {}, message: GONE };

  const checked = checkProductDetails(values);
  if (!checked.ok) return { values, errors: checked.errors };

  try {
    const updated = await updateProductDetails(id, checked.value);
    if (!updated) return { values, errors: {}, message: GONE };
  } catch (error) {
    const errors = constraintErrors(error);
    if (!errors) throw error;
    return { values, errors };
  }

  revalidateCatalogue();
  refresh();
  return { values, errors: {}, saved: true };
}

// Stock and made-to-order. `expectedStock` is the figure the form was showing;
// the write happens only if it is still the stock, so a sale made while the
// page was open is not overwritten.
export async function setAvailability(
  id: number,
  expectedStock: number,
  _previous: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  await requireAdmin();

  if (!(formData instanceof FormData)) return { message: "Nothing was sent." };
  const values = readAvailabilityForm(formData);
  if (!isId(id) || !isStockFigure(expectedStock)) {
    return { values, message: GONE };
  }

  const stock = checkStock(values.stock);
  if (stock === null) {
    return { values, expected: expectedStock, error: STOCK_ERROR };
  }

  const saved = await setProductAvailability(id, expectedStock, {
    stock,
    madeToOrder: values.madeToOrder,
  });

  if (!saved) {
    const current = await getProductAvailability(id);
    if (!current) return { values, message: GONE };
    // The page is read again, so the form shows the stock as it now is.
    refresh();
    return {
      message: `Stock changed to ${current.stock} while this page was open, so nothing was saved. Check the figure and save again.`,
    };
  }

  revalidateCatalogue();
  refresh();
  return { saved: true };
}

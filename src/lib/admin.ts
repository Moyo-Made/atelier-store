// Admin helpers with no database import, so client components can use them.
import type { ProductImage } from "@/db/schema";
import type { Product } from "@/lib/products";

// The sections of the admin, in the order the navigation and the first page
// list them. A new section is one entry here and a folder under
// `src/app/admin/` whose pages and Server Actions each call `requireAdmin`.
export const adminSections = [
  {
    label: "Products",
    href: "/admin/products",
    description: "The pieces on sale: their names, prices, pictures and copy.",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    description: "How the catalogue is grouped, and the tiles on the homepage.",
  },
  {
    label: "Stock",
    href: "/admin/stock",
    description: "How many of each piece are available to buy.",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    description: "What customers have bought, and where each payment stands.",
  },
] as const;

export const adminProductHref = (product: Pick<Product, "slug">) =>
  `/admin/products/${product.slug}`;

// ---------- Product forms ----------
//
// What a form holds is text, exactly as it was typed. The server reads it
// with `readProductForm`, checks it with the validators below, and on a
// mistake sends the same text back so the form can show it again.

export const MAX_IMAGES = 4;
const MAX_DETAILS = 12;
// Checkout cannot charge less than a dollar, and prices are shown in whole
// dollars (`formatPrice`).
const MIN_PRICE = 1;
const MAX_PRICE = 1_000_000;
const MAX_STOCK = 100_000;
// The only host `next.config.ts` lets `next/image` load. A picture from
// anywhere else would break every page that shows the product.
const IMAGE_HOST = "images.unsplash.com";
const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// `/admin/products/new` is the form for a new product.
const RESERVED_PRODUCT_SLUGS = ["new"];

export type ProductFormValues = {
  name: string;
  slug: string;
  styleNumber: string;
  categoryId: string;
  price: string;
  badge: string;
  description: string;
  details: string;
  materials: string;
  // Always `MAX_IMAGES` rows; an unused row is empty.
  images: ProductImage[];
  stock: string;
  madeToOrder: boolean;
};

export type ProductField = Exclude<keyof ProductFormValues, "madeToOrder">;
export type ProductErrors = Partial<Record<ProductField, string>>;

export type ProductFormState = {
  values: ProductFormValues;
  errors: ProductErrors;
  // A problem that belongs to no single field.
  message?: string;
  saved?: boolean;
};

export type AvailabilityFormValues = { stock: string; madeToOrder: boolean };

export type AvailabilityFormState = {
  // Absent when the form should show what the database holds.
  values?: AvailabilityFormValues;
  // The stock figure `values` were typed against. They are shown again only
  // while that is still the stock.
  expected?: number;
  error?: string;
  message?: string;
  saved?: boolean;
};

// One row of the stock screen.
export type StockFormState = {
  // What was typed, when it was refused.
  value?: string;
  error?: string;
  saved?: boolean;
  // Why nothing was saved, when it was not the typed value's fault.
  message?: string;
  // The stock figure the above belong to. When set, they are shown only
  // while that is still the stock, so a row never shows typing, a "saved" or
  // a warning about a figure that has since changed.
  expected?: number;
};

// What the database is given once a form has passed.
export type ProductDetails = {
  name: string;
  styleNumber: string;
  categoryId: number;
  priceCents: number;
  badge: string | null;
  description: string;
  details: string[];
  materials: string;
  images: ProductImage[];
};

export type NewProduct = ProductDetails & {
  slug: string;
  stock: number;
  madeToOrder: boolean;
};

type Checked<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ProductErrors };

const emptyImages = (): ProductImage[] =>
  Array.from({ length: MAX_IMAGES }, () => ({ src: "", alt: "" }));

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  slug: "",
  styleNumber: "",
  categoryId: "",
  price: "",
  badge: "",
  description: "",
  details: "",
  materials: "",
  images: emptyImages(),
  stock: "0",
  madeToOrder: false,
});

// A product as the edit form shows it.
export const productFormValues = (product: Product): ProductFormValues => ({
  name: product.name,
  slug: product.slug,
  styleNumber: product.styleNumber,
  categoryId: String(product.categoryId),
  price: String(Math.round(product.priceCents / 100)),
  badge: product.badge ?? "",
  description: product.description,
  details: product.details.join("\n"),
  materials: product.materials,
  images: [...product.images, ...emptyImages()].slice(0, MAX_IMAGES),
  stock: String(product.stock),
  madeToOrder: product.madeToOrder,
});

// A form field is a string unless the caller sent a file in its place.
const text = (value: FormDataEntryValue | null | undefined) =>
  typeof value === "string" ? value : "";

export function readProductForm(data: FormData): ProductFormValues {
  const sources = data.getAll("imageSrc");
  const alts = data.getAll("imageAlt");

  return {
    name: text(data.get("name")),
    slug: text(data.get("slug")),
    styleNumber: text(data.get("styleNumber")),
    categoryId: text(data.get("categoryId")),
    price: text(data.get("price")),
    badge: text(data.get("badge")),
    description: text(data.get("description")),
    details: text(data.get("details")),
    materials: text(data.get("materials")),
    images: emptyImages().map((_, index) => ({
      src: text(sources[index]),
      alt: text(alts[index]),
    })),
    stock: text(data.get("stock")),
    madeToOrder: data.get("madeToOrder") === "on",
  };
}

export function readAvailabilityForm(data: FormData): AvailabilityFormValues {
  return {
    stock: text(data.get("stock")),
    madeToOrder: data.get("madeToOrder") === "on",
  };
}

export const readStockForm = (data: FormData) => text(data.get("stock"));

// The largest value a Postgres `integer` holds.
const MAX_INTEGER = 2_147_483_647;

// Arguments bound to an action (`action.bind(null, id)`) come back from the
// browser, so they are checked like anything else the caller sends.
export const isId = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value > 0 &&
  value <= MAX_INTEGER;

// A stock figure as the database could hold it.
export const isStockFigure = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= MAX_INTEGER;

// "Saddle-stitched satchel" -> "saddle-stitched-satchel".
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    // Accents, which NFKD has split from their letters.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// Digits only, so "1e3", "12.5" and "-1" are refused rather than rounded.
function wholeNumber(value: string, min: number, max: number) {
  if (!/^\d{1,9}$/.test(value)) return null;
  const number = Number(value);
  return number >= min && number <= max ? number : null;
}

function required(value: string, max: number, what: string) {
  if (!value) return `Enter ${what}.`;
  if (value.length > max) return `Use ${max} characters or fewer.`;
  return undefined;
}

function checkImages(rows: ProductImage[]): {
  images: ProductImage[];
  error?: string;
} {
  const images: ProductImage[] = [];

  for (const [index, row] of rows.slice(0, MAX_IMAGES).entries()) {
    const src = row.src.trim();
    const alt = row.alt.trim();
    if (!src && !alt) continue;

    const where = `Image ${index + 1}`;
    if (!src) return { images, error: `${where}: enter its address.` };
    if (src.length > 500) return { images, error: `${where}: the address is too long.` };

    let url: URL | null = null;
    try {
      url = new URL(src);
    } catch {
      // Reported below.
    }
    if (
      !url ||
      url.protocol !== "https:" ||
      url.hostname !== IMAGE_HOST ||
      url.port ||
      url.username ||
      url.password
    ) {
      return {
        images,
        error: `${where}: use an address that starts with https://${IMAGE_HOST}/.`,
      };
    }
    if (!alt) {
      return { images, error: `${where}: describe the picture for people who cannot see it.` };
    }
    if (alt.length > 200) {
      return { images, error: `${where}: use 200 characters or fewer for the description.` };
    }

    images.push({ src: url.href, alt });
  }

  if (images.length === 0) {
    return { images, error: "Add at least one image. The first is shown on product cards." };
  }
  return { images };
}

// Everything about a product except its slug and availability.
export function checkProductDetails(
  values: ProductFormValues,
): Checked<ProductDetails> {
  const errors: ProductErrors = {};

  const name = values.name.trim();
  errors.name = required(name, 120, "a name");

  const styleNumber = values.styleNumber.trim();
  errors.styleNumber = required(styleNumber, 40, "a style number");

  const categoryId = wholeNumber(values.categoryId, 1, MAX_INTEGER);
  if (categoryId === null) errors.categoryId = "Choose a category.";

  const price = wholeNumber(
    values.price.replace(/[$,\s]/g, ""),
    MIN_PRICE,
    MAX_PRICE,
  );
  if (price === null) {
    errors.price = `Enter a price in whole dollars, from ${MIN_PRICE} to ${MAX_PRICE.toLocaleString("en-US")}.`;
  }

  const badge = values.badge.trim();
  if (badge.length > 40) errors.badge = "Use 40 characters or fewer.";

  const description = values.description.trim();
  errors.description = required(description, 2000, "a description");

  const materials = values.materials.trim();
  errors.materials = required(materials, 500, "the materials");

  const details = values.details
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (details.length === 0) {
    errors.details = "Enter at least one detail, one per line.";
  } else if (details.length > MAX_DETAILS) {
    errors.details = `Use ${MAX_DETAILS} lines or fewer.`;
  } else if (details.some((line) => line.length > 200)) {
    errors.details = "Keep each line to 200 characters or fewer.";
  }

  const { images, error: imageError } = checkImages(values.images);
  errors.images = imageError;

  if (
    Object.values(errors).some(Boolean) ||
    categoryId === null ||
    price === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      styleNumber,
      categoryId,
      priceCents: price * 100,
      badge: badge || null,
      description,
      details,
      materials,
      images,
    },
  };
}

// Stock is a count of units; null when the text is not one.
export function checkStock(value: string) {
  return wholeNumber(value.trim(), 0, MAX_STOCK);
}

export const STOCK_ERROR = `Enter a whole number from 0 to ${MAX_STOCK.toLocaleString("en-US")}.`;

// A new product: the details, and the slug and availability it starts with.
// An empty slug is made from the name.
export function checkNewProduct(values: ProductFormValues): Checked<NewProduct> {
  const details = checkProductDetails(values);
  const errors: ProductErrors = details.ok ? {} : details.errors;

  const slug = values.slug.trim() || slugify(values.name);
  if (!slug) {
    // With no name either, the name's own message is enough.
    if (values.name.trim()) {
      errors.slug = "Enter a web address using letters and numbers.";
    }
  } else if (slug.length > 80) {
    errors.slug = "Use 80 characters or fewer.";
  } else if (!SLUG_SHAPE.test(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens only.";
  } else if (RESERVED_PRODUCT_SLUGS.includes(slug)) {
    errors.slug = `"${slug}" is used by the site. Choose another.`;
  }

  const stock = checkStock(values.stock);
  if (stock === null) errors.stock = STOCK_ERROR;

  if (!details.ok || stock === null || Object.values(errors).some(Boolean)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { ...details.value, slug, stock, madeToOrder: values.madeToOrder },
  };
}

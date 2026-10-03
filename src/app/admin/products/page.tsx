import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminProducts } from "@/db/admin";
import { adminProductHref } from "@/lib/admin";
import { formatPrice } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Products | Admin | Atelier Store", robots: { index: false } };
}

// The whole catalogue, newest first.
export default async function ProductsPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <section aria-labelledby="products-title">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-baseline gap-6">
          <h2 id="products-title" className="type-title">
            Products
          </h2>
          <p className="type-ui text-muted">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          prefetch={false}
          className="btn btn-primary btn-sm"
        >
          Add a product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="type-body mt-6 border-t pt-6 text-muted">
          There are no products yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y border-y">
          {products.map((product) => {
            const [image] = product.images;
            const soldOut = !product.madeToOrder && product.stock === 0;

            return (
              <li
                key={product.id}
                className="relative flex items-center gap-4 py-4"
              >
                <div className="media-tile w-16 shrink-0">
                  {image ? (
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="4rem"
                      className="mix-blend-multiply"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="type-body">{product.name}</h3>
                  <p className="type-caption mt-1 text-muted">
                    {product.styleNumber} · {product.category.name}
                  </p>
                  <p
                    className={`type-caption mt-1 ${soldOut ? "text-danger" : ""}`}
                  >
                    {product.madeToOrder
                      ? `Made to order · ${product.stock} in stock`
                      : soldOut
                        ? "Sold out"
                        : `${product.stock} in stock`}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatPrice(product.priceCents)}
                </p>
                {/* The link's box is stretched over the row, so all of it opens the product. */}
                <Link
                  href={adminProductHref(product)}
                  prefetch={false}
                  className="link type-ui shrink-0 after:absolute after:inset-0"
                >
                  Edit
                  <span className="sr-only"> {product.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

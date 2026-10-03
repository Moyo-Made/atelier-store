import type { Metadata } from "next";
import Link from "next/link";
import { StockRowForm } from "@/components/admin/stock-row-form";
import { getStockLevels } from "@/db/admin";
import { adminProductHref } from "@/lib/admin";
import { getStockState } from "@/lib/products";
import { requireAdmin } from "@/lib/session";
import { setStock } from "./actions";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Stock | Admin | Atelier Store", robots: { index: false } };
}

// Every product's stock, each with its own form. The figure that is edited is
// the `stock` column itself: what customers can buy now.
export default async function StockPage() {
  await requireAdmin();
  const products = await getStockLevels();

  return (
    <section aria-labelledby="stock-title">
      <div className="flex items-baseline gap-6">
        <h2 id="stock-title" className="type-title">
          Stock
        </h2>
        <p className="type-ui text-muted">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>
      <p className="type-body mt-4 max-w-reading text-muted">
        Available is what customers can buy now. Units held by a checkout in
        progress are already taken out of it, and come back if that checkout
        ends without a payment.
      </p>

      {products.length === 0 ? (
        <p className="type-body mt-6 border-t pt-6 text-muted">
          There are no products yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y border-y">
          {products.map((product) => {
            const state = getStockState(product);

            return (
              <li
                key={product.id}
                className="grid gap-x-grid gap-y-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
              >
                <div className="min-w-0">
                  <h3 className="type-body">
                    <Link
                      href={adminProductHref(product)}
                      prefetch={false}
                      className="underline-offset-4 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="type-caption mt-1 text-muted">
                    {product.styleNumber} · {product.category}
                  </p>
                  <p className="type-caption mt-1 text-muted">
                    {product.held} held · {product.stock + product.held} on hand
                  </p>
                  <p
                    className={`type-caption mt-1 ${state.available ? "" : "text-danger"}`}
                  >
                    Customers see: {state.label}
                  </p>
                  {product.madeToOrder ? (
                    <p className="type-caption mt-1 text-muted">
                      Stock is not used while this piece is made to order.
                    </p>
                  ) : null}
                </div>
                <StockRowForm
                  action={setStock.bind(null, product.id, product.stock)}
                  stock={product.stock}
                  name={product.name}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

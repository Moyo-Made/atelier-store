import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

// Tiles in grid-products are 2, 3 and 4 across.
const tileSizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 34vw, 50vw";

// A full page of products under one heading: new arrivals, a category, search.
export function ProductListing({
  title,
  intro,
  children,
  label = "All pieces",
  products,
  empty,
  emptyAction,
}: {
  title: string;
  intro?: string;
  // Controls shown under the heading, such as the search form.
  children?: React.ReactNode;
  // Names the grid, beside the count.
  label?: string;
  products: Product[];
  // Shown in place of the grid when there are no products.
  empty: string;
  emptyAction?: { label: string; href: string };
}) {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{title}</span>
        </nav>

        <h1 className="type-headline mt-4">{title}</h1>
        {intro ? (
          <p className="type-lead mt-4 max-w-reading text-muted">{intro}</p>
        ) : null}
        {children}
      </div>

      <section aria-labelledby="products-title">
        <div className="shell flex items-baseline justify-between gap-6 border-t py-5">
          <h2 id="products-title" className="type-ui">
            {label}
          </h2>
          <p className="type-ui shrink-0 text-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {products.length > 0 ? (
          <ul className="grid-products">
            {products.map((product, index) => (
              <li key={product.id}>
                {/* The first row is on screen when the page opens. */}
                <ProductCard
                  product={product}
                  sizes={tileSizes}
                  eager={index < 4}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-t">
            <div className="shell-reading py-section text-center">
              <p className="type-body text-muted">{empty}</p>
              {emptyAction ? (
                <Link
                  href={emptyAction.href}
                  className="btn btn-secondary mt-8"
                >
                  {emptyAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

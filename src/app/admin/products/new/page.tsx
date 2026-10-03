import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/db/admin";
import { emptyProductForm } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";
import { createProduct } from "../actions";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return {
    title: "Add a product | Admin | Atelier Store",
    robots: { index: false },
  };
}

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategoryOptions();

  return (
    <section aria-labelledby="new-product-title">
      <h2 id="new-product-title" className="type-title">
        Add a product
      </h2>

      <div className="mt-6 border-t pt-8">
        {categories.length === 0 ? (
          <>
            <p className="type-body text-muted">
              A product belongs to a category, and there are none yet.
            </p>
            <Link
              href="/admin/products"
              prefetch={false}
              className="btn btn-secondary mt-8"
            >
              All products
            </Link>
          </>
        ) : (
          <ProductForm
            mode="create"
            action={createProduct}
            initial={emptyProductForm()}
            categories={categories}
          />
        )}
      </div>
    </section>
  );
}

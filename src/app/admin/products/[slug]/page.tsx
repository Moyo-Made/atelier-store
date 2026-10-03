import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityForm } from "@/components/admin/availability-form";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductBySlug, getCategoryOptions } from "@/db/admin";
import { productFormValues } from "@/lib/admin";
import { productHref } from "@/lib/products";
import { requireAdmin } from "@/lib/session";
import { setAvailability, updateProduct } from "../actions";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return {
    title: "Edit product | Admin | Atelier Store",
    robots: { index: false },
  };
}

// One product, as two forms. Details and availability are saved apart:
// stock moves whenever someone checks out, so it is never written along with
// a change of name or price.
export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[slug]">) {
  const { slug } = await params;
  await requireAdmin();

  const [product, categories] = await Promise.all([
    getAdminProductBySlug(slug),
    getCategoryOptions(),
  ]);
  if (!product) notFound();

  return (
    <article aria-labelledby="product-title">
      <p className="type-caption text-muted">
        {product.styleNumber} · {product.category.name}
      </p>
      <h2 id="product-title" className="type-title mt-2">
        {product.name}
      </h2>
      <p className="type-caption mt-2 break-words text-muted">
        <Link href={productHref(product)} prefetch={false} className="link">
          {productHref(product)}
        </Link>
      </p>

      <section
        aria-labelledby="availability-title"
        className="mt-8 border-t pt-8"
      >
        <h3 id="availability-title" className="type-heading mb-6">
          Availability
        </h3>
        <AvailabilityForm
          action={setAvailability.bind(null, product.id, product.stock)}
          stock={product.stock}
          madeToOrder={product.madeToOrder}
        />
      </section>

      <section aria-labelledby="details-title" className="mt-12 border-t pt-8">
        <h3 id="details-title" className="type-heading mb-6">
          Details
        </h3>
        <ProductForm
          mode="edit"
          action={updateProduct.bind(null, product.id)}
          initial={productFormValues(product)}
          categories={categories}
        />
      </section>
    </article>
  );
}

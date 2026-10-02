import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product-listing";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getProductsByCategory,
} from "@/db/queries";

// Stock and new products show up within a minute without a rebuild.
export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategorySlugs();
  return categories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} | Atelier Store`,
    description: `${category.name} from Atelier Store, with the most recent pieces first.`,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/[category]">) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);

  return (
    <ProductListing
      title={category.name}
      products={products}
      empty={`There is nothing in ${category.name.toLowerCase()} at the moment. New pieces appear here as soon as they leave the workshop.`}
      emptyAction={{ label: "Shop new arrivals", href: "/new" }}
    />
  );
}

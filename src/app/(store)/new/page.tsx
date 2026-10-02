import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
import { getNewArrivals } from "@/db/queries";

const intro = "The latest pieces from the workshop, with the most recent first.";

// Stock and new products show up within a minute without a rebuild.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "New arrivals | Atelier Store",
  description: intro,
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <ProductListing
      title="New arrivals"
      intro={intro}
      products={products}
      empty="Nothing new has arrived yet. The next pieces will appear here as soon as they leave the workshop."
    />
  );
}

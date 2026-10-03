import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Categories | Admin | Atelier Store", robots: { index: false } };
}

// Only the guarded route for now: the section itself is not built yet.
export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <section aria-labelledby="categories-title">
      <h2 id="categories-title" className="type-title">
        Categories
      </h2>
      <p className="type-body mt-6 border-t pt-6 text-muted">
        The categories will be listed here, with the forms to add and edit one.
      </p>
    </section>
  );
}

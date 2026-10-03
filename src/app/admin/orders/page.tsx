import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Orders | Admin | Atelier Store", robots: { index: false } };
}

// Only the guarded route for now: the section itself is not built yet.
export default async function OrdersPage() {
  await requireAdmin();

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="type-title">
        Orders
      </h2>
      <p className="type-body mt-6 border-t pt-6 text-muted">
        Orders will be listed here, newest first, with where each payment stands.
      </p>
    </section>
  );
}

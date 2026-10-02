import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/session";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin");
  return { title: "Admin | Atelier Store", robots: { index: false } };
}

// Every page and Server Action under /admin calls `requireAdmin` itself: a
// layout would not re-run on navigation and cannot stop a page from rendering.
export default async function AdminPage() {
  const { user } = await requireAdmin("/admin");

  return (
    <main className="shell-reading flex-1 py-section">
      <h1 className="type-headline">Admin</h1>
      <p className="type-lead mt-4 text-muted">
        Signed in as {user.name} ({user.email}).
      </p>
      <p className="type-body mt-6">
        Nothing is managed from here yet. This page only confirms that the
        admin role is enforced.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <SignOutButton />
        <Link href="/" className="link type-ui">
          Back to the store
        </Link>
      </div>
    </main>
  );
}

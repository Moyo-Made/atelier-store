import type { Metadata } from "next";
import Link from "next/link";
import { adminSections } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";

// Checked here as well so the 404 a non-admin gets does not carry this title.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Admin | Atelier Store", robots: { index: false } };
}

// Every page and Server Action under /admin calls `requireAdmin` itself: the
// layout does not re-run on navigation and cannot stop a page from rendering.
export default async function AdminPage() {
  await requireAdmin();

  return (
    <section aria-labelledby="overview-title">
      <h2 id="overview-title" className="type-title">
        Overview
      </h2>

      <ul className="mt-6 divide-y border-y">
        {adminSections.map((section) => (
          <li
            key={section.href}
            className="relative flex items-baseline justify-between gap-6 py-5"
          >
            <div className="min-w-0">
              <h3 className="type-body">{section.label}</h3>
              <p className="type-caption mt-1 text-muted">
                {section.description}
              </p>
            </div>
            {/* The link's box is stretched over the row, so all of it opens the section. */}
            <Link
              href={section.href}
              prefetch={false}
              className="link type-ui shrink-0 after:absolute after:inset-0"
            >
              Open
              <span className="sr-only"> {section.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

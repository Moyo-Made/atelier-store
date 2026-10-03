import Link from "next/link";

// What every 404 shows: a product or category that is gone, an address that
// was never a page, and anything a visitor is not allowed to know exists. The
// wording is the same for all of them on purpose.
export function NotFoundPage() {
  return (
    <main className="flex-1 pt-header">
      {/* `metadata` is not read from a not-found file, so the title is set here. */}
      <title>Page not found | Atelier Store</title>
      <div className="shell-reading py-section">
        <p className="type-caption text-muted">Error 404</p>
        <h1 className="type-headline mt-4">We could not find that page</h1>
        <p className="type-lead mt-4 text-muted">
          The address may be mistyped, or the piece may no longer be sold.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link href="/search" className="btn btn-secondary">
            Search the store
          </Link>
        </div>
      </div>
    </main>
  );
}

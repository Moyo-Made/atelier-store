"use client";

import Link from "next/link";
import { useEffect } from "react";

// What an error boundary shows when a page fails on our side, usually
// because the database could not be reached. Checkout has its own, which
// also speaks about the payment.
export function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 pt-header">
      <title>Something went wrong | Atelier Store</title>
      <div className="shell-reading py-section">
        <h1 className="type-headline">Something went wrong</h1>
        <p className="type-lead mt-4 text-muted">
          We could not load this page. Please try again in a moment.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button type="button" onClick={retry} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Return to the store
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

// Something failed on our side during checkout. The wording is careful about
// money: this page cannot know whether a payment went through, so it says
// where to look instead of guessing.
export default function CheckoutError({
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
      <div className="shell-reading py-section">
        <h1 className="type-headline">Something went wrong</h1>
        <p className="type-lead mt-4 text-muted">
          We could not finish loading this page. If you had already paid on
          Stripe, the payment is safe and your order will be recorded; please
          do not pay again.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button type="button" onClick={retry} className="btn btn-primary">
            Try again
          </button>
          <Link href="/bag" className="btn btn-secondary">
            Return to your bag
          </Link>
        </div>
      </div>
    </main>
  );
}

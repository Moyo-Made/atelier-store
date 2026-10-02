"use client";

import { useFormStatus } from "react-dom";

// Submit button for a checkout form. Busy from the press until the browser
// leaves for Stripe, so it cannot be pressed twice.
export function CheckoutButton({
  children = "Continue to payment",
}: {
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-block"
      >
        {pending ? "Taking you to payment…" : children}
      </button>
      <p role="status" className="type-caption mt-3 min-h-4 text-muted">
        {pending
          ? "Holding your pieces and opening Stripe. This takes a few seconds."
          : null}
      </p>
    </>
  );
}

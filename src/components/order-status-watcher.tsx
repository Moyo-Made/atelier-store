"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EVERY_MS = 4000;
// About two minutes. Stripe's confirmation normally lands within seconds.
const MAX_CHECKS = 30;

// Shown while an order is waiting for its payment to be confirmed. It asks
// the server for the page again every few seconds; the server reads the
// order's state, so the page turns into the confirmation by itself once the
// order is paid. It decides nothing about the payment.
export function OrderStatusWatcher() {
  const router = useRouter();
  const [checks, setChecks] = useState(0);
  const waiting = checks < MAX_CHECKS;

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      router.refresh();
      setChecks((count) => count + 1);
    }, EVERY_MS);
    return () => clearTimeout(timer);
  }, [checks, waiting, router]);

  return (
    <div role="status" className="mt-8 border-l-2 pl-4">
      {waiting ? (
        <p className="type-body">
          Checking for confirmation. This page updates by itself, so there is
          nothing to press.
        </p>
      ) : (
        <>
          <p className="type-body">
            It is taking longer than usual. You can leave this page: the order
            is recorded and will be confirmed as soon as the payment is.
          </p>
          <button
            type="button"
            onClick={() => setChecks(0)}
            className="btn btn-secondary btn-sm mt-4"
          >
            Check again
          </button>
        </>
      )}
    </div>
  );
}

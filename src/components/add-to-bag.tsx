"use client";

import Link from "next/link";
import { useState } from "react";
import { useBag } from "@/components/bag";

const FAILED = "We could not update your bag. Please try again.";

export function AddToBag({
  productId,
  available,
  max,
}: {
  productId: number;
  available: boolean;
  // From `getMaxQuantity`. It can be a minute stale here, so the server
  // checks again and its answer is the one shown.
  max: number;
}) {
  const bag = useBag();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inBag = bag.quantityOf(productId);
  const atLimit = inBag >= max;

  async function add() {
    setPending(true);
    setMessage(null);
    try {
      const result = await bag.add(productId);
      setMessage(result.message ?? null);
    } catch {
      setMessage(FAILED);
    }
    setPending(false);
  }

  return (
    <div>
      <button
        type="button"
        disabled={!available || atLimit || pending}
        onClick={add}
        className="btn btn-primary btn-block"
      >
        {!available ? "Sold out" : pending ? "Adding…" : "Add to bag"}
      </button>
      <p role="status" className="type-caption mt-3 min-h-4 text-muted">
        {message ??
          (inBag > 0 ? (
            <>
              {inBag} in your bag
              {atLimit ? ". That is the most you can add. " : ". "}
              <Link href="/bag" className="link text-foreground">
                View bag
              </Link>
            </>
          ) : null)}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBag } from "@/components/bag";
import { Roll } from "@/components/roll";

const FAILED = "We could not update your bag. Please try again.";
// How long the button says "Added".
const ADDED_MS = 1600;

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
  const [added, setAdded] = useState(false);
  // The label only rolls once the customer has pressed the button.
  const [pressed, setPressed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inBag = bag.quantityOf(productId);
  const atLimit = inBag >= max;

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  async function add() {
    clearTimeout(addedTimer.current);
    setPressed(true);
    setAdded(false);
    setPending(true);
    setMessage(null);
    try {
      const result = await bag.add(productId);
      setMessage(result.message ?? null);
      if (result.ok) {
        // "Added" for a moment, then back to "Add to bag".
        setAdded(true);
        addedTimer.current = setTimeout(() => setAdded(false), ADDED_MS);
      }
    } catch {
      setMessage(FAILED);
    }
    setPending(false);
  }

  const label = !available
    ? "Sold out"
    : pending
      ? "Adding…"
      : added
        ? "Added"
        : "Add to bag";

  return (
    <div>
      <button
        type="button"
        disabled={!available || atLimit || pending}
        onClick={add}
        className="btn btn-primary btn-block"
      >
        <Roll value={label} animate={pressed} />
      </button>
      <p role="status" className="type-caption mt-3 min-h-4 text-muted">
        {/* Keyed on what it says, so each new line fades in. */}
        <span key={message ?? inBag} className="enter-fade">
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
        </span>
      </p>
    </div>
  );
}

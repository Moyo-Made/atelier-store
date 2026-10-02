"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useBag } from "@/components/bag";

const FAILED = "We could not update your bag. Please try again.";

// Quantity stepper and Remove for one line of the bag page. The quantity in
// `quantity` is the server's; this only asks for a change and shows the asked
// value until the answer comes back.
export function BagLineControls({
  productId,
  name,
  quantity,
  max,
  limitNote,
}: {
  productId: number;
  name: string;
  quantity: number;
  // From `getMaxQuantity`, as the server saw it when the page rendered.
  max: number;
  // Shown once the line holds everything it can.
  limitNote: string;
}) {
  const bag = useBag();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(quantity);
  const [removing, setRemoving] = useOptimistic(false);
  // What is being typed, until it is committed on Enter or on leaving the box.
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function change(next: number) {
    setDraft(null);
    setMessage(null);
    startTransition(async () => {
      setShown(next);
      try {
        const result = await bag.setQuantity(productId, next);
        setMessage(result.message ?? null);
      } catch {
        setMessage(FAILED);
      }
    });
  }

  function commitDraft() {
    if (draft === null) return;
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 1) {
      setDraft(null);
      setMessage("Enter a quantity of 1 or more, or remove the piece.");
      return;
    }
    if (next === quantity) {
      setDraft(null);
      return;
    }
    // More than is available is still sent: the server stores what it can
    // and says why.
    change(next);
  }

  function remove() {
    setMessage(null);
    startTransition(async () => {
      setRemoving(true);
      try {
        await bag.remove(productId);
      } catch {
        setMessage(FAILED);
      }
    });
  }

  const atLimit = shown >= max;

  return (
    <div aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="stepper">
          <button
            type="button"
            aria-label={`One fewer ${name}`}
            disabled={pending || shown <= 1}
            onClick={() => change(shown - 1)}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            aria-label={`Quantity of ${name}`}
            value={draft ?? shown}
            readOnly={pending}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitDraft();
            }}
          />
          <button
            type="button"
            aria-label={`One more ${name}`}
            disabled={pending || atLimit}
            onClick={() => change(shown + 1)}
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="link type-caption"
        >
          {removing ? "Removing…" : "Remove"}
          <span className="sr-only"> {name}</span>
        </button>
      </div>

      <p role="status" className="type-caption mt-2 min-h-4 text-muted">
        {message ?? (atLimit ? limitNote : null)}
      </p>
    </div>
  );
}

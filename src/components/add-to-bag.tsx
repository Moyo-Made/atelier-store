"use client";

import { useBag } from "@/components/bag";

export function AddToBag({
  productId,
  available,
  stock,
}: {
  productId: number;
  available: boolean;
  // Units that can be added; omit for made-to-order pieces.
  stock?: number;
}) {
  const bag = useBag();
  const inBag = bag.quantityOf(productId);
  const atLimit = stock !== undefined && inBag >= stock;

  return (
    <div>
      <button
        type="button"
        disabled={!available || atLimit}
        onClick={() => bag.add(productId)}
        className="btn btn-primary btn-block"
      >
        {available ? "Add to bag" : "Sold out"}
      </button>
      <p role="status" className="type-caption mt-3 min-h-4 text-muted">
        {inBag > 0
          ? `${inBag} in your bag${atLimit ? ". That is all we have." : ""}`
          : null}
      </p>
    </div>
  );
}

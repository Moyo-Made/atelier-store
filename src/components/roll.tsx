"use client";

import { useBag } from "@/components/bag";

// Text that rolls up into place when `value` changes. Until `animate` is
// true it stays still, so a value that arrives with the page or with
// hydration does not roll.
export function Roll({
  value,
  animate,
}: {
  value: React.ReactNode;
  animate: boolean;
}) {
  return (
    <span className="roll">
      {/* A new key remounts the span, which replays its animation. */}
      <span
        key={animate ? String(value) : undefined}
        className={animate ? "roll-in" : undefined}
      >
        {value}
      </span>
    </span>
  );
}

// A figure that rolls once the bag has changed on this page, for server
// pages such as the bag's subtotal.
export function BagRoll({ value }: { value: React.ReactNode }) {
  const { changes } = useBag();
  return <Roll value={value} animate={changes > 0} />;
}

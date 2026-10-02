"use client";

import { createContext, use, useMemo, useState } from "react";

type Bag = {
  count: number;
  quantityOf: (productId: number) => number;
  add: (productId: number) => void;
};

const BagContext = createContext<Bag | null>(null);

// Held in memory only: the bag empties on reload until there is a real cart.
export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<number, number>>({});

  const bag = useMemo<Bag>(
    () => ({
      count: Object.values(items).reduce((total, quantity) => total + quantity, 0),
      quantityOf: (productId) => items[productId] ?? 0,
      add: (productId) =>
        setItems((current) => ({
          ...current,
          [productId]: (current[productId] ?? 0) + 1,
        })),
    }),
    [items],
  );

  return <BagContext value={bag}>{children}</BagContext>;
}

export function useBag() {
  const bag = use(BagContext);
  if (!bag) throw new Error("useBag must be used inside BagProvider");
  return bag;
}

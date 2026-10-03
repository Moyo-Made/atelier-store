"use client";

import {
  createContext,
  use,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  addToBag,
  removeFromBag,
  setBagQuantity,
  tidyBag,
  type BagChange,
} from "@/app/(store)/bag/actions";
import { BAG_COOKIE, parseBag } from "@/lib/bag-cookie";

type Bag = {
  count: number;
  // How many changes this page has made to the bag. The header only rolls
  // its count once this is above 0.
  changes: number;
  quantityOf: (productId: number) => number;
  add: (productId: number) => Promise<BagChange>;
  setQuantity: (productId: number, quantity: number) => Promise<BagChange>;
  remove: (productId: number) => Promise<BagChange>;
  // Brings the cookie back in line with the catalogue.
  tidy: () => Promise<void>;
  // Reads the cookie again after something else on the server changed it.
  refresh: () => void;
};

const BagContext = createContext<Bag | null>(null);

// The bag lives in a cookie that only the Server Actions write. This reads it
// for the count and the "in your bag" lines, and is told to read it again
// after each action.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab may have changed the bag while this one was in the background.
  document.addEventListener("visibilitychange", listener);
  return () => {
    listeners.delete(listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

function readCookie() {
  const prefix = `${BAG_COOKIE}=`;
  const found = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  // Empty on the server: the layout is prerendered, so the count appears once
  // the page has hydrated.
  const cookie = useSyncExternalStore(subscribe, readCookie, () => "");
  const [changes, setChanges] = useState(0);

  const bag = useMemo<Bag>(() => {
    const entries = parseBag(cookie);
    const after = async <T,>(action: Promise<T>) => {
      try {
        return await action;
      } finally {
        setChanges((count) => count + 1);
        notify();
      }
    };

    return {
      count: entries.reduce((total, entry) => total + entry.quantity, 0),
      changes,
      quantityOf: (productId) =>
        entries.find((entry) => entry.productId === productId)?.quantity ?? 0,
      add: (productId) => after(addToBag(productId)),
      setQuantity: (productId, quantity) =>
        after(setBagQuantity(productId, quantity)),
      remove: (productId) => after(removeFromBag(productId)),
      tidy: () => after(tidyBag()),
      refresh: notify,
    };
  }, [cookie, changes]);

  return <BagContext value={bag}>{children}</BagContext>;
}

export function useBag() {
  const bag = use(BagContext);
  if (!bag) throw new Error("useBag must be used inside BagProvider");
  return bag;
}

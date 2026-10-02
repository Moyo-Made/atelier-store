"use client";

import { useEffect, useRef } from "react";
import { finishCheckout } from "@/app/(store)/checkout/actions";
import { useBag } from "@/components/bag";

// Rendered by the confirmation page of a paid order. Has the server empty
// the bag (a page cannot write cookies), then updates the header count.
export function FinishCheckout({ sessionId }: { sessionId: string }) {
  const bag = useBag();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void finishCheckout(sessionId).then(bag.refresh);
  }, [bag, sessionId]);

  return null;
}

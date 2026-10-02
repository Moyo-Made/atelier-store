"use client";

import { useEffect, useRef, useState } from "react";
import { useBag } from "@/components/bag";

// Says what the bag page had to drop or reduce, and has the cookie rewritten
// to match, which the page itself cannot do. The notices are kept in state so
// they stay on screen after that rewrite re-renders the page without them.
export function BagNotices({ notices }: { notices: string[] }) {
  const bag = useBag();
  const [shown] = useState(notices);
  const tidied = useRef(false);

  useEffect(() => {
    if (shown.length === 0 || tidied.current) return;
    tidied.current = true;
    void bag.tidy();
  }, [bag, shown]);

  if (shown.length === 0) return null;

  return (
    <ul
      role="status"
      className="type-body mt-8 grid max-w-reading gap-2 border-l-2 border-danger pl-4"
    >
      {shown.map((notice) => (
        <li key={notice}>{notice}</li>
      ))}
    </ul>
  );
}

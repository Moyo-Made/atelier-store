"use client";

import { useEffect } from "react";

// The hero entrance in motion.css lasts about 2.6 seconds.
const INTRO_MS = 3000;

// Marks the page once the hero entrance has played, so coming back to the
// homepage in the same visit shows the hero at rest. A reload plays it again.
// Leaving before it finishes clears the timer, so the next visit still plays.
export function HeroIntro() {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.dataset.introPlayed = "";
    }, INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

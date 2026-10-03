"use client";

import { useEffect, useRef } from "react";

// An editorial photograph that unveils once as it scrolls into view. It
// renders visible, and only one that starts below the fold is hidden after
// hydration, so a photograph is never left hidden waiting for a script.
// For editorial imagery only: product grids stay still so shoppers can scan.
export function Reveal({
  className = "",
  children,
}: {
  // The box's own classes, such as `media-cover aspect-4/3`.
  className?: string;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    element.classList.add("reveal-pending");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.classList.replace("reveal-pending", "reveal-shown");
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.classList.remove("reveal-pending");
    };
  }, []);

  return (
    <div ref={box} className={className}>
      {children}
    </div>
  );
}

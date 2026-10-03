"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useBag } from "@/components/bag";
import { BagRoll } from "@/components/roll";
import { authClient } from "@/lib/auth-client";

const primaryLinks = [
  { label: "New arrivals", href: "/new" },
  { label: "Outerwear", href: "/outerwear" },
  { label: "Knitwear", href: "/knitwear" },
  { label: "Bags", href: "/bags" },
  { label: "Shoes", href: "/shoes" },
  { label: "Small leather goods", href: "/small-leather" },
  { label: "Eyewear", href: "/eyewear" },
  { label: "Watches", href: "/watches" },
  { label: "Fragrance", href: "/fragrance" },
  { label: "The atelier", href: "/atelier" },
];

const secondaryLinks = [
  { label: "Search", href: "/search" },
  { label: "Stores", href: "/stores" },
  { label: "Customer care", href: "/care" },
  { label: "Account", href: "/account" },
];

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function useScrolled() {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 16,
    () => false,
  );
}

// Below this, the header never tucks away.
const TUCK_AFTER = 160;
// Smaller movements, such as a trackpad settling, are ignored.
const SCROLL_SLOP = 8;

// True while the page is scrolling down, so the header can get out of the
// way of the photographs. Any scroll up brings it back.
function useTuckedAway() {
  const [tucked, setTucked] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < SCROLL_SLOP) return;
      setTucked(y > lastY && y > TUCK_AFTER);
      lastY = y;
    }
    return subscribeToScroll(onScroll);
  }, []);

  // Sticky columns below the header (`top-header-offset`) move up with it.
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-header-tucked", tucked);
    return () => root.removeAttribute("data-header-tucked");
  }, [tucked]);

  return tucked;
}

export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const tucked = useTuckedAway();
  const bag = useBag();
  const menu = useRef<HTMLDialogElement>(null);
  // Better Auth cannot extend a session from a Server Component, so this
  // request from the browser is what keeps a returning customer signed in.
  // It also keeps the session out of the layout, which stays prerendered.
  const { data: session, isPending } = authClient.useSession();
  // Until the answer is in, the label stays "Account": the link is right
  // either way, and a signed-in customer never sees "Sign in".
  const accountLabel = isPending || session ? "Account" : "Sign in";

  // On the homepage the header sits over the hero image until the page scrolls.
  const overHero = pathname === "/" && !scrolled;

  return (
    <>
      <header
        // A keyboard user tabbing into a tucked header brings it back.
        className={`fixed inset-x-0 top-0 z-40 border-b transition-[color,background-color,border-color,translate] duration-(--duration-slow) ease-emphasis focus-within:translate-y-0 ${
          overHero
            ? "border-transparent bg-transparent text-white"
            : "bg-background text-foreground"
        } ${tucked ? "-translate-y-full" : ""}`}
      >
        <div className="shell grid h-header grid-cols-[1fr_auto_1fr] items-center">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => menu.current?.showModal()}
            className="type-ui -ml-2 flex items-center gap-3 justify-self-start px-2 py-3"
          >
            <span aria-hidden="true" className="grid w-4 gap-1.5">
              <span className="h-px bg-current" />
              <span className="h-px bg-current" />
            </span>
            Menu
          </button>

          <Link href="/" aria-label="Atelier home" className="type-wordmark">
            Atelier
          </Link>

          <nav
            aria-label="Account"
            className="type-ui flex items-center gap-6 justify-self-end"
          >
            <Link href="/search" className="link-reveal max-lg:hidden">
              Search
            </Link>
            <Link
              href="/account"
              prefetch={false}
              className="link-reveal max-lg:hidden"
            >
              {accountLabel}
            </Link>
            <Link href="/bag" className="link-reveal">
              Bag (<BagRoll value={bag.count} />)
            </Link>
          </nav>
        </div>
      </header>

      <dialog
        ref={menu}
        aria-label="Menu"
        onClick={(event) => {
          // The dialog itself is only hit when the click lands on the backdrop.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-md -translate-x-full bg-background text-foreground transition-[translate,display,overlay] transition-discrete duration-(--duration-slow) ease-emphasis backdrop:scrim open:translate-x-0 starting:open:-translate-x-full"
      >
        <div className="flex h-full flex-col overflow-y-auto px-gutter pb-10">
          <div className="flex h-header shrink-0 items-center justify-end">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => menu.current?.close()}
              className="btn btn-primary btn-icon"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>

          <nav
            aria-label="Main"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                menu.current?.close();
              }
            }}
            className="mt-6 flex flex-1 flex-col"
          >
            {/* The links follow the drawer in, one after another. */}
            <ul className="menu-stagger grid gap-4 text-lg font-medium">
              {primaryLinks.map((link, index) => (
                <li
                  key={link.href}
                  style={{ "--item": index } as React.CSSProperties}
                >
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="link-reveal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="menu-stagger type-ui mt-10 grid gap-4 border-t pt-8">
              {secondaryLinks.map((link, index) => (
                <li
                  key={link.href}
                  style={
                    {
                      "--item": primaryLinks.length + index,
                    } as React.CSSProperties
                  }
                >
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="link-reveal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}

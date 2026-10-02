"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useSyncExternalStore } from "react";
import { useBag } from "@/components/bag";

const primaryLinks = [
  { label: "New arrivals", href: "/new" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Bags", href: "/bags" },
  { label: "Shoes", href: "/shoes" },
  { label: "Accessories", href: "/accessories" },
  { label: "The atelier", href: "/atelier" },
];

const secondaryLinks = [
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

export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const bag = useBag();
  const menu = useRef<HTMLDialogElement>(null);

  // On the homepage the header sits over the hero image until the page scrolls.
  const overHero = pathname === "/" && !scrolled;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-colors ${
          overHero
            ? "border-transparent bg-transparent text-white"
            : "bg-background text-foreground"
        }`}
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
            <Link
              href="/search"
              prefetch={false}
              className="link-reveal max-lg:hidden"
            >
              Search
            </Link>
            <Link
              href="/account"
              prefetch={false}
              className="link-reveal max-lg:hidden"
            >
              Account
            </Link>
            <Link href="/bag" prefetch={false} className="link-reveal">
              Bag ({bag.count})
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
            <ul className="grid gap-4 text-lg font-medium">
              {primaryLinks.map((link) => (
                <li key={link.href}>
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

            <ul className="type-ui mt-10 grid gap-4 border-t pt-8">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
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

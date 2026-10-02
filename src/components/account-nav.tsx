"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

// Sections of the account area: a row that wraps on small screens, a column
// beside the content from `lg`.
export function AccountNav({
  links,
  className = "",
}: {
  links: { label: string; href: string }[];
  className?: string;
}) {
  const pathname = usePathname();

  // A section stays marked on the pages under it (an order under Orders).
  // `/account` is the root of them all, so it only matches itself.
  const current = (href: string) => {
    if (pathname === href) return "page";
    return href !== "/account" && pathname.startsWith(`${href}/`)
      ? "true"
      : undefined;
  };

  return (
    <nav aria-label="Account sections" className={className}>
      <ul className="type-ui flex flex-wrap gap-x-8 gap-y-4 lg:flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              prefetch={false}
              aria-current={current(link.href)}
              className="link-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <SignOutButton className="type-ui link-muted" />
        </li>
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

// Sections of the account area, of the admin and of customer care: a row that
// wraps on small screens, a column beside the content from `lg`.
export function AccountNav({
  links,
  root = "/account",
  label = "Account sections",
  signOut = true,
  className = "",
}: {
  links: { label: string; href: string }[];
  // The area's own first page.
  root?: string;
  label?: string;
  // Off for an area that is not behind a sign-in.
  signOut?: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  // A section stays marked on the pages under it (an order under Orders).
  // The root is above them all, so it only matches itself.
  const current = (href: string) => {
    if (pathname === href) return "page";
    return href !== root && pathname.startsWith(`${href}/`) ? "true" : undefined;
  };

  return (
    <nav aria-label={label} className={className}>
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
        {signOut ? (
          <li>
            <SignOutButton className="type-ui link-muted" />
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

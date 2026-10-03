import Link from "next/link";
import { AccountNav } from "@/components/account-nav";

const links = [
  { label: "Terms of sale", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Cookies", href: "/legal/cookies" },
];

// The frame the legal pages share, laid out like customer care: the sections
// beside the page. There is no page at `/legal` itself. A new one is an entry
// in `links` and a page beside this file.
export default function LegalLayout({ children }: LayoutProps<"/legal">) {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Legal</span>
        </nav>

        <h1 className="type-headline mt-4">Legal</h1>
        <p className="type-lead mt-4 max-w-reading text-muted">
          The terms an order is made on, what we keep about you, and the
          cookies this site sets.
        </p>
      </div>

      <div className="border-t">
        <div className="shell grid-page gap-y-10 py-10 lg:py-14">
          <AccountNav
            links={links}
            root="/legal"
            label="Legal sections"
            signOut={false}
            className="col-span-full lg:col-span-3"
          />
          <div className="col-span-full max-w-reading lg:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

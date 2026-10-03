import Link from "next/link";
import { AccountNav } from "@/components/account-nav";

const links = [
  { label: "Contact us", href: "/care" },
  { label: "Delivery and returns", href: "/care/delivery" },
  { label: "Alterations", href: "/care/alterations" },
  { label: "Size guides", href: "/care/sizes" },
];

// The frame every customer care page shares, laid out like the account: the
// sections beside the page. A new one is an entry in `links` and a page
// beside this file.
export default function CareLayout({ children }: LayoutProps<"/care">) {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Customer care</span>
        </nav>

        <h1 className="type-headline mt-4">Customer care</h1>
        <p className="type-lead mt-4 max-w-reading text-muted">
          Delivery, returns, alterations and sizes, and how to reach us about
          anything else.
        </p>
      </div>

      <div className="border-t">
        <div className="shell grid-page gap-y-10 py-10 lg:py-14">
          <AccountNav
            links={links}
            root="/care"
            label="Customer care sections"
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

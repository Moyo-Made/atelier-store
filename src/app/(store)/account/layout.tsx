import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { getSession } from "@/lib/session";

// The frame every account page shares. It reads the session only to greet the
// customer and build the navigation: it protects nothing, because a layout
// does not re-run on navigation. Each page calls `requireUser` itself.
export default async function AccountLayout({
  children,
}: LayoutProps<"/account">) {
  const session = await getSession();

  // A new section (orders, addresses) is one more entry here and a page
  // beside this file.
  const links = [{ label: "Details", href: "/account" }];
  if (session?.user.role === "admin") {
    links.push({ label: "Admin", href: "/admin" });
  }

  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Account</span>
        </nav>

        <h1 className="type-headline mt-4">Account</h1>
        {session ? (
          <p className="type-lead mt-4 text-muted">
            Welcome, {session.user.name}.
          </p>
        ) : null}
      </div>

      <div className="border-t">
        <div className="shell grid-page gap-y-10 py-10 lg:py-14">
          <AccountNav links={links} className="col-span-full lg:col-span-3" />
          <div className="col-span-full lg:col-span-9">{children}</div>
        </div>
      </div>
    </main>
  );
}

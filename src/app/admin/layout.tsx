import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { adminSections } from "@/lib/admin";
import { getSession } from "@/lib/session";

// The frame every admin page shares. It protects nothing: a layout does not
// re-run on navigation and cannot stop a page from rendering, so each page
// and Server Action under /admin calls `requireAdmin` itself. The role is
// read here only so that the 404 a non-admin gets carries none of the frame.
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getSession();
  if (session?.user.role !== "admin") return children;

  const links = [
    { label: "Overview", href: "/admin" },
    ...adminSections.map(({ label, href }) => ({ label, href })),
  ];

  return (
    <main className="flex-1">
      <div className="shell flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pt-8 pb-10 lg:pt-14 lg:pb-14">
        <div>
          <h1 className="type-headline">Admin</h1>
          <p className="type-lead mt-4 text-muted">
            Signed in as {session.user.name} ({session.user.email}).
          </p>
        </div>
        <Link href="/" className="link type-ui">
          Back to the store
        </Link>
      </div>

      <div className="border-t">
        <div className="shell grid-page gap-y-10 py-10 lg:py-14">
          <AccountNav
            links={links}
            root="/admin"
            label="Admin sections"
            className="col-span-full lg:col-span-3"
          />
          <div className="col-span-full lg:col-span-9">{children}</div>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { useId } from "react";

// A page of copy rather than products: the atelier, the stores, careers. The
// heading block matches the listing pages; the body is `ContentSection`s.
export function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{title}</span>
        </nav>

        <h1 className="type-headline mt-4">{title}</h1>
        <p className="type-lead mt-4 max-w-reading text-muted">{intro}</p>
      </div>

      {children}
    </main>
  );
}

// One ruled row of a content page: the heading on the left from `lg`, the
// copy in a reading column beside it.
export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = useId();

  return (
    <section aria-labelledby={id} className="border-t">
      <div className="shell grid-page gap-y-6 py-10 lg:py-14">
        <h2 id={id} className="type-title col-span-full lg:col-span-4">
          {title}
        </h2>
        <div className="type-body col-span-full grid max-w-reading gap-4 lg:col-span-7 lg:col-start-6">
          {children}
        </div>
      </div>
    </section>
  );
}

// A titled block of copy inside a framed area that already has its page
// heading, such as a customer care page.
export function ContentBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = useId();

  return (
    <section aria-labelledby={id} className="mt-10 border-t pt-6">
      <h3 id={id} className="type-heading">
        {title}
      </h3>
      <div className="type-body mt-4 grid gap-4">{children}</div>
    </section>
  );
}

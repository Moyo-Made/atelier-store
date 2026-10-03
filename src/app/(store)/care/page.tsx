import type { Metadata } from "next";
import Link from "next/link";
import { ContentBlock } from "@/components/content-page";
import { care } from "@/data/house";

export const metadata: Metadata = {
  title: "Contact us | Atelier Store",
  description:
    "How to reach Atelier Store customer care about an order, a delivery or a piece you own.",
};

export default function ContactPage() {
  return (
    <article aria-labelledby="contact-title">
      <h2 id="contact-title" className="type-title">
        Contact us
      </h2>
      <p className="type-body mt-4 text-muted">
        Customer care sits in the workshop, so a question about a piece is
        answered by someone who can walk over and look at one.
      </p>

      <dl className="mt-6 divide-y border-y">
        <div className="grid gap-1 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6">
          <dt className="type-caption text-muted">Email</dt>
          <dd className="type-body break-words">
            <a href={`mailto:${care.email}`} className="link">
              {care.email}
            </a>
          </dd>
        </div>
        <div className="grid gap-1 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6">
          <dt className="type-caption text-muted">Telephone</dt>
          <dd className="type-body">{care.phone}</dd>
        </div>
        <div className="grid gap-1 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6">
          <dt className="type-caption text-muted">Hours</dt>
          <dd className="type-body">{care.hours}</dd>
        </div>
      </dl>

      <ContentBlock title="About an order">
        <p>
          If you ordered while signed in, the order and where its payment
          stands are in your account. When you write to us, include the order
          number, which starts with AT-.
        </p>
        <p className="type-ui">
          <Link href="/account/orders" prefetch={false} className="link">
            Your orders
          </Link>
        </p>
      </ContentBlock>

      <ContentBlock title="In person">
        <p>
          The stores in New York, Chicago and Los Angeles can help with
          anything here, and take in pieces for alteration.
        </p>
        <p className="type-ui">
          <Link href="/stores" className="link">
            Stores
          </Link>
        </p>
      </ContentBlock>
    </article>
  );
}

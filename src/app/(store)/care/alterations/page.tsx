import type { Metadata } from "next";
import Link from "next/link";
import { ContentBlock } from "@/components/content-page";
import { care } from "@/data/house";

export const metadata: Metadata = {
  title: "Alterations | Atelier Store",
  description:
    "Bring any Atelier piece back to be re-hemmed, relined or resoled in the workshop that made it.",
};

export default function AlterationsPage() {
  return (
    <article aria-labelledby="alterations-title">
      <h2 id="alterations-title" className="type-title">
        Alterations for life
      </h2>
      <p className="type-body mt-4 text-muted">
        Bring any piece back to be re-hemmed, relined or resoled in the
        workshop, however long ago it was bought.
      </p>

      <ContentBlock title="What we do">
        <ul className="grid gap-2">
          <li>Hems, sleeves and waists taken up, in or out.</li>
          <li>Coats and jackets relined.</li>
          <li>Shoes resoled and reheeled.</li>
          <li>Bags restitched, and their edges and handles refinished.</li>
        </ul>
        <p>
          Adjusting the fit of a piece is free. A reline, a resole or a repair
          is quoted before any work begins.
        </p>
      </ContentBlock>

      <ContentBlock title="How to arrange it">
        <p>
          Leave the piece at any store, or write to{" "}
          <a href={`mailto:${care.email}`} className="link">
            {care.email}
          </a>{" "}
          and we send a prepaid label to post it to the workshop.
        </p>
        <p>
          Most work takes two to three weeks. The piece comes back to the store
          or to your door, tracked.
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

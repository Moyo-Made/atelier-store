import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";
import { stores } from "@/data/house";

const intro =
  "Three stores, each with the full collection and an advisor who knows how every piece is made.";

export const metadata: Metadata = {
  title: "Stores | Atelier Store",
  description: intro,
};

export default function StoresPage() {
  return (
    <ContentPage title="Stores" intro={intro}>
      <section aria-labelledby="stores-title" className="border-t">
        <div className="shell py-10 lg:py-14">
          <h2 id="stores-title" className="sr-only">
            Our stores
          </h2>
          <ul className="grid gap-x-grid gap-y-10 md:grid-cols-3">
            {stores.map((store) => (
              <li key={store.city} className="border-t border-foreground pt-6">
                <h3 className="type-heading">{store.city}</h3>
                <p className="type-body mt-3">{store.area}</p>
                <ul className="type-body mt-3 text-muted">
                  {store.hours.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="type-ui mt-5">{store.phone}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContentSection title="In every store">
        <p>
          Try a piece on before you order it, and see the leathers and cloths
          that made-to-order pieces are cut from.
        </p>
        <p>
          Any piece can be left at a store to be altered or repaired in the
          workshop, and collected there when it is ready.
        </p>
        <p className="type-ui">
          <Link href="/care/alterations" className="link">
            Alterations
          </Link>
        </p>
      </ContentSection>
    </ContentPage>
  );
}

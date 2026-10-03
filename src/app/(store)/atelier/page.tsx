import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";
import { Reveal } from "@/components/reveal";
import { atelier } from "@/data/catalog";

const intro =
  "Every coat, bag and shoe is cut and finished by the same forty people, in the building where the patterns are drawn.";

export const metadata: Metadata = {
  title: "The atelier | Atelier Store",
  description: intro,
};

export default function AtelierPage() {
  return (
    <ContentPage title="The atelier" intro={intro}>
      <div className="shell pb-10 lg:pb-14">
        <Reveal className="media-cover aspect-4/3 lg:aspect-16/7">
          <Image
            src={atelier.image}
            alt={atelier.alt}
            fill
            preload
            sizes="100vw"
          />
        </Reveal>
      </div>

      <ContentSection title="One workshop">
        <p>
          Patterns are drawn on the top floor, cut on the floor below and sewn
          on the one below that. A question about a seam is answered by walking
          down a flight of stairs, not by sending a sample across an ocean.
        </p>
        <p>
          Nothing leaves until the person who made it has signed the inside
          seam.
        </p>
      </ContentSection>

      <ContentSection title="Made to order">
        <p>
          Some pieces are made only once they are ordered. They are cut for
          that order and are ready in three weeks, and each product page says
          when a piece is made this way.
        </p>
        <p>
          It means nothing is made to sit in a warehouse, and nothing is marked
          down to clear it.
        </p>
      </ContentSection>

      <ContentSection title="Kept in use">
        <p>
          A piece that has been worn for ten years is the best thing the
          workshop makes. Any of them can come back to be re-hemmed, relined or
          resoled by the people who made it.
        </p>
        <p className="type-ui">
          <Link href="/care/alterations" className="link">
            Alterations
          </Link>
        </p>
      </ContentSection>

      <ContentSection title="See the pieces">
        <p>
          The newest pieces from the workshop are online, and in the stores in
          New York, Chicago and Los Angeles.
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <Link href="/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link href="/stores" className="btn btn-secondary">
            Find a store
          </Link>
        </div>
      </ContentSection>
    </ContentPage>
  );
}

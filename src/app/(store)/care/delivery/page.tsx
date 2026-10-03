import type { Metadata } from "next";
import { ContentBlock } from "@/components/content-page";
import { care } from "@/data/house";

export const metadata: Metadata = {
  title: "Delivery and returns | Atelier Store",
  description:
    "Free tracked delivery on every order within the United States, and free returns within 30 days.",
};

export default function DeliveryPage() {
  return (
    <article aria-labelledby="delivery-title">
      <h2 id="delivery-title" className="type-title">
        Delivery and returns
      </h2>
      <p className="type-body mt-4 text-muted">
        Free tracked delivery on every order, and free returns within 30 days.
      </p>

      <ContentBlock title="Delivery">
        <p>
          We deliver within the United States. Delivery is tracked and free on
          every order, whatever its size.
        </p>
        <p>
          Pieces in stock leave the workshop within two working days. A
          made-to-order piece is ready in three weeks and is sent the day it is
          finished.
        </p>
      </ContentBlock>

      <ContentBlock title="Prices and payment">
        <p>
          Prices are in US dollars. No delivery charge or tax is added at
          checkout: the total you review is the total you pay. Payment is taken
          on Stripe&rsquo;s secure page, and only when it succeeds.
        </p>
      </ContentBlock>

      <ContentBlock title="Returns">
        <p>
          A piece can be returned free of charge within 30 days of delivery,
          unworn and with its labels attached.
        </p>
        <p>
          To return one, write to{" "}
          <a href={`mailto:${care.email}`} className="link">
            {care.email}
          </a>{" "}
          with the order number. We send a prepaid label, and refund the
          payment to the card it was made with once the piece is back in the
          workshop.
        </p>
      </ContentBlock>
    </article>
  );
}

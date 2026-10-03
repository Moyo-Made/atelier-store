import type { Metadata } from "next";
import Link from "next/link";
import { ContentBlock } from "@/components/content-page";
import { care } from "@/data/house";

export const metadata: Metadata = {
  title: "Terms of sale | Atelier Store",
  description:
    "The terms an order with Atelier Store is made on: prices, payment, delivery within the United States and returns within 30 days.",
};

export default function TermsPage() {
  return (
    <article aria-labelledby="terms-title">
      <h2 id="terms-title" className="type-title">
        Terms of sale
      </h2>
      <p className="type-body mt-4 text-muted">
        These terms apply to every order placed on this site. They say the
        same as the checkout does, in one place.
      </p>

      <ContentBlock title="Placing an order">
        <p>
          An order is placed when its payment succeeds, not when a piece goes
          into the bag. The bag does not set anything aside.
        </p>
        <p>
          When you continue to payment, the pieces in your bag are held for
          you for about half an hour. If the payment is not completed in that
          time, or you go back and change the bag, the hold ends and they
          return to sale.
        </p>
      </ContentBlock>

      <ContentBlock title="Prices">
        <p>
          Prices are in US dollars. No delivery charge or tax is added at
          checkout: the total you review is the total you pay. The price of a
          piece is the one shown when you review the order, and it stays on
          the order whatever the piece costs afterwards.
        </p>
      </ContentBlock>

      <ContentBlock title="Payment">
        <p>
          Payment is taken on Stripe&rsquo;s secure page, and only when it
          succeeds. Your card details are given to Stripe and never reach us.
        </p>
        <p>
          Some banks hold a payment before releasing it. Until they do, the
          order waits and its pieces stay held; if the payment fails, the
          order ends and nothing is charged.
        </p>
      </ContentBlock>

      <ContentBlock title="Delivery">
        <p>
          We deliver within the United States. Delivery is tracked and free on
          every order. Pieces in stock leave the workshop within two working
          days; a made-to-order piece is ready in three weeks and is sent the
          day it is finished.
        </p>
        <p className="type-ui">
          <Link href="/care/delivery" className="link">
            Delivery and returns
          </Link>
        </p>
      </ContentBlock>

      <ContentBlock title="Returns and refunds">
        <p>
          A piece can be returned free of charge within 30 days of delivery,
          unworn and with its labels attached. The refund goes to the card the
          payment was made with, once the piece is back in the workshop.
        </p>
      </ContentBlock>

      <ContentBlock title="Questions">
        <p>
          Write to{" "}
          <a href={`mailto:${care.email}`} className="link">
            {care.email}
          </a>{" "}
          with the order number, which starts with AT-.
        </p>
      </ContentBlock>
    </article>
  );
}

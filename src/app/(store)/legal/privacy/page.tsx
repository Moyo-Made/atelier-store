import type { Metadata } from "next";
import Link from "next/link";
import { ContentBlock } from "@/components/content-page";
import { care } from "@/data/house";

export const metadata: Metadata = {
  title: "Privacy | Atelier Store",
  description:
    "What Atelier Store keeps about you when you open an account or place an order, who sees it, and how to have it corrected or removed.",
};

export default function PrivacyPage() {
  return (
    <article aria-labelledby="privacy-title">
      <h2 id="privacy-title" className="type-title">
        Privacy
      </h2>
      <p className="type-body mt-4 text-muted">
        We keep what is needed to take an order and send it, and nothing to
        follow you around the web.
      </p>

      <ContentBlock title="Your account">
        <p>
          An account holds your name, your email address and a password. The
          password is stored scrambled, so nobody here can read it. Signing in
          keeps you signed in on that browser for seven days.
        </p>
        <p>You can order without an account, as a guest.</p>
      </ContentBlock>

      <ContentBlock title="Your orders">
        <p>
          For each order we keep what was bought and what it cost, the email
          address you gave at payment, and the name and address it is
          delivered to. An order placed while signed in is also kept with your
          account, so it appears in your order history.
        </p>
      </ContentBlock>

      <ContentBlock title="Payment">
        <p>
          Payment is taken by Stripe on its own page. Your card details go to
          Stripe and never reach us; we receive only whether the payment
          succeeded, and your email and delivery address.
        </p>
      </ContentBlock>

      <ContentBlock title="Who sees it">
        <p>
          Stripe, to take the payment, and the carrier, to deliver the order.
          We do not sell what we hold, and this site carries no advertising or
          analytics trackers.
        </p>
        <p className="type-ui">
          <Link href="/legal/cookies" className="link">
            Cookies
          </Link>
        </p>
      </ContentBlock>

      <ContentBlock title="Seeing, correcting or removing it">
        <p>
          Write to{" "}
          <a href={`mailto:${care.email}`} className="link">
            {care.email}
          </a>{" "}
          to see what we hold about you, to have it corrected, or to have your
          account closed. Records of paid orders are kept for as long as the
          law requires.
        </p>
      </ContentBlock>
    </article>
  );
}

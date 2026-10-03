import type { Metadata } from "next";
import { ContentBlock } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Cookies | Atelier Store",
  description:
    "The three cookies Atelier Store sets, what each one is for and how long it lasts.",
};

// Every cookie the site sets. Keep this true to `src/lib/bag-cookie.ts`,
// `src/lib/checkout.ts` and Better Auth's session.
const cookies = [
  {
    name: "atelier_bag",
    lasts: "30 days",
    purpose:
      "Your bag: which pieces are in it and how many of each. It holds no prices and nothing about you.",
  },
  {
    name: "atelier_checkout",
    lasts: "1 hour",
    purpose:
      "The payment you last started, so the pieces held for it can be released if you change the bag or come back without paying.",
  },
  {
    name: "better-auth.session_token",
    lasts: "7 days",
    purpose: "Keeps you signed in. Set only when you sign in or open an account.",
  },
];

export default function CookiesPage() {
  return (
    <article aria-labelledby="cookies-title">
      <h2 id="cookies-title" className="type-title">
        Cookies
      </h2>
      <p className="type-body mt-4 text-muted">
        This site sets three cookies, and each one is needed for the bag,
        the checkout or your account to work.
      </p>

      <dl className="mt-6 divide-y border-y">
        {cookies.map((cookie) => (
          <div
            key={cookie.name}
            className="grid gap-1 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
          >
            <dt className="type-caption break-words text-muted">
              {cookie.name}
            </dt>
            <dd className="type-body">
              {cookie.purpose}
              <span className="type-caption mt-1 block text-muted">
                Lasts {cookie.lasts}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <ContentBlock title="No tracking">
        <p>
          There are no advertising or analytics cookies here, which is why the
          site does not ask you to accept any.
        </p>
      </ContentBlock>

      <ContentBlock title="At payment">
        <p>
          Payment is taken on Stripe&rsquo;s own page, which sets its own
          cookies to keep the payment secure and to prevent fraud. Those are
          Stripe&rsquo;s, not ours.
        </p>
      </ContentBlock>

      <ContentBlock title="Turning cookies off">
        <p>
          Your browser can refuse or clear cookies. Without them the bag
          empties between pages and you cannot stay signed in, so an order
          cannot be placed.
        </p>
      </ContentBlock>
    </article>
  );
}

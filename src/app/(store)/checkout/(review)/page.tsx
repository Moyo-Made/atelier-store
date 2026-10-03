import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { startCheckout } from "@/app/(store)/checkout/actions";
import { CheckoutButton } from "@/components/checkout-button";
import { SummaryLines, SummaryTotals } from "@/components/order-summary";
import { getBag } from "@/lib/bag";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout | Atelier Store",
  robots: { index: false },
};

// Why the customer is back here, from `?status=`. Only these fixed sentences
// are ever shown, whatever the address says.
const statuses = new Map([
  [
    "cancelled",
    {
      title: "Payment was cancelled",
      text: "You have not been charged and your pieces are still in your bag. You can continue to payment again when you are ready.",
    },
  ],
  [
    "error",
    {
      title: "We could not open the payment page",
      text: "You have not been charged. Please try again in a moment.",
    },
  ],
]);

// The last look before paying: what is in the bag, at today's prices and
// stock, and what it comes to. Nothing is held or charged until the button is
// pressed; the payment itself happens on Stripe's page.
export default async function CheckoutPage({
  searchParams,
}: PageProps<"/checkout">) {
  const { status: statusParam } = await searchParams;
  const status =
    typeof statusParam === "string" ? statuses.get(statusParam) : undefined;

  const [bag, session] = await Promise.all([getBag(), getSession()]);
  // Nothing to pay for, or something changed: the bag page explains it.
  if (bag.lines.length === 0 || bag.notices.length > 0) redirect("/bag");

  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/bag" className="link-muted">
            Bag
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Checkout</span>
        </nav>

        <h1 className="type-headline mt-4">Checkout</h1>
        <p className="type-lead mt-4 max-w-reading text-muted">
          Check your order, then pay on Stripe&rsquo;s secure page.
        </p>

        {status ? (
          <div
            role="alert"
            className="mt-8 max-w-reading border-l-2 border-danger pl-4"
          >
            <p className="type-body font-medium">{status.title}</p>
            <p className="type-body mt-1 text-muted">{status.text}</p>
          </div>
        ) : null}
      </div>

      <div className="border-t">
        <div className="shell grid-page gap-y-10 pb-section">
          <section
            aria-labelledby="review-title"
            className="col-span-full lg:col-span-7"
          >
            <div className="flex items-baseline justify-between gap-6 py-5">
              <h2 id="review-title" className="type-ui">
                Your order
              </h2>
              <Link href="/bag" className="link type-ui">
                Edit bag
              </Link>
            </div>
            <SummaryLines
              lines={bag.lines.map((line) => ({
                id: line.product.id,
                name: line.product.name,
                quantity: line.quantity,
                unitPriceCents: line.product.priceCents,
                image: line.product.images[0],
                note: line.product.madeToOrder
                  ? "Made to order, ready in three weeks"
                  : undefined,
              }))}
            />
          </section>

          <section
            aria-labelledby="pay-title"
            className="col-span-full lg:sticky lg:top-header-offset lg:col-span-4 lg:col-start-9 lg:self-start lg:pt-5 lg:transition-[top] lg:duration-(--duration-slow) lg:ease-emphasis"
          >
            <h2 id="pay-title" className="type-ui">
              Payment
            </h2>
            <div className="mt-5 border-y py-5">
              <SummaryTotals subtotalCents={bag.subtotalCents} />
            </div>

            <p className="type-caption mt-5 text-muted">
              {session ? (
                <>Ordering as {session.user.email}.</>
              ) : (
                <>
                  Ordering as a guest.{" "}
                  <Link
                    href="/sign-in?next=%2Fcheckout"
                    className="link text-foreground"
                  >
                    Sign in
                  </Link>{" "}
                  to keep this order with your account.
                </>
              )}
            </p>

            <form action={startCheckout} className="mt-6">
              <CheckoutButton />
            </form>

            <ul className="type-caption grid gap-2 text-muted">
              <li>Stripe asks for your email, delivery address and payment.</li>
              <li>
                Your pieces are held for 30 minutes while you pay. You are
                charged only when the payment succeeds.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

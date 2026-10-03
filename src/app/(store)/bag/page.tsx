import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BagLineControls } from "@/components/bag-line-controls";
import { BagNotices } from "@/components/bag-notices";
import { StockLabel } from "@/components/stock-label";
import { getBag } from "@/lib/bag";
import { formatPrice, getStockState, productHref } from "@/lib/products";

export const metadata: Metadata = {
  title: "Bag | Atelier Store",
  robots: { index: false },
};

// Why checkout sent the customer back here, from `?checkout=`. Only this fixed
// sentence is ever shown, whatever the address says.
const checkoutMessages = new Map([
  [
    "stock",
    "Something in your bag was bought by someone else just now, so checkout did not start and you have not been charged. Please check the quantities below.",
  ],
]);

// Reading the bag cookie renders this page on every request, so prices, stock
// and the subtotal are always the current ones and it needs no `revalidate`.
export default async function BagPage({ searchParams }: PageProps<"/bag">) {
  const { checkout } = await searchParams;
  const checkoutMessage =
    typeof checkout === "string" ? checkoutMessages.get(checkout) : undefined;
  const bag = await getBag();
  const pieces = `${bag.count} ${bag.count === 1 ? "piece" : "pieces"}`;

  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <nav aria-label="Breadcrumb" className="type-caption text-muted">
          <Link href="/" className="link-muted">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Bag</span>
        </nav>

        <h1 className="type-headline mt-4">Bag</h1>
        {checkoutMessage ? (
          <p
            role="status"
            className="type-body mt-8 max-w-reading border-l-2 border-danger pl-4"
          >
            {checkoutMessage}
          </p>
        ) : null}
        <BagNotices notices={bag.notices} />
      </div>

      {bag.lines.length === 0 ? (
        <div className="border-t">
          <div className="shell-reading py-section text-center">
            <h2 className="type-title">Your bag is empty</h2>
            <p className="type-body mt-4 text-muted">
              Pieces you add are kept here for thirty days, on this device.
            </p>
            <Link href="/new" className="btn btn-primary mt-8">
              Shop new arrivals
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-t">
          <div className="shell grid-page gap-y-10 pb-section">
            <section
              aria-labelledby="lines-title"
              className="col-span-full lg:col-span-8"
            >
              <div className="flex items-baseline justify-between gap-6 py-5">
                <h2 id="lines-title" className="type-ui">
                  Your pieces
                </h2>
                <p className="type-ui shrink-0 text-muted">{pieces}</p>
              </div>

              <ul className="divide-y border-y">
                {bag.lines.map(({ product, quantity, max, lineTotalCents }) => {
                  const [image] = product.images;

                  return (
                    // Dims while its own change is on its way to the server.
                    <li
                      key={product.id}
                      className="flex gap-4 py-6 transition-opacity has-aria-busy:opacity-50 md:gap-6"
                    >
                      <Link
                        href={productHref(product)}
                        className="media-tile w-24 shrink-0 self-start md:w-32"
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 48rem) 8rem, 6rem"
                          className="mix-blend-multiply"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="type-body">
                            <Link
                              href={productHref(product)}
                              className="underline-offset-4 hover:underline"
                            >
                              {product.name}
                            </Link>
                          </h3>
                          <p className="shrink-0 font-medium">
                            {formatPrice(lineTotalCents)}
                          </p>
                        </div>
                        <p className="type-caption mt-1 text-muted">
                          {formatPrice(product.priceCents)} each
                        </p>
                        <StockLabel
                          stock={getStockState(product)}
                          className="type-caption mt-1"
                        />

                        <div className="mt-4">
                          <BagLineControls
                            productId={product.id}
                            name={product.name}
                            quantity={quantity}
                            max={max}
                            limitNote={
                              product.madeToOrder
                                ? `Made-to-order pieces are limited to ${max} per order.`
                                : max === 1
                                  ? "This is the last one."
                                  : `You have all ${max} we have in stock.`
                            }
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              aria-labelledby="summary-title"
              className="col-span-full lg:sticky lg:top-header lg:col-span-4 lg:self-start lg:pt-5"
            >
              <h2 id="summary-title" className="type-ui">
                Summary
              </h2>
              <dl className="mt-5 grid gap-3 border-y py-5">
                <div className="flex items-baseline justify-between gap-6">
                  <dt className="type-body text-muted">Pieces</dt>
                  <dd className="type-body">{bag.count}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6">
                  <dt className="type-body">Subtotal</dt>
                  <dd aria-live="polite" className="text-lg font-medium">
                    {formatPrice(bag.subtotalCents)}
                  </dd>
                </div>
              </dl>
              <p className="type-caption mt-4 text-muted">
                No delivery charge or tax is added. You review the order
                before paying.
              </p>
              <Link href="/checkout" className="btn btn-primary btn-block mt-8">
                Checkout
              </Link>
              <Link href="/new" className="btn btn-secondary btn-block mt-3">
                Continue shopping
              </Link>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}

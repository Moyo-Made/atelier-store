import Image from "next/image";
import Link from "next/link";
import type { orderItems, ProductImage, ShippingAddress } from "@/db/schema";
import { formatPrice, productHref, type Product } from "@/lib/products";

type OrderItem = typeof orderItems.$inferSelect & {
  // Read with the item only where the order is shown with pictures.
  product?: Pick<Product, "slug" | "images">;
};

export type SummaryLine = {
  id: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
  // The product's first image, when the product was read with the line.
  image?: ProductImage;
  // The product page. The name becomes a link to it.
  href?: string;
  note?: string;
};

// An order's items as summary lines. The name, quantity and price are the
// ones the order was placed at; only the picture and the link come from the
// product as it is today.
export function orderSummaryLines(items: OrderItem[]): SummaryLine[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    image: item.product?.images[0],
    href: item.product ? productHref(item.product) : undefined,
    // A line that took no stock is a made-to-order piece.
    note: item.reservedStock ? undefined : "Made to order, ready in three weeks",
  }));
}

// What is being bought, read-only: checkout review, order confirmation and
// the order in the customer's account.
export function SummaryLines({ lines }: { lines: SummaryLine[] }) {
  return (
    <ul className="divide-y border-y">
      {lines.map((line) => (
        <li key={line.id} className="flex items-start gap-4 py-5">
          {line.image ? (
            <div className="media-tile w-16 shrink-0 md:w-20">
              <Image
                src={line.image.src}
                alt={line.image.alt}
                fill
                sizes="5rem"
                className="mix-blend-multiply"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="type-body">
              {line.href ? (
                <Link
                  href={line.href}
                  className="underline-offset-4 hover:underline"
                >
                  {line.name}
                </Link>
              ) : (
                line.name
              )}
            </p>
            <p className="type-caption mt-1 text-muted">
              {line.quantity} × {formatPrice(line.unitPriceCents)}
            </p>
            {line.note ? (
              <p className="type-caption mt-1">{line.note}</p>
            ) : null}
          </div>
          <p className="shrink-0 font-medium">
            {formatPrice(line.unitPriceCents * line.quantity)}
          </p>
        </li>
      ))}
    </ul>
  );
}

// The sums under the lines. Nothing is added for delivery or tax in this
// version, and the rows say so rather than leaving the customer to wonder.
export function SummaryTotals({
  subtotalCents,
  totalLabel = "Total",
}: {
  subtotalCents: number;
  totalLabel?: string;
}) {
  return (
    <dl className="grid gap-3">
      <div className="flex items-baseline justify-between gap-6">
        <dt className="type-body text-muted">Subtotal</dt>
        <dd className="type-body">{formatPrice(subtotalCents)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6">
        <dt className="type-body text-muted">Delivery, United States</dt>
        <dd className="type-body">No charge</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6">
        <dt className="type-body text-muted">Tax</dt>
        <dd className="type-body">Not added</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 border-t pt-4">
        <dt className="type-body">{totalLabel}</dt>
        <dd className="text-lg font-medium">{formatPrice(subtotalCents)}</dd>
      </div>
    </dl>
  );
}

// Where a paid order is going. Stripe collects the address, so an order has
// one only once it is paid.
export function SummaryAddress({
  name,
  address,
}: {
  name: string | null;
  address: ShippingAddress;
}) {
  return (
    <address className="type-body not-italic">
      {name}
      <br />
      {address.line1}
      {address.line2 ? (
        <>
          <br />
          {address.line2}
        </>
      ) : null}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
    </address>
  );
}

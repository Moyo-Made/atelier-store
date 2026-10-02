import Image from "next/image";
import type { ProductImage } from "@/db/schema";
import { formatPrice } from "@/lib/products";

export type SummaryLine = {
  id: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
  // Shown before payment, when the product is at hand. A paid order keeps
  // only the name and price it was sold at.
  image?: ProductImage;
  note?: string;
};

// What is being bought, read-only: checkout review and order confirmation.
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
            <p className="type-body">{line.name}</p>
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

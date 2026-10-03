import type { Metadata } from "next";
import Link from "next/link";
import { ContentBlock } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Size guides | Atelier Store",
  description:
    "Measurements for Atelier knitwear and outerwear, and shoe sizes in EU, UK and US.",
};

const clothing = {
  columns: ["Size", "Chest (in)", "Chest (cm)", "Sleeve (in)", "Sleeve (cm)"],
  rows: [
    ["XS", "34", "86", "32", "81"],
    ["S", "36", "91", "33", "84"],
    ["M", "38", "97", "34", "86"],
    ["L", "40", "102", "35", "89"],
    ["XL", "42", "107", "36", "91"],
  ],
};

const shoes = {
  columns: ["EU", "UK", "US", "Foot length (cm)"],
  rows: [
    ["39", "5", "6", "24.6"],
    ["40", "6", "7", "25.4"],
    ["41", "7", "8", "26.2"],
    ["42", "8", "9", "27.1"],
    ["43", "9", "10", "27.9"],
    ["44", "10", "11", "28.8"],
    ["45", "11", "12", "29.6"],
  ],
};

// A table scrolls sideways inside its own box on a phone, so the page never
// does.
function SizeTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-y text-left whitespace-nowrap">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="type-caption py-3 pr-6 font-normal text-muted"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([size, ...cells]) => (
            <tr key={size} className="border-t">
              <th scope="row" className="py-3 pr-6 font-medium">
                {size}
              </th>
              {cells.map((cell, index) => (
                <td key={columns[index + 1]} className="py-3 pr-6">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidesPage() {
  return (
    <article aria-labelledby="sizes-title">
      <h2 id="sizes-title" className="type-title">
        Size guides
      </h2>
      <p className="type-body mt-4 text-muted">
        Measurements are of the body, not the garment. Measure over a shirt,
        with the tape level and not pulled tight.
      </p>

      <ContentBlock title="Knitwear and outerwear">
        <SizeTable caption="Knitwear and outerwear sizes" {...clothing} />
        <p>
          Chest is measured around the fullest part. Sleeve is measured from
          the centre of the back of the neck, over the shoulder, to the wrist.
        </p>
      </ContentBlock>

      <ContentBlock title="Shoes">
        <SizeTable caption="Shoe sizes" {...shoes} />
        <p>
          Shoes are marked in EU sizes. Stand on a sheet of paper, mark the
          heel and the longest toe, and measure between the marks.
        </p>
      </ContentBlock>

      <ContentBlock title="Between two sizes">
        <p>
          Take the larger one: a piece can be taken in by the workshop, free of
          charge, but not let out beyond its seams.
        </p>
        <p className="type-ui">
          <Link href="/care/alterations" className="link">
            Alterations
          </Link>
        </p>
      </ContentBlock>
    </article>
  );
}

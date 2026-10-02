import type { Metadata } from "next";
import Form from "next/form";
import { ProductListing } from "@/components/product-listing";
import { getNewArrivals, searchProducts } from "@/db/queries";

const MAX_QUERY_LENGTH = 80;

// `?q=` can be missing, or repeated, in a hand-written URL.
function readQuery(q: string | string[] | undefined) {
  const value = Array.isArray(q) ? q[0] : q;
  return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const query = readQuery((await searchParams).q);

  return {
    title: query
      ? `“${query}” | Search | Atelier Store`
      : "Search | Atelier Store",
    description: "Search the Atelier Store catalogue.",
    robots: { index: false },
  };
}

// Reading the query string renders this page on every request, so results are
// always current and it needs no `revalidate`.
export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const query = readQuery((await searchParams).q);
  // Before a search there is something to browse rather than an empty page.
  const products = await (query ? searchProducts(query) : getNewArrivals());

  return (
    <ProductListing
      title="Search"
      label={query ? `Results for “${query}”` : "New arrivals"}
      products={products}
      empty={
        query
          ? `Nothing matches “${query}”. Check the spelling, or try a more general word such as a material or a category.`
          : "There is nothing in the catalogue yet."
      }
      emptyAction={
        query ? { label: "Shop new arrivals", href: "/new" } : undefined
      }
    >
      <Form
        action="/search"
        role="search"
        className="mt-8 flex max-w-reading flex-col gap-4 md:flex-row md:items-end"
      >
        <label className="flex-1">
          <span className="type-caption text-muted">Search products</span>
          {/* Keyed so the box follows the URL when the header link clears it. */}
          <input
            key={query}
            type="search"
            name="q"
            required
            maxLength={MAX_QUERY_LENGTH}
            defaultValue={query}
            autoFocus={!query}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Name, material or category"
            className="field [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </Form>
    </ProductListing>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { AddToBag } from "@/components/add-to-bag";
import { ProductCard } from "@/components/product-card";
import { StockLabel } from "@/components/stock-label";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/db/queries";
import {
  categoryHref,
  formatPrice,
  getMaxQuantity,
  getStockState,
} from "@/lib/products";
import { openGraphDefaults, shareImage, siteImage } from "@/lib/share";

// Tiles in grid-products are 2, 3 and 4 across.
const tileSizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 34vw, 50vw";

// Stock and new products show up within a minute without a rebuild.
export const revalidate = 60;

export function generateStaticParams() {
  return getProductSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const [image] = product.images;

  return {
    title: `${product.name} | Atelier Store`,
    description: product.description,
    openGraph: {
      ...openGraphDefaults,
      title: product.name,
      description: `${formatPrice(product.priceCents)}. ${product.description}`,
      images: [image ? shareImage(image.src, image.alt) : siteImage],
    },
  };
}

function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="disclosure group border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
          className="transition-transform group-open:rotate-45"
        >
          <path d="M6 0v12M0 6h12" />
        </svg>
      </summary>
      <div className="type-body pb-6">{children}</div>
    </details>
  );
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stock = getStockState(product);
  const related = await getRelatedProducts(product);

  return (
    <main className="flex-1 pt-header">
      <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* A swipeable strip on phones and tablets, a stack beside the details on desktop. */}
        <ul
          aria-label="Product images"
          className="flex snap-x snap-mandatory gap-px overflow-x-auto lg:grid lg:overflow-visible"
        >
          {product.images.map((image, index) => {
            const photograph = (
              <div className="media-tile">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  preload={index === 0}
                  sizes="(min-width: 64rem) 58vw, (min-width: 48rem) 62vw, 88vw"
                  className="mix-blend-multiply"
                />
              </div>
            );

            return (
              <li
                key={image.src}
                className="w-[88%] shrink-0 snap-start md:w-[62%] lg:w-auto"
              >
                {/* Shares its name with the product card, so the
                    photograph travels from the tile that was clicked. */}
                {index === 0 ? (
                  <ViewTransition
                    name={`product-image-${product.id}`}
                    share="morph"
                    default="none"
                  >
                    {photograph}
                  </ViewTransition>
                ) : (
                  photograph
                )}
              </li>
            );
          })}
        </ul>

        <div className="px-gutter pt-8 pb-section lg:sticky lg:top-header-offset lg:self-start lg:pt-14 lg:transition-[top] lg:duration-(--duration-slow) lg:ease-emphasis">
          {/* Rises in beside the photograph when the page opens. */}
          <ViewTransition enter="product-details" default="none">
            <div className="lg:max-w-md">
              <nav aria-label="Breadcrumb" className="type-caption text-muted">
                <Link href="/" className="link-muted">
                  Home
                </Link>
                <span aria-hidden="true"> / </span>
                <Link
                  href={categoryHref(product.category)}
                  className="link-muted"
                >
                  {product.category.name}
                </Link>
              </nav>

              <h1 className="type-title mt-4">{product.name}</h1>
              <p className="mt-3 text-lg">{formatPrice(product.priceCents)}</p>
              <StockLabel stock={stock} className="type-ui mt-2" />

              <p className="type-body mt-8">{product.description}</p>

              <div className="mt-8">
                <AddToBag
                  productId={product.id}
                  available={stock.available}
                  max={getMaxQuantity(product)}
                />
                {stock.level === "out" ? (
                  <p className="type-caption text-muted">
                    This piece has sold out.{" "}
                    <Link
                      href={categoryHref(product.category)}
                      className="link text-foreground"
                    >
                      See all {product.category.name.toLowerCase()}
                    </Link>
                  </p>
                ) : null}
              </div>

              <div className="mt-6 border-t">
                <Disclosure title="Details">
                  <ul className="grid gap-2">
                    {product.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <p className="type-caption mt-4 text-muted">
                    Style {product.styleNumber}
                  </p>
                </Disclosure>
                <Disclosure title="Materials and care">
                  <p>{product.materials}</p>
                </Disclosure>
                <Disclosure title="Delivery and returns">
                  <p>
                    Free tracked delivery on every order, and free returns within
                    30 days.{" "}
                    <Link href="/care/delivery" prefetch={false} className="link">
                      Delivery and returns
                    </Link>
                  </p>
                </Disclosure>
              </div>
            </div>
          </ViewTransition>
        </div>
      </div>

      <section aria-labelledby="related-title" className="border-t pt-section">
        <div className="shell mb-8 lg:mb-10">
          <h2 id="related-title" className="type-title">
            You may also like
          </h2>
        </div>
        <ul className="grid-products">
          {related.map((item, index) => (
            // Three fill one row on tablets; the fourth would orphan.
            <li
              key={item.id}
              className={index >= 3 ? "md:max-lg:hidden" : undefined}
            >
              <ProductCard product={item} sizes={tileSizes} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

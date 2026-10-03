import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { StockLabel } from "@/components/stock-label";
import {
  formatPrice,
  getStockState,
  productHref,
  type Product,
} from "@/lib/products";

export function ProductCard({
  product,
  sizes,
  eager = false,
}: {
  product: Product;
  sizes: string;
  // Set on tiles that are on screen when the page opens.
  eager?: boolean;
}) {
  const stock = getStockState(product);
  const soldOut = stock.level === "out";
  // A sold-out piece says so where its badge would be.
  const badge = soldOut ? stock.label : product.badge;
  const [image, closeUp] = product.images;
  // Pointing at the tile crossfades to the close-up and moves the piece
  // slightly closer. `group-hover` only applies where there is a pointer, so
  // phones keep the first photograph.
  const motion =
    "transition-[opacity,scale] duration-(--duration-slow) ease-emphasis group-hover:scale-103";

  return (
    <Link href={productHref(product)} className="group block">
      {/* The same name on the product page's first photograph, so the
          photograph travels from the tile when the page opens. */}
      <ViewTransition
        name={`product-image-${product.id}`}
        share="morph"
        default="none"
      >
        <div className="media-tile">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            className={`mix-blend-multiply ${motion} ${soldOut ? "opacity-50" : ""} ${closeUp ? "group-hover:opacity-0" : ""}`}
          />
          {closeUp ? (
            <Image
              src={closeUp.src}
              alt=""
              fill
              sizes={sizes}
              loading="lazy"
              className={`mix-blend-multiply opacity-0 ${motion} ${soldOut ? "group-hover:opacity-50" : "group-hover:opacity-100"}`}
            />
          ) : null}
          {badge ? (
            <span className="type-micro absolute top-3 left-3">{badge}</span>
          ) : null}
        </div>
      </ViewTransition>
      <div className="tile-caption">
        <h3>
          <span className="link-reveal-group">{product.name}</span>
        </h3>
        <p className={soldOut ? "text-muted" : "font-medium"}>
          {formatPrice(product.priceCents)}
        </p>
        {stock.level === "low" ? <StockLabel stock={stock} /> : null}
      </div>
    </Link>
  );
}

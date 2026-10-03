import Image from "next/image";
import Link from "next/link";
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
  const [image] = product.images;

  return (
    <Link href={productHref(product)} className="group block">
      <div className="media-tile">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          className={`mix-blend-multiply ${soldOut ? "opacity-50" : ""}`}
        />
        {badge ? (
          <span className="type-micro absolute top-3 left-3">{badge}</span>
        ) : null}
      </div>
      <div className="tile-caption">
        <h3 className="underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        <p className={soldOut ? "text-muted" : "font-medium"}>
          {formatPrice(product.priceCents)}
        </p>
        {stock.level === "low" ? <StockLabel stock={stock} /> : null}
      </div>
    </Link>
  );
}

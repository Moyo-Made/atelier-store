import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getStockState,
  productHref,
  type Product,
} from "@/lib/products";

export function ProductCard({
  product,
  sizes,
}: {
  product: Product;
  sizes: string;
}) {
  const stock = getStockState(product);
  const badge = stock.available ? product.badge : stock.label;
  const [image] = product.images;

  return (
    <Link href={productHref(product)} className="group block">
      <div className="media-tile">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="mix-blend-multiply"
        />
        {badge ? (
          <span className="type-micro absolute top-3 left-3">{badge}</span>
        ) : null}
      </div>
      <div className="tile-caption">
        <h3 className="underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        <p className={stock.available ? "font-medium" : "text-muted"}>
          {formatPrice(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}

import type { StockState } from "@/lib/products";

// How each stock state is coloured wherever customers see it. Low stock is
// the one that asks for attention; sold out recedes.
const tone: Record<StockState["level"], string> = {
  in: "",
  low: "text-danger",
  out: "text-muted",
  "made-to-order": "",
};

// A product's availability in words, from `getStockState`. The product page,
// product cards and the bag all show it through this, so a state looks the
// same everywhere. `className` sets the type role and spacing.
export function StockLabel({
  stock,
  className = "",
}: {
  stock: StockState;
  className?: string;
}) {
  return <p className={`${className} ${tone[stock.level]}`}>{stock.label}</p>;
}

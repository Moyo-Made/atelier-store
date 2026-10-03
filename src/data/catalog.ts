// Homepage copy and photography. Products and categories live in the database.
// Photography is from Unsplash; the photographer is noted beside each id.

type ImageSize = { width: number; height?: number };

export function unsplash(id: string, { width, height }: ImageSize) {
  const size = height ? `w=${width}&h=${height}` : `w=${width}`;
  return `https://images.unsplash.com/photo-${id}?fm=jpg&fit=crop&q=80&${size}`;
}

export type Collection = {
  name: string;
  season: string;
  cta: string;
  image: string;
  alt: string;
  href: string;
};

export const hero = {
  title: "The autumn collection",
  description:
    "Evening pieces, soft tailoring and leather that is made to wear in.",
  cta: "Shop the collection",
  href: "/new",
  // naeim jafari
  image: unsplash("1593528625646-d705402054ba", { width: 2400 }),
  alt: "A model seated across two wooden chairs in a hall crossed by shafts of light",
};

export const collections: Collection[] = [
  {
    name: "Outerwear",
    season: "Autumn collection",
    cta: "Shop outerwear",
    // The AW Creative Directory
    image: unsplash("1618244965061-1d27b208d6e8", { width: 1600 }),
    alt: "A woman in a camel coat standing against a dark panelled door",
    href: "/outerwear",
  },
  {
    name: "Watches",
    season: "Autumn collection",
    cta: "Shop watches",
    // Christian
    image: unsplash("1676278746061-c5bac5b34ae5", { width: 1600 }),
    alt: "A man in a pinstripe suit and a wristwatch reading in an armchair in low light",
    href: "/watches",
  },
];

export const atelier = {
  title: "Made in one workshop",
  body: "Every coat, bag and shoe is cut and finished by the same forty people, in the building where the patterns are drawn. Nothing leaves until the person who made it has signed the inside seam.",
  cta: "Visit the atelier",
  href: "/atelier",
  // J Williams
  image: unsplash("1560796952-f1c9b838544c", { width: 2000 }),
  alt: "Close view of a sewing machine needle stitching dark cloth",
};

export const services = [
  {
    title: "Complimentary delivery",
    body: "Free tracked delivery on every order, and free returns within 30 days.",
    cta: "Delivery and returns",
    href: "/care/delivery",
  },
  {
    title: "Alterations for life",
    body: "Bring any piece back to be re-hemmed, relined or resoled in the workshop.",
    cta: "Book an alteration",
    href: "/care/alterations",
  },
];

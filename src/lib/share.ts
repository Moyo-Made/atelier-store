import type { Metadata } from "next";

// What a link to the site shows when it is pasted into X, Slack, iMessage and
// the like. The root layout sets these for every page; a page that sets its
// own `openGraph` replaces the whole object (metadata merges shallowly), so it
// spreads `openGraphDefaults` back in.

export const siteName = "Atelier Store";

export const siteDescription =
  "Coats, knitwear, bags and shoes made in one workshop, with free delivery across the United States.";

export const openGraphDefaults = {
  type: "website",
  siteName,
  locale: "en_US",
} satisfies Metadata["openGraph"];

// `src/app/opengraph-image.jpg`, which the root layout picks up by itself. A
// page that replaces `openGraph` and has no photo of its own names it here.
// The alt text repeats `opengraph-image.alt.txt`; change both together.
export const siteImage = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "The Atelier wordmark over a model seated across two wooden chairs in a hall crossed by shafts of light",
};

// Share cards are 1200 by 630. Catalogue photos are square and on
// images.unsplash.com, which resizes from the query string. Cropping one to
// the card would cut off the top and bottom of the piece, so the whole photo
// is fitted in and the sides are filled with a blur of it.
export function shareImage(src: string, alt: string) {
  const url = new URL(src);
  url.searchParams.set("w", "1200");
  url.searchParams.set("h", "630");
  url.searchParams.set("fit", "fill");
  url.searchParams.set("fill", "blur");
  return { url: url.toString(), width: 1200, height: 630, alt };
}

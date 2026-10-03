import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { openGraphDefaults, siteDescription, siteName } from "@/lib/share";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500"],
});

const siteAddress = process.env.BETTER_AUTH_URL;

export const metadata: Metadata = {
  // Share cards need absolute image URLs. The site's public address is the
  // one Better Auth and Stripe already use.
  metadataBase: siteAddress ? new URL(siteAddress) : undefined,
  title: siteName,
  description: siteDescription,
  // The image is `opengraph-image.jpg` beside this file.
  openGraph: {
    ...openGraphDefaults,
    title: siteName,
    description: siteDescription,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import Stripe from "stripe";

let client: Stripe | null = null;

// Created on first use, not at import, so `next build` runs without the key.
// The API version is the one this SDK release is pinned to.
export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

// Where Stripe sends the customer back to. The same variable Better Auth
// uses for the site's address.
export function siteUrl(path: string) {
  const base = process.env.BETTER_AUTH_URL;
  if (!base) throw new Error("BETTER_AUTH_URL is not set");
  return new URL(path, base).toString();
}

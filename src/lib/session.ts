import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

// The only place pages, Server Actions and Route Handlers read the session.
// It is looked up in the database on every request (no cookie cache), so a
// sign-out or a role change applies at once.
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// For anything only a signed-in customer may see or do. `next` is where to
// come back to after signing in.
export async function requireUser(next: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session;
}

// For anything only an admin may see or do. Everyone else gets a 404, signed
// in or not, so the response does not confirm the admin area exists. An admin
// who is signed out signs in at /sign-in and comes back.
export async function requireAdmin() {
  const session = await getSession();
  if (session?.user.role !== "admin") notFound();
  return session;
}

// Stands in for this site's address when a path is parsed; never requested.
const SITE = "http://site.invalid";

// `?next=` comes from the URL, so only a path on this site is followed. It is
// parsed the way a browser will parse it, which drops tabs and newlines and
// reads `\` as `/`: `/<tab>/evil.com` is `//evil.com`, another site. What is
// returned is the parsed path, so what is followed is what was checked.
export function safeNext(next: string | string[] | undefined) {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/")) return "/account";

  let url: URL;
  try {
    url = new URL(value, SITE);
  } catch {
    return "/account";
  }
  if (url.origin !== SITE) return "/account";
  return `${url.pathname}${url.search}${url.hash}`;
}

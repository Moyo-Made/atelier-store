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

// For anything only an admin may see or do. Everyone else gets a 404, so the
// response does not confirm the admin area exists.
export async function requireAdmin(next: string) {
  const session = await requireUser(next);
  if (session.user.role !== "admin") notFound();
  return session;
}

// `?next=` comes from the URL, so only a path on this site is followed.
export function safeNext(next: string | string[] | undefined) {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || /^\/[/\\]/.test(value)) {
    return "/account";
  }
  return value;
}

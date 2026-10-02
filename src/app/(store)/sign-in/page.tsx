import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession, safeNext } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in | Atelier Store",
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <main className="flex-1 pt-header">
      <div className="shell-reading py-section">
        <h1 className="type-headline">Sign in</h1>
        <p className="type-lead mt-4 text-muted">
          Enter the email address and password for your account.
        </p>
        <AuthForm mode="sign-in" next={next} />
      </div>
    </main>
  );
}

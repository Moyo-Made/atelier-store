import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession, safeNext } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create an account | Atelier Store",
  robots: { index: false },
};

export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <main className="flex-1 pt-header">
      <div className="shell-reading py-section">
        <h1 className="type-headline">Create an account</h1>
        <p className="type-lead mt-4 text-muted">
          An account keeps your details in one place for your next visit.
        </p>
        <AuthForm mode="sign-up" next={next} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account | Atelier Store",
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function AccountPage() {
  const { user } = await requireUser("/account");

  const details = [
    { label: "Name", value: user.name },
    { label: "Email address", value: user.email },
    { label: "Customer since", value: dateFormat.format(user.createdAt) },
  ];

  return (
    <section aria-labelledby="details-title" className="max-w-reading">
      <h2 id="details-title" className="type-title">
        Details
      </h2>

      <dl className="mt-6 divide-y border-y">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="grid gap-1 py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
          >
            <dt className="type-caption text-muted">{detail.label}</dt>
            <dd className="type-body break-words">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/content-page";
import { careersEmail } from "@/data/house";

const intro =
  "Forty people make everything we sell. When one of them moves on, or the workshop grows, the role is listed here.";

export const metadata: Metadata = {
  title: "Careers | Atelier Store",
  description: intro,
};

const roles = [
  {
    title: "Pattern cutter",
    place: "The workshop",
    about: "Cuts outerwear and tailoring from the pattern room's blocks.",
  },
  {
    title: "Leather finisher",
    place: "The workshop",
    about: "Edges, stitches and finishes bags and small leather goods by hand.",
  },
  {
    title: "Store advisor",
    place: "New York",
    about: "Looks after customers in the store and takes in alterations.",
  },
];

export default function CareersPage() {
  return (
    <ContentPage title="Careers" intro={intro}>
      <ContentSection title="How we hire">
        <p>
          Everyone who joins the workshop spends their first month beside the
          person whose work is closest to theirs. We hire for care and
          patience first; most of the rest is taught at the bench.
        </p>
      </ContentSection>

      <ContentSection title="Open roles">
        <ul className="divide-y border-y">
          {roles.map((role) => (
            <li key={role.title} className="py-5">
              <h3 className="type-heading">{role.title}</h3>
              <p className="type-caption mt-1 text-muted">{role.place}</p>
              <p className="mt-3">{role.about}</p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection title="Apply">
        <p>
          Write to{" "}
          <a href={`mailto:${careersEmail}`} className="link">
            {careersEmail}
          </a>{" "}
          with the role in the subject line, a few lines about your work, and
          photographs of something you have made.
        </p>
      </ContentSection>
    </ContentPage>
  );
}

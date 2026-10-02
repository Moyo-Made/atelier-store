import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Styleguide | Atelier Store",
  robots: { index: false },
};

const colors = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "muted", className: "bg-muted" },
  { name: "surface", className: "bg-surface" },
  { name: "line", className: "bg-line" },
  { name: "disabled", className: "bg-disabled" },
  { name: "danger", className: "bg-danger" },
];

const typeRoles = [
  { name: "type-display", sample: "Cut slowly, worn for years" },
  { name: "type-headline", sample: "Autumn outerwear" },
  { name: "type-title", sample: "You may also like" },
  { name: "type-heading", sample: "Product description" },
  { name: "type-label", sample: "Customer care" },
  {
    name: "type-lead",
    sample: "Twelve coats, each cut from a single bolt of double-faced wool.",
  },
  {
    name: "type-body",
    sample:
      "A long coat with a dropped shoulder and a concealed placket. The lining is left out so the inside face of the cloth shows at the cuff and hem.",
  },
  { name: "type-ui", sample: "Filter and sort" },
  { name: "type-caption", sample: "Double-faced wool coat" },
  { name: "type-micro", sample: "Made to order" },
];

const products = [
  { name: "Double-faced wool coat", price: "$2,400", badge: "Made to order" },
  { name: "Leather tote, large", price: "$1,850" },
  { name: "Silk twill shirt", price: "$690" },
  { name: "Pleated trouser", price: "$780", badge: "New" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t py-section">
      <div className="shell">
        <h2 className="type-title mb-10">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Styleguide() {
  return (
    <main className="flex-1">
      <header className="shell grid h-header grid-cols-3 items-center">
        <a href="#buttons" className="link-reveal type-ui justify-self-start">
          Buttons
        </a>
        <p className="type-wordmark justify-self-center">Atelier</p>
        <a href="#grid" className="link-reveal type-ui justify-self-end">
          Grid
        </a>
      </header>

      <div className="shell py-section">
        <h1 className="type-headline">Styleguide</h1>
        <p className="type-lead mt-4 max-w-reading text-muted">
          Every token and primitive in the design system, rendered with the
          classes you would use in a page.
        </p>
      </div>

      <Section title="Colour">
        <ul className="grid grid-cols-2 gap-grid md:grid-cols-4 lg:grid-cols-7">
          {colors.map((color) => (
            <li key={color.name}>
              <div className={`aspect-tile border ${color.className}`} />
              <p className="type-ui mt-3">{color.name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <dl className="divide-y border-y">
          {typeRoles.map((role) => (
            <div key={role.name} className="grid-page items-baseline py-6">
              <dt className="type-caption col-span-full text-muted md:col-span-2 lg:col-span-3">
                {role.name}
              </dt>
              <dd
                className={`${role.name} col-span-full mt-2 md:col-span-6 md:mt-0 lg:col-span-9`}
              >
                {role.sample}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <section id="buttons" className="border-t py-section">
        <div className="shell">
          <h2 className="type-title mb-10">Buttons and links</h2>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-primary">
              Add to bag
            </button>
            <button type="button" className="btn btn-secondary">
              Find in store
            </button>
            <button type="button" className="btn btn-secondary btn-sm">
              Size guide
            </button>
            <button type="button" className="btn btn-primary" disabled>
              Sold out
            </button>
            <button
              type="button"
              className="btn btn-primary btn-icon"
              aria-label="Close"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>

          <div className="mt-6 max-w-md">
            <button type="button" className="btn btn-primary btn-block">
              Add to bag
            </button>
          </div>

          <div className="type-ui mt-10 flex flex-wrap items-center gap-8">
            <a href="#buttons" className="link">
              Inline link
            </a>
            <a href="#buttons" className="link-reveal" aria-current="page">
              Current page
            </a>
            <a href="#buttons" className="link-reveal">
              Navigation link
            </a>
            <a href="#buttons" className="link-muted">
              Secondary link
            </a>
          </div>
        </div>
      </section>

      <section className="theme-inverse py-section">
        <div className="shell">
          <h2 className="type-title mb-10">Inverse scope</h2>
          <p className="type-body max-w-reading text-muted">
            The same classes inside theme-inverse. Nothing here is styled
            separately: buttons, links and borders read the same tokens.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-primary">
              Shop the collection
            </button>
            <button type="button" className="btn btn-secondary">
              Book an appointment
            </button>
            <a href="#buttons" className="link type-ui">
              Inline link
            </a>
          </div>
          <div className="type-caption mt-10 border-t pt-6 text-muted">
            Hairline border on black
          </div>
        </div>
      </section>

      <section id="grid" className="py-section">
        <div className="shell">
          <h2 className="type-title mb-10">Product grid</h2>
        </div>
        <ul className="grid-products">
          {products.map((product) => (
            <li key={product.name}>
              <div className="media-tile">
                {product.badge ? (
                  <span className="type-micro absolute left-3 top-3">
                    {product.badge}
                  </span>
                ) : null}
              </div>
              <div className="tile-caption">
                <p>{product.name}</p>
                <p className="font-medium">{product.price}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Section title="Page grid">
        <div className="grid-page gap-y-grid">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={index}
              className="type-caption bg-surface py-6 text-center text-muted"
            >
              {index + 1}
            </div>
          ))}
          <div className="type-caption col-span-full bg-surface p-6 lg:col-span-7">
            col-span-full lg:col-span-7
          </div>
          <div className="type-caption col-span-full bg-surface p-6 lg:col-span-4 lg:col-start-9">
            col-span-full lg:col-span-4 lg:col-start-9
          </div>
        </div>
      </Section>
    </main>
  );
}

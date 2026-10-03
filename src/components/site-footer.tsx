import Link from "next/link";

const columns = [
  {
    title: "Customer care",
    links: [
      { label: "Contact us", href: "/care" },
      { label: "Track an order", href: "/account/orders" },
      { label: "Delivery and returns", href: "/care/delivery" },
      { label: "Alterations", href: "/care/alterations" },
      { label: "Size guides", href: "/care/sizes" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "The atelier", href: "/atelier" },
      { label: "Stores", href: "/stores" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="theme-inverse pt-section">
      <div className="shell">
        <div className="grid-page gap-y-12">
          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="col-span-2 md:col-span-2 lg:col-span-3"
            >
              <h2 className="type-label text-muted">{column.title}</h2>
              <ul className="type-ui mt-5 grid gap-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className="link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 md:col-span-2 lg:col-span-3">
            <h2 className="type-label text-muted">Shipping to</h2>
            <p className="type-ui mt-5">United States (USD)</p>
          </div>
        </div>

        <p className="type-caption mt-16 text-muted">
          © 2026 Atelier Store. Sample photography from Unsplash.
        </p>

        <p
          aria-hidden="true"
          className="mt-10 flex justify-between pb-10 font-display text-[clamp(3rem,14vw,15rem)] leading-none font-medium uppercase"
        >
          {"Atelier".split("").map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </p>
      </div>
    </footer>
  );
}

import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import { atelier, collections, hero, services } from "@/data/catalog";
import { getHomepageCategories, getNewArrivals } from "@/db/queries";
import { categoryHref } from "@/lib/products";

// Tiles in grid-products are 2, 3 and 4 across.
const tileSizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 34vw, 50vw";

// Stock and new products show up within a minute without a rebuild.
export const revalidate = 60;

export default async function Home() {
  const [categories, newArrivals] = await Promise.all([
    getHomepageCategories(),
    getNewArrivals(),
  ]);

  return (
    <main className="flex-1">
      <section className="media-cover h-[min(92svh,60rem)] min-h-[34rem] bg-black">
        <Image
          src={hero.image}
          alt={hero.alt}
          fill
          preload
          sizes="100vw"
          className="object-[42%_18%]"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/45 to-transparent" />
        <div className="on-image absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-32 pb-10 lg:pb-16">
          <div className="shell">
            <h1 className="type-display max-w-[12ch]">{hero.title}</h1>
            <p className="type-lead mt-4 max-w-[30ch]">{hero.description}</p>
            <Link
              href={hero.href}
              prefetch={false}
              className="btn btn-primary mt-8"
            >
              {hero.cta}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="categories-title">
        <h2 id="categories-title" className="sr-only">
          Shop by category
        </h2>
        <ul className="grid grid-cols-2 gap-px lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={categoryHref(category)}
                prefetch={false}
                className="group block"
              >
                <div className="media-tile">
                  <Image
                    src={category.imageUrl}
                    alt={category.imageAlt}
                    fill
                    sizes="(min-width: 64rem) 25vw, 50vw"
                    className="mix-blend-multiply"
                  />
                </div>
                <p className="type-ui py-5 text-center underline-offset-4 group-hover:underline">
                  {category.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="collections-title">
        <h2 id="collections-title" className="sr-only">
          Collections
        </h2>
        <ul className="grid gap-px md:grid-cols-2">
          {collections.map((collection) => (
            <li
              key={collection.href}
              className="media-cover aspect-4/5 md:aspect-portrait lg:aspect-6/7"
            >
              <Image
                src={collection.image}
                alt={collection.alt}
                fill
                sizes="(min-width: 48rem) 50vw, 100vw"
              />
              <div className="on-image absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-gutter pt-32 pb-10 text-center lg:pb-14">
                <h3 className="type-title">{collection.name}</h3>
                <p className="type-caption mt-1">{collection.season}</p>
                <Link
                  href={collection.href}
                  prefetch={false}
                  className="btn btn-secondary mt-6"
                >
                  {collection.cta}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="arrivals-title" className="pt-section">
        <div className="shell mb-8 flex items-baseline justify-between gap-6 lg:mb-10">
          <h2 id="arrivals-title" className="type-title">
            New arrivals
          </h2>
          <Link href="/new" prefetch={false} className="link type-ui shrink-0">
            View all
          </Link>
        </div>
        <ul className="grid-products">
          {newArrivals.map((product, index) => (
            // Six fill two rows of three on tablets; the last two would orphan.
            <li
              key={product.id}
              className={index >= 6 ? "md:max-lg:hidden" : undefined}
            >
              <ProductCard product={product} sizes={tileSizes} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="atelier-title" className="py-section">
        <div className="shell grid-page items-center gap-y-10">
          <div className="media-cover col-span-full aspect-4/3 lg:col-span-7">
            <Image
              src={atelier.image}
              alt={atelier.alt}
              fill
              sizes="(min-width: 64rem) 58vw, 100vw"
            />
          </div>
          <div className="col-span-full lg:col-span-4 lg:col-start-9">
            <h2 id="atelier-title" className="type-headline">
              {atelier.title}
            </h2>
            <p className="type-body mt-6 max-w-reading">{atelier.body}</p>
            <Link
              href={atelier.href}
              prefetch={false}
              className="btn btn-secondary mt-8"
            >
              {atelier.cta}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="services-title" className="border-t py-section">
        <div className="shell">
          <h2 id="services-title" className="type-title">
            Services
          </h2>
          <ul className="mt-10 grid gap-x-grid gap-y-10 md:grid-cols-3">
            {services.map((service) => (
              <li key={service.href} className="border-t border-foreground pt-6">
                <h3 className="type-heading">{service.title}</h3>
                <p className="type-body mt-3 max-w-[34ch]">{service.body}</p>
                <p className="type-ui mt-5">
                  <Link href={service.href} prefetch={false} className="link">
                    {service.cta}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="newsletter-title"
        className="border-t py-section"
      >
        <div className="shell-reading text-center">
          <h2 id="newsletter-title" className="type-display">
            Hear first when a collection opens
          </h2>
          <p className="type-body mx-auto mt-5 max-w-[44ch] text-muted">
            Four letters a year, one for each collection, with early access to
            made-to-order pieces.
          </p>
          <div className="mt-10">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}

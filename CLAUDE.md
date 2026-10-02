# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # dev server on http://localhost:3000
npm run build          # production build (also the type check — there is no separate tsc script)
npm run lint           # ESLint flat config; `npm run lint -- src/lib/auth.ts` for one file
npm run db:generate    # write SQL migrations to drizzle/ from src/db/schema.ts
npm run db:migrate     # apply migrations
npm run db:push        # push schema straight to the database, no migration files
npm run db:studio      # Drizzle Studio
npm run db:seed        # upsert the sample categories and products (reads .env.local)
npm run auth:generate  # write Better Auth's Drizzle tables to src/db/auth-schema.ts
```

There is no test runner configured.

Setup needs a `.env.local` copied from `.env.example` with `DATABASE_URL` (Neon pooled connection string), `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.

## Architecture

Next.js 16 App Router, React 19, Tailwind CSS v4, Better Auth, Drizzle ORM over Neon Postgres. Source lives in `src/`, imported through the `@/*` alias. The storefront reads its categories and products from the database; auth is wired but with no sign-in method enabled.

### Storefront

- `src/app/(store)/` is the route group for customer-facing pages. Its `layout.tsx` wraps them in `SiteHeader` and `SiteFooter`; `/styleguide` sits outside the group and gets neither.
- `src/components/site-header.tsx` is a client component. The header is fixed, and transparent with white text only on `/` before the page scrolls, so any page in the group other than the homepage needs its own top padding of `pt-header`. The menu is a native `<dialog>` opened with `showModal()`.
- `src/db/queries.ts` is the only place the storefront reads the catalogue: `getNewArrivals`, `getHomepageCategories`, `getProductBySlug`, `getRelatedProducts`, `getProductSlugs`. Pages call these directly from Server Components.
- `src/lib/products.ts` holds the `Product` type and the pure helpers `getStockState`, `formatPrice` (takes cents), `productHref` and `categoryHref`. It imports the schema as types only, so client components can use it without pulling in the database client.
- `src/data/catalog.ts` holds only homepage copy (`hero`, `collections`, `atelier`, `services`). Category and navigation links point at routes that do not exist (`/women`, `/bags`), and `NewsletterForm` only confirms on screen.
- `src/app/(store)/products/[slug]/page.tsx` is the product page, prerendered for every product through `generateStaticParams`. Stock wording comes only from `getStockState`, which the page and `ProductCard` both call, so the listing and the product page cannot disagree.
- The homepage and product page export `revalidate = 60`. Without it they would be prerendered once at build and never show a stock change. The "Add to bag" limit can be up to a minute stale, so a real cart must re-check stock on the server.
- `src/components/bag.tsx` provides the bag through context from the store layout, keyed by the numeric product id. It is in memory only and empties on reload; there is no `/bag` page or checkout.
- Images are hot-linked from Unsplash through `next/image`. `next.config.ts` allows `images.unsplash.com` with the object form of `remotePatterns`; `new URL(...)` there would reject the sizing query string.

### Database

- `src/db/index.ts` exports the single `db` client, built on the Neon **HTTP** driver (`drizzle-orm/neon-http`). It throws at import time when `DATABASE_URL` is unset, so anything that imports `@/db` or `@/lib/auth` — including `next build` collecting the auth route — fails without it. `next build` also queries the catalogue to prerender, so the database must be reachable and migrated.
- The HTTP driver has no interactive transactions: `db.transaction()` throws. Use `db.batch()` for atomic multi-statement writes, and leave the Drizzle adapter's `transaction` option off in `src/lib/auth.ts`.
- `src/db/schema.ts` is the only schema entry point. Both `drizzle.config.ts` and the `db` client read that one file, so tables defined elsewhere are invisible to migrations and to `db.query` until they are re-exported from it.
- Environment variables live in `.env.local`. Next.js loads it on its own; `drizzle.config.ts` loads `.env.local` then `.env` through `dotenv` (first one wins, as in Next.js), and `db:seed` passes `--env-file=.env.local` to `tsx`. A new script that touches the database outside Next.js has to load the file itself.

### Database conventions

The schema is `categories` 1 — N `products` and nothing else. Carts, orders, payments, reviews, wishlists and variants were deliberately left out of the first version; do not add them, or tables that anticipate them, unless asked.

Keys and naming:

- Every table has an `integer` identity primary key (`generatedAlwaysAsIdentity()`), and foreign keys point at it. Anything that appears in a URL gets its own unique `slug` column; a slug is never a primary or foreign key, so a product can be renamed without rewriting references.
- Columns are `snake_case` in SQL and `camelCase` in TypeScript, with the SQL name passed explicitly when the two differ (`integer("price_cents")`).
- Foreign keys use `ON DELETE RESTRICT` and get an index. Declare `relations()` on both sides so `db.query.*.findMany({ with })` works.
- Constraints and indexes are named `<table>_<column>_check` and `<table>_<column>_idx`.

Column choices:

- Money is an integer number of cents (`price_cents`), with a `CHECK >= 0`. `formatPrice` takes cents. Never store dollars or use a float or `numeric` for a price.
- Stock is the `stock` column on `products` (`CHECK >= 0`), not a separate table: with no variants it would be 1:1 and only add a join. `made_to_order` products are buyable at stock 0. If variants are added, stock moves to the variant row.
- A list that is only ever read with its parent stays on the parent row: `details` is `text[]`, `images` is `jsonb` typed with `.$type<ProductImage[]>()`, first entry being the card image. Promote one to its own table only when it needs to be queried or managed on its own.
- Timestamps are `timestamp with time zone`, `NOT NULL DEFAULT now()`.
- Optional presentation data is a nullable column, not a flag: a category is a homepage tile when `image_url` is set, ordered by `sort_order`.

Migrations and seed:

- Every schema change is `db:generate`, then read the SQL, then `db:migrate`. Commit `drizzle/` including `drizzle/meta/`. Do not use `db:push`, and do not edit a migration that has been applied; generate a new one.
- `src/db/seed.ts` holds the sample catalogue. It upserts on `slug` (`onConflictDoUpdate`), so it is safe to re-run; keep it that way, and add new sample rows there rather than in a migration.
- If `db:migrate` fails through Neon's pooled connection string, run it with the direct one.

Reading and writing:

- Storefront reads go in `src/db/queries.ts`; pages and components do not import `db` themselves. Wrap a query in React `cache` when more than one function in a request calls it (`getProductBySlug`).
- Types come from the schema (`typeof products.$inferSelect`), exported from `src/lib/products.ts`. Do not hand-write a parallel type. Helpers a client component may need live there too, and that file must only ever import the schema with `import type`.
- Sorting and filtering belong in SQL, not in JavaScript after the fetch (see `getRelatedProducts`).
- A page that reads the catalogue needs `export const revalidate = 60`, as a literal number.

### Auth

- `src/lib/auth.ts` is the server instance, `src/lib/auth-client.ts` the React client, and `src/app/api/auth/[...all]/route.ts` mounts every Better Auth endpoint under `/api/auth/*`.
- The Drizzle adapter is given no explicit `schema`, so it finds its tables through the schema passed to `db`. The auth tables do not exist yet. To add them: run `npm run auth:generate`, re-export the output from `src/db/schema.ts` (`export * from "./auth-schema"`), then `db:generate` + `db:migrate`. Re-run this after adding any Better Auth plugin that adds tables or columns.
- `betterAuth()` currently has no `emailAndPassword` or `socialProviders` config; a sign-in method has to be enabled before any auth UI will work.
- `nextCookies()` must stay the last entry in `plugins`.

### Styling

Tailwind v4 is configured in CSS, not in a `tailwind.config` file. `src/app/globals.css` only imports Tailwind and the four files in `src/styles/`:

- `tokens.css` — raw custom properties on `:root` (colour, gutter, grid, section and header sizes, stepped at `md` and `lg`) and the `@theme inline` block that maps them to utilities. The default colour palette, type scale, tracking, radii and breakpoints are reset there, so only the project's own names exist: `bg-gray-200`, `text-sm`, `rounded-lg`, `sm:` and `2xl:` do not compile to anything.
- `base.css` — element defaults: hairline border colour on everything, focus ring, selection, reduced motion.
- `primitives.css` — `@utility` rules: `shell`, `shell-reading`, `bleed`, `grid-page`, `grid-products`, `media-tile`, `media-cover`, `tile-caption`, `scrim`, `theme-inverse`, `on-image`, and the `type-*` roles.
- `components.css` — `.btn` (+ `-primary`, `-secondary`, `-sm`, `-block`, `-icon`), `.field`, and `.link`, `.link-reveal`, `.link-muted` in `@layer components`.

The site is light-only (no `prefers-color-scheme` switch). Black sections use the `theme-inverse` utility, which re-points the colour tokens for its subtree; text and buttons laid over a photograph use `on-image`, the same tokens without the black fill. Do not write separate "on dark" variants. Use a `type-*` role rather than assembling size, weight and case by hand. `/styleguide` renders every token and primitive.

## Git

This folder is its own repository (`main`, remote `origin` at `github.com/Moyo-Made/atelier-store`). It sits inside `~/Documents`, which is a separate, unrelated repository; run git commands from this directory so they act on this one.

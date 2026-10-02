# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev            # dev server on http://localhost:3000
pnpm build          # production build (also the type check — there is no separate tsc script)
pnpm lint           # ESLint flat config; `pnpm lint src/lib/auth.ts` for one file
pnpm db:generate    # write SQL migrations to drizzle/ from src/db/schema.ts
pnpm db:migrate     # apply migrations
pnpm db:push        # push schema straight to the database, no migration files
pnpm db:studio      # Drizzle Studio
pnpm db:seed        # upsert the sample categories and products (reads .env.local)
pnpm auth:generate  # write Better Auth's Drizzle tables to src/db/auth-schema.ts
pnpm auth:grant-admin <email>  # make an existing user an admin (reads .env.local)
```

There is no test runner configured.

Install with pnpm only; there is no `package-lock.json`. `patches/drizzle-kit@0.31.11.patch` (registered in `pnpm-workspace.yaml`) makes Drizzle Studio refuse any request whose `Origin` is not `https://local.drizzle.studio`. Unpatched, Studio accepts SQL from any web page while it is running, and no released version fixes that. npm or yarn would install it unpatched. When upgrading `drizzle-kit`, check whether upstream restricts origins; if not, redo the patch with `pnpm patch` (the same edit in `bin.cjs`, `api.js` and `api.mjs`).

Setup needs a `.env.local` copied from `.env.example` with `DATABASE_URL` (Neon pooled connection string), `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. Checkout also needs `STRIPE_SECRET_KEY` (a sandbox restricted key, `rk_test_…`, with Checkout Sessions write); without it the build still passes and continuing to payment returns to `/checkout` with an error. The webhook needs `STRIPE_WEBHOOK_SECRET` (`whsec_…`) and answers 500 until it is set. `BETTER_AUTH_URL` is also the address Stripe sends customers back to.

## Architecture

Next.js 16 App Router, React 19, Tailwind CSS v4, Better Auth, Drizzle ORM over Neon Postgres. Source lives in `src/`, imported through the `@/*` alias. The storefront reads its categories and products from the database; customers sign in with email and password, and an `admin` role guards `/admin`.

### Storefront

- `src/app/(store)/` is the route group for customer-facing pages. Its `layout.tsx` wraps them in `SiteHeader` and `SiteFooter`; `/styleguide` sits outside the group and gets neither.
- `src/components/site-header.tsx` is a client component. Its account link reads "Sign in" or "Account" from the client session. The header is fixed, and transparent with white text only on `/` before the page scrolls, so any page in the group other than the homepage needs its own top padding of `pt-header`. The menu is a native `<dialog>` opened with `showModal()`.
- `src/db/queries.ts` is the only place the storefront reads the catalogue: `getNewArrivals`, `getHomepageCategories`, `getCategoryBySlug`, `getProductsByCategory`, `getCategorySlugs`, `getProductBySlug`, `getRelatedProducts`, `searchProducts`, `getProductSlugs`. Pages call these directly from Server Components.
- `src/lib/products.ts` holds the `Product` type and the pure helpers `getStockState`, `formatPrice` (takes cents), `productHref` and `categoryHref`. It imports the schema as types only, so client components can use it without pulling in the database client.
- `src/data/catalog.ts` holds only homepage copy (`hero`, `collections`, `atelier`, `services`). Collection and navigation links point at routes that do not exist (`/women`, `/atelier`) and keep `prefetch={false}`, and `NewsletterForm` only confirms on screen.
- `src/components/product-listing.tsx` is the full-page product grid (breadcrumb, heading, count, `ProductCard` tiles, empty state). `/new`, `/search` and the category page `src/app/(store)/[category]/page.tsx` all render it. The category page lives at `/<slug>`, is prerendered for every category through `generateStaticParams`, and returns `notFound()` for any other slug, so a new static route in the group takes precedence over it.
- `src/app/(store)/search/page.tsx` is the search page: a `next/form` GET form that puts the query in `?q=`, and `searchProducts` matching every word against name, description, materials, style number and category name with `ILIKE`. Reading `searchParams` makes it render on every request, so it has no `revalidate`. With no query it lists new arrivals.
- `src/app/(store)/products/[slug]/page.tsx` is the product page, prerendered for every product through `generateStaticParams`. Stock wording comes only from `getStockState`, which the page and `ProductCard` both call, so the listing and the product page cannot disagree.
- The homepage, listing pages and product page export `revalidate = 60`. Without it they would be prerendered once at build and never show a stock change. The "Add to bag" limit can be up to a minute stale, which is why the bag's Server Actions re-check stock.
- The bag is a cookie (`atelier_bag`, 30 days) holding only product ids and quantities, written as `12x2.7x1`. There are no cart tables. It is the same for guests and signed-in customers and does not follow them to another device. Nothing in it is trusted: prices, names and stock are read from the database on every read and write. The bag itself does not reserve stock; checkout does (see Checkout).
- `src/lib/bag-cookie.ts` is the cookie format (no imports, shared by browser and server). `src/lib/bag.ts` is the only server code that reads or writes the cookie; `resolveBag` drops unknown and sold-out products, cuts quantities to what is available, and prices lines in cents.
- `src/app/(store)/bag/actions.ts` holds the only writers: `addToBag`, `setBagQuantity`, `removeFromBag`, `tidyBag`. They take a product id and a quantity and nothing else from the caller. The one stock rule is `getMaxQuantity` in `src/lib/products.ts` (stock, or `MAX_MADE_TO_ORDER` for made-to-order pieces); the buttons and the server both use it.
- `src/components/bag.tsx` provides the bag through context from the store layout. It reads the cookie in the browser (the cookie is deliberately not HttpOnly) for the header count and "in your bag" lines, and re-reads it after each action; the count is 0 in the prerendered HTML and fills in on hydration. Change the bag only through `useBag()`.
- `/bag` renders per request. A page cannot write cookies, so when it has to drop or reduce a line, `BagNotices` says so and calls `tidyBag`.
- Images are hot-linked from Unsplash through `next/image`. `next.config.ts` allows `images.unsplash.com` with the object form of `remotePatterns`; `new URL(...)` there would reject the sizing query string.

### Database

- `src/db/index.ts` exports the single `db` client, built on the Neon **HTTP** driver (`drizzle-orm/neon-http`). It throws at import time when `DATABASE_URL` is unset, so anything that imports `@/db` or `@/lib/auth` — including `next build` collecting the auth route — fails without it. `next build` also queries the catalogue to prerender, so the database must be reachable and migrated.
- The HTTP driver has no interactive transactions: `db.transaction()` throws. Use `db.batch()` for atomic multi-statement writes, and leave the Drizzle adapter's `transaction` option off in `src/lib/auth.ts`.
- `src/db/schema.ts` is the only schema entry point. Both `drizzle.config.ts` and the `db` client read that one file, so tables defined elsewhere are invisible to migrations and to `db.query` until they are re-exported from it.
- Environment variables live in `.env.local`. Next.js loads it on its own; `drizzle.config.ts` loads `.env.local` then `.env` through `dotenv` (first one wins, as in Next.js), and `db:seed` passes `--env-file=.env.local` to `tsx`. A new script that touches the database outside Next.js has to load the file itself.

### Database conventions

The catalogue schema is `categories` 1 — N `products`. Beside it are Better Auth's tables (see Auth) and `orders` 1 — N `order_items`, written only by `src/db/orders.ts`. An order's `status` (`pending`, `paid`, `expired`, `failed`) is its payment state, `user_id` is null for a guest, the Stripe ids are their own unique columns, and each item keeps a copy of the product's name and unit price. `order_items.reserved_stock` records whether the line took units from `products.stock`. `users` has no `orders` relation because its relations are in the generated auth schema; query from `orders`. Carts, orders, payments, reviews, wishlists and variants were deliberately left out of the first version; do not add them, or tables that anticipate them, unless asked.

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

### Checkout

Stripe-hosted Checkout. Stripe owns the payment page, the card, the email and the US shipping address; the database owns products, prices, stock and orders. There is no delivery charge and no tax. Orders are settled by the webhook; the success page settles too, so the customer sees the result without waiting for it.

- `/checkout` is the review before paying: the bag's lines and totals, read-only, and the form that calls `startCheckout`. It redirects to `/bag` when the bag is empty or anything in it changed. `?status=cancelled` and `?status=error` show a fixed message there; a stock conflict goes to `/bag?checkout=stock` instead, because it has to be fixed in the bag. `SummaryLines` and `SummaryTotals` in `src/components/order-summary.tsx` are shared with the confirmation page. The segment has its own `loading.tsx` and `error.tsx`; because of the loading file, its redirects arrive in the stream with a 200 status.
- `startCheckout` in `src/app/(store)/checkout/actions.ts` takes no arguments. It reads the bag cookie, re-checks it against the database, and calls `createPendingOrder`, which writes the order, its items and the stock decrement in one `db.batch`. The `products_stock_check` constraint is what refuses an oversell: the batch fails as a whole and `createPendingOrder` returns null. Only then is the Stripe session created, from inline `price_data` (there is no Stripe product catalogue), and its id saved on the order.
- An order is `pending` while its stock is held, for 31 minutes (`expires_at`, also the Stripe session's expiry). `markOrderPaid` and `releaseOrder` in `src/db/orders.ts` are single statements guarded on the current status, so repeating one does nothing. `releaseOrder` gives stock back only for items with `reserved_stock`.
- `settleFromSession` in `src/lib/checkout.ts` is the only place an order becomes paid. It takes a session obtained from Stripe with our key, and requires `status = complete`, `payment_status` other than `unpaid`, and the amount and currency to equal the order's. Never mark an order paid from a query string, a form field or anything else the browser sends.
- `src/app/api/stripe/webhook/route.ts` verifies the `Stripe-Signature` against `STRIPE_WEBHOOK_SECRET` over the raw request text before reading anything; a bad, missing or stale signature is a 400. It handles four events and acknowledges the rest: `checkout.session.completed` and `checkout.session.async_payment_succeeded` call `settleFromSession`; `checkout.session.expired` and `checkout.session.async_payment_failed` call `releaseFromSession`. Stripe delivers at least once and in any order. That is safe only because every transition is guarded on status, so keep any new handler idempotent the same way instead of adding an event log. A processing error returns 500 so Stripe retries. Locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints the secret to use. There is no scheduled job that reconciles orders if a webhook never arrives.
- `/checkout/success?session_id=…` is the order confirmation. It shows the order's status from the database, found by the session id; an unknown or malformed id is a 404, and the id in the address is what allows the order to be seen. Only while the order is `pending` does it also ask Stripe and call `settleFromSession`; if Stripe cannot be reached it still renders, from the database alone. A paid order shows the confirmation and `FinishCheckout` has the server empty the bag. A pending order shows one of three waiting states (confirming, held by the bank, not paid), and `expired`/`failed` show that the checkout ended. In the confirming state `OrderStatusWatcher` calls `router.refresh()` every 4 seconds for about 2 minutes, so the page becomes the confirmation by itself when the webhook lands; the watcher decides nothing.
- The `atelier_checkout` cookie (HttpOnly) names the order this browser last took to Stripe. `/checkout/cancel`, any change to the bag, and starting a new checkout all call `cancelCheckout`: the Stripe session is expired first, so it cannot be paid afterwards, and then the order is released. While that order is pending, `getBag` counts its held units as still available to this customer.
- Do not pass `payment_method_types` to Stripe, and do not enable `automatic_tax` without a tax registration.

### Auth

- `src/lib/auth.ts` is the server instance, `src/lib/auth-client.ts` the React client, and `src/app/api/auth/[...all]/route.ts` mounts every Better Auth endpoint under `/api/auth/*`.
- Email and password is the only sign-in method. There is no email verification, password reset, social login or two-factor; do not add them unless asked.
- The Drizzle adapter is given no explicit `schema`, so it finds its tables through the schema passed to `db`. `usePlural: true` makes them `users`, `sessions`, `accounts` and `verifications`, and `advanced.database.generateId: "serial"` gives them integer identity keys. Better Auth still hands ids back as strings (`session.user.id` is `"1"`).
- `src/db/auth-schema.ts` is generated: `pnpm auth:generate` overwrites it, and it is re-exported from `src/db/schema.ts`. After regenerating (needed for any plugin that adds tables or columns), put `{ withTimezone: true }` back on every `timestamp(...)`, then `db:generate`, read the SQL, `db:migrate`. The file keeps the generator's `ON DELETE CASCADE` from `sessions` and `accounts` to `users` and its `<table>_userId_idx` index names; those are the exceptions to the database conventions.
- The role is the `role` column on `users` (`customer` or `admin`), declared in `user.additionalFields` with `input: false` so a sign-up request cannot set it. The only way to change it is `pnpm auth:grant-admin <email>`. The Better Auth `admin` plugin is not installed.
- `src/lib/session.ts` is the only place the server reads the session: `getSession`, `requireUser(next)` (redirects to `/sign-in?next=`), `requireAdmin(next)` (404 for anyone who is not an admin) and `safeNext` (accepts only a path on this site). Every protected page, Server Action and Route Handler calls `requireUser` or `requireAdmin` itself; a layout check is not enough, because layouts do not re-run on navigation. `/admin` also calls it in `generateMetadata` so the 404 does not carry the page title.
- Do not read the session in `src/app/(store)/layout.tsx`: it would make every storefront page dynamic and undo `revalidate`. The header reads it on the client with `authClient.useSession()`. That request is also what extends the 7-day session, since Better Auth skips the refresh inside Server Components.
- There is no cookie cache, so every check is a database lookup and a sign-out or role change applies on the next request.
- `/sign-in`, `/sign-up` and `/account` are in the store group; `/admin` is outside it. `src/app/(store)/account/layout.tsx` is the account frame (breadcrumb, greeting, `AccountNav`); a new account section is one entry in its `links` and a page beside it that calls `requireUser`. There is no order history or profile editing. `src/components/auth-form.tsx` calls `authClient` rather than a Server Action so that attempts pass through Better Auth's rate limiter, which is on only in production and kept in memory.
- `nextCookies()` must stay the last entry in `plugins`.

### Styling

Tailwind v4 is configured in CSS, not in a `tailwind.config` file. `src/app/globals.css` only imports Tailwind and the four files in `src/styles/`:

- `tokens.css` — raw custom properties on `:root` (colour, gutter, grid, section and header sizes, stepped at `md` and `lg`) and the `@theme inline` block that maps them to utilities. The default colour palette, type scale, tracking, radii and breakpoints are reset there, so only the project's own names exist: `bg-gray-200`, `text-sm`, `rounded-lg`, `sm:` and `2xl:` do not compile to anything.
- `base.css` — element defaults: hairline border colour on everything, focus ring, selection, reduced motion.
- `primitives.css` — `@utility` rules: `shell`, `shell-reading`, `bleed`, `grid-page`, `grid-products`, `media-tile`, `media-cover`, `tile-caption`, `scrim`, `theme-inverse`, `on-image`, and the `type-*` roles.
- `components.css` — `.btn` (+ `-primary`, `-secondary`, `-sm`, `-block`, `-icon`), `.field` (its error state is `aria-invalid="true"`, not a class), `.stepper` (the bag's − [number] + quantity control), and `.link`, `.link-reveal`, `.link-muted` in `@layer components`.

The site is light-only (no `prefers-color-scheme` switch). Black sections use the `theme-inverse` utility, which re-points the colour tokens for its subtree; text and buttons laid over a photograph use `on-image`, the same tokens without the black fill. Do not write separate "on dark" variants. Use a `type-*` role rather than assembling size, weight and case by hand. `/styleguide` renders every token and primitive.

## Git

This folder is its own repository (`main`, remote `origin` at `github.com/Moyo-Made/atelier-store`). It sits inside `~/Documents`, which is a separate, unrelated repository; run git commands from this directory so they act on this one.

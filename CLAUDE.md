# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev            # http://localhost:3000
pnpm build          # production build; needs a reachable, migrated database
pnpm lint           # `pnpm lint <file>` for one file
pnpm typecheck      # tsc --noEmit, no database needed
pnpm test           # node:test through tsx, pure helpers only
pnpm db:generate    # then read the SQL, then pnpm db:migrate
pnpm db:seed        # upserts the sample catalogue, stock included
pnpm auth:grant-admin <email>
```

- `pnpm typecheck` reads the route types in `.next/`. After adding or removing a route it fails with `LayoutRoutes`/`AppRoutes` errors until they are regenerated: run `pnpm exec next typegen`.
- Tests cover pure helpers only. Do not add tests that write to the database: there is one shared database and no transactions to roll back.
- Install with pnpm only. `patches/drizzle-kit@0.31.11.patch` makes Drizzle Studio refuse requests whose `Origin` is not `https://local.drizzle.studio`; unpatched, Studio accepts SQL from any web page while it runs, and no release fixes it. npm or yarn would install it unpatched. When upgrading `drizzle-kit`, check whether upstream now restricts origins; if not, redo the patch with `pnpm patch` (the same edit in `bin.cjs`, `api.js` and `api.mjs`).
- `.env.local` needs `DATABASE_URL` (Neon pooled), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (also where Stripe sends customers back), `STRIPE_SECRET_KEY` (a sandbox restricted key, `rk_test_…`, with Checkout Sessions write) and `STRIPE_WEBHOOK_SECRET`. Without the Stripe key the build passes and payment returns to `/checkout?status=error`; without the webhook secret the webhook answers 500. Locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints the secret.
- A script that touches the database outside Next.js must load `.env.local` itself (`tsx --env-file=.env.local`, as `db:seed` does).

## Architecture

Next.js 16 App Router, React 19, Tailwind CSS v4, Better Auth, Drizzle ORM over Neon Postgres, Stripe-hosted Checkout. Customer pages are in the `src/app/(store)/` route group; `/admin` and `/styleguide` are outside it.

### Storefront

- The header is fixed and transparent only on `/` before scrolling, so every other page in the store group needs its own `pt-header` top padding.
- Catalogue pages (homepage, `/new`, category, product) export `revalidate = 60` as a literal number, or they would be prerendered once at build and never show a stock change. Every admin write also calls `revalidateCatalogue()` so changes show at once. Content pages read nothing from the database and need no `revalidate`.
- Do not read the session in `src/app/(store)/layout.tsx`: it would make every storefront page dynamic. The header reads it on the client with `authClient.useSession()`, and that request is also what extends the 7-day session (Better Auth skips the refresh inside Server Components).
- The category page lives at `/<slug>` and 404s for unknown slugs, so a new static route in the group takes precedence over it. The header menu lists the categories by hand (`primaryLinks` in `site-header.tsx`), so a new category has to be added there too.
- Stock wording and colour come only from `getStockState`. Branch on its `level`, never on the label text.
- `NotFoundPage` is the single 404 page. A not-found file's `metadata` is not read, so its title is a `<title>` in the component. `src/app/not-found.tsx` adds the bag provider, header and footer itself so it looks the same as the store group's.
- Images are hot-linked from `images.unsplash.com`. `remotePatterns` must stay in object form: `new URL(...)` rejects Unsplash's sizing query string.
- `NewsletterForm` is not connected to anything; it only confirms on screen.
- Link previews (Open Graph, X cards):
  - The root layout sets the site-wide card from `src/lib/share.ts`. `metadataBase` comes from `BETTER_AUTH_URL`, so that variable must be the public address in production or the share image URLs point at the wrong host.
  - Metadata merges shallowly: a page that sets `openGraph` replaces the layout's whole object, image included. Such a page spreads `openGraphDefaults` back in and always passes an image, falling back to `siteImage`. Product and category pages do this.
  - `src/app/opengraph-image.jpg` is a static file made from the homepage hero photo with the wordmark over it. If the hero changes, remake it. Its alt text lives in both `opengraph-image.alt.txt` and `siteImage`.
- Content and legal copy is sample text, and the legal pages have not been reviewed by a lawyer. Contact details use `.example` addresses and 555 numbers on purpose. What these pages say has to stay true to the code:
  - delivery, returns and payment: US only, no delivery charge or tax, made to order in three weeks
  - `/legal/cookies` lists every cookie the site sets, with its lifetime
  - `/legal/privacy` says there are no trackers and what an order stores

  A new cookie, tracker or stored customer field has to be added there.

### Bag

- The bag is a cookie (`atelier_bag`, 30 days, deliberately not HttpOnly so the header can count it) holding only product ids and quantities. There are no cart tables. Nothing in it is trusted: prices, names and stock are re-read from the database on every read and write. The bag reserves no stock; checkout does.
- Only `src/lib/bag.ts` reads or writes the cookie on the server, and only the Server Actions in `src/app/(store)/bag/actions.ts` change it; they take a product id and quantity and nothing else. In components, change the bag only through `useBag()`.
- The one quantity rule is `getMaxQuantity` (stock, or `MAX_MADE_TO_ORDER` for made-to-order pieces), used by both the buttons and the server. The "Add to bag" limit can be a minute stale, which is why the actions re-check stock.
- A page cannot write cookies, so when `/bag` has to drop or reduce a line, `BagNotices` says so and calls `tidyBag`.

### Database

- `src/db/index.ts` uses the Neon **HTTP** driver and throws at import when `DATABASE_URL` is unset. It has no interactive transactions: `db.transaction()` throws. Use `db.batch()` for atomic multi-statement writes, and leave the Better Auth adapter's `transaction` option off.
- `src/db/schema.ts` is the only schema entry point for migrations and `db.query`; tables defined elsewhere must be re-exported from it.
- Storefront reads go only in `src/db/queries.ts`, admin catalogue reads and writes only in `src/db/admin.ts`, order writes only in `src/db/orders.ts`. Pages and components never import `db`.
- Carts, reviews, wishlists and variants were deliberately left out. Do not add them, or tables that anticipate them, unless asked.

Conventions:

- Every table has an `integer` identity primary key (`generatedAlwaysAsIdentity()`). Anything in a URL gets its own unique `slug` column, never used as a key, so a product can be renamed without rewriting references.
- Columns are `snake_case` in SQL and `camelCase` in TypeScript. Foreign keys are `ON DELETE RESTRICT`, indexed, with `relations()` on both sides. Constraints and indexes are named `<table>_<column>_check` / `_idx`.
- Money is integer cents with `CHECK >= 0`; never dollars, floats or `numeric`.
- Stock is `products.stock` (`CHECK >= 0`); `made_to_order` products are buyable at 0. If variants are ever added, stock moves to the variant row.
- A list only read with its parent stays on the row (`details text[]`, `images jsonb`).
- Timestamps are `timestamp with time zone NOT NULL DEFAULT now()`.
- Optional presentation data is a nullable column, not a flag (a category is a homepage tile when `image_url` is set).
- Types come from the schema (`$inferSelect`), exported from `src/lib/products.ts`; never hand-write a parallel type. That file is imported by client components, so it may only `import type` from the schema.
- Sorting and filtering go in SQL, not in JavaScript after the fetch.

Migrations and seed:

- Every schema change is `db:generate`, read the SQL, `db:migrate`; commit `drizzle/` including `meta/`. Never use `db:push`, and never edit an applied migration. If `db:migrate` fails through Neon's pooled string, use the direct one.
- Add sample rows to `src/db/seed.ts`, not a migration, and keep it an upsert on `slug`. It overwrites every column of the sample products, stock included, so do not run it against a database whose catalogue is managed from the admin.

### Checkout

Stripe owns the payment page, card, email and US shipping address; the database owns products, prices, stock and orders. No delivery charge and no tax: do not enable `automatic_tax` without a tax registration, and do not pass `payment_method_types`. Prices go to Stripe as inline `price_data`; there is no Stripe product catalogue.

- `startCheckout` takes no arguments. It re-checks the bag cookie against the database, then `createPendingOrder` writes the order, items and stock decrement in one `db.batch`. The `products_stock_check` constraint is what refuses an oversell: the whole batch fails. Only after that is the Stripe session created.
- A `pending` order holds its stock for 31 minutes, which is also the Stripe session's expiry. `order_items.reserved_stock` records which lines took stock, and only those give it back. Orders that never reached Stripe are released by `releaseAbandonedOrders` at the start of the next `startCheckout`; there is no scheduled job.
- `settleFromSession` is the only place an order becomes paid. It takes a session fetched from Stripe with our key and requires `status = complete`, `payment_status` not `unpaid`, and amount and currency equal to the order's. Never mark an order paid from anything the browser sends.
- On a total or currency mismatch the order stays `pending` with its stock held and an error is logged. Nothing surfaces it until `/admin/orders` is built; it is resolved by hand.
- Every status transition is a single statement guarded on the current status, so repeating one does nothing. That is what makes at-least-once, out-of-order webhooks safe: keep any new handler idempotent the same way instead of adding an event log.
- The webhook verifies the signature over the raw request text before reading anything (bad signature: 400; processing error: 500 so Stripe retries). For completed or async-succeeded events, it re-retrieves the session with our key rather than using the event's copy, whose shape follows the endpoint's API version and may lack the delivery address.
- The success page and the account order page also call `syncPendingOrder` while an order is `pending`, so a late or lost webhook does not leave it stuck. They still render from the database if Stripe is unreachable. Neither has a `loading.tsx`, so their 404s keep the 404 status. The review page at `/checkout` does have one (in the `(review)` group), so its redirects arrive with a 200 status.
- The `atelier_checkout` cookie (HttpOnly) names the browser's open checkout by its Checkout Session id, never by order reference: whoever sends the value can cancel that checkout, and a reference is not secret.
- Changing the bag, `/checkout/cancel` and starting a new checkout all cancel the open checkout: expire the Stripe session first, so it can no longer be paid, then release the order.
- A checkout already completed at Stripe cannot be cancelled. Its bag is emptied instead, and `startCheckout` goes to its confirmation rather than selling the bag twice.
- If Stripe is unreachable during a cancel, the order keeps its stock, and its units count as this customer's own in the bag.
- Known gap: `startCheckout` needs no sign-in and has no bot protection, and one request can hold a whole bag of stock for 31 minutes, so a script can keep the catalogue sold out. A throttle alone will not fix it; it needs bot protection before the store takes real orders.

### Auth

- Email and password only. No email verification, password reset, social login or two-factor; do not add them unless asked. Sign-in goes through `authClient`, not a Server Action, so attempts hit Better Auth's rate limiter (production only, in memory).
- The adapter uses `usePlural: true` and `generateId: "serial"`, so tables are `users`, `sessions`, … with integer keys, but Better Auth still returns ids as strings. `nextCookies()` must stay the last plugin. There is no cookie cache: every check is a database lookup.
- `src/db/auth-schema.ts` is generated by `pnpm auth:generate`. After regenerating, put `{ withTimezone: true }` back on every `timestamp(...)`, then generate and migrate. Its `ON DELETE CASCADE` to `users` and `<table>_userId_idx` names are the accepted exceptions to the conventions.
- The role is `users.role` (`customer` | `admin`), declared with `input: false` so sign-up cannot set it. Only `pnpm auth:grant-admin` changes it; the Better Auth `admin` plugin is not installed.
- Only `src/lib/session.ts` reads the session on the server. Every protected page, Server Action and Route Handler calls `requireUser` or `requireAdmin` itself, because layouts do not re-run on navigation.
- `requireAdmin` returns a 404 to non-admins rather than a redirect. Admin pages also call it in `generateMetadata` so that 404 does not carry the page title. No admin segment has a `loading.tsx`, so the 404 keeps its status.
- A customer's order history shows only their own orders that reached Stripe, without `expired` ones. Any other order is a 404.

### Admin

- Product details and availability are separate forms. `setProductAvailability` is the only statement that changes stock from the admin. It writes only `where stock = expectedStock` (the figure the form showed), so a sale made while the page was open is not overwritten. Keep stock out of every other admin write, and save one product per statement: a batch would not fail as a whole when one guard misses.
- Stock inputs are keyed on the server's figure (`key={stock}`), and action results carry the figure they belong to. A refresh that brings a new figure therefore remounts the input and drops unsaved typing. Without this, a stale draft would be saved against the new `expectedStock` and the guard would pass.
- Forms are validated on the server by the pure checkers in `src/lib/admin.ts`. A refused action returns the typed values with the errors, because React resets a form after its action.
- Duplicate slugs and style numbers are detected by constraint name (`constraintOf`).
- Prices are entered in whole dollars, images must be on `images.unsplash.com`, and a slug is fixed once created. There is no product delete.
- `/admin/categories` and `/admin/orders` are guarded placeholders, not built yet.

### Styling

- Tailwind v4 is configured in CSS (`src/styles/`), with no `tailwind.config`. The default palette, type scale, radii and breakpoints are reset, so `bg-gray-200`, `text-sm`, `rounded-lg`, `sm:` and `2xl:` compile to nothing; use the project's tokens.
- Use a `type-*` role instead of assembling size, weight and case by hand.
- The site is light-only. Black sections use `theme-inverse` and text over photographs uses `on-image`; do not write separate "on dark" variants.
- `.field`'s error state is `aria-invalid="true"`, not a class.
- `/styleguide` renders every token and primitive.

### Motion

- One curve, `--ease-emphasis`, and the `--duration-*` tokens; nothing bounces. Keyframes and motion classes live in `src/styles/motion.css`. No animation library: CSS plus React's `<ViewTransition>`.
- Anything that starts hidden or delayed sits inside `prefers-reduced-motion: no-preference`, so with reduced motion nothing waits hidden. View transitions are switched off separately at the end of `motion.css`, because base.css does not reach their pseudo-elements.
- The hero entrance plays once per page load: `HeroIntro` sets `data-intro-played` on `<html>` afterwards.
- `Reveal` is for editorial photographs only, never product grids. It renders visible and hides only what starts below the fold.
- Product card and product page share the name `product-image-<id>` so the photograph morphs between them. A name must be unique among rendered elements on a page, so do not show the same product twice on one page without dropping the name from one copy.
- `Roll` slides changed text up into place. It stays still until `animate` is true, and `BagRoll` sets that from `useBag().changes`, so figures that arrive with the page or with hydration do not roll.
- The header tucks away while scrolling down past 160px and returns on any scroll up or focus. While it is away it sets `data-header-tucked` on `<html>`, which sets `--header-offset` to 0. Sticky elements under the header use `top-header-offset`, not `top-header`, so they move up with it.

## Git

This folder is its own repository (default branch `main`, remote `github.com/Moyo-Made/atelier-store`). It sits inside `~/Documents`, which is a separate, unrelated repository, so run git commands from this directory.

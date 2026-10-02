# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS, with Better Auth, Drizzle ORM and Neon Postgres.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm db:migrate     # create the tables
pnpm db:seed        # load the sample catalogue
pnpm dev
```

## Environment

| Variable             | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `DATABASE_URL`       | Neon Postgres connection string          |
| `BETTER_AUTH_SECRET` | Secret for signing sessions and tokens   |
| `BETTER_AUTH_URL`    | Base URL of the app                      |

## Structure

- `src/db/index.ts` — Drizzle client over the Neon HTTP driver
- `src/db/schema.ts` — Drizzle schema: `categories` and `products`
- `src/db/queries.ts` — catalogue reads used by the storefront
- `src/db/seed.ts` — sample categories and products
- `src/lib/auth.ts` — Better Auth server instance
- `src/lib/auth-client.ts` — Better Auth React client
- `src/app/api/auth/[...all]/route.ts` — Better Auth route handler
- `drizzle.config.ts` — Drizzle Kit config, migrations output to `drizzle/`

## Scripts

| Script                  | Does                                          |
| ----------------------- | --------------------------------------------- |
| `pnpm dev`           | Start the dev server                          |
| `pnpm build`         | Production build                              |
| `pnpm lint`          | ESLint                                        |
| `pnpm db:generate`   | Generate SQL migrations from the schema       |
| `pnpm db:migrate`    | Apply migrations                              |
| `pnpm db:push`       | Push the schema straight to the database      |
| `pnpm db:studio`     | Open Drizzle Studio                           |
| `pnpm db:seed`       | Upsert the sample categories and products     |
| `pnpm auth:generate` | Generate Better Auth's Drizzle tables         |

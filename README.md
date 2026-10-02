# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS, with Better Auth, Drizzle ORM and Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate     # create the tables
npm run db:seed        # load the sample catalogue
npm run dev
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
| `npm run dev`           | Start the dev server                          |
| `npm run build`         | Production build                              |
| `npm run lint`          | ESLint                                        |
| `npm run db:generate`   | Generate SQL migrations from the schema       |
| `npm run db:migrate`    | Apply migrations                              |
| `npm run db:push`       | Push the schema straight to the database      |
| `npm run db:studio`     | Open Drizzle Studio                           |
| `npm run db:seed`       | Upsert the sample categories and products     |
| `npm run auth:generate` | Generate Better Auth's Drizzle tables         |

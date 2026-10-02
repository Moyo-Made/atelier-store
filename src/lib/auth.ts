import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";

export const auth = betterAuth({
  // Plural table names (`users`, `sessions`) to match the rest of the schema.
  // No `transaction` option: the Neon HTTP driver cannot run one.
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // `input: false` keeps a sign-up request from choosing its own role.
      role: {
        type: ["customer", "admin"],
        required: true,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  // Integer identity primary keys, like every other table.
  advanced: { database: { generateId: "serial" } },
  // nextCookies must stay last in the plugins array
  plugins: [nextCookies()],
});

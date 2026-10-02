// Makes an existing user an admin: `pnpm auth:grant-admin name@example.com`.
// This is the only way a role changes; no page or endpoint does it.
import { eq } from "drizzle-orm";

import { db } from "./index";
import { users } from "./schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: pnpm auth:grant-admin <email>");
  }

  const updated = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning({ id: users.id });

  if (updated.length === 0) {
    throw new Error(`No user with the email ${email}. Sign up first.`);
  }

  console.log(`${email} is now an admin.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same precedence as Next.js: .env.local wins over .env.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

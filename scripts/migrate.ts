/**
 * Apply pending migrations. Works for both PGlite (local) and postgres-js (Supabase).
 * Run with: npm run db:migrate
 */

import "dotenv/config";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";

const MIGRATIONS_FOLDER = "./drizzle";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url && url.length > 0) {
    console.log(`Migrating Postgres at ${new URL(url).host}…`);
    const client = postgres(url, { max: 1 });
    const db = drizzlePg(client);
    await migratePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await client.end();
  } else {
    const dataDir = path.join(process.cwd(), "data", "pglite");
    console.log(`Migrating local PGlite at ${dataDir}…`);
    const pg = new PGlite(dataDir);
    const db = drizzlePglite(pg);
    await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await pg.close();
  }
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

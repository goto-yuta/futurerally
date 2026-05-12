/**
 * Smart DB client: uses PGlite (local file) when DATABASE_URL is unset,
 * postgres-js when set. Same Drizzle interface either way.
 */

import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import path from "node:path";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data", "pglite");

type Db =
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>;

let _db: Db | undefined;

export function getDb(): Db {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (url && url.length > 0) {
    const client = postgres(url, { prepare: false, max: 1 });
    _db = drizzlePg(client, { schema }) as Db;
  } else {
    const pg = new PGlite(DATA_DIR);
    _db = drizzlePglite(pg, { schema }) as Db;
  }
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
}) as Db;

/**
 * Apply jp-name-overrides.csv (or jp-wta-name-overrides.csv) to the DB.
 * Matches by atp_player_id (primary) or name_en (fallback).
 * Sets name_ja + name_ja_verified=true.
 *
 * Run:
 *   npm run names:apply           — ATP overrides (data/jp-name-overrides.csv)
 *   npm run names:apply:wta       — WTA overrides (data/jp-wta-name-overrides.csv)
 */

import "@/lib/load-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players } from "@/lib/db/schema";

type Override = {
  atp_player_id: string;
  name_en: string;
  name_ja: string;
  source: string;
};

async function main() {
  const isWta = process.argv.includes("--tour") &&
    process.argv[process.argv.indexOf("--tour") + 1] === "wta";
  const csvFile = isWta ? "jp-wta-name-overrides.csv" : "jp-name-overrides.csv";
  const csvPath = join(process.cwd(), "data", csvFile);
  console.log(`Reading ${csvFile}…`);
  const lines = readFileSync(csvPath, "utf-8").split("\n").filter(Boolean);
  const rows: Override[] = lines.slice(1).map((l) => {
    const cols = l.split(",");
    return {
      atp_player_id: cols[0],
      name_en: cols[1],
      name_ja: cols[2],
      source: cols[3] ?? "",
    };
  });

  console.log(`Applying ${rows.length} name overrides…`);
  let applied = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.name_ja || !row.atp_player_id) { skipped++; continue; }

    const atpId = Number(row.atp_player_id);
    if (!Number.isFinite(atpId)) { skipped++; continue; }

    const [existing] = await db
      .select({ id: players.id, nameJa: players.nameJa })
      .from(players)
      .where(eq(players.atpPlayerId, atpId))
      .limit(1);

    if (!existing) { skipped++; continue; }

    await db
      .update(players)
      .set({ nameJa: row.name_ja, nameJaVerified: true, updatedAt: new Date() })
      .where(eq(players.id, existing.id));

    applied++;
  }

  console.log(`✓ Applied: ${applied}  Skipped: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

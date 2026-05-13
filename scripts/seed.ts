/**
 * Seed real data. Idempotent: truncates main tables before inserting.
 * Run: npm run db:seed
 *
 * After seeding, run:
 *   npm run rankings:sync        ← imports all 84 JPN ATP players
 *   npm run rankings:sync:wta    ← imports all 80 JPN WTA players
 *   npm run names:apply          ← applies kanji overrides CSV
 *   npm run names:apply:wta
 */

import "@/lib/load-env";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  players, articles, articlePlayers, playerRankSnapshots, matchRecords,
} from "@/lib/db/schema";
import { resolvePlayerFromSackmann } from "@/lib/players/resolve";

/** Known ATP IDs to pre-populate as a starting set. */
const SEED_PRO_ATP_IDS = [
  200647, // 島袋将  #107
  208278, // 望月慎太郎 #130
  210536, // 坂本怜  #156
  106415, // 西岡良仁 #175
  200677, // 野口莉央 #204
  106121, // ダニエル太郎 #335
  105453, // 錦織圭 #558
  105216, // 杉田祐一
] as const;

/** Top 3 ranked players become Featured (editor can update in Supabase Studio). */
const FEATURED_ATP_IDS = [200647, 208278, 210536];

async function main() {
  console.log("seeding…");

  await db.execute(sql`TRUNCATE TABLE
    match_records, player_rank_snapshots, sponsorship_inquiries,
    article_tournaments, article_players, articles,
    tournament_entries, tournaments, pro_endorsements, players
    RESTART IDENTITY CASCADE`);

  // --- Real pros from Sackmann + Wikidata ---
  const insertedPros: { id: number; slug: string; atpPlayerId: number }[] = [];
  for (const [i, atpId] of SEED_PRO_ATP_IDS.entries()) {
    const r = await resolvePlayerFromSackmann(atpId);
    if (!r) { console.warn(`  Sackmann lookup failed for ${atpId}`); continue; }

    const isFeatured = FEATURED_ATP_IDS.includes(atpId);
    const displayOrder = FEATURED_ATP_IDS.indexOf(atpId) + 1;

    const [row] = await db.insert(players).values({
      slug: r.slug,
      nameJa: r.nameJa,
      nameEn: r.nameEn,
      nameJaVerified: r.nameJaVerified,
      birthYear: r.birthYear,
      hand: r.hand,
      heightCm: r.heightCm,
      category: "pro",
      atpPlayerId: r.atpPlayerId,
      wikidataId: r.wikidataId,
      featured: isFeatured,
      displayOrder: isFeatured ? displayOrder : 0,
    }).returning();

    insertedPros.push({ id: row.id, slug: row.slug, atpPlayerId: atpId });
    console.log(`  + ${r.slug}: ${r.nameJa} ${isFeatured ? "★ featured" : ""}`);
  }

  // Convenience references
  const byId = (atpId: number) => insertedPros.find((p) => p.atpPlayerId === atpId);
  const nishiokaRow = byId(106415);
  const shimabukuroRow = byId(200647);

  // --- Sample rank snapshots for Shimabukuro (12 months, realistic trend) ---
  if (shimabukuroRow) {
    const trend = [310, 290, 260, 230, 200, 170, 155, 140, 125, 115, 110, 107];
    await db.insert(playerRankSnapshots).values(
      trend.map((rank, i) => {
        const d = new Date();
        d.setUTCMonth(d.getUTCMonth() - (11 - i));
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        return { playerId: shimabukuroRow.id, provider: "atp" as const, rank, snapshotAt: d };
      }),
    );
    console.log("  + rank snapshots for 島袋将");
  }

  // --- Sample article (body will be replaced by articles:sync from MDX) ---
  const [article] = await db.insert(articles).values([
    {
      slug: "nishioka-yamada-talk",
      title: "「俺もここで泣いた」西岡が、F級で戦う後輩へ。",
      excerpt: "西岡良仁 × F級選手 / 6,200字 — F級時代に味わった挫折と、いま挑む後輩への言葉。",
      body: "# placeholder\n本文はMDXファイルから同期されます。",
      category: "interview",
      authors: "編集部",
      publishedAt: new Date("2026-05-12"),
    },
  ]).returning();

  if (nishiokaRow) {
    await db.insert(articlePlayers).values([
      { articleId: article.id, playerId: nishiokaRow.id },
    ]);
  }

  console.log("seed complete.");
  console.log("");
  console.log("Next steps:");
  console.log("  npm run rankings:sync        (import all 84 JPN ATP players)");
  console.log("  npm run rankings:sync:wta    (import all 80 JPN WTA players)");
  console.log("  npm run names:apply          (apply kanji overrides CSV)");
  console.log("  npm run names:apply:wta");
  console.log("  npm run articles:sync        (sync MDX → DB)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

/**
 * Sync all Japanese ATP-ranked players from Sackmann CSV + Wikidata.
 *
 * Steps:
 *  1. Fetch atp_rankings_current.csv and atp_players.csv from Sackmann's GitHub
 *  2. Filter to the latest ranking date, IOC=JPN, sorted by rank
 *  3. Batch-fetch Wikidata labels (ja/en) for players that have a wikidata_id
 *  4. Upsert all players into the DB (ON CONFLICT atp_player_id → UPDATE)
 *  5. Print stats: inserted N, updated N, Wikidata-verified N/total
 *
 * Run:
 *   npm run rankings:sync
 */

import "@/lib/load-env";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players } from "@/lib/db/schema";
import { fetchWikidataLabelsBatch } from "@/lib/wikidata/lookup";

const SACKMANN_RANKINGS_URL =
  "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv";
const SACKMANN_PLAYERS_URL =
  "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv";

const USER_AGENT = "FutureRally/1.0 (https://futurerally.vercel.app)";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type RankingRow = {
  rankDate: string; // YYYYMMDD
  rank: number;
  playerId: number;
  points: number;
};

type PlayerRow = {
  playerId: number;
  nameFirst: string;
  nameLast: string;
  hand: string | null;
  dob: string | null;
  ioc: string | null;
  heightCm: number | null;
  wikidataId: string | null;
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (macrons etc.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function parseRankingsCsv(text: string): RankingRow[] {
  const lines = text.split("\n");
  const rows: RankingRow[] = [];
  // Header: ranking_date,rank,player,points
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length < 4) continue;
    const rankDate = cols[0];
    const rank = Number(cols[1]);
    const playerId = Number(cols[2]);
    const points = Number(cols[3]);
    if (!rankDate || !Number.isFinite(rank) || !Number.isFinite(playerId)) continue;
    rows.push({ rankDate, rank, playerId, points });
  }
  return rows;
}

function parsePlayersCsv(text: string): Map<number, PlayerRow> {
  const lines = text.split("\n");
  const map = new Map<number, PlayerRow>();
  // Header: player_id,name_first,name_last,hand,dob,ioc,height,wikidata_id
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length < 8) continue;
    const playerId = Number(cols[0]);
    if (!Number.isFinite(playerId)) continue;
    map.set(playerId, {
      playerId,
      nameFirst: cols[1] || "",
      nameLast: cols[2] || "",
      hand: cols[3] || null,
      dob: cols[4] || null,
      ioc: cols[5] || null,
      heightCm: cols[6] ? Number(cols[6]) || null : null,
      wikidataId: cols[7] || null,
    });
  }
  return map;
}

function birthYearFromDob(dob: string | null): number | null {
  if (!dob || dob.length < 4) return null;
  const y = Number(dob.slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : null;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching Sackmann CSVs...");
  const [rankingsText, playersText] = await Promise.all([
    fetchText(SACKMANN_RANKINGS_URL),
    fetchText(SACKMANN_PLAYERS_URL),
  ]);

  const allRankings = parseRankingsCsv(rankingsText);
  const allPlayers = parsePlayersCsv(playersText);

  // Find the latest ranking date
  const latestDate = allRankings.reduce(
    (max, r) => (r.rankDate > max ? r.rankDate : max),
    "",
  );
  console.log(`Latest ranking date: ${latestDate}`);

  // Filter to latest date, JPN players only, sort by rank
  const jpnRankings = allRankings
    .filter((r) => r.rankDate === latestDate)
    .filter((r) => {
      const p = allPlayers.get(r.playerId);
      return p?.ioc === "JPN";
    })
    .sort((a, b) => a.rank - b.rank);

  console.log(`Japanese ATP-ranked players found: ${jpnRankings.length}`);

  // Collect wikidata IDs for batch fetch
  const wikidataIds: string[] = [];
  for (const row of jpnRankings) {
    const p = allPlayers.get(row.playerId);
    if (p?.wikidataId) wikidataIds.push(p.wikidataId);
  }

  console.log(
    `Fetching Wikidata labels for ${wikidataIds.length} players with wikidata_id...`,
  );
  const wikidataMap = await fetchWikidataLabelsBatch(wikidataIds);
  console.log(`Wikidata labels retrieved: ${wikidataMap.size}`);

  // Upsert each player
  let inserted = 0;
  let updated = 0;
  let verified = 0;

  for (const rankRow of jpnRankings) {
    const p = allPlayers.get(rankRow.playerId);
    if (!p) continue;

    const romajiNameEn = `${p.nameFirst} ${p.nameLast}`.trim();
    const romajiNameJa = `${p.nameLast} ${p.nameFirst}`.trim();

    const labels = p.wikidataId ? (wikidataMap.get(p.wikidataId) ?? null) : null;
    const nameJa = labels?.ja ?? romajiNameJa;
    const nameEn = labels?.en ?? romajiNameEn;
    const nameJaVerified = Boolean(labels?.ja);

    if (nameJaVerified) verified++;

    // slug: Last-First (romaji), lowercased, diacritics stripped
    const slug = slugify(`${p.nameLast} ${p.nameFirst}`);

    const payload = {
      slug,
      nameJa,
      nameEn,
      nameJaVerified,
      birthYear: birthYearFromDob(p.dob),
      heightCm: p.heightCm,
      category: "pro" as const,
      atpPlayerId: p.playerId,
      wikidataId: p.wikidataId,
      currentAtpRank: rankRow.rank,
      updatedAt: new Date(),
    };

    // onConflictDoUpdate targets the partial unique index on atp_player_id (WHERE NOT NULL)
    const conflictSet = {
      currentAtpRank: sql`excluded.current_atp_rank`,
      nameJa: sql`excluded.name_ja`,
      nameJaVerified: sql`excluded.name_ja_verified`,
      nameEn: sql`excluded.name_en`,
      wikidataId: sql`excluded.wikidata_id`,
      updatedAt: sql`excluded.updated_at`,
    };

    try {
      const result = await db
        .insert(players)
        .values(payload)
        .onConflictDoUpdate({
          target: players.atpPlayerId,
          targetWhere: sql`${players.atpPlayerId} IS NOT NULL`,
          set: conflictSet,
        })
        .returning({ id: players.id, wasInserted: sql<boolean>`(xmax = 0)` });

      const row = result[0];
      // xmax=0 means it was a fresh insert (no conflicting row was updated)
      if (row?.wasInserted) {
        inserted++;
        console.log(`  [INSERT] rank#${rankRow.rank} ${nameEn} (${nameJa}) atp_id=${p.playerId}`);
      } else {
        updated++;
        console.log(`  [UPDATE] rank#${rankRow.rank} ${nameEn} (${nameJa}) atp_id=${p.playerId}`);
      }
    } catch (err) {
      // Slug conflict: another player has the same slug. Append atp_player_id to disambiguate.
      const fallbackSlug = `${slug}-${p.playerId}`;
      try {
        await db
          .insert(players)
          .values({ ...payload, slug: fallbackSlug })
          .onConflictDoUpdate({
            target: players.atpPlayerId,
            targetWhere: sql`${players.atpPlayerId} IS NOT NULL`,
            set: conflictSet,
          });
        updated++;
        console.log(
          `  [UPDATE/slug-conflict] rank#${rankRow.rank} ${nameEn} slug=${fallbackSlug}`,
        );
      } catch (err2) {
        console.error(`  [ERROR] rank#${rankRow.rank} ${nameEn} atp_id=${p.playerId}:`, err2);
      }
    }
  }

  console.log("");
  console.log("=== Sync complete ===");
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Updated  : ${updated}`);
  console.log(
    `  Verified : ${verified} / ${jpnRankings.length} (Wikidata kanji confirmed)`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

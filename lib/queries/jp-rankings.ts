import { asc, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, playerRankSnapshots } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export type RankedPlayer = {
  slug: string;
  nameJa: string;
  nameEn: string;
  nameJaVerified: boolean;
  atpRank: number;
  atpPoints: number | null;
  category: string;
  university: string | null;
  lastScrapedAt: Date | null;
};

export async function selectJpRankings(): Promise<RankedPlayer[]> {
  const rows = await db
    .select({
      slug: players.slug,
      nameJa: players.nameJa,
      nameEn: players.nameEn,
      nameJaVerified: players.nameJaVerified,
      atpRank: players.currentAtpRank,
      category: players.category,
      university: players.university,
      lastScrapedAt: players.lastScrapedAt,
    })
    .from(players)
    .where(isNotNull(players.currentAtpRank))
    .orderBy(asc(players.currentAtpRank));

  // Fetch latest ATP points from rank snapshots for display
  const ids = rows.map((r) => r.slug);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 1);

  const snapRows = await db
    .select({
      playerId: playerRankSnapshots.playerId,
      rank: playerRankSnapshots.rank,
    })
    .from(playerRankSnapshots)
    .where(
      and(
        eq(playerRankSnapshots.provider, "atp"),
        gte(playerRankSnapshots.snapshotAt, sixMonthsAgo),
      ),
    )
    .orderBy(asc(playerRankSnapshots.snapshotAt));

  // Get player IDs to match snapshots
  const playerIdMap = new Map<string, number>();
  const playerRows = await db
    .select({ id: players.id, slug: players.slug })
    .from(players)
    .where(isNotNull(players.currentAtpRank));
  for (const p of playerRows) playerIdMap.set(p.slug, p.id);

  // Latest snap per player
  const latestSnap = new Map<number, number>();
  for (const s of snapRows) latestSnap.set(s.playerId, s.rank);

  return rows
    .filter((r) => r.atpRank !== null)
    .map((r) => {
      const pid = playerIdMap.get(r.slug);
      return {
        slug: r.slug,
        nameJa: r.nameJa,
        nameEn: r.nameEn,
        nameJaVerified: r.nameJaVerified,
        atpRank: r.atpRank!,
        atpPoints: null, // Sackmann ranking CSV doesn't include points per player in snapshot
        category: r.category,
        university: r.university,
        lastScrapedAt: r.lastScrapedAt,
      };
    });
}

export async function selectRankingsUpdatedAt(): Promise<string | null> {
  const [row] = await db
    .select({ at: sql<Date>`MAX(last_scraped_at)` })
    .from(players)
    .where(isNotNull(players.currentAtpRank));
  return row?.at ? new Date(row.at).toISOString().slice(0, 10) : null;
}

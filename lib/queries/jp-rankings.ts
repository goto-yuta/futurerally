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

export async function selectJpRankings(tour: "atp" | "wta" = "atp"): Promise<RankedPlayer[]> {
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
    .where(and(isNotNull(players.currentAtpRank), eq(players.tour, tour)))
    .orderBy(asc(players.currentAtpRank));

  return rows
    .filter((r) => r.atpRank !== null)
    .map((r) => ({
      slug: r.slug,
      nameJa: r.nameJa,
      nameEn: r.nameEn,
      nameJaVerified: r.nameJaVerified,
      atpRank: r.atpRank!,
      atpPoints: null,
      category: r.category,
      university: r.university,
      lastScrapedAt: r.lastScrapedAt,
    }));
}

export async function selectRankingsUpdatedAt(tour: "atp" | "wta" = "atp"): Promise<string | null> {
  const [row] = await db
    .select({ at: sql<Date>`MAX(last_scraped_at)` })
    .from(players)
    .where(and(isNotNull(players.currentAtpRank), eq(players.tour, tour)));
  return row?.at ? new Date(row.at).toISOString().slice(0, 10) : null;
}

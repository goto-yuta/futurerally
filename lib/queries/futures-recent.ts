import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, tournaments, tournamentEntries } from "@/lib/db/schema";

export type FuturesEntryRow = {
  playerSlug: string;
  playerNameJa: string;
  playerNameEn: string;
  status: "alive" | "scheduled" | "won" | "lost" | "champion";
  currentRound: string | null;
  lastMatchSummary: string | null;
};

export type FuturesTournamentBlock = {
  tournamentSlug: string;
  tournamentNameJa: string;
  level: string;
  startDate: string;
  endDate: string;
  entries: FuturesEntryRow[];
};

export type FuturesRecentData = {
  blocks: FuturesTournamentBlock[];
  dataAsOf: string | null;
};

export async function selectFuturesRecent(weeksBack = 3): Promise<FuturesRecentData> {
  const since = new Date();
  since.setDate(since.getDate() - weeksBack * 7);

  const rows = await db
    .select({
      tournamentSlug: tournaments.slug,
      tournamentNameJa: tournaments.nameJa,
      level: tournaments.level,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      playerSlug: players.slug,
      playerNameJa: players.nameJa,
      playerNameEn: players.nameEn,
      status: tournamentEntries.status,
      currentRound: tournamentEntries.currentRound,
      lastMatchSummary: tournamentEntries.lastMatchSummary,
      lastUpdatedAt: tournamentEntries.lastUpdatedAt,
    })
    .from(tournamentEntries)
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .where(
      and(
        inArray(tournaments.level, ["futures_25", "futures_15"]),
        gte(tournaments.startDate, since),
      ),
    )
    .orderBy(desc(tournaments.startDate), tournamentEntries.status);

  // Group by tournament
  const blockMap = new Map<string, FuturesTournamentBlock>();
  let maxUpdatedAt: Date | null = null;

  for (const r of rows) {
    if (!blockMap.has(r.tournamentSlug)) {
      const fmt = (d: Date) => d.toISOString().slice(5, 10).replace("-", "/");
      blockMap.set(r.tournamentSlug, {
        tournamentSlug: r.tournamentSlug,
        tournamentNameJa: r.tournamentNameJa,
        level: r.level,
        startDate: fmt(r.startDate),
        endDate: fmt(r.endDate),
        entries: [],
      });
    }
    blockMap.get(r.tournamentSlug)!.entries.push({
      playerSlug: r.playerSlug,
      playerNameJa: r.playerNameJa,
      playerNameEn: r.playerNameEn,
      status: r.status as FuturesEntryRow["status"],
      currentRound: r.currentRound,
      lastMatchSummary: r.lastMatchSummary,
    });
    if (r.lastUpdatedAt && (!maxUpdatedAt || r.lastUpdatedAt > maxUpdatedAt)) {
      maxUpdatedAt = r.lastUpdatedAt;
    }
  }

  // Sort by start date (newest first), remove empty
  const blocks = [...blockMap.values()].sort(
    (a, b) => b.startDate.localeCompare(a.startDate),
  );

  return {
    blocks,
    dataAsOf: maxUpdatedAt ? maxUpdatedAt.toISOString().slice(0, 10) : null,
  };
}

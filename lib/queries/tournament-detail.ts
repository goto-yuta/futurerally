import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tournaments, tournamentEntries, players } from "@/lib/db/schema";
import type { TournamentLevel } from "@/app/_components/tournament/TournamentBadge";
import type { TournamentEntryRow } from "@/app/_components/tournament/TournamentEntriesTable";

export type TournamentDetail = {
  slug: string;
  nameJa: string;
  nameEn: string;
  level: TournamentLevel;
  location: string | null;
  surface: string | null;
  startDate: string;
  endDate: string;
  externalUrl: string | null;
  status: "active" | "upcoming" | "past";
  entries: TournamentEntryRow[];
};

const STATUS_ORDER: Record<TournamentEntryRow["status"], number> = {
  alive: 0, scheduled: 1, champion: 2, won: 3, lost: 4,
};

export async function selectTournamentDetail(slug: string): Promise<TournamentDetail | null> {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
  if (!t) return null;

  const rows = await db
    .select({
      playerSlug: players.slug,
      playerName: players.nameJa,
      status: tournamentEntries.status,
      currentRound: tournamentEntries.currentRound,
      lastMatchSummary: tournamentEntries.lastMatchSummary,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .where(eq(tournamentEntries.tournamentId, t.id));

  const entries: TournamentEntryRow[] = rows
    .map((r) => ({
      playerSlug: r.playerSlug,
      playerName: r.playerName,
      status: r.status as TournamentEntryRow["status"],
      currentRound: r.currentRound,
      lastMatchSummary: r.lastMatchSummary,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const now = new Date();
  const status: TournamentDetail["status"] =
    t.endDate < now ? "past"
    : t.startDate > now ? "upcoming"
    : "active";
  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace("-", "/");

  return {
    slug: t.slug,
    nameJa: t.nameJa,
    nameEn: t.nameEn,
    level: t.level as TournamentLevel,
    location: t.location,
    surface: t.surface,
    startDate: fmt(t.startDate),
    endDate: fmt(t.endDate),
    externalUrl: t.externalUrl,
    status,
    entries,
  };
}

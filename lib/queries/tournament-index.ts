import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tournaments, tournamentEntries } from "@/lib/db/schema";
import type { TournamentSummary } from "@/app/_components/tournament/TournamentListCard";

export async function selectTournamentIndex(): Promise<{
  active: TournamentSummary[];
  upcoming: TournamentSummary[];
  past: TournamentSummary[];
}> {
  const now = new Date();
  const rows = await db
    .select({
      slug: tournaments.slug,
      nameJa: tournaments.nameJa,
      level: tournaments.level,
      location: tournaments.location,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      entryCount: sql<number>`count(${tournamentEntries.id})::int`,
    })
    .from(tournaments)
    .leftJoin(tournamentEntries, eq(tournamentEntries.tournamentId, tournaments.id))
    .groupBy(tournaments.id)
    .orderBy(desc(tournaments.startDate));

  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace("-", "/");

  const summaries: TournamentSummary[] = rows.map((t) => {
    const status: TournamentSummary["status"] =
      t.endDate < now ? "past"
      : t.startDate > now ? "upcoming"
      : "active";
    return {
      slug: t.slug,
      nameJa: t.nameJa,
      level: t.level as TournamentSummary["level"],
      location: t.location,
      startDate: fmt(t.startDate),
      endDate: fmt(t.endDate),
      status,
      japaneseEntryCount: t.entryCount,
    };
  });

  return {
    active: summaries.filter((s) => s.status === "active"),
    upcoming: summaries.filter((s) => s.status === "upcoming"),
    past: summaries.filter((s) => s.status === "past"),
  };
}

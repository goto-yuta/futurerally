import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  players, proEndorsements, tournaments, tournamentEntries,
  articles, articlePlayers,
} from "@/lib/db/schema";
import type { Scorecard } from "@/app/_components/player/ScorecardPanel";
import { selectRankHistory } from "./player-rank-history";
import { selectRecentWL } from "./player-recent-wl";

export type PlayerProfileData = {
  player: {
    slug: string;
    nameJa: string;
    nameEn: string;
    university: string | null;
    hand: string | null;
    age: number | null;
    heightCm: number | null;
    birthplace: string | null;
    photoUrl: string | null;
    currentJtaRank: number | null;
    currentAtpRank: number | null;
    scorecard: Scorecard;
  };
  endorsements: Array<{ proName: string; quote: string | null }>;
  currentTournament: {
    tournamentName: string;
    currentRound: string;
    nextMatchAt: string | null;
    nextOpponent: string | null;
  } | null;
  schedule: Array<{
    tournamentSlug: string;
    tournamentName: string;
    status: "alive" | "scheduled" | "won" | "lost" | "champion";
    startDate: string;
    endDate: string;
  }>;
  relatedArticles: Array<{ slug: string; title: string; publishedAt: string }>;
  sparkline: number[];
  recentWL: { wins: number; losses: number };
};

const EMPTY_SCORECARD: Scorecard = {
  sns: {}, personal: {}, currentSponsors: [], asks: [],
};

export async function selectPlayerProfile(slug: string): Promise<PlayerProfileData | null> {
  const [p] = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
  if (!p) return null;

  const endorsementRows = await db
    .select({ proName: proEndorsements.proName, quote: proEndorsements.quote })
    .from(proEndorsements)
    .where(eq(proEndorsements.playerId, p.id))
    .orderBy(proEndorsements.displayOrder);

  const scheduleRows = await db
    .select({
      slug: tournaments.slug,
      nameJa: tournaments.nameJa,
      startDate: tournaments.startDate,
      endDate: tournaments.endDate,
      status: tournamentEntries.status,
      currentRound: tournamentEntries.currentRound,
      nextMatchAt: tournamentEntries.nextMatchAt,
      nextOpponent: tournamentEntries.nextOpponent,
    })
    .from(tournamentEntries)
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(eq(tournamentEntries.playerId, p.id))
    .orderBy(desc(tournaments.startDate));

  const articleRows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      publishedAt: articles.publishedAt,
    })
    .from(articlePlayers)
    .innerJoin(articles, eq(articlePlayers.articleId, articles.id))
    .where(eq(articlePlayers.playerId, p.id))
    .orderBy(desc(articles.publishedAt))
    .limit(5);

  const alive = scheduleRows.find((s) => s.status === "alive");
  const currentTournament = alive ? {
    tournamentName: alive.nameJa,
    currentRound: alive.currentRound ?? "",
    nextMatchAt: alive.nextMatchAt ? alive.nextMatchAt.toISOString().slice(11, 16) : null,
    nextOpponent: alive.nextOpponent ?? null,
  } : null;

  const age = p.birthYear ? new Date().getFullYear() - p.birthYear : null;
  const fmt = (d: Date) => d.toISOString().slice(5, 10).replace("-", "/");

  const sparkline = await selectRankHistory(p.id);
  const recentWL = await selectRecentWL(p.id);

  return {
    player: {
      slug: p.slug,
      nameJa: p.nameJa,
      nameEn: p.nameEn,
      university: p.university,
      hand: p.hand,
      age,
      heightCm: p.heightCm,
      birthplace: null,
      photoUrl: p.photoUrl,
      currentJtaRank: p.currentJtaRank,
      currentAtpRank: p.currentAtpRank,
      scorecard: (p.scorecard as Scorecard) ?? EMPTY_SCORECARD,
    },
    endorsements: endorsementRows,
    currentTournament,
    schedule: scheduleRows.map((s) => ({
      tournamentSlug: s.slug,
      tournamentName: s.nameJa,
      status: s.status,
      startDate: fmt(s.startDate),
      endDate: fmt(s.endDate),
    })),
    relatedArticles: articleRows.map((a) => ({
      slug: a.slug,
      title: a.title,
      publishedAt: a.publishedAt.toISOString().slice(0, 10),
    })),
    sparkline,
    recentWL,
  };
}

selectPlayerProfile.shapeKeys = [
  "player", "endorsements", "currentTournament", "schedule",
  "relatedArticles", "sparkline", "recentWL",
] as const;

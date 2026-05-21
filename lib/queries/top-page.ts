import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  players, articles, proEndorsements,
  tournaments, tournamentEntries,
} from "@/lib/db/schema";

export type TopPageData = {
  heroStory: {
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: string;
  } | null;
  aliveEntries: Array<{
    playerSlug: string;
    playerName: string;
    tournamentSlug: string;
    tournamentName: string;
    tournamentLevel: string;
    currentRound: string;
    note?: string;
  }>;
  recentResults: Array<{
    playerSlug: string;
    playerName: string;
    tournamentSlug: string;
    tournamentName: string;
    result: "won" | "lost";
    summary: string;
  }>;
  featuredPlayers: Array<{
    slug: string;
    nameJa: string;
    meta: string;
    endorsedBy: string;
    stats: string;
  }>;
  latestArticles: Array<{
    slug: string;
    title: string;
    category: string;
    publishedAt: string;
    readMinutes: number;
  }>;
  playerCounts: {
    total: number;
    pro: number;
    college: number;
    futures: number;
  };
};

async function getHero(): Promise<TopPageData["heroStory"]> {
  const rows = await db
    .select({
      slug: articles.slug, title: articles.title, excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    slug: r.slug, title: r.title, excerpt: r.excerpt,
    publishedAt: r.publishedAt.toISOString().slice(0, 10),
  };
}

async function getAlive(): Promise<TopPageData["aliveEntries"]> {
  const rows = await db
    .select({
      playerSlug: players.slug,
      playerName: players.nameJa,
      tournamentSlug: tournaments.slug,
      tournamentName: tournaments.nameJa,
      tournamentLevel: tournaments.level,
      currentRound: tournamentEntries.currentRound,
      nextMatchAt: tournamentEntries.nextMatchAt,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(eq(tournamentEntries.status, "alive"))
    .limit(8);
  return rows.map((r) => ({
    playerSlug: r.playerSlug,
    playerName: r.playerName,
    tournamentSlug: r.tournamentSlug,
    tournamentName: r.tournamentName,
    tournamentLevel: r.tournamentLevel,
    currentRound: r.currentRound ?? "",
    note: r.nextMatchAt ? `${r.nextMatchAt.toISOString().slice(11, 16)} プレー予定` : undefined,
  }));
}

async function getRecent(): Promise<TopPageData["recentResults"]> {
  const dayAgo = new Date(Date.now() - 1000 * 60 * 60 * 36);
  const rows = await db
    .select({
      playerSlug: players.slug,
      playerName: players.nameJa,
      tournamentSlug: tournaments.slug,
      tournamentName: tournaments.nameJa,
      status: tournamentEntries.status,
      summary: tournamentEntries.lastMatchSummary,
    })
    .from(tournamentEntries)
    .innerJoin(players, eq(tournamentEntries.playerId, players.id))
    .innerJoin(tournaments, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(
      and(
        gte(tournamentEntries.lastUpdatedAt, dayAgo),
        inArray(tournamentEntries.status, ["won", "lost"]),
      ),
    )
    .orderBy(desc(tournamentEntries.lastUpdatedAt))
    .limit(6);
  return rows.map((r) => ({
    playerSlug: r.playerSlug,
    playerName: r.playerName,
    tournamentSlug: r.tournamentSlug,
    tournamentName: r.tournamentName,
    result: r.status as "won" | "lost",
    summary: r.summary ?? "",
  }));
}

async function getFeatured(): Promise<TopPageData["featuredPlayers"]> {
  const playerRows = await db
    .select({
      id: players.id,
      slug: players.slug,
      nameJa: players.nameJa,
      university: players.university,
      currentJtaRank: players.currentJtaRank,
      currentAtpRank: players.currentAtpRank,
      sns: players.sns,
    })
    .from(players)
    .where(eq(players.featured, true))
    .orderBy(players.displayOrder)
    .limit(3);

  const result: TopPageData["featuredPlayers"] = [];
  for (const p of playerRows) {
    const [endorsement] = await db
      .select({ proName: proEndorsements.proName })
      .from(proEndorsements)
      .where(eq(proEndorsements.playerId, p.id))
      .orderBy(proEndorsements.displayOrder)
      .limit(1);
    const sns = p.sns as { ig?: number } | null;
    const rankLabel = p.currentJtaRank
      ? `JTA #${p.currentJtaRank}`
      : (p.currentAtpRank ? `ATP ${p.currentAtpRank}` : "");
    result.push({
      slug: p.slug,
      nameJa: p.nameJa,
      meta: [p.university, rankLabel].filter(Boolean).join(" · "),
      endorsedBy: endorsement?.proName ?? "",
      stats: sns?.ig ? `IG ${(sns.ig / 1000).toFixed(1)}k` : "",
    });
  }
  return result;
}

async function getLatest(): Promise<TopPageData["latestArticles"]> {
  const rows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      category: articles.category,
      publishedAt: articles.publishedAt,
      body: articles.body,
    })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(3);
  return rows.map((r) => {
    const words = r.body.split(/\s+/).length;
    return {
      slug: r.slug,
      title: r.title,
      category: r.category,
      publishedAt: r.publishedAt.toISOString().slice(0, 10).replaceAll("-", "."),
      readMinutes: Math.max(1, Math.round(words / 400)),
    };
  });
}

async function getCounts(): Promise<TopPageData["playerCounts"]> {
  const rows = await db
    .select({ category: players.category, c: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.category);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.category] = r.c;
  const total = (map.pro ?? 0) + (map.college ?? 0) + (map.futures ?? 0);
  return { total, pro: map.pro ?? 0, college: map.college ?? 0, futures: map.futures ?? 0 };
}

export async function selectTopPageData(): Promise<TopPageData> {
  const [heroStory, aliveEntries, recentResults, featuredPlayers, latestArticles, playerCounts] = await Promise.all([
    getHero(), getAlive(), getRecent(), getFeatured(), getLatest(), getCounts(),
  ]);
  return { heroStory, aliveEntries, recentResults, featuredPlayers, latestArticles, playerCounts };
}

selectTopPageData.shapeKeys = [
  "heroStory", "aliveEntries", "recentResults", "featuredPlayers", "latestArticles", "playerCounts",
] as const;

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articles, articlePlayers, players, proEndorsements } from "@/lib/db/schema";
import type { TaggedPlayerSummary } from "@/app/_components/article/TaggedPlayersSidebar";

export type ArticleDetail = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  authors: string;
  publishedAt: string;
  readMinutes: number;
  heroImageUrl: string | null;
  taggedPlayers: TaggedPlayerSummary[];
};

export async function selectArticleDetail(slug: string): Promise<ArticleDetail | null> {
  const [a] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!a) return null;

  const playerRows = await db
    .select({
      slug: players.slug, nameJa: players.nameJa, university: players.university,
      currentJtaRank: players.currentJtaRank, currentAtpRank: players.currentAtpRank,
      playerId: players.id,
    })
    .from(articlePlayers)
    .innerJoin(players, eq(articlePlayers.playerId, players.id))
    .where(eq(articlePlayers.articleId, a.id));

  const taggedPlayers: TaggedPlayerSummary[] = [];
  for (const p of playerRows) {
    const [end] = await db
      .select({ proName: proEndorsements.proName })
      .from(proEndorsements)
      .where(eq(proEndorsements.playerId, p.playerId))
      .limit(1);
    const rankLabel = p.currentJtaRank
      ? `JTA #${p.currentJtaRank}`
      : (p.currentAtpRank ? `ATP ${p.currentAtpRank}` : "");
    taggedPlayers.push({
      slug: p.slug,
      nameJa: p.nameJa,
      meta: [p.university, rankLabel].filter(Boolean).join(" · "),
      endorsedBy: end?.proName ?? null,
    });
  }

  const words = a.body.split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(words / 400));

  return {
    slug: a.slug, title: a.title, excerpt: a.excerpt ?? "", body: a.body,
    category: a.category, authors: a.authors ?? "編集部",
    publishedAt: a.publishedAt.toISOString().slice(0, 10),
    readMinutes,
    heroImageUrl: a.heroImageUrl,
    taggedPlayers,
  };
}

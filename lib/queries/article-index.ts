import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articles } from "@/lib/db/schema";
import type { ArticleListItem } from "@/app/_components/article/ArticleListCard";

export type ArticleIndexData = {
  articles: ArticleListItem[];
  counts: { total: number; interview: number; profile: number; tournament: number; column: number };
};

export async function selectArticleIndex(
  filter?: "interview" | "profile" | "tournament" | "column",
): Promise<ArticleIndexData> {
  const rows = filter
    ? await db.select().from(articles).where(eq(articles.category, filter)).orderBy(desc(articles.publishedAt))
    : await db.select().from(articles).orderBy(desc(articles.publishedAt));

  const list: ArticleListItem[] = rows.map((a) => {
    const words = a.body.split(/\s+/).length;
    return {
      slug: a.slug, title: a.title, excerpt: a.excerpt ?? "",
      category: a.category, authors: a.authors ?? "編集部",
      publishedAt: a.publishedAt.toISOString().slice(0, 10),
      readMinutes: Math.max(1, Math.round(words / 400)),
    };
  });

  const countRows = await db
    .select({ category: articles.category, c: sql<number>`count(*)::int` })
    .from(articles)
    .groupBy(articles.category);
  const m: Record<string, number> = {};
  for (const r of countRows) m[r.category] = r.c;
  const total = Object.values(m).reduce((s, v) => s + v, 0);

  return {
    articles: list,
    counts: {
      total,
      interview: m.interview ?? 0,
      profile: m.profile ?? 0,
      tournament: m.tournament ?? 0,
      column: m.column ?? 0,
    },
  };
}

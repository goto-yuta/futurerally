import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  articles, articlePlayers, articleTournaments, players, tournaments,
} from "@/lib/db/schema";
import { loadAllArticles } from "./load-articles";

export async function syncArticles(): Promise<{
  inserted: number; updated: number; skipped: string[];
}> {
  const loaded = await loadAllArticles();
  let inserted = 0;
  let updated = 0;
  const skipped: string[] = [];

  const allPlayers = await db.select({ id: players.id, slug: players.slug }).from(players);
  const playerMap = new Map(allPlayers.map((p) => [p.slug, p.id]));

  const allTournaments = await db.select({ id: tournaments.id, slug: tournaments.slug }).from(tournaments);
  const tournamentMap = new Map(allTournaments.map((t) => [t.slug, t.id]));

  for (const a of loaded) {
    const playerIds = a.taggedPlayers.map((s) => playerMap.get(s)).filter((id): id is number => id !== undefined);
    const tournamentIds = a.taggedTournaments.map((s) => tournamentMap.get(s)).filter((id): id is number => id !== undefined);

    const missingPlayers = a.taggedPlayers.filter((s) => !playerMap.has(s));
    if (missingPlayers.length > 0) {
      skipped.push(`${a.slug}: missing player slugs ${missingPlayers.join(", ")}`);
    }
    const missingTournaments = a.taggedTournaments.filter((s) => !tournamentMap.has(s));
    if (missingTournaments.length > 0) {
      skipped.push(`${a.slug}: missing tournament slugs ${missingTournaments.join(", ")}`);
    }

    const [existing] = await db.select().from(articles).where(eq(articles.slug, a.slug)).limit(1);

    const payload = {
      slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body,
      category: a.category, heroImageUrl: a.heroImage ?? null,
      authors: a.authors, publishedAt: new Date(a.publishedAt),
      updatedAt: new Date(),
    };

    let articleId: number;
    if (existing) {
      await db.update(articles).set(payload).where(eq(articles.id, existing.id));
      articleId = existing.id;
      updated++;
    } else {
      const [row] = await db.insert(articles).values(payload).returning();
      articleId = row.id;
      inserted++;
    }

    await db.delete(articlePlayers).where(eq(articlePlayers.articleId, articleId));
    if (playerIds.length > 0) {
      await db.insert(articlePlayers).values(playerIds.map((playerId) => ({ articleId, playerId })));
    }

    await db.delete(articleTournaments).where(eq(articleTournaments.articleId, articleId));
    if (tournamentIds.length > 0) {
      await db.insert(articleTournaments).values(tournamentIds.map((tournamentId) => ({ articleId, tournamentId })));
    }
  }

  return { inserted, updated, skipped };
}

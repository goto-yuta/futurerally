import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players } from "@/lib/db/schema";

export type PlayerListItem = {
  slug: string;
  nameJa: string;
  category: "pro" | "college" | "futures";
  university: string | null;
  currentJtaRank: number | null;
  currentAtpRank: number | null;
  featured: boolean;
};

export type PlayerIndexData = {
  players: PlayerListItem[];
  counts: { total: number; pro: number; college: number; futures: number };
};

export async function selectPlayerIndex(
  filter?: "pro" | "college" | "futures",
): Promise<PlayerIndexData> {
  const rows = filter
    ? await db.select().from(players).where(eq(players.category, filter)).orderBy(players.nameJa)
    : await db.select().from(players).orderBy(players.nameJa);

  const list: PlayerListItem[] = rows.map((r) => ({
    slug: r.slug, nameJa: r.nameJa,
    category: r.category as PlayerListItem["category"],
    university: r.university,
    currentJtaRank: r.currentJtaRank,
    currentAtpRank: r.currentAtpRank,
    featured: r.featured,
  }));

  const countRows = await db
    .select({ category: players.category, c: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.category);
  const m: Record<string, number> = {};
  for (const r of countRows) m[r.category] = r.c;
  const total = (m.pro ?? 0) + (m.college ?? 0) + (m.futures ?? 0);

  return {
    players: list,
    counts: {
      total,
      pro: m.pro ?? 0,
      college: m.college ?? 0,
      futures: m.futures ?? 0,
    },
  };
}

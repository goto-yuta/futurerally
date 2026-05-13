import { eq, sql, and } from "drizzle-orm";
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
  tour: string | null;
};

export type PlayerIndexData = {
  players: PlayerListItem[];
  counts: { total: number; pro: number; college: number; futures: number; wta: number };
};

export async function selectPlayerIndex(
  filter?: "pro" | "college" | "futures" | "wta",
): Promise<PlayerIndexData> {
  let rows;
  if (filter === "wta") {
    rows = await db.select().from(players).where(eq(players.tour, "wta")).orderBy(players.currentAtpRank);
  } else if (filter) {
    rows = await db.select().from(players)
      .where(and(eq(players.category, filter), eq(players.tour, "atp")))
      .orderBy(players.nameJa);
  } else {
    rows = await db.select().from(players).orderBy(players.nameJa);
  }

  const list: PlayerListItem[] = rows.map((r) => ({
    slug: r.slug, nameJa: r.nameJa,
    category: r.category as PlayerListItem["category"],
    university: r.university,
    currentJtaRank: r.currentJtaRank,
    currentAtpRank: r.currentAtpRank,
    featured: r.featured,
    tour: r.tour ?? "atp",
  }));

  const countRows = await db
    .select({ category: players.category, tour: players.tour, c: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.category, players.tour);

  const m: Record<string, number> = {};
  let wtaCount = 0;
  for (const r of countRows) {
    if (r.tour === "wta") {
      wtaCount += r.c;
    } else {
      m[r.category] = (m[r.category] ?? 0) + r.c;
    }
  }
  const total = (m.pro ?? 0) + (m.college ?? 0) + (m.futures ?? 0) + wtaCount;

  return {
    players: list,
    counts: {
      total,
      pro: m.pro ?? 0,
      college: m.college ?? 0,
      futures: m.futures ?? 0,
      wta: wtaCount,
    },
  };
}

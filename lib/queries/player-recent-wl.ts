import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matchRecords } from "@/lib/db/schema";

export async function selectRecentWL(playerId: number): Promise<{ wins: number; losses: number }> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const rows = await db
    .select({ result: matchRecords.result, c: sql<number>`count(*)::int` })
    .from(matchRecords)
    .where(
      and(
        eq(matchRecords.playerId, playerId),
        gte(matchRecords.playedAt, sixMonthsAgo),
      ),
    )
    .groupBy(matchRecords.result);

  let wins = 0;
  let losses = 0;
  for (const r of rows) {
    if (r.result === "won") wins = r.c;
    if (r.result === "lost") losses = r.c;
  }
  return { wins, losses };
}

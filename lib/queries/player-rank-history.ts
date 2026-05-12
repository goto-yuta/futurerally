import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playerRankSnapshots } from "@/lib/db/schema";

export async function selectRankHistory(playerId: number): Promise<number[]> {
  const yearAgo = new Date();
  yearAgo.setMonth(yearAgo.getMonth() - 12);

  const rows = await db
    .select({ rank: playerRankSnapshots.rank, snapshotAt: playerRankSnapshots.snapshotAt })
    .from(playerRankSnapshots)
    .where(
      and(
        eq(playerRankSnapshots.playerId, playerId),
        eq(playerRankSnapshots.provider, "jta"),
        gte(playerRankSnapshots.snapshotAt, yearAgo),
      ),
    )
    .orderBy(playerRankSnapshots.snapshotAt);

  return rows.map((r) => r.rank);
}

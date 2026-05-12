import "@/lib/load-env";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL!;
  const sql = postgres(url);
  const players = await sql`SELECT slug, name_ja, current_atp_rank, atp_player_id FROM players ORDER BY id`;
  console.log("\n=== Players ===");
  console.table(players);
  const entries = await sql`
    SELECT t.slug AS tournament, t.name_ja AS tname, t.level, t.start_date::date AS start, te.status, te.current_round, p.name_ja AS player, te.last_match_summary
    FROM tournament_entries te
    JOIN tournaments t ON t.id = te.tournament_id
    JOIN players p ON p.id = te.player_id
    ORDER BY t.start_date DESC
    LIMIT 30
  `;
  console.log("\n=== Recent tournament entries ===");
  console.table(entries);
  const ranks = await sql`SELECT p.name_ja, prs.rank, prs.provider, prs.snapshot_at::date FROM player_rank_snapshots prs JOIN players p ON p.id = prs.player_id WHERE prs.provider = 'atp' ORDER BY prs.snapshot_at DESC LIMIT 10`;
  console.log("\n=== ATP rank snapshots ===");
  console.table(ranks);
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

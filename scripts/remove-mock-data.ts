/**
 * One-time cleanup: remove demo/mock players and related data.
 * Run: npm run mock:remove
 */

import "@/lib/load-env";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  // 1. Verify what we're deleting
  const demos = await sql`SELECT id, slug FROM players WHERE atp_player_id IS NULL`;
  console.log("Removing demo players:", demos.map((d) => d.slug));

  // CASCADE removes tournament_entries, pro_endorsements, article_players automatically
  await sql`DELETE FROM players WHERE atp_player_id IS NULL`;
  console.log("  ✓ Players deleted");

  // 2. Remove seeded fictional tournaments (only the ones with no real entries)
  const fictionalSlugs = ["yokkaichi-f1-2026", "hiroshima-f4-2026", "roanne-challenger-2026"];
  for (const slug of fictionalSlugs) {
    // Check if any real (Sackmann-derived) entries remain
    const [rem] = await sql`
      SELECT COUNT(*)::int AS c FROM tournament_entries te
      JOIN tournaments t ON t.id = te.tournament_id
      WHERE t.slug = ${slug}
    `;
    if (rem.c === 0) {
      await sql`DELETE FROM tournaments WHERE slug = ${slug}`;
      console.log(`  ✓ Deleted empty tournament: ${slug}`);
    } else {
      console.log(`  → Kept tournament ${slug} (${rem.c} entries remain)`);
    }
  }

  // 3. Set featured=true for top 3 real JPN ATP players
  const topJpn = await sql`
    SELECT id, slug, name_ja FROM players
    WHERE atp_player_id IS NOT NULL AND tour = 'atp' AND current_atp_rank IS NOT NULL
    ORDER BY current_atp_rank
    LIMIT 3
  `;
  for (const [i, p] of topJpn.entries()) {
    await sql`
      UPDATE players SET featured = true, display_order = ${i + 1} WHERE id = ${p.id}
    `;
    console.log(`  ✓ Featured: ${p.name_ja} (#${i + 1})`);
  }

  // 4. Summary
  const [total] = await sql`SELECT COUNT(*)::int c FROM players`;
  const [featured] = await sql`SELECT COUNT(*)::int c FROM players WHERE featured = true`;
  console.log(`\nDone. ${total.c} players total, ${featured.c} featured.`);

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

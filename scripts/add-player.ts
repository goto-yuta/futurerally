/**
 * Add or refresh a player by ATP player ID (Jeff Sackmann's integer ID).
 *
 *   npm run player:add 106415
 *   npm run player:add 106415 -- --category=pro --featured
 *
 * Looks the player up in Sackmann's atp_players.csv, resolves a verified
 * Japanese name via Wikidata when possible, and upserts the DB row.
 * Never invents kanji — falls back to "Surname Firstname" romaji.
 */

import "@/lib/load-env";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players } from "@/lib/db/schema";
import { resolvePlayerFromSackmann } from "@/lib/players/resolve";

type Category = "pro" | "college" | "futures";

function parseArgs(): { atpId: number; category: Category; featured: boolean } {
  const args = process.argv.slice(2);
  const atpIdStr = args.find((a) => /^\d+$/.test(a));
  if (!atpIdStr) {
    console.error("Usage: npm run player:add <atp_player_id> [-- --category=pro|college|futures] [--featured]");
    process.exit(1);
  }
  const atpId = Number(atpIdStr);

  const catArg = args.find((a) => a.startsWith("--category="));
  const category = (catArg?.split("=")[1] ?? "pro") as Category;
  if (!["pro", "college", "futures"].includes(category)) {
    console.error("invalid --category; must be pro/college/futures");
    process.exit(1);
  }

  const featured = args.includes("--featured");
  return { atpId, category, featured };
}

async function main() {
  const { atpId, category, featured } = parseArgs();
  console.log(`Resolving ATP player ${atpId}…`);
  const resolved = await resolvePlayerFromSackmann(atpId);
  if (!resolved) {
    console.error(`No Sackmann row found for ATP player_id=${atpId}`);
    process.exit(1);
  }

  console.log("Resolved:");
  console.log("  slug         :", resolved.slug);
  console.log("  name_ja      :", resolved.nameJa, resolved.nameJaVerified ? "(verified via Wikidata)" : "(romaji fallback)");
  console.log("  name_en      :", resolved.nameEn);
  console.log("  birth year   :", resolved.birthYear);
  console.log("  hand         :", resolved.hand);
  console.log("  height (cm)  :", resolved.heightCm);
  console.log("  IOC          :", resolved.ioc);
  console.log("  wikidata_id  :", resolved.wikidataId);
  console.log("  category     :", category);
  console.log("  featured     :", featured);

  const payload = {
    slug: resolved.slug,
    nameJa: resolved.nameJa,
    nameEn: resolved.nameEn,
    nameJaVerified: resolved.nameJaVerified,
    birthYear: resolved.birthYear,
    hand: resolved.hand,
    heightCm: resolved.heightCm,
    category,
    featured,
    atpPlayerId: resolved.atpPlayerId,
    wikidataId: resolved.wikidataId,
    updatedAt: new Date(),
  };

  // De-dup by atp_player_id (the stable identifier across renames) rather than slug
  const [existing] = await db
    .select()
    .from(players)
    .where(eq(players.atpPlayerId, resolved.atpPlayerId))
    .limit(1);
  if (existing) {
    await db.update(players).set(payload).where(eq(players.id, existing.id));
    console.log(`\n✓ Updated player #${existing.id} (${resolved.slug})`);
  } else {
    const [row] = await db.insert(players).values(payload).returning();
    console.log(`\n✓ Inserted player #${row.id} (${resolved.slug})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

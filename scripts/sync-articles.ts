import "dotenv/config";
import { syncArticles } from "@/lib/articles/sync-articles";

async function main() {
  const result = await syncArticles();
  console.log(`Articles sync: ${result.inserted} inserted, ${result.updated} updated`);
  if (result.skipped.length > 0) {
    console.warn("Warnings:");
    for (const w of result.skipped) console.warn(" -", w);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

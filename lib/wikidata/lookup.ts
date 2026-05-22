/**
 * Resolve a Wikidata entity's Japanese (and English) labels.
 * Returns null on any failure so callers can fall back to romaji safely —
 * never guess kanji.
 */

export type WikidataLabels = {
  ja: string | null;
  en: string | null;
};

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "UltimateForehand/1.0 (https://ultimateforehand.vercel.app)";

export async function fetchWikidataLabels(
  wikidataId: string,
): Promise<WikidataLabels | null> {
  const url =
    `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}` +
    `&props=labels&languages=ja|en&format=json&origin=*`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    entities?: Record<string, { labels?: Record<string, { value: string }> }>;
  };
  const entity = json.entities?.[wikidataId];
  if (!entity?.labels) return null;
  return {
    ja: entity.labels.ja?.value ?? null,
    en: entity.labels.en?.value ?? null,
  };
}

/**
 * Batch-fetch Wikidata labels for multiple IDs at once.
 * Splits into chunks of 50 (API limit) and returns a Map keyed by Wikidata ID.
 * IDs that fail or have no labels are omitted from the map.
 */
export async function fetchWikidataLabelsBatch(
  wikidataIds: string[],
): Promise<Map<string, WikidataLabels>> {
  const result = new Map<string, WikidataLabels>();
  if (wikidataIds.length === 0) return result;

  const CHUNK_SIZE = 50;
  for (let i = 0; i < wikidataIds.length; i += CHUNK_SIZE) {
    const chunk = wikidataIds.slice(i, i + CHUNK_SIZE);
    const ids = chunk.join("|");
    const url =
      `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(ids)}` +
      `&props=labels&languages=ja|en&format=json`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        entities?: Record<string, { labels?: Record<string, { value: string }> }>;
      };
      if (!json.entities) continue;
      for (const [qid, entity] of Object.entries(json.entities)) {
        if (!entity?.labels) continue;
        result.set(qid, {
          ja: entity.labels.ja?.value ?? null,
          en: entity.labels.en?.value ?? null,
        });
      }
    } catch {
      // Skip failed chunks — callers will fall back to romaji
    }
  }

  return result;
}

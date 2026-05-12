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

export async function fetchWikidataLabels(
  wikidataId: string,
): Promise<WikidataLabels | null> {
  const url =
    `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}` +
    `&props=labels&languages=ja|en&format=json&origin=*`;

  const res = await fetch(url, {
    headers: { "User-Agent": "FutureRally/1.0 (https://futurerally.vercel.app)" },
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

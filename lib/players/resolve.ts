/**
 * Resolve a player's display data from an ATP player ID.
 *
 * Hard rule: NEVER guess kanji. Either Wikidata provides a Japanese label
 * (then name_ja_verified=true) or we fall back to romaji "Last First"
 * (name_ja_verified=false). The site can show whatever is in name_ja safely.
 */

import { fetchSackmannPlayer, type SackmannPlayer } from "./sackmann-fetch";
import { fetchWikidataLabels } from "@/lib/wikidata/lookup";

export type ResolvedPlayer = {
  slug: string;
  nameJa: string;
  nameEn: string;
  nameJaVerified: boolean;
  birthYear: number | null;
  hand: string | null;
  heightCm: number | null;
  atpPlayerId: number;
  wikidataId: string | null;
  ioc: string | null;
  source: "wikidata" | "romaji_fallback";
};

const HAND_MAP: Record<string, string> = {
  R: "右利き",
  L: "左利き",
  U: "不明",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks (macrons etc.)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function birthYearFromDob(dob: string | null): number | null {
  if (!dob || dob.length < 4) return null;
  const y = Number(dob.slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : null;
}

export async function resolvePlayerFromSackmann(atpId: number): Promise<ResolvedPlayer | null> {
  const s = await fetchSackmannPlayer(atpId);
  if (!s) return null;
  return resolveFromSackmannRow(s);
}

export async function resolveFromSackmannRow(s: SackmannPlayer): Promise<ResolvedPlayer> {
  const romajiNameEn = `${s.nameFirst} ${s.nameLast}`.trim();
  const romajiNameJa = `${s.nameLast} ${s.nameFirst}`.trim(); // surname-first like Japanese custom

  let labels: { ja: string | null; en: string | null } | null = null;
  if (s.wikidataId) {
    try {
      labels = await fetchWikidataLabels(s.wikidataId);
    } catch {
      labels = null;
    }
  }

  const nameJa = labels?.ja ?? romajiNameJa;
  const nameEn = labels?.en ?? romajiNameEn;
  const verified = Boolean(labels?.ja);

  return {
    // Japanese convention: surname first → "last-first" slug for consistency
    // with how the rest of the project already names players.
    slug: slugify(`${s.nameLast} ${s.nameFirst}`),
    nameJa,
    nameEn,
    nameJaVerified: verified,
    birthYear: birthYearFromDob(s.dob),
    hand: s.hand ? (HAND_MAP[s.hand] ?? s.hand) : null,
    heightCm: s.heightCm,
    atpPlayerId: s.playerId,
    wikidataId: s.wikidataId,
    ioc: s.ioc,
    source: verified ? "wikidata" : "romaji_fallback",
  };
}

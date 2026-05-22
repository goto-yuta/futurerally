/**
 * Look up a player row in Jeff Sackmann's atp_players.csv.
 *
 * Loads the CSV once per process, then keeps an index in memory.
 */

const SACKMANN_PLAYERS_URL =
  "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv";

export type SackmannPlayer = {
  playerId: number;
  nameFirst: string;
  nameLast: string;
  hand: string | null;
  dob: string | null; // YYYYMMDD
  ioc: string | null;
  heightCm: number | null;
  wikidataId: string | null;
};

let cache: Map<number, SackmannPlayer> | null = null;

export async function fetchSackmannPlayer(atpId: number): Promise<SackmannPlayer | null> {
  if (!cache) {
    cache = await loadAllPlayers();
  }
  return cache.get(atpId) ?? null;
}

async function loadAllPlayers(): Promise<Map<number, SackmannPlayer>> {
  const res = await fetch(SACKMANN_PLAYERS_URL, {
    headers: { "User-Agent": "UltimateForehand/1.0" },
  });
  if (!res.ok) throw new Error(`failed to fetch Sackmann players: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n");
  const map = new Map<number, SackmannPlayer>();
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length < 8) continue;
    const playerId = Number(cols[0]);
    if (!Number.isFinite(playerId)) continue;
    map.set(playerId, {
      playerId,
      nameFirst: cols[1] || "",
      nameLast: cols[2] || "",
      hand: cols[3] || null,
      dob: cols[4] || null,
      ioc: cols[5] || null,
      heightCm: cols[6] ? Number(cols[6]) || null : null,
      wikidataId: cols[7] || null,
    });
  }
  return map;
}

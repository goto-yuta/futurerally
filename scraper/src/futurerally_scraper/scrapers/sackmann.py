"""Scraper for Jeff Sackmann's tennis_atp open data on GitHub.

Source: https://github.com/JeffSackmann/tennis_atp
License: CC-BY-NC-SA 4.0 (attribute on the site footer)

Fetches:
- atp_rankings_current.csv      → current rank per player_id
- atp_matches_{year}.csv         → main-tour matches
- atp_matches_qual_chall_{year}  → qualifying + challenger matches
- atp_matches_futures_{year}     → ITF World Tennis Tour (Futures) matches

Cached in-memory per pipeline run. Each player's PlayerStatus is derived by
joining the player_id across all sources.
"""

from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Iterable

from ..models import EntrySnapshot, PlayerStatus, TournamentInfo, TournamentLevel
from .base import Scraper


BASE_RAW = "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master"

ROUND_ORDER = [
    "Q1", "Q2", "Q3", "BR",
    "R128", "R64", "R32", "R16", "QF", "SF", "F", "RR",
]

_LEVEL_TO_ENUM: dict[tuple[str, str], TournamentLevel] = {
    # (source_file_suffix, csv_level) -> our enum
}


def _map_level(csv_file: str, csv_level: str) -> TournamentLevel:
    """Map Sackmann tourney_level + source CSV to our TournamentLevel enum."""
    if "futures" in csv_file:
        # Sackmann level field for futures historically uses '15', '25' or 'S'.
        if "25" in csv_level:
            return "futures_25"
        return "futures_15"
    if csv_level == "C":
        return "challenger"
    # G/M/A/D/F → all ATP-tier
    return "atp"


def _round_index(round_name: str | None) -> int:
    if not round_name:
        return -1
    try:
        return ROUND_ORDER.index(round_name)
    except ValueError:
        return -1


class SackmannScraper(Scraper):
    """Fetches CSVs once, then answers fetch_player_status() from memory."""

    _rankings: dict[int, int] | None = None  # player_id → rank
    _matches_by_player: dict[int, list[dict]] | None = None

    def __init__(self, client, settings, year: int | None = None):
        super().__init__(client, settings)
        self.year = year or datetime.now().year

    # ---- public API ---------------------------------------------------

    def fetch_player_status(self, player: dict) -> PlayerStatus:
        atp_id = player.get("atp_player_id")
        if not atp_id:
            return PlayerStatus(player_id=player["id"], entries=[])

        self._ensure_loaded()
        rank = (self._rankings or {}).get(int(atp_id))
        matches = (self._matches_by_player or {}).get(int(atp_id), [])

        entries = self._build_entries(int(atp_id), matches)
        return PlayerStatus(player_id=player["id"], entries=entries, atp_rank=rank)

    def fetch_rankings(self) -> dict[int, int]:
        """Public so the pipeline can refresh rank for everyone in one pass."""
        self._ensure_loaded()
        return dict(self._rankings or {})

    # ---- loading ------------------------------------------------------

    def _ensure_loaded(self) -> None:
        if self._rankings is None:
            self._rankings = self._load_rankings()
        if self._matches_by_player is None:
            self._matches_by_player = self._load_matches()

    def _load_rankings(self) -> dict[int, int]:
        url = f"{BASE_RAW}/atp_rankings_current.csv"
        rows = self._fetch_csv(url)
        # Latest date wins; CSV is sorted ascending by date.
        latest: dict[int, int] = {}
        for r in rows:
            try:
                player_id = int(r["player"])
                rank = int(r["rank"])
            except (ValueError, KeyError):
                continue
            latest[player_id] = rank
        return latest

    def _load_matches(self) -> dict[int, list[dict]]:
        sources = [
            f"atp_matches_{self.year}.csv",
            f"atp_matches_qual_chall_{self.year}.csv",
            f"atp_matches_futures_{self.year}.csv",
        ]
        by_player: dict[int, list[dict]] = defaultdict(list)
        for src in sources:
            url = f"{BASE_RAW}/{src}"
            try:
                rows = self._fetch_csv(url)
            except Exception:
                # File may not exist yet for this year; skip rather than fail.
                continue
            for r in rows:
                r["_source"] = src
                try:
                    winner = int(r["winner_id"])
                    loser = int(r["loser_id"])
                except (ValueError, KeyError):
                    continue
                by_player[winner].append(r)
                by_player[loser].append(r)
        return by_player

    def _fetch_csv(self, url: str) -> list[dict]:
        assert self.client is not None, "SackmannScraper requires httpx client"
        resp = self.client.get(url, headers={"User-Agent": self.settings.user_agent})
        resp.raise_for_status()
        reader = csv.DictReader(io.StringIO(resp.text))
        return list(reader)

    # ---- entry construction -------------------------------------------

    def _build_entries(self, atp_id: int, matches: Iterable[dict]) -> list[EntrySnapshot]:
        by_tourney: dict[str, list[dict]] = defaultdict(list)
        for m in matches:
            tid = m.get("tourney_id") or ""
            if tid:
                by_tourney[tid].append(m)

        entries: list[EntrySnapshot] = []
        for tourney_id, ms in by_tourney.items():
            entry = self._tournament_entry(atp_id, tourney_id, ms)
            if entry is not None:
                entries.append(entry)
        # Sort newest first (we don't enforce but it's nicer in DB writes).
        entries.sort(key=lambda e: e.tournament.start_date, reverse=True)
        return entries

    def _tournament_entry(
        self, atp_id: int, tourney_id: str, ms: list[dict],
    ) -> EntrySnapshot | None:
        # Use the most-recent (by round) match this player participated in.
        ms.sort(key=lambda m: _round_index(m.get("round")))
        last = ms[-1]

        try:
            start = datetime.strptime(last["tourney_date"], "%Y%m%d")
        except (KeyError, ValueError):
            return None
        # Sackmann doesn't ship end_date; tournaments are typically 7 days.
        end = start + timedelta(days=7)

        tournament_name = last.get("tourney_name") or tourney_id
        surface = last.get("surface") or None
        level = _map_level(last.get("_source", ""), last.get("tourney_level") or "")

        try:
            winner_id = int(last["winner_id"])
        except (KeyError, ValueError):
            return None

        round_name = last.get("round")
        if winner_id == atp_id:
            status = "champion" if round_name == "F" else "won"
            current_round = round_name or None
            summary = f"{round_name} 勝 ({last.get('score', '')})".strip()
        else:
            status = "lost"
            current_round = round_name or None
            summary = f"{round_name} 敗 ({last.get('score', '')})".strip()

        slug = f"sackmann-{tourney_id}"
        info = TournamentInfo(
            slug=slug,
            name_ja=tournament_name,
            name_en=tournament_name,
            level=level,
            start_date=start,
            end_date=end,
            location=surface,  # actual location not in Sackmann; surface is a hint
        )
        return EntrySnapshot(
            tournament=info,
            status=status,
            current_round=current_round,
            last_match_summary=summary,
        )

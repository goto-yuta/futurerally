"""Scraper for ITF World Tennis Tour player pages.

NOTE: ITF's site is JS-heavy and its DOM changes. Selectors in `_parse_tournament_node`
are placeholders — replace with actual selectors after capturing a real player page
HTML fixture into tests/cassettes/itf_player_page.html and running the test.
"""

from __future__ import annotations

from datetime import datetime
from urllib.parse import urljoin

from selectolax.parser import HTMLParser

from ..models import EntrySnapshot, PlayerStatus, TournamentInfo, TournamentLevel
from .base import Scraper


ITF_BASE = "https://www.itftennis.com"


class ITFScraper(Scraper):
    def fetch_player_status(self, player: dict) -> PlayerStatus:
        slug = player.get("itf_slug")
        itf_id = player.get("itf_id")
        if not slug or not itf_id:
            raise ValueError(f"player {player['slug']} missing itf_slug or itf_id")
        if self.client is None:
            raise RuntimeError("ITFScraper.fetch_player_status called without httpx client")

        url = urljoin(ITF_BASE, f"/en/players/{slug}/{itf_id}/")
        resp = self.client.get(url, headers={"User-Agent": self.settings.user_agent})
        resp.raise_for_status()
        return self.parse_player_html(resp.text, player_id=player["id"])

    def parse_player_html(self, html: str, *, player_id: int) -> PlayerStatus:
        tree = HTMLParser(html)
        entries: list[EntrySnapshot] = []
        # ADJUST: replace this selector with the actual one for tournament cards
        # on a real ITF player page once a fixture is captured.
        nodes = tree.css("div[data-tournament-card]")
        for node in nodes:
            entry = self._parse_tournament_node(node)
            if entry is not None:
                entries.append(entry)
        return PlayerStatus(player_id=player_id, entries=entries)

    def _parse_tournament_node(self, node) -> EntrySnapshot | None:
        name_en = self._text(node, "[data-tournament-name]")
        slug = (self._text(node, "[data-tournament-slug]") or "").lower()
        level_raw = (self._text(node, "[data-tournament-level]") or "").lower()
        start = self._text(node, "[data-tournament-start]")
        end = self._text(node, "[data-tournament-end]")
        location = self._text(node, "[data-tournament-location]")
        status_raw = (self._text(node, "[data-entry-status]") or "scheduled").lower()
        round_text = self._text(node, "[data-entry-round]")
        last_match = self._text(node, "[data-entry-last-match]")

        if not name_en or not slug or not start or not end:
            return None

        tournament = TournamentInfo(
            slug=slug,
            name_ja=name_en,
            name_en=name_en,
            level=self._normalise_level(level_raw),
            start_date=self._parse_date(start),
            end_date=self._parse_date(end),
            location=location,
        )
        return EntrySnapshot(
            tournament=tournament,
            status=self._normalise_status(status_raw),
            current_round=round_text,
            last_match_summary=last_match,
        )

    @staticmethod
    def _text(node, selector: str) -> str | None:
        el = node.css_first(selector)
        return el.text(strip=True) if el else None

    @staticmethod
    def _parse_date(s: str) -> datetime:
        return datetime.strptime(s, "%Y-%m-%d")

    @staticmethod
    def _normalise_level(raw: str) -> TournamentLevel:
        m = {
            "atp": "atp", "challenger": "challenger",
            "m25": "futures_25", "futures_25": "futures_25", "25k": "futures_25",
            "m15": "futures_15", "futures_15": "futures_15", "15k": "futures_15",
        }
        return m.get(raw, "futures_15")  # type: ignore[return-value]

    @staticmethod
    def _normalise_status(raw: str) -> str:
        m = {
            "alive": "alive", "scheduled": "scheduled", "won": "won", "lost": "lost",
            "winner": "champion", "champion": "champion",
            "qf": "alive", "sf": "alive", "r32": "alive", "r16": "alive", "r64": "alive",
        }
        return m.get(raw, "scheduled")

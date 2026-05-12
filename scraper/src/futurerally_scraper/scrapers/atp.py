"""Scraper for ATP rankings (singles)."""

from __future__ import annotations

import re

from selectolax.parser import HTMLParser

from ..models import PlayerStatus
from .base import Scraper


ATP_RANKINGS_URL = "https://www.atptour.com/en/rankings/singles"


class ATPScraper(Scraper):
    _cached_rankings: dict[str, int] | None = None

    def fetch_player_status(self, player: dict) -> PlayerStatus:
        rankings = self._cached_rankings or self.fetch_rankings()
        rank = rankings.get(player.get("name_en") or "")
        return PlayerStatus(player_id=player["id"], atp_rank=rank)

    def fetch_rankings(self) -> dict[str, int]:
        if self.client is None:
            raise RuntimeError("ATPScraper.fetch_rankings called without httpx client")
        resp = self.client.get(
            ATP_RANKINGS_URL,
            headers={"User-Agent": self.settings.user_agent},
        )
        resp.raise_for_status()
        result = self.parse_rankings_html(resp.text)
        self._cached_rankings = result
        return result

    def parse_rankings_html(self, html: str) -> dict[str, int]:
        tree = HTMLParser(html)
        out: dict[str, int] = {}
        # ADJUST: ATP renders rankings in a table; the selector below is illustrative.
        rows = tree.css("table.mega-table tbody tr")
        for row in rows:
            rank_text = self._cell_text(row, "td.rank")
            name_text = self._cell_text(row, "td.player a")
            if not rank_text or not name_text:
                continue
            m = re.search(r"(\d+)", rank_text)
            if not m:
                continue
            out[name_text] = int(m.group(1))
        return out

    @staticmethod
    def _cell_text(row, selector: str) -> str | None:
        el = row.css_first(selector)
        return el.text(strip=True) if el else None

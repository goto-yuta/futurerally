"""Abstract base class for all scrapers."""

from __future__ import annotations

from abc import ABC, abstractmethod

import httpx

from ..config import Settings
from ..models import PlayerStatus


class Scraper(ABC):
    def __init__(self, client: httpx.Client | None, settings: Settings):
        self.client = client
        self.settings = settings

    @abstractmethod
    def fetch_player_status(self, player: dict) -> PlayerStatus:
        """Return current status for a player. `player` is a row dict from the DB."""
        raise NotImplementedError

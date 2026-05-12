"""Structured outputs from scrapers."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


EntryStatus = Literal["scheduled", "alive", "won", "lost", "champion"]
TournamentLevel = Literal["atp", "challenger", "futures_25", "futures_15", "jta", "college"]


class TournamentInfo(BaseModel):
    slug: str
    name_ja: str
    name_en: str
    level: TournamentLevel
    start_date: datetime
    end_date: datetime
    location: str | None = None
    external_url: str | None = None


class EntrySnapshot(BaseModel):
    tournament: TournamentInfo
    status: EntryStatus
    current_round: str | None
    last_match_summary: str | None
    next_match_at: datetime | None = None
    next_opponent: str | None = None


class PlayerStatus(BaseModel):
    player_id: int
    entries: list[EntrySnapshot] = []
    jta_rank: int | None = None
    atp_rank: int | None = None

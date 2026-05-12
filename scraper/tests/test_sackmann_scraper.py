"""Tests for SackmannScraper.

Uses a synthetic in-memory CSV pair so the test never reaches the network.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from futurerally_scraper.scrapers.sackmann import SackmannScraper


RANKINGS_CSV = (
    "ranking_date,rank,player,points\n"
    "20260504,175,106415,351\n"
    "20260504,335,106121,151\n"
)

CHALL_CSV = (
    "tourney_id,tourney_name,surface,draw_size,tourney_level,tourney_date,match_num,"
    "winner_id,winner_seed,winner_entry,winner_name,winner_hand,winner_ht,winner_ioc,winner_age,"
    "loser_id,loser_seed,loser_entry,loser_name,loser_hand,loser_ht,loser_ioc,loser_age,"
    "score,best_of,round,minutes,"
    "w_ace,w_df,w_svpt,w_1stIn,w_1stWon,w_2ndWon,w_SvGms,w_bpSaved,w_bpFaced,"
    "l_ace,l_df,l_svpt,l_1stIn,l_1stWon,l_2ndWon,l_SvGms,l_bpSaved,l_bpFaced,"
    "winner_rank,winner_rank_points,loser_rank,loser_rank_points\n"
    # Daniel wins R32 of Brisbane Challenger over a fictional opponent
    "2026-2967,Brisbane CH,Hard,32,C,20260202,357,106121,,,Taro Daniel,R,191,JPN,33,"
    "999999,,,Opponent,R,180,XYZ,25,6-3 7-5,3,R32,90,"
    ",,,,,,,,,,,,,,,,,,400,118,469,93\n"
    # Daniel loses R16 of same tournament
    "2026-2967,Brisbane CH,Hard,32,C,20260202,372,210536,6,,Rei Sakamoto,R,193,JPN,19,"
    "106121,,,Taro Daniel,R,191,JPN,33,7-6(5) 6-2,3,R16,100,"
    ",,,,,,,,,,,,,,,,,,184,332,400,118\n"
)


class _StubResponse:
    def __init__(self, text: str):
        self.text = text

    def raise_for_status(self) -> None:
        return None


class _StubClient:
    def __init__(self, mapping: dict[str, str]):
        self.mapping = mapping
        self.calls: list[str] = []

    def get(self, url: str, *, headers=None):  # noqa: ARG002
        self.calls.append(url)
        for substr, body in self.mapping.items():
            if substr in url:
                return _StubResponse(body)
        # Empty CSV (file doesn't exist this year) → just headers
        return _StubResponse("")


@pytest.fixture
def scraper(settings):
    client = _StubClient({
        "atp_rankings_current.csv": RANKINGS_CSV,
        "atp_matches_qual_chall_2026.csv": CHALL_CSV,
    })
    return SackmannScraper(client=client, settings=settings, year=2026)


def test_fetches_rank_and_entries_for_known_player(scraper):
    status = scraper.fetch_player_status({"id": 1, "atp_player_id": 106121})
    assert status.atp_rank == 335
    assert len(status.entries) == 1
    entry = status.entries[0]
    assert entry.tournament.name_en == "Brisbane CH"
    assert entry.tournament.level == "challenger"
    # Last (highest) round Daniel played was R16, which he lost
    assert entry.status == "lost"
    assert entry.current_round == "R16"


def test_player_without_atp_id_returns_empty_status(scraper):
    status = scraper.fetch_player_status({"id": 2, "atp_player_id": None})
    assert status.entries == []
    assert status.atp_rank is None


def test_parse_tourney_date(scraper):
    status = scraper.fetch_player_status({"id": 1, "atp_player_id": 106121})
    assert isinstance(status.entries[0].tournament.start_date, datetime)
    assert status.entries[0].tournament.start_date.year == 2026

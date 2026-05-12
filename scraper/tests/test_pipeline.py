from datetime import datetime, timezone
from unittest.mock import MagicMock

from futurerally_scraper.models import EntrySnapshot, PlayerStatus, TournamentInfo
from futurerally_scraper.pipeline import process_player


def _entry():
    return EntrySnapshot(
        tournament=TournamentInfo(
            slug="t1", name_ja="Tour 1", name_en="Tour 1",
            level="futures_25",
            start_date=datetime(2026, 5, 10, tzinfo=timezone.utc),
            end_date=datetime(2026, 5, 16, tzinfo=timezone.utc),
        ),
        status="alive", current_round="R16", last_match_summary="1R突破",
    )


def test_process_player_writes_tournament_entry_and_marks_scraped():
    scraper = MagicMock()
    scraper.fetch_player_status.return_value = PlayerStatus(player_id=1, entries=[_entry()])
    conn = MagicMock()

    upsert_t = MagicMock(return_value=99)
    upsert_e = MagicMock()
    mark = MagicMock()

    process_player(
        player={"id": 1, "name_ja": "テスト", "name_en": "Test", "category": "futures"},
        scraper=scraper, conn=conn,
        upsert_tournament_fn=upsert_t,
        upsert_entry_fn=upsert_e,
        mark_scraped_fn=mark,
    )

    upsert_t.assert_called_once()
    upsert_e.assert_called_once()
    mark.assert_called_once_with(conn, player_id=1)
    _, kwargs = upsert_e.call_args
    assert kwargs["player_id"] == 1
    assert kwargs["tournament_id"] == 99
    assert kwargs["status"] == "alive"


def test_process_player_no_entries_still_marks_scraped():
    scraper = MagicMock()
    scraper.fetch_player_status.return_value = PlayerStatus(player_id=2, entries=[])
    conn = MagicMock()
    mark = MagicMock()

    process_player(
        player={"id": 2, "name_ja": "Y", "name_en": "Y", "category": "futures"},
        scraper=scraper, conn=conn,
        upsert_tournament_fn=MagicMock(), upsert_entry_fn=MagicMock(),
        mark_scraped_fn=mark,
    )
    mark.assert_called_once_with(conn, player_id=2)

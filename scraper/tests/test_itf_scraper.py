from datetime import datetime
from pathlib import Path

from futurerally_scraper.scrapers.itf import ITFScraper


FIXTURE = Path(__file__).parent / "cassettes" / "itf_player_page.html"


def test_parses_player_page_into_player_status(settings):
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ITFScraper(client=None, settings=settings)
    status = scraper.parse_player_html(html, player_id=42)
    assert status.player_id == 42
    assert len(status.entries) == 2
    first = status.entries[0]
    assert first.tournament.level == "futures_25"
    assert first.status in {"alive", "lost"}


def test_parses_iso_dates(settings):
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ITFScraper(client=None, settings=settings)
    status = scraper.parse_player_html(html, player_id=42)
    entry = status.entries[0]
    assert isinstance(entry.tournament.start_date, datetime)
    assert entry.tournament.start_date.year == 2026

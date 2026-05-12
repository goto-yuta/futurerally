from pathlib import Path

from futurerally_scraper.scrapers.atp import ATPScraper


FIXTURE = Path(__file__).parent / "cassettes" / "atp_rankings_page.html"


def test_parses_rankings_into_dict(settings):
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ATPScraper(client=None, settings=settings)
    rankings = scraper.parse_rankings_html(html)
    assert isinstance(rankings, dict)
    assert len(rankings) >= 2
    for name, rank in rankings.items():
        assert isinstance(name, str)
        assert isinstance(rank, int)
        assert 1 <= rank <= 5000

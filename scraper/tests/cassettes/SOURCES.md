# Cassettes

These are saved upstream responses used by tests.

- `itf_player_page.html` — **synthetic placeholder**. Replace with a real captured ITF
  player page (e.g. https://www.itftennis.com/en/players/<slug>/<id>/) saved via
  "Save Page As → Webpage, complete" once a real player is on file. Then update the
  selectors in `src/futurerally_scraper/scrapers/itf.py` to match the captured DOM.

- `atp_rankings_page.html` — **synthetic placeholder**. Replace with
  https://www.atptour.com/en/rankings/singles once needed.

Each replacement should be accompanied by an update to selectors in the corresponding
scraper module and a passing test run.

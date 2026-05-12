# FutureRally Scraper

Python pipeline that pulls tournament status + rankings for tracked Japanese
players and upserts into Postgres (Supabase in production).

## Prerequisites

- Python 3.12 (`pyenv install 3.12.0` or `brew install python@3.12`)
- [uv](https://github.com/astral-sh/uv) (`brew install uv` or `pip install uv`)

## Setup

```bash
cd scraper
uv venv --python 3.12
source .venv/bin/activate
uv pip install -e ".[dev]"
```

Create `scraper/.env`:

```
DATABASE_URL=postgresql://...
SENTRY_DSN=...
```

## Run once locally

```bash
source .venv/bin/activate
python -m futurerally_scraper
```

## Test

```bash
source .venv/bin/activate
pytest
```

## Schedule

`.github/workflows/scraper-cron.yml` runs the pipeline twice daily (06:00 and
21:00 JST).

## Adjusting selectors

The scrapers in `src/futurerally_scraper/scrapers/itf.py` and `atp.py` contain
`# ADJUST` markers and synthetic fixtures in `tests/cassettes/*.html`. To go
live:

1. Visit the real upstream page (e.g.
   `https://www.itftennis.com/en/players/<slug>/<id>/`) and save its rendered
   HTML into `tests/cassettes/itf_player_page.html`.
2. Inspect the DOM and update the CSS selectors in the scraper.
3. Re-run `pytest`; iterate until the fixture parses correctly.
4. Trigger the workflow manually in the Actions tab.

## Runbook

### A daily run failed (Sentry alert)

1. Open Sentry → find the exception traceback.
2. Per-player failures (`player_failed` log line) leave the rest of the batch
   intact. The next scheduled run will retry.
3. If `pipeline_start` is not followed by `pipeline_end`, the orchestrator
   crashed. Investigate, fix, re-run manually.

### ITF site layout changed

Symptom: `tests/test_itf_scraper.py` fails or every `player_failed` log line
points at a parsing error.

Fix: re-capture the fixture, update selectors in `itf.py`, re-run tests.

### Blocked (HTTP 403 / 429)

Increase `REQUEST_DELAY_SECONDS` in `.env` to 15 or higher. If persistent, plan
the migration to a paid API (Sportradar) — see spec section 5.3.

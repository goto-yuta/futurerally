# FutureRally Plan 5: Scraping Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python pipeline that fetches each Japanese player's current tournament status from ITF (and rankings from ATP for ranked players), writes to the same Supabase database the Next.js app reads, and runs twice per day via GitHub Actions. Failures route to Sentry.

**Architecture:** A separate Python project rooted at `scraper/` in the same repo. Each scraper module implements a common `Scraper` ABC. A `pipeline.py` orchestrator loads all players from the DB, dispatches the right scraper per player category, and UPSERTs `tournament_entries`, `player_rank_snapshots`, and updates `players.current_jta_rank` / `current_atp_rank`. GitHub Actions runs it at 06:00 and 21:00 JST. Each player gets a 5-10 second delay between requests to respect the source. Sentry catches per-player exceptions without halting the whole batch.

**Tech Stack:** Python 3.12, `httpx` (HTTP), `selectolax` (HTML parsing — faster than BeautifulSoup, lighter than lxml), `psycopg[binary]` v3 (Postgres), `pydantic` (config + structured output), `tenacity` (retries), `sentry-sdk`, `pytest` (tests), `pytest-vcr` (record/replay HTTP for tests), `ruff` (lint + format).

**Prerequisites:** Plans 1-4 complete (especially Plan 4's `player_rank_snapshots` schema).

**Related Spec:** `docs/superpowers/specs/2026-05-12-futurerally-tennis-media-design.md` sections 5, 6.

---

## File Structure

```
scraper/
├── pyproject.toml                            # Project metadata + deps
├── uv.lock                                   # Lockfile (if using uv)
├── .python-version                           # Python 3.12
├── README.md                                 # How to run, troubleshoot
├── src/
│   └── futurerally_scraper/
│       ├── __init__.py
│       ├── __main__.py                       # `python -m futurerally_scraper`
│       ├── config.py                         # Pydantic Settings (env vars)
│       ├── db.py                             # psycopg connection + upsert helpers
│       ├── models.py                         # Pydantic shapes (PlayerStatus etc.)
│       ├── pipeline.py                       # Orchestrator
│       ├── scrapers/
│       │   ├── __init__.py
│       │   ├── base.py                       # Scraper ABC
│       │   ├── itf.py                        # ITFScraper
│       │   └── atp.py                        # ATPScraper (rankings only)
│       └── observability.py                  # Sentry init + logging
└── tests/
    ├── __init__.py
    ├── conftest.py                           # Fixtures + VCR config
    ├── cassettes/
    │   ├── itf_player_page.yaml              # Recorded ITF response
    │   └── atp_rankings_page.yaml
    ├── test_itf_scraper.py
    ├── test_atp_scraper.py
    ├── test_pipeline.py
    └── test_db.py
.github/
└── workflows/
    └── scraper-cron.yml                      # Cron schedule
```

---

## Task 1: Initialize Python project with `uv`

`uv` is faster than pip/poetry and the project Python is 3.12. Engineer should `brew install uv` first if not already installed.

**Files:**
- Create: `scraper/pyproject.toml`
- Create: `scraper/.python-version`
- Create: `scraper/src/futurerally_scraper/__init__.py`
- Create: `scraper/README.md`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p scraper/src/futurerally_scraper/scrapers scraper/tests/cassettes
echo "3.12" > scraper/.python-version
touch scraper/src/futurerally_scraper/__init__.py
touch scraper/src/futurerally_scraper/scrapers/__init__.py
touch scraper/tests/__init__.py
```

- [ ] **Step 2: Create `scraper/pyproject.toml`**

```toml
[project]
name = "futurerally-scraper"
version = "0.1.0"
description = "ITF/ATP scraping pipeline for FutureRally"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.27",
    "selectolax>=0.3.21",
    "psycopg[binary]>=3.2",
    "pydantic>=2.7",
    "pydantic-settings>=2.3",
    "tenacity>=8.5",
    "sentry-sdk>=2.7",
    "structlog>=24.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.2",
    "pytest-vcr>=1.0",
    "pytest-asyncio>=0.23",
    "ruff>=0.5",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/futurerally_scraper"]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.pytest.ini_options]
pythonpath = ["src"]
asyncio_mode = "auto"
```

- [ ] **Step 3: Install with uv**

```bash
cd scraper
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
cd ..
```
Expected: deps install successfully. Test by running `cd scraper && python -c "import httpx; print(httpx.__version__)"`.

- [ ] **Step 4: Create `scraper/README.md`**

```md
# FutureRally Scraper

Python pipeline that pulls tournament status + rankings for tracked Japanese players and upserts into Supabase Postgres.

## Setup

```
cd scraper
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

Set env vars in `.env` (gitignored):

```
DATABASE_URL=postgresql://...
SENTRY_DSN=...
```

## Run once locally

```
python -m futurerally_scraper
```

## Test

```
pytest
```

## Run on a schedule

GitHub Actions runs this at 06:00 and 21:00 JST. See `.github/workflows/scraper-cron.yml`.
```

- [ ] **Step 5: Commit**

```bash
git add scraper/ .python-version
git commit -m "feat(scraper): initialize Python scraping project with uv"
```

---

## Task 2: Config + DB module

**Files:**
- Create: `scraper/src/futurerally_scraper/config.py`
- Create: `scraper/src/futurerally_scraper/db.py`

- [ ] **Step 1: Implement `scraper/src/futurerally_scraper/config.py`**

```python
"""Environment-driven configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    sentry_dsn: str | None = None
    request_delay_seconds: float = 7.0
    user_agent: str = "FutureRally Bot / contact: editor@futurerally.example"
    request_timeout_seconds: float = 30.0


def load_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
```

- [ ] **Step 2: Implement `scraper/src/futurerally_scraper/db.py`**

```python
"""Database connection + upsert helpers using psycopg3."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Iterator

import psycopg
from psycopg.rows import dict_row


@contextmanager
def connect(database_url: str) -> Iterator[psycopg.Connection]:
    """Yield a psycopg connection, autocommit OFF (caller commits)."""
    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        yield conn


def fetch_tracked_players(conn: psycopg.Connection) -> list[dict]:
    """All players we should scrape."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, slug, name_ja, category, itf_id, itf_slug "
            "FROM players ORDER BY id"
        )
        return list(cur.fetchall())


def find_tournament_id_by_slug(conn: psycopg.Connection, slug: str) -> int | None:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM tournaments WHERE slug = %s", (slug,))
        row = cur.fetchone()
        return row["id"] if row else None


def upsert_tournament(
    conn: psycopg.Connection,
    *,
    slug: str,
    name_ja: str,
    name_en: str,
    level: str,
    start_date: datetime,
    end_date: datetime,
    location: str | None,
    external_url: str | None,
) -> int:
    """Insert tournament if missing, return its id."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tournaments (slug, name_ja, name_en, level, start_date, end_date, location, external_url, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (slug) DO UPDATE SET
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date,
              location = EXCLUDED.location,
              external_url = EXCLUDED.external_url,
              updated_at = now()
            RETURNING id
            """,
            (slug, name_ja, name_en, level, start_date, end_date, location, external_url),
        )
        return cur.fetchone()["id"]


def upsert_entry(
    conn: psycopg.Connection,
    *,
    player_id: int,
    tournament_id: int,
    status: str,
    current_round: str | None,
    last_match_summary: str | None,
    next_match_at: datetime | None,
    next_opponent: str | None,
) -> None:
    """Upsert a tournament entry, treating (player_id, tournament_id) as the natural key."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tournament_entries
              (player_id, tournament_id, status, current_round, last_match_summary, next_match_at, next_opponent, last_updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (player_id, tournament_id) DO UPDATE SET
              status = EXCLUDED.status,
              current_round = EXCLUDED.current_round,
              last_match_summary = EXCLUDED.last_match_summary,
              next_match_at = EXCLUDED.next_match_at,
              next_opponent = EXCLUDED.next_opponent,
              last_updated_at = now()
            """,
            (player_id, tournament_id, status, current_round, last_match_summary, next_match_at, next_opponent),
        )


def insert_rank_snapshot(
    conn: psycopg.Connection,
    *,
    player_id: int,
    provider: str,
    rank: int,
    snapshot_at: datetime,
) -> None:
    """Insert a rank snapshot only if one for the same (player, provider, month) doesn't exist."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO player_rank_snapshots (player_id, provider, rank, snapshot_at)
            SELECT %s, %s, %s, %s
            WHERE NOT EXISTS (
              SELECT 1 FROM player_rank_snapshots
              WHERE player_id = %s AND provider = %s
                AND date_trunc('month', snapshot_at) = date_trunc('month', %s::timestamp)
            )
            """,
            (player_id, provider, rank, snapshot_at, player_id, provider, snapshot_at),
        )


def update_player_current_rank(
    conn: psycopg.Connection,
    *,
    player_id: int,
    jta_rank: int | None = None,
    atp_rank: int | None = None,
) -> None:
    with conn.cursor() as cur:
        if jta_rank is not None:
            cur.execute(
                "UPDATE players SET current_jta_rank = %s, updated_at = now() WHERE id = %s",
                (jta_rank, player_id),
            )
        if atp_rank is not None:
            cur.execute(
                "UPDATE players SET current_atp_rank = %s, updated_at = now() WHERE id = %s",
                (atp_rank, player_id),
            )
```

> **Note:** The schema as defined in Plans 1 and 4 does not declare a unique constraint on `(player_id, tournament_id)` for `tournament_entries`. Without that, `ON CONFLICT` cannot match. Add the constraint now.

- [ ] **Step 3: Add unique constraint to `lib/db/schema.ts` (Next.js side)**

In `lib/db/schema.ts`, find the `tournamentEntries` definition and convert it to use a uniqueness constraint:

```ts
import { uniqueIndex } from 'drizzle-orm/pg-core';

export const tournamentEntries = pgTable('tournament_entries', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  status: entryStatus('status').notNull(),
  currentRound: varchar('current_round', { length: 16 }),
  lastMatchSummary: text('last_match_summary'),
  nextMatchAt: timestamp('next_match_at'),
  nextOpponent: varchar('next_opponent', { length: 64 }),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().notNull(),
}, (t) => ({
  playerTournamentIdx: uniqueIndex('player_tournament_unique').on(t.playerId, t.tournamentId),
}));
```

- [ ] **Step 4: Generate and apply migration**

```bash
cd ..
npx drizzle-kit generate
npx drizzle-kit migrate
```
Expected: new migration adds the unique index.

- [ ] **Step 5: Commit**

```bash
git add scraper/src/futurerally_scraper/config.py scraper/src/futurerally_scraper/db.py lib/db/schema.ts drizzle/
git commit -m "feat(scraper): add config + db modules; add unique constraint on tournament_entries"
```

---

## Task 3: Models + base Scraper ABC

**Files:**
- Create: `scraper/src/futurerally_scraper/models.py`
- Create: `scraper/src/futurerally_scraper/scrapers/base.py`

- [ ] **Step 1: Implement `scraper/src/futurerally_scraper/models.py`**

```python
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
```

- [ ] **Step 2: Implement `scraper/src/futurerally_scraper/scrapers/base.py`**

```python
"""Abstract base class for all scrapers."""

from __future__ import annotations

from abc import ABC, abstractmethod

import httpx

from ..config import Settings
from ..models import PlayerStatus


class Scraper(ABC):
    def __init__(self, client: httpx.Client, settings: Settings):
        self.client = client
        self.settings = settings

    @abstractmethod
    def fetch_player_status(self, player: dict) -> PlayerStatus:
        """Return current status for a player. `player` is a row dict from the DB."""
        raise NotImplementedError
```

- [ ] **Step 3: Commit**

```bash
git add scraper/src/futurerally_scraper/models.py scraper/src/futurerally_scraper/scrapers/base.py
git commit -m "feat(scraper): add PlayerStatus models and Scraper ABC"
```

---

## Task 4: ITFScraper — parsing one player page (TDD)

**Files:**
- Create: `scraper/tests/conftest.py`
- Create: `scraper/tests/cassettes/itf_player_page.yaml` (manual setup)
- Create: `scraper/tests/test_itf_scraper.py`
- Create: `scraper/src/futurerally_scraper/scrapers/itf.py`

The ITF site is JS-heavy. Per the spec, we scrape the per-player page (`itftennis.com/en/players/<slug>/<id>/`) rather than the live center. The actual page structure may differ from training assumptions, so this task uses a saved HTML fixture and expects the engineer to capture a real fixture during implementation.

- [ ] **Step 1: Capture a sample ITF player HTML fixture**

Manual step:
1. Find a Japanese player's ITF page. Example: visit `https://www.itftennis.com/en/players/daniel-taro/...` (replace with current valid URL).
2. Save the rendered HTML (Right-click → Save As → "Webpage, complete") into `scraper/tests/cassettes/itf_player_page.html`. If the data only appears via XHR, intercept the JSON response from DevTools Network tab and save it as `itf_player_page.json` instead.

Document the exact URL used in `scraper/tests/cassettes/SOURCES.md`:
```md
itf_player_page.html — captured from https://www.itftennis.com/en/players/<slug>/<id>/ on 2026-MM-DD
```

- [ ] **Step 2: Write the failing test**

`scraper/tests/test_itf_scraper.py`:
```python
from datetime import datetime
from pathlib import Path

import pytest

from futurerally_scraper.scrapers.itf import ITFScraper
from futurerally_scraper.config import Settings


FIXTURE = Path(__file__).parent / "cassettes" / "itf_player_page.html"


@pytest.fixture
def settings():
    return Settings(database_url="postgresql://test/test")


def test_parses_player_page_into_player_status(settings):
    """Parsing the fixture should yield at least one tournament entry with a level."""
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ITFScraper(client=None, settings=settings)  # client unused in parse
    status = scraper.parse_player_html(html, player_id=42)
    assert status.player_id == 42
    assert len(status.entries) >= 1
    entry = status.entries[0]
    assert entry.status in {"scheduled", "alive", "won", "lost", "champion"}
    assert entry.tournament.level in {"atp", "challenger", "futures_25", "futures_15"}


def test_parses_iso_dates(settings):
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ITFScraper(client=None, settings=settings)
    status = scraper.parse_player_html(html, player_id=42)
    entry = status.entries[0]
    assert isinstance(entry.tournament.start_date, datetime)
    assert isinstance(entry.tournament.end_date, datetime)
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd scraper
source .venv/bin/activate
pytest tests/test_itf_scraper.py -v
```
Expected: ImportError or NotImplementedError.

- [ ] **Step 4: Implement `scraper/src/futurerally_scraper/scrapers/itf.py`**

The exact CSS/JSON path will depend on what the engineer captures. Below is a skeleton with **explicit places to adjust** marked with `# ADJUST:`. The engineer fills these in against the live HTML/JSON.

```python
"""Scraper for ITF World Tennis Tour player pages."""

from __future__ import annotations

from datetime import datetime
from urllib.parse import urljoin

import httpx
from selectolax.parser import HTMLParser

from ..models import EntrySnapshot, PlayerStatus, TournamentInfo
from .base import Scraper


ITF_BASE = "https://www.itftennis.com"


class ITFScraper(Scraper):
    def fetch_player_status(self, player: dict) -> PlayerStatus:
        slug = player.get("itf_slug")
        itf_id = player.get("itf_id")
        if not slug or not itf_id:
            raise ValueError(f"player {player['slug']} missing itf_slug or itf_id")

        url = urljoin(ITF_BASE, f"/en/players/{slug}/{itf_id}/")
        resp = self.client.get(url, headers={"User-Agent": self.settings.user_agent})
        resp.raise_for_status()
        return self.parse_player_html(resp.text, player_id=player["id"])

    def parse_player_html(self, html: str, *, player_id: int) -> PlayerStatus:
        tree = HTMLParser(html)

        entries: list[EntrySnapshot] = []

        # ADJUST: selector for each "tournament card" on a player page.
        # Inspect the captured fixture's DOM to find what wraps each entry.
        tournament_nodes = tree.css("div[data-tournament-card]")  # ADJUST selector
        for node in tournament_nodes:
            entry = self._parse_tournament_node(node)
            if entry:
                entries.append(entry)

        return PlayerStatus(player_id=player_id, entries=entries)

    def _parse_tournament_node(self, node) -> EntrySnapshot | None:
        # ADJUST: each sub-selector against the real DOM.
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

        level = self._normalise_level(level_raw)
        status = self._normalise_status(status_raw)
        start_dt = self._parse_date(start)
        end_dt = self._parse_date(end)

        tournament = TournamentInfo(
            slug=slug,
            name_ja=name_en,  # ITF page has English only; editorial team can override later
            name_en=name_en,
            level=level,
            start_date=start_dt,
            end_date=end_dt,
            location=location,
        )
        return EntrySnapshot(
            tournament=tournament,
            status=status,
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
    def _normalise_level(raw: str):
        m = {
            "atp": "atp", "challenger": "challenger",
            "m25": "futures_25", "futures_25": "futures_25", "25k": "futures_25",
            "m15": "futures_15", "futures_15": "futures_15", "15k": "futures_15",
        }
        return m.get(raw, "futures_15")

    @staticmethod
    def _normalise_status(raw: str):
        m = {
            "alive": "alive", "scheduled": "scheduled", "won": "won", "lost": "lost",
            "winner": "champion", "champion": "champion",
            "qf": "alive", "sf": "alive", "r32": "alive", "r16": "alive", "r64": "alive",
        }
        return m.get(raw, "scheduled")
```

- [ ] **Step 5: Adjust selectors against the real fixture**

The engineer inspects `tests/cassettes/itf_player_page.html` and replaces every `# ADJUST` line with the actual CSS selector. Run tests after each replacement until they pass.

```bash
pytest tests/test_itf_scraper.py -v
```
Expected: tests passing once selectors are correct.

- [ ] **Step 6: Commit**

```bash
git add scraper/src/futurerally_scraper/scrapers/itf.py scraper/tests/test_itf_scraper.py scraper/tests/cassettes/
git commit -m "feat(scraper): implement ITF player-page scraper with HTML fixture tests"
```

---

## Task 5: ATPScraper for rankings (lightweight)

**Files:**
- Create: `scraper/tests/test_atp_scraper.py`
- Create: `scraper/src/futurerally_scraper/scrapers/atp.py`
- Create: `scraper/tests/cassettes/atp_rankings_page.html` (manual)

- [ ] **Step 1: Capture a sample ATP rankings page**

Visit https://www.atptour.com/en/rankings/singles, save the rendered HTML as `scraper/tests/cassettes/atp_rankings_page.html`. Note the URL/timestamp in `SOURCES.md`.

- [ ] **Step 2: Write failing tests**

`scraper/tests/test_atp_scraper.py`:
```python
from pathlib import Path

import pytest

from futurerally_scraper.scrapers.atp import ATPScraper
from futurerally_scraper.config import Settings


FIXTURE = Path(__file__).parent / "cassettes" / "atp_rankings_page.html"


@pytest.fixture
def settings():
    return Settings(database_url="postgresql://test/test")


def test_parses_rankings_into_dict(settings):
    html = FIXTURE.read_text(encoding="utf-8")
    scraper = ATPScraper(client=None, settings=settings)
    rankings = scraper.parse_rankings_html(html)
    assert isinstance(rankings, dict)
    # Should map player display name → integer rank
    assert len(rankings) > 50
    for name, rank in rankings.items():
        assert isinstance(name, str)
        assert isinstance(rank, int)
        assert 1 <= rank <= 5000
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pytest tests/test_atp_scraper.py -v
```
Expected: FAIL.

- [ ] **Step 4: Implement `scraper/src/futurerally_scraper/scrapers/atp.py`**

```python
"""Scraper for ATP rankings (singles)."""

from __future__ import annotations

import re

import httpx
from selectolax.parser import HTMLParser

from ..models import PlayerStatus
from .base import Scraper


ATP_RANKINGS_URL = "https://www.atptour.com/en/rankings/singles"


class ATPScraper(Scraper):
    def fetch_player_status(self, player: dict) -> PlayerStatus:
        """ATPScraper only fills atp_rank; entries handled by ITFScraper for Challenger/Futures."""
        rankings = self._cached_rankings or self._fetch_rankings()
        rank = rankings.get(player["name_en"]) if player.get("name_en") else None
        return PlayerStatus(player_id=player["id"], atp_rank=rank)

    _cached_rankings: dict[str, int] | None = None

    def _fetch_rankings(self) -> dict[str, int]:
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
```

- [ ] **Step 5: Adjust selectors and re-run**

Engineer inspects the captured HTML and replaces the `# ADJUST` selector. Re-run `pytest tests/test_atp_scraper.py`.

- [ ] **Step 6: Commit**

```bash
git add scraper/src/futurerally_scraper/scrapers/atp.py scraper/tests/test_atp_scraper.py scraper/tests/cassettes/
git commit -m "feat(scraper): implement ATP rankings scraper"
```

---

## Task 6: Sentry + structlog observability

**Files:**
- Create: `scraper/src/futurerally_scraper/observability.py`

- [ ] **Step 1: Implement `scraper/src/futurerally_scraper/observability.py`**

```python
"""Sentry init + structured logging."""

import logging
import sys

import sentry_sdk
import structlog


def init(sentry_dsn: str | None) -> structlog.stdlib.BoundLogger:
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=0.0,
            profiles_sample_rate=0.0,
            send_default_pii=False,
        )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    return structlog.get_logger()
```

- [ ] **Step 2: Commit**

```bash
git add scraper/src/futurerally_scraper/observability.py
git commit -m "feat(scraper): add Sentry + structlog observability"
```

---

## Task 7: Pipeline orchestrator

**Files:**
- Create: `scraper/src/futurerally_scraper/pipeline.py`
- Create: `scraper/src/futurerally_scraper/__main__.py`
- Create: `scraper/tests/test_pipeline.py`

- [ ] **Step 1: Write failing test for pipeline routing**

`scraper/tests/test_pipeline.py`:
```python
from datetime import datetime, timezone
from unittest.mock import MagicMock

from futurerally_scraper.config import Settings
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


def test_process_player_writes_tournament_and_entry():
    scraper = MagicMock()
    scraper.fetch_player_status.return_value = PlayerStatus(player_id=1, entries=[_entry()])
    conn = MagicMock()

    upsert_tournament = MagicMock(return_value=99)
    upsert_entry = MagicMock()

    process_player(
        player={"id": 1, "name_ja": "テスト", "name_en": "Test", "category": "futures"},
        scraper=scraper, conn=conn,
        upsert_tournament=upsert_tournament,
        upsert_entry=upsert_entry,
    )

    upsert_tournament.assert_called_once()
    upsert_entry.assert_called_once()
    _, kwargs = upsert_entry.call_args
    assert kwargs["player_id"] == 1
    assert kwargs["tournament_id"] == 99
    assert kwargs["status"] == "alive"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_pipeline.py -v
```
Expected: FAIL.

- [ ] **Step 3: Implement `scraper/src/futurerally_scraper/pipeline.py`**

```python
"""Orchestrator: load players, dispatch scrapers, write to DB."""

from __future__ import annotations

import time
from typing import Callable

import httpx
import sentry_sdk

from .config import Settings, load_settings
from .db import (
    connect, fetch_tracked_players,
    insert_rank_snapshot, update_player_current_rank,
    upsert_entry, upsert_tournament,
)
from .models import PlayerStatus
from .observability import init as init_observability
from .scrapers.atp import ATPScraper
from .scrapers.base import Scraper
from .scrapers.itf import ITFScraper


def pick_scraper(player: dict, itf: Scraper, atp: Scraper) -> Scraper:
    """Return which scraper to use for a given player row."""
    category = player.get("category")
    if category in {"futures", "college"}:
        return itf
    # 'pro' may still play challengers/futures; fall through to ITF as primary,
    # ATP runs separately for rank refresh.
    return itf


def process_player(
    *,
    player: dict,
    scraper: Scraper,
    conn,
    upsert_tournament: Callable = upsert_tournament,
    upsert_entry: Callable = upsert_entry,
) -> None:
    status: PlayerStatus = scraper.fetch_player_status(player)
    for entry in status.entries:
        t = entry.tournament
        tournament_id = upsert_tournament(
            conn,
            slug=t.slug, name_ja=t.name_ja, name_en=t.name_en,
            level=t.level, start_date=t.start_date, end_date=t.end_date,
            location=t.location, external_url=t.external_url,
        )
        upsert_entry(
            conn,
            player_id=player["id"], tournament_id=tournament_id,
            status=entry.status, current_round=entry.current_round,
            last_match_summary=entry.last_match_summary,
            next_match_at=entry.next_match_at, next_opponent=entry.next_opponent,
        )


def run() -> None:
    settings = load_settings()
    log = init_observability(settings.sentry_dsn)
    log.info("pipeline_start")

    with httpx.Client(timeout=settings.request_timeout_seconds) as client:
        itf = ITFScraper(client=client, settings=settings)
        atp = ATPScraper(client=client, settings=settings)

        with connect(settings.database_url) as conn:
            players = fetch_tracked_players(conn)
            log.info("players_loaded", count=len(players))

            for player in players:
                try:
                    scraper = pick_scraper(player, itf=itf, atp=atp)
                    process_player(player=player, scraper=scraper, conn=conn)
                    conn.commit()
                    log.info("player_done", slug=player["slug"])
                except Exception as exc:  # noqa: BLE001
                    conn.rollback()
                    sentry_sdk.capture_exception(exc)
                    log.warning("player_failed", slug=player["slug"], err=str(exc))

                time.sleep(settings.request_delay_seconds)

            # Rank refresh — ATP is rate-limited but one fetch covers all
            try:
                atp_rankings = atp._fetch_rankings()
                for player in players:
                    name = player.get("name_en")
                    rank = atp_rankings.get(name) if name else None
                    if rank is not None:
                        from datetime import datetime, timezone
                        now = datetime.now(timezone.utc)
                        update_player_current_rank(conn, player_id=player["id"], atp_rank=rank)
                        insert_rank_snapshot(
                            conn, player_id=player["id"], provider="atp",
                            rank=rank, snapshot_at=now,
                        )
                conn.commit()
                log.info("rank_refresh_done")
            except Exception as exc:  # noqa: BLE001
                conn.rollback()
                sentry_sdk.capture_exception(exc)
                log.warning("rank_refresh_failed", err=str(exc))

    log.info("pipeline_end")


if __name__ == "__main__":
    run()
```

- [ ] **Step 4: Implement `scraper/src/futurerally_scraper/__main__.py`**

```python
from .pipeline import run

if __name__ == "__main__":
    run()
```

- [ ] **Step 5: Run unit test**

```bash
pytest tests/test_pipeline.py -v
```
Expected: 1 test passing.

- [ ] **Step 6: Run the pipeline locally against a real Supabase**

> **Manual prerequisite:** Make sure `scraper/.env` has `DATABASE_URL` and `SENTRY_DSN`. Confirm test players in DB have `itf_id` and `itf_slug` filled in (Supabase Studio).

```bash
python -m futurerally_scraper
```
Expected: structured JSON log lines. Check Supabase Studio that `tournament_entries` rows updated.

- [ ] **Step 7: Commit**

```bash
git add scraper/src/futurerally_scraper/pipeline.py scraper/src/futurerally_scraper/__main__.py scraper/tests/test_pipeline.py
git commit -m "feat(scraper): add pipeline orchestrator with per-player error isolation"
```

---

## Task 8: GitHub Actions cron

**Files:**
- Create: `.github/workflows/scraper-cron.yml`

- [ ] **Step 1: Create `.github/workflows/scraper-cron.yml`**

```yaml
name: Scraper Cron

on:
  schedule:
    # 06:00 JST = 21:00 UTC previous day
    - cron: "0 21 * * *"
    # 21:00 JST = 12:00 UTC same day
    - cron: "0 12 * * *"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    defaults:
      run:
        working-directory: scraper
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install uv
        run: pip install uv
      - name: Install deps
        run: |
          uv venv
          source .venv/bin/activate
          uv pip install -e .
      - name: Run pipeline
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
        run: |
          source .venv/bin/activate
          python -m futurerally_scraper
```

- [ ] **Step 2: Add secrets in GitHub Settings**

Manual step: in the GitHub repo's Settings → Secrets and variables → Actions, add:
- `DATABASE_URL` (same as Vercel)
- `SENTRY_DSN`

- [ ] **Step 3: Manually trigger via the Actions tab**

Manual: open the Actions tab → "Scraper Cron" → "Run workflow" → main branch. Verify the run completes green and the DB has updated rows.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/scraper-cron.yml
git commit -m "ci(scraper): run pipeline twice daily via GitHub Actions"
```

---

## Task 9: Mark scraper status in admin notes (optional polish)

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/seed.ts`

Add a `last_scraped_at` timestamp on `players` so the editor can see freshness.

- [ ] **Step 1: Update `lib/db/schema.ts`**

In the `players` table definition, add:
```ts
lastScrapedAt: timestamp('last_scraped_at'),
```

- [ ] **Step 2: Generate migration**

```bash
cd ..
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 3: Update pipeline to set the timestamp**

In `scraper/src/futurerally_scraper/db.py`, add:
```python
def mark_player_scraped(conn: psycopg.Connection, *, player_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE players SET last_scraped_at = now() WHERE id = %s",
            (player_id,),
        )
```

In `scraper/src/futurerally_scraper/pipeline.py` `process_player` body, after the entries loop:
```python
from .db import mark_player_scraped  # add at top
# at the end of process_player:
mark_player_scraped(conn, player_id=player["id"])
```

- [ ] **Step 4: Run pipeline + verify**

```bash
cd scraper
python -m futurerally_scraper
```
Verify `players.last_scraped_at` is set in Supabase Studio.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/ scraper/src/futurerally_scraper/db.py scraper/src/futurerally_scraper/pipeline.py
git commit -m "feat(scraper): record last_scraped_at for each player"
```

---

## Task 10: Runbook and troubleshooting docs

**Files:**
- Modify: `scraper/README.md`

- [ ] **Step 1: Append a runbook to `scraper/README.md`**

```md
## Runbook

### A daily run failed (Sentry alert)

1. Open Sentry → find the exception traceback.
2. If the failure is per-player (single `player_failed` log line), other players were processed normally. The next scheduled run will retry that player.
3. If the failure is `pipeline_start` not followed by `pipeline_end`, the orchestrator itself crashed. Re-run manually via GitHub Actions "Run workflow" once the root cause is fixed.

### ITF site layout changed

Symptom: tests in `tests/test_itf_scraper.py` fail; in production every player logs `player_failed` with a parsing error.

Fix:
1. Capture a fresh `itf_player_page.html` fixture.
2. Run `pytest tests/test_itf_scraper.py` and inspect failures.
3. Update CSS selectors in `src/futurerally_scraper/scrapers/itf.py`.
4. Re-run tests until green.
5. Trigger the pipeline manually.

### Scraping is being blocked (HTTP 403 / 429)

1. Verify our request rate. Default `REQUEST_DELAY_SECONDS=7` should be polite; increase to 15 if blocking persists.
2. If still blocked, consider switching to an authenticated API (Sportradar) — see spec section 5.3.
```

- [ ] **Step 2: Commit**

```bash
git add scraper/README.md
git commit -m "docs(scraper): add runbook for failures and layout changes"
```

---

## Self-Review Checklist

- [x] Spec coverage:
  - Section 5.1 (scraper layer): Tasks 3-5
  - Section 5.2 (per-source approach): Tasks 4, 5
  - Section 5.3 (rate limit / UA / migration path): Task 2 config defaults, Task 10 runbook
  - Section 5.4 (status update logic): Task 7 pipeline processes entries
  - Section 6 (GH Actions cron / Sentry): Tasks 6, 8
  - Plan 4 dependency (rank snapshots): Task 7 inserts via `insert_rank_snapshot`
- [x] Placeholder scan:
  - `# ADJUST` markers are intentional in the scrapers — the engineer must replace with real selectors against captured fixtures. This is the correct pattern for HTML scraping where the upstream structure can only be observed at implementation time. Each is documented inline.
  - No "TODO" or other vague placeholders.
- [x] Type consistency:
  - `EntryStatus` Literal matches the `entry_status` pg enum
  - `TournamentLevel` Literal matches the `tournament_level` pg enum
  - DB function signatures use keyword-only args consistent with how `pipeline.process_player` calls them
  - `PlayerStatus.entries` shape is consumed exactly the way it's produced

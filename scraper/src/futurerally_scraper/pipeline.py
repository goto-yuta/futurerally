"""Orchestrator: load players, dispatch scrapers, write to DB."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Callable

import httpx
import sentry_sdk

from .config import load_settings
from .db import (
    connect, fetch_tracked_players,
    insert_rank_snapshot, mark_player_scraped,
    update_player_current_rank, upsert_entry, upsert_tournament,
)
from .models import PlayerStatus
from .observability import init as init_observability
from .scrapers.atp import ATPScraper
from .scrapers.base import Scraper
from .scrapers.itf import ITFScraper


def pick_scraper(player: dict, itf: Scraper, atp: Scraper) -> Scraper:
    """Return which scraper to use for a given player row.

    ATP is used only for the rank refresh pass — entries always come from ITF.
    """
    _ = atp
    return itf


def process_player(
    *,
    player: dict,
    scraper: Scraper,
    conn,
    upsert_tournament_fn: Callable = upsert_tournament,
    upsert_entry_fn: Callable = upsert_entry,
    mark_scraped_fn: Callable = mark_player_scraped,
) -> None:
    status: PlayerStatus = scraper.fetch_player_status(player)
    for entry in status.entries:
        t = entry.tournament
        tournament_id = upsert_tournament_fn(
            conn,
            slug=t.slug, name_ja=t.name_ja, name_en=t.name_en,
            level=t.level, start_date=t.start_date, end_date=t.end_date,
            location=t.location, external_url=t.external_url,
        )
        upsert_entry_fn(
            conn,
            player_id=player["id"], tournament_id=tournament_id,
            status=entry.status, current_round=entry.current_round,
            last_match_summary=entry.last_match_summary,
            next_match_at=entry.next_match_at, next_opponent=entry.next_opponent,
        )
    mark_scraped_fn(conn, player_id=player["id"])


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

            # ATP rank refresh — one fetch covers everyone
            try:
                rankings = atp.fetch_rankings()
                now = datetime.now(timezone.utc)
                for player in players:
                    name = player.get("name_en")
                    rank = rankings.get(name) if name else None
                    if rank is None:
                        continue
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

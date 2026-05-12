"""Database connection + upsert helpers using psycopg3."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Iterator

import psycopg
from psycopg.rows import dict_row


@contextmanager
def connect(database_url: str) -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        yield conn


def fetch_tracked_players(conn: psycopg.Connection) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, slug, name_ja, name_en, category, itf_id, itf_slug, atp_player_id "
            "FROM players ORDER BY id"
        )
        return list(cur.fetchall())


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
    """Insert rank snapshot only if one for the same (player, provider, month) doesn't exist."""
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


def mark_player_scraped(conn: psycopg.Connection, *, player_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE players SET last_scraped_at = now() WHERE id = %s",
            (player_id,),
        )

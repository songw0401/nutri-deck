import json
import sqlite3
from contextlib import closing
from typing import Dict, List

from app.core.config import DB_FILE
from app.models import MatchRecord, RankingItem


def init_db() -> None:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(DB_FILE)) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS match_records (
                id TEXT PRIMARY KEY,
                played_at TEXT NOT NULL,
                winner_name TEXT NOT NULL,
                reached_goal INTEGER NOT NULL,
                player_count INTEGER NOT NULL,
                payload_json TEXT NOT NULL
            )
            """
        )
        conn.commit()


def save_match(record: MatchRecord) -> None:
    init_db()
    with closing(sqlite3.connect(DB_FILE)) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO match_records
            (id, played_at, winner_name, reached_goal, player_count, payload_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                record.id,
                record.playedAt,
                record.winnerName,
                int(record.reachedGoal),
                len(record.players),
                record.model_dump_json(),
            ),
        )
        conn.commit()


def list_matches(limit: int = 40) -> List[MatchRecord]:
    init_db()
    with closing(sqlite3.connect(DB_FILE)) as conn:
        rows = conn.execute(
            "SELECT payload_json FROM match_records ORDER BY played_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [MatchRecord.model_validate(json.loads(row[0])) for row in rows]


def rankings(limit: int = 20) -> List[RankingItem]:
    records = list_matches(limit=1000)
    stats: Dict[str, Dict[str, int]] = {}
    for record in records:
        for player in record.players:
            row = stats.setdefault(player.name, {"best_score": 0, "wins": 0, "games": 0})
            row["games"] += 1
            row["best_score"] = max(row["best_score"], player.totalScore)
        if record.winnerName in stats:
            stats[record.winnerName]["wins"] += 1

    ordered = sorted(
        stats.items(),
        key=lambda item: (-item[1]["wins"], -item[1]["best_score"], item[0]),
    )[:limit]
    return [
        RankingItem(
            rank=index + 1,
            player_name=name,
            best_score=row["best_score"],
            wins=row["wins"],
            games=row["games"],
        )
        for index, (name, row) in enumerate(ordered)
    ]

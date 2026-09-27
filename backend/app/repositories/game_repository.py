import json
from typing import Dict, List

from app.core.config import RECORDS_FILE
from app.models import MatchRecord, RankingItem


def init_db() -> None:
    RECORDS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not RECORDS_FILE.exists():
        RECORDS_FILE.write_text("[]", encoding="utf-8")


def _load_records() -> List[MatchRecord]:
    init_db()
    try:
        raw = json.loads(RECORDS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        raw = []
    return [MatchRecord.model_validate(item) for item in raw]


def _save_records(records: List[MatchRecord]) -> None:
    payload = [json.loads(record.model_dump_json()) for record in records]
    RECORDS_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def save_match(record: MatchRecord) -> None:
    records = _load_records()
    records = [item for item in records if item.id != record.id]
    records.append(record)
    records.sort(key=lambda item: item.playedAt, reverse=True)
    _save_records(records)


def list_matches(limit: int = 40) -> List[MatchRecord]:
    records = _load_records()
    records.sort(key=lambda item: item.playedAt, reverse=True)
    return records[:limit]


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

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = PROJECT_ROOT / "data" / "processed" / "game_foods.json"
RECORDS_FILE = PROJECT_ROOT / "backend" / "game_records.json"

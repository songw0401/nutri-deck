"""메뉴젠 Open API를 수집해 뉴트리 덱 게임용 데이터로 갱신하는 CLI."""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.public_data_sync import sync_menuzen_data  # noqa: E402


def main() -> None:
    metadata = sync_menuzen_data()
    print("[Nutri-Deck] 메뉴젠 Open API 동기화 완료")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

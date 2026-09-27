"""게임용 최종 데이터 검증 스크립트.

사용법:
    python data/pipeline/validate_game_foods.py
"""

import json
from pathlib import Path
from typing import List, Set

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "processed" / "game_foods.json"

REQUIRED = {
    "food_code",
    "food_name",
    "category",
    "energy_kcal",
    "carbohydrate_g",
    "protein_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
    "image",
}
NUMERIC = {
    "energy_kcal",
    "carbohydrate_g",
    "protein_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
}


def main() -> None:
    rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or not rows:
        raise SystemExit("[FAIL] game_foods.json은 비어 있지 않은 배열이어야 합니다.")

    seen: Set[str] = set()
    errors: List[str] = []

    for idx, row in enumerate(rows, start=1):
        missing = REQUIRED - set(row)
        if missing:
            errors.append(f"{idx}행: 필수 필드 누락 {sorted(missing)}")
            continue

        code = str(row["food_code"]).strip()
        if not code:
            errors.append(f"{idx}행: food_code가 비어 있습니다.")
        elif code in seen:
            errors.append(f"{idx}행: 중복 food_code={code}")
        seen.add(code)

        for key in NUMERIC:
            value = row[key]
            if not isinstance(value, (int, float)) or value < 0:
                errors.append(f"{idx}행: {key}는 0 이상의 숫자여야 합니다. 현재값={value!r}")

    if errors:
        print("[FAIL] 데이터 검증 실패")
        for error in errors:
            print(" -", error)
        raise SystemExit(1)

    print(f"[OK] {len(rows)}개 메뉴 검증 완료 / food_code 중복 없음 / 영양값 음수 없음")


if __name__ == "__main__":
    main()

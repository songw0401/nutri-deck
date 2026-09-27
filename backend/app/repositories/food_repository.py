import json
from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Tuple

from app.core.config import DATA_FILE
from app.models import Food


class FoodRepository:
    def __init__(self, data_file: Path = DATA_FILE):
        self.data_file = data_file

    @lru_cache(maxsize=1)
    def all(self) -> Tuple[Food, ...]:
        if not self.data_file.exists():
            raise FileNotFoundError(f"게임 데이터 파일을 찾을 수 없습니다: {self.data_file}")
        with self.data_file.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        foods = tuple(Food.model_validate(row) for row in raw)
        codes = [food.food_code for food in foods]
        if len(codes) != len(set(codes)):
            raise ValueError("game_foods.json에 중복 food_code가 있습니다.")
        return foods

    def refresh(self) -> Tuple[Food, ...]:
        self.all.cache_clear()
        return self.all()

    def get(self, food_code: str) -> Optional[Food]:
        return next((food for food in self.all() if food.food_code == food_code), None)

    def categories(self) -> List[str]:
        return sorted({food.category for food in self.all()})

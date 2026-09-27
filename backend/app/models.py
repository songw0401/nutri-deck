from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class Food(BaseModel):
    food_code: str
    food_name: str
    category: str
    energy_kcal: float
    carbohydrate_g: float
    protein_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    image: str = ""


class NutritionTotals(BaseModel):
    energy_kcal: float = 0
    carbohydrate_g: float = 0
    protein_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0


class NutritionCalculationRequest(BaseModel):
    food_codes: List[str] = Field(default_factory=list)


class NutritionCalculationResponse(BaseModel):
    foods: List[Food]
    totals: NutritionTotals


class Level1Mission(BaseModel):
    id: str
    level: Literal[1]
    prompt: str
    nutrient: str
    direction: Literal["highest", "lowest"]


class Level2Mission(BaseModel):
    id: str
    level: Literal[2]
    prompt: str
    targetKcal: float
    successGap: float


class Level3Condition(BaseModel):
    id: str
    label: str
    nutrient: str
    op: Literal["between", "gte", "lte"]
    min: Optional[float] = None
    max: Optional[float] = None
    value: Optional[float] = None
    unit: str


class Level3Mission(BaseModel):
    id: str
    level: Literal[3]
    prompt: str
    conditions: List[Level3Condition]


class MissionGenerateRequest(BaseModel):
    level: Literal[1, 2, 3]
    card_count: int = Field(default=6, ge=2, le=20)


class MissionGenerateResponse(BaseModel):
    mission: dict
    foods: List[Food]


class MissionEvaluateRequest(BaseModel):
    kind: Literal["level1", "level2", "level3"]
    selected: Optional[Food] = None
    dealt: List[Food] = Field(default_factory=list)
    totals: Optional[NutritionTotals] = None
    mission: dict


class ConditionJudgement(BaseModel):
    id: str
    label: str
    targetText: str
    actualText: str
    met: bool


class MissionJudgement(BaseModel):
    points: int
    maxPoints: int
    headline: str
    detail: str
    conditions: List[ConditionJudgement]


class MatchPlayer(BaseModel):
    name: str
    position: int
    totalScore: int
    reachedGoal: bool


class MatchRecord(BaseModel):
    id: str
    playedAt: str
    winnerName: str
    reachedGoal: bool
    players: List[MatchPlayer]


class RankingItem(BaseModel):
    rank: int
    player_name: str
    best_score: int
    wins: int
    games: int

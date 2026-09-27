from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    Level1Mission,
    Level2Mission,
    Level3Mission,
    MatchRecord,
    MissionEvaluateRequest,
    MissionGenerateRequest,
    MissionGenerateResponse,
    MissionJudgement,
    NutritionCalculationRequest,
    NutritionCalculationResponse,
    RankingItem,
)
from app.repositories.food_repository import FoodRepository
from app.repositories.game_repository import init_db, list_matches, rankings, save_match
from app.services.mission_service import (
    evaluate_level1,
    evaluate_level2,
    evaluate_level3,
    generate_mission,
)
from app.services.nutrition_service import calculate_totals

food_repo = FoodRepository()


@asynccontextmanager
async def lifespan(_: FastAPI):
    food_repo.all()  # 데이터 파일/스키마를 서버 시작 시 검증
    init_db()
    yield


app = FastAPI(
    title="Nutri-Deck API",
    version="1.0.0",
    description="뉴트리 덱 목업용 FastAPI 백엔드",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "food_count": len(food_repo.all())}


@app.get("/api/foods")
def get_foods(
    category: str | None = None,
    q: str | None = None,
    limit: int | None = Query(default=None, ge=1, le=200),
):
    foods = list(food_repo.all())
    if category:
        foods = [food for food in foods if food.category == category]
    if q:
        keyword = q.strip().lower()
        foods = [food for food in foods if keyword in food.food_name.lower()]
    return foods[:limit] if limit else foods


@app.get("/api/foods/categories")
def get_categories():
    return food_repo.categories()


@app.get("/api/foods/{food_code}")
def get_food(food_code: str):
    food = food_repo.get(food_code)
    if not food:
        raise HTTPException(status_code=404, detail=f"food_code를 찾을 수 없습니다: {food_code}")
    return food


@app.post("/api/nutrition/calculate", response_model=NutritionCalculationResponse)
def calculate_nutrition(request: NutritionCalculationRequest):
    foods = []
    missing = []
    for food_code in request.food_codes:
        food = food_repo.get(food_code)
        if food:
            foods.append(food)
        else:
            missing.append(food_code)
    if missing:
        raise HTTPException(status_code=404, detail={"missing_food_codes": missing})
    return NutritionCalculationResponse(foods=foods, totals=calculate_totals(foods))


@app.post("/api/missions/generate", response_model=MissionGenerateResponse)
def create_mission(request: MissionGenerateRequest):
    mission, foods = generate_mission(request.level, list(food_repo.all()), request.card_count)
    return MissionGenerateResponse(mission=mission, foods=foods)


@app.post("/api/mission/evaluate", response_model=MissionJudgement)
def evaluate_mission(request: MissionEvaluateRequest):
    try:
        if request.kind == "level1":
            mission = Level1Mission.model_validate(request.mission)
            return evaluate_level1(request.selected, request.dealt, mission)
        if request.kind == "level2":
            if request.totals is None:
                raise ValueError("LEVEL 2 평가에는 totals가 필요합니다.")
            mission = Level2Mission.model_validate(request.mission)
            return evaluate_level2(request.totals, mission)
        if request.totals is None:
            raise ValueError("LEVEL 3 평가에는 totals가 필요합니다.")
        mission = Level3Mission.model_validate(request.mission)
        return evaluate_level3(request.totals, mission)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/game/records", response_model=MatchRecord)
def create_game_record(record: MatchRecord):
    save_match(record)
    return record


@app.get("/api/game/records", response_model=list[MatchRecord])
def get_game_records(limit: int = Query(default=40, ge=1, le=200)):
    return list_matches(limit)


@app.get("/api/rankings", response_model=list[RankingItem])
def get_rankings(limit: int = Query(default=20, ge=1, le=100)):
    return rankings(limit)

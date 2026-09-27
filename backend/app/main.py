from contextlib import asynccontextmanager
import os
from typing import List, Optional

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
from app.services.public_data_sync import (
    env_flag,
    get_sync_status,
    load_backend_env,
    sync_menuzen_data,
)

food_repo = FoodRepository()


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_backend_env()

    # 운영/심사 환경에서만 켜면 서버 시작 시 메뉴젠 Open API를 갱신한다.
    # 실패하더라도 이미 검증된 캐시가 있으면 서비스는 계속 실행한다.
    if env_flag("SYNC_MENUZEN_ON_STARTUP", False):
        try:
            metadata = sync_menuzen_data()
            food_repo.refresh()
            print(
                "[Nutri-Deck] MenuGen API sync complete: {0} menus".format(
                    metadata.get("usable_game_menu_count", 0)
                )
            )
        except Exception as exc:
            print("[Nutri-Deck] MenuGen API sync skipped/failed: {0}".format(exc))

    food_repo.all()  # 캐시 데이터/스키마 검증
    init_db()
    yield


app = FastAPI(
    title="Nutri-Deck API",
    version="1.1.0",
    description="뉴트리 덱 게임 백엔드",
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
    return {
        "status": "ok",
        "food_count": len(food_repo.all()),
        "data_sync": get_sync_status(),
    }


@app.get("/api/data/status")
def data_status():
    return get_sync_status()


@app.post("/api/data/sync")
def data_sync():
    load_backend_env()
    if not env_flag("ENABLE_DATA_SYNC_ENDPOINT", False):
        raise HTTPException(
            status_code=403,
            detail="데이터 동기화 endpoint가 비활성화되어 있습니다.",
        )
    try:
        metadata = sync_menuzen_data()
        food_repo.refresh()
        return metadata
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/api/foods")
def get_foods(
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1, le=200),
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


@app.get("/api/game/records", response_model=List[MatchRecord])
def get_game_records(limit: int = Query(default=40, ge=1, le=200)):
    return list_matches(limit)


@app.get("/api/rankings", response_model=List[RankingItem])
def get_rankings(limit: int = Query(default=20, ge=1, le=100)):
    return rankings(limit)

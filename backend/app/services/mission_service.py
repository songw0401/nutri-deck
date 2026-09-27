from __future__ import annotations

import random

from app.models import (
    ConditionJudgement,
    Food,
    Level1Mission,
    Level2Mission,
    Level3Condition,
    Level3Mission,
    MissionJudgement,
    NutritionTotals,
)

NUTRIENT_META = {
    "energy_kcal": ("열량", "kcal"),
    "carbohydrate_g": ("탄수화물", "g"),
    "protein_g": ("단백질", "g"),
    "fat_g": ("지방", "g"),
    "fiber_g": ("식이섬유", "g"),
    "sugar_g": ("당류", "g"),
    "sodium_mg": ("나트륨", "mg"),
}

LEVEL1_TEMPLATES = [
    ("protein", "protein_g", "단백질 함량이 가장 높은 음식은 무엇일까요?", "highest"),
    ("fiber", "fiber_g", "식이섬유 함량이 가장 높은 음식은 무엇일까요?", "highest"),
    ("sodium", "sodium_mg", "나트륨 함량이 가장 높은 음식은 무엇일까요?", "highest"),
]

LEVEL3_CONDITIONS = [
    Level3Condition(id="protein", label="단백질", nutrient="protein_g", op="gte", value=25, unit="g"),
    Level3Condition(id="fiber", label="식이섬유", nutrient="fiber_g", op="gte", value=5, unit="g"),
    Level3Condition(id="sodium", label="나트륨", nutrient="sodium_mg", op="lte", value=1000, unit="mg"),
]


def generate_mission(level: int, foods: list[Food], card_count: int) -> tuple[dict, list[Food]]:
    if len(foods) < 2:
        raise ValueError("게임 문제 생성을 위해 최소 2개의 음식 데이터가 필요합니다.")
    dealt = random.sample(foods, min(card_count, len(foods)))

    if level == 1:
        mission_id, nutrient, prompt, direction = random.choice(LEVEL1_TEMPLATES)
        mission = Level1Mission(
            id=mission_id,
            level=1,
            prompt=prompt,
            nutrient=nutrient,
            direction=direction,
        ).model_dump()
    elif level == 2:
        mission = Level2Mission(
            id="kcal-700",
            level=2,
            prompt="700 kcal에 가장 가까운 한 끼를 구성하세요.",
            targetKcal=700,
            successGap=50,
        ).model_dump()
    else:
        mission = Level3Mission(
            id="balanced-meal",
            level=3,
            prompt="영양조건을 만족하는 한 끼를 구성하세요.",
            conditions=LEVEL3_CONDITIONS,
        ).model_dump()
    return mission, dealt


def evaluate_level1(selected: Food | None, dealt: list[Food], mission: Level1Mission) -> MissionJudgement:
    if not dealt:
        raise ValueError("LEVEL 1 평가에는 dealt 음식 목록이 필요합니다.")
    values = [float(getattr(food, mission.nutrient)) for food in dealt]
    target = max(values) if mission.direction == "highest" else min(values)
    answers = [food for food in dealt if float(getattr(food, mission.nutrient)) == target]
    correct = selected is not None and any(food.food_code == selected.food_code for food in answers)
    label, unit = NUTRIENT_META[mission.nutrient]
    actual = "선택 없음" if selected is None else f"{getattr(selected, mission.nutrient):g}{unit}"
    target_text = ", ".join(f"{f.food_name} {getattr(f, mission.nutrient):g}{unit}" for f in answers)
    return MissionJudgement(
        points=1 if correct else 0,
        maxPoints=1,
        headline="정답입니다!" if correct else "오답입니다.",
        detail=(f"{selected.food_name}의 {label}은 {actual}입니다." if correct and selected else f"정답은 {', '.join(f.food_name for f in answers)}입니다."),
        conditions=[ConditionJudgement(
            id=mission.id,
            label=mission.prompt,
            targetText=target_text,
            actualText=(f"{selected.food_name} {actual}" if selected else "시간 초과"),
            met=correct,
        )],
    )


def evaluate_level2(totals: NutritionTotals, mission: Level2Mission) -> MissionJudgement:
    gap = totals.energy_kcal - mission.targetKcal
    distance = abs(gap)
    success = distance <= mission.successGap
    return MissionJudgement(
        points=2 if success else 0,
        maxPoints=2,
        headline="정답!" if success else "목표와 차이가 있습니다.",
        detail=f"목표는 {mission.targetKcal:g}kcal, 내 식단은 {totals.energy_kcal:g}kcal, 차이는 {distance:g}kcal입니다.",
        conditions=[ConditionJudgement(
            id="target-kcal",
            label="목표 열량",
            targetText=f"{mission.targetKcal:g}kcal · 차이 {mission.successGap:g}kcal 이내",
            actualText=f"{totals.energy_kcal:g}kcal (차이 {gap:+g}kcal)",
            met=success,
        )],
    )


def _judge_condition(totals: NutritionTotals, condition: Level3Condition) -> ConditionJudgement:
    actual = float(getattr(totals, condition.nutrient))
    if condition.op == "between":
        min_v = condition.min or 0
        max_v = condition.max or 0
        met = min_v <= actual <= max_v
        target = f"{min_v:g}~{max_v:g}{condition.unit}"
    elif condition.op == "gte":
        value = condition.value or 0
        met = actual >= value
        target = f"{value:g}{condition.unit} 이상"
    else:
        value = condition.value or 0
        met = actual <= value
        target = f"{value:g}{condition.unit} 이하"
    return ConditionJudgement(
        id=condition.id,
        label=condition.label,
        targetText=target,
        actualText=f"{actual:g}{condition.unit}",
        met=met,
    )


def evaluate_level3(totals: NutritionTotals, mission: Level3Mission) -> MissionJudgement:
    conditions = [_judge_condition(totals, c) for c in mission.conditions]
    met_count = sum(c.met for c in conditions)
    return MissionJudgement(
        points=met_count,
        maxPoints=len(conditions),
        headline=f"{len(conditions)}개 조건 중 {met_count}개 충족",
        detail="조건마다 1점입니다. 이 점수는 건강도가 아니라 게임 미션 달성 점수입니다.",
        conditions=conditions,
    )

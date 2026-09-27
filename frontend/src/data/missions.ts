import type { Level1Mission, Level2Mission, Level3Mission, NutrientKey } from "../types";

export interface StudyNutrient {
  id: string;
  key: NutrientKey;
  label: string;
  direction: "highest" | "lowest";
  prompt: string;
  level3: {
    op: "gte" | "lte";
    value: number;
    unit: string;
  };
}

export const STUDY_SECONDS = 10;
export const LEARNED_CARD_COUNT = 6;
export const GOAL_POSITION = 8;
export const BOARD_SPACES = GOAL_POSITION + 1;
export const LEVEL1_ROUND_POINTS = 1;
export const LEVEL2_CLEAR_POINTS = 2;

export const studyNutrients: StudyNutrient[] = [
  { id: "protein", key: "protein_g", label: "단백질", direction: "highest", prompt: "단백질 함량이 가장 높은 음식은 무엇일까요?", level3: { op: "gte", value: 25, unit: "g" } },
  { id: "fiber", key: "fiber_g", label: "식이섬유", direction: "highest", prompt: "식이섬유 함량이 가장 높은 음식은 무엇일까요?", level3: { op: "gte", value: 5, unit: "g" } },
  { id: "sodium", key: "sodium_mg", label: "나트륨", direction: "highest", prompt: "나트륨 함량이 가장 높은 음식은 무엇일까요?", level3: { op: "lte", value: 1000, unit: "mg" } },
];

export const level2Mission: Level2Mission = {
  id: "kcal-700",
  level: 2,
  prompt: "700 kcal에 가장 가까운 한 끼를 구성하세요.",
  targetKcal: 700,
  successGap: 50,
};

export const boardDemoFoodCodes = ["MENU001", "MENU002", "MENU004", "MENU005", "MENU006", "MENU007"] as const;

export function missionForRound(round: number): Level1Mission {
  const nutrient = studyNutrients[round - 1] ?? studyNutrients[0];
  return { id: nutrient.id, level: 1, prompt: nutrient.prompt, nutrient: nutrient.key, direction: nutrient.direction };
}

export function buildLevel3Mission(): Level3Mission {
  return {
    id: "learned-nutrients",
    level: 3,
    prompt: "학습한 영양소 3가지 조건을 만족하는 한 끼를 구성하세요.",
    conditions: studyNutrients.map((nutrient) => ({
      id: nutrient.id,
      label: nutrient.label,
      nutrient: nutrient.key,
      op: nutrient.level3.op,
      value: nutrient.level3.value,
      unit: nutrient.level3.unit,
    })),
  };
}

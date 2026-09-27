import { getFoodByCode, foods } from "../data/foods";
import type { Food, MatchRecord, MissionJudgement, NutritionTotals } from "../types";
import { evaluateMission, type MissionEvaluationInput } from "../utils/missionEvaluator";
import { calculateNutrition, emptyNutrition } from "../utils/nutritionCalculator";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export interface CalculationResult {
  foods: Food[];
  totals: NutritionTotals;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchFoods(): Promise<Food[]> {
  try { return await request<Food[]>("/api/foods"); } catch { return foods; }
}

export async function fetchFoodByCode(foodCode: string): Promise<Food> {
  try { return await request<Food>(`/api/foods/${encodeURIComponent(foodCode)}`); }
  catch {
    const food = getFoodByCode(foodCode);
    if (!food) throw new Error(`food_code를 찾을 수 없습니다: ${foodCode}`);
    return food;
  }
}

export async function calculateNutritionByCodes(foodCodes: string[]): Promise<CalculationResult> {
  if (foodCodes.length === 0) return { foods: [], totals: emptyNutrition() };
  try {
    return await request<CalculationResult>("/api/nutrition/calculate", {
      method: "POST",
      body: JSON.stringify({ food_codes: foodCodes }),
    });
  } catch {
    const selected: Food[] = [];
    for (const foodCode of foodCodes) {
      const food = getFoodByCode(foodCode);
      if (!food) throw new Error(`food_code를 찾을 수 없습니다: ${foodCode}`);
      selected.push(food);
    }
    return { foods: selected, totals: calculateNutrition(selected) };
  }
}

export async function postEvaluateMission(input: MissionEvaluationInput): Promise<MissionJudgement> {
  try {
    return await request<MissionJudgement>("/api/mission/evaluate", { method: "POST", body: JSON.stringify(input) });
  } catch {
    return evaluateMission(input);
  }
}

export async function postGameRecord(record: MatchRecord): Promise<void> {
  try {
    await request<MatchRecord>("/api/game/records", { method: "POST", body: JSON.stringify(record) });
  } catch {
    // 로컬 시연 기록은 기존 GameContext가 별도로 저장한다.
  }
}

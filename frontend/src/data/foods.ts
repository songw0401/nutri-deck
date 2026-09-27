import catalog from "../../data/foods.json";
import type { Food } from "../types";

/**
 * 마지막 메뉴젠 Open API 동기화 결과를 프론트엔드 폴백 데이터로 사용한다.
 * 정상 실행 시에는 FastAPI가 data/processed/game_foods.json을 제공한다.
 */
export const foods = catalog as Food[];

const seen = new Set<string>();
for (const food of foods) {
  if (seen.has(food.food_code)) {
    throw new Error(`중복 food_code: ${food.food_code}`);
  }
  seen.add(food.food_code);
}

export function getFoodByCode(foodCode: string): Food | undefined {
  return foods.find((food) => food.food_code === foodCode);
}

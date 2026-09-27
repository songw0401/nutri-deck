import catalog from "../../data/foods.json";
import type { Food } from "../types";

/**
 * 목업용 완성 음식 메뉴 데이터.
 * 영양 수치는 국가표준식품성분 DB와 메뉴젠을 연결하기 전의 예시 값이다.
 * 각 항목은 이미 완성된 음식 메뉴 한 가지이며, 카드 한 장에 해당한다.
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

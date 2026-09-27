import { getFoodByCode, foods } from "../data/foods";
import type { Food } from "../types";

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap] as T;
    next[swap] = current as T;
  }
  return next;
}

export function getRandomFoodCards(count: number): Food[] {
  return shuffle(foods).slice(0, count);
}

export function getPresetFoodCards(foodCodes: readonly string[]): Food[] {
  return foodCodes.map((foodCode) => {
    const food = getFoodByCode(foodCode);
    if (!food) throw new Error(`알 수 없는 food_code: ${foodCode}`);
    return food;
  });
}

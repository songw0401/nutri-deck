import type { Food, NutrientKey, NutritionTotals } from "../types";

export function emptyNutrition(): NutritionTotals {
  return { energy_kcal: 0, carbohydrate_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };
}

function round1(value: number): number { return Math.round(value * 10) / 10; }

export function calculateNutrition(selectedFoods: Food[]): NutritionTotals {
  const totals = selectedFoods.reduce<NutritionTotals>((sum, food) => {
    const key: NutrientKey[] = ["energy_kcal", "carbohydrate_g", "protein_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg"];
    const next = { ...sum };
    for (const nutrient of key) next[nutrient] = sum[nutrient] + food[nutrient];
    return next;
  }, emptyNutrition());
  return {
    energy_kcal: Math.round(totals.energy_kcal),
    carbohydrate_g: round1(totals.carbohydrate_g),
    protein_g: round1(totals.protein_g),
    fat_g: round1(totals.fat_g),
    fiber_g: round1(totals.fiber_g),
    sugar_g: round1(totals.sugar_g),
    sodium_mg: Math.round(totals.sodium_mg),
  };
}

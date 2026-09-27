from typing import List

from app.models import Food, NutritionTotals

NUTRIENTS = (
    "energy_kcal",
    "carbohydrate_g",
    "protein_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
)


def calculate_totals(foods: List[Food]) -> NutritionTotals:
    sums = {key: 0.0 for key in NUTRIENTS}
    for food in foods:
        for key in NUTRIENTS:
            sums[key] += float(getattr(food, key))

    return NutritionTotals(
        energy_kcal=round(sums["energy_kcal"]),
        carbohydrate_g=round(sums["carbohydrate_g"], 1),
        protein_g=round(sums["protein_g"], 1),
        fat_g=round(sums["fat_g"], 1),
        fiber_g=round(sums["fiber_g"], 1),
        sugar_g=round(sums["sugar_g"], 1),
        sodium_mg=round(sums["sodium_mg"]),
    )

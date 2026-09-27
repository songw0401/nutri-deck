import { NUTRIENT_META } from "../types";
import type { Food, Level1Mission, Level2Mission, Level3Condition, Level3Mission, MissionJudgement, NutritionTotals } from "../types";
import { formatNutrient } from "./format";

export type MissionEvaluationInput =
  | { kind: "level1"; selected: Food | null; dealt: Food[]; mission: Level1Mission }
  | { kind: "level2"; totals: NutritionTotals; mission: Level2Mission }
  | { kind: "level3"; totals: NutritionTotals; mission: Level3Mission };

export function evaluateMission(input: MissionEvaluationInput): MissionJudgement {
  if (input.kind === "level1") return evaluateLevel1(input.selected, input.dealt, input.mission);
  if (input.kind === "level2") return evaluateLevel2(input.totals, input.mission);
  return evaluateLevel3(input.totals, input.mission);
}

function evaluateLevel1(selected: Food | null, dealt: Food[], mission: Level1Mission): MissionJudgement {
  const answers = bestFoods(dealt, mission);
  const correct = selected ? answers.some((food) => food.food_code === selected.food_code) : false;
  const meta = NUTRIENT_META[mission.nutrient];
  const actual = selected ? formatNutrient(mission.nutrient, selected[mission.nutrient]) : "선택 없음";
  return {
    points: correct ? 1 : 0,
    maxPoints: 1,
    headline: correct ? "정답입니다!" : "오답입니다.",
    detail: correct ? `${selected?.food_name ?? ""}의 ${meta.label}은 ${actual}입니다.` : `정답은 ${answers.map((food) => food.food_name).join(", ")}입니다.`,
    conditions: [{
      id: mission.id,
      label: mission.prompt,
      targetText: answers.map((food) => `${food.food_name} ${formatNutrient(mission.nutrient, food[mission.nutrient])}`).join(", "),
      actualText: selected ? `${selected.food_name} ${actual}` : "시간 초과",
      met: correct,
    }],
  };
}

export function bestFoods(dealt: Food[], mission: Level1Mission): Food[] {
  if (dealt.length === 0) return [];
  const values = dealt.map((food) => food[mission.nutrient]);
  const target = mission.direction === "highest" ? Math.max(...values) : Math.min(...values);
  return dealt.filter((food) => food[mission.nutrient] === target);
}

function evaluateLevel2(totals: NutritionTotals, mission: Level2Mission): MissionJudgement {
  const gap = totals.energy_kcal - mission.targetKcal;
  const distance = Math.abs(gap);
  const success = distance <= mission.successGap;
  return {
    points: success ? 2 : 0,
    maxPoints: 2,
    headline: success ? "정답!" : "목표와 차이가 있습니다.",
    detail: `목표는 ${mission.targetKcal}kcal, 내 식단은 ${totals.energy_kcal}kcal, 차이는 ${distance}kcal입니다.`,
    conditions: [{ id: "target-kcal", label: "목표 열량", targetText: `${mission.targetKcal}kcal · 차이 ${mission.successGap}kcal 이내`, actualText: `${totals.energy_kcal}kcal (차이 ${gap > 0 ? "+" : ""}${gap}kcal)`, met: success }],
  };
}

function evaluateLevel3(totals: NutritionTotals, mission: Level3Mission): MissionJudgement {
  const conditions = mission.conditions.map((condition) => judgeCondition(totals, condition));
  const metCount = conditions.filter((condition) => condition.met).length;
  return {
    points: metCount,
    maxPoints: mission.conditions.length,
    headline: `${mission.conditions.length}개 조건 중 ${metCount}개 충족`,
    detail: "조건마다 1점입니다. 이 점수는 건강도가 아니라 게임 미션 달성 점수입니다.",
    conditions,
  };
}

function judgeCondition(totals: NutritionTotals, condition: Level3Condition): MissionJudgement["conditions"][number] {
  const actual = totals[condition.nutrient];
  let met = false;
  let targetText = "";
  if (condition.op === "between") {
    const min = condition.min ?? 0;
    const max = condition.max ?? 0;
    met = actual >= min && actual <= max;
    targetText = `${min.toLocaleString("ko-KR")}~${max.toLocaleString("ko-KR")}${condition.unit}`;
  } else if (condition.op === "gte") {
    const value = condition.value ?? 0;
    met = actual >= value;
    targetText = `${value.toLocaleString("ko-KR")}${condition.unit} 이상`;
  } else {
    const value = condition.value ?? 0;
    met = actual <= value;
    targetText = `${value.toLocaleString("ko-KR")}${condition.unit} 이하`;
  }
  return { id: condition.id, label: condition.label, targetText, actualText: formatNutrient(condition.nutrient, actual), met };
}

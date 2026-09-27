import { SimplePage } from "../components/SimplePage";
import { foods } from "../data/foods";
import { FoodCard } from "../components/FoodCard";
import { FoodCardGrid } from "../components/FoodCardGrid";
export function Learn(){return <SimplePage title="학습 자료"><h1 className="text-3xl font-black">영양정보 학습</h1><p className="mt-2 text-neutral-600">게임에 사용되는 음식별 영양정보 예시입니다.</p><div className="mt-6"><FoodCardGrid>{foods.slice(0,6).map(food=><FoodCard key={food.food_code} food={food} showNutrition disabled/>)}</FoodCardGrid></div></SimplePage>;}

import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FoodCard } from "../components/FoodCard";
import { FoodCardGrid } from "../components/FoodCardGrid";
import { MealTray } from "../components/MealTray";
import { foods as fallbackFoods } from "../data/foods";
import { calculateNutritionByCodes, fetchFoods } from "../api/nutritionApi";
import type { Food, NutritionTotals } from "../types";
import { NUTRIENT_META } from "../types";
import { formatNutrient } from "../utils/format";

export function Play(){
  const [catalog,setCatalog]=useState<Food[]>(fallbackFoods);
  const [selected,setSelected]=useState<string[]>([]);
  const [totals,setTotals]=useState<NutritionTotals|null>(null);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    let active=true;
    fetchFoods().then(items=>{
      if(active&&items.length){
        setCatalog(items);
        setSelected(current=>current.filter(code=>items.some(food=>food.food_code===code)));
      }
    });
    return ()=>{active=false;};
  },[]);

  const chosen=useMemo(()=>catalog.filter(f=>selected.includes(f.food_code)),[catalog,selected]);
  function toggle(code:string){setSelected(cur=>cur.includes(code)?cur.filter(x=>x!==code):[...cur,code]);setTotals(null);}
  async function calculate(){setBusy(true);try{const result=await calculateNutritionByCodes(selected);setTotals(result.totals);}finally{setBusy(false);}}

  return <div className="min-h-screen bg-[#f4f6f5]"><Header/><main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]"><section><p className="text-sm font-black tracking-[0.15em] text-brand">NUTRI-DECK PLAY</p><h1 className="mt-1 text-3xl font-black">음식 카드를 선택해 한 끼를 구성하세요</h1><p className="mt-2 text-sm font-medium text-neutral-500">메뉴젠 Open API 기반 게임 데이터 {catalog.length.toLocaleString()}개</p><div className="mt-6"><FoodCardGrid>{catalog.slice(0,9).map(food=><FoodCard key={food.food_code} food={food} selected={selected.includes(food.food_code)} onSelect={toggle}/>)}</FoodCardGrid></div></section><aside className="space-y-4"><MealTray foods={chosen} onRemove={toggle} showEnergy/><button type="button" disabled={!selected.length||busy} onClick={calculate} className="w-full rounded-full bg-brand py-3 font-black text-white disabled:opacity-40">{busy?"계산 중...":"영양성분 계산"}</button>{totals&&<div className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-black">총 영양성분</h2><dl className="mt-3 space-y-2">{(Object.keys(NUTRIENT_META) as Array<keyof NutritionTotals>).map(key=><div key={key} className="flex justify-between text-sm"><dt>{NUTRIENT_META[key].label}</dt><dd className="font-bold">{formatNutrient(key,totals[key])}</dd></div>)}</dl></div>}</aside></main><Footer/></div>;
}

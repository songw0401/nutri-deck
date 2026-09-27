import { foods } from "../data/foods";

const frame = ["MENU001","MENU004","MENU002","MENU005","MENU006","MENU007","MENU008"];

export function FoodCollage({ variant }: { variant: "frame" | "fill" }) {
  const items = frame.map((code) => foods.find((f) => f.food_code === code)).filter(Boolean);
  if (variant === "frame") {
    return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>{items.map((food, i) => food && <img key={food.food_code} src={food.image} alt="" className="absolute hidden aspect-square w-36 rounded-full object-cover shadow-xl ring-4 ring-white md:block" style={{left:`${(i*13)%85}%`,top:`${10+(i*11)%70}%`}} />)}</div>;
  }
  return <div className="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-950" aria-hidden><div className="grid grid-cols-3 gap-2 opacity-70 sm:grid-cols-4 lg:grid-cols-6">{[...foods,...foods].map((food,index)=><img key={`${food.food_code}-${index}`} src={food.image} alt="" className="h-36 w-full object-cover sm:h-44" />)}</div><div className="absolute inset-0 bg-neutral-950/78" /></div>;
}

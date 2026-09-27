import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { FoodCollage } from "../components/FoodCollage";

export function Home() {
  return <div className="relative min-h-screen overflow-hidden bg-[#f4f6f5]"><Header/><main className="relative isolate flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16"><FoodCollage variant="frame"/><section className="relative z-10 mx-auto max-w-3xl text-center"><p className="text-sm font-black tracking-[0.18em] text-brand">PUBLIC DATA NUTRITION GAME</p><h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Nutri-Deck</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-neutral-600">공공데이터 기반 음식 카드를 비교하고 조합하며 영양정보를 익히는 체험형 교육 게임</p><Link to="/play" className="mt-8 inline-flex rounded-full bg-brand px-7 py-3.5 font-black text-white shadow-lg">게임 시작</Link></section></main><Footer/></div>;
}

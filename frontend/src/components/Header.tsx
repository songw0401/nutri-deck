import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { cx } from "../utils/format";

const links = [
  { to: "/", label: "홈", end: true },
  { to: "/about", label: "게임 소개", end: false },
  { to: "/learn", label: "학습 자료", end: false },
  { to: "/ranking", label: "랭킹", end: false },
  { to: "/me", label: "마이페이지", end: false },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    if (!authOpen) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setAuthOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight"><Logo /><span>Nutri-Deck</span></Link>
        <nav className="ml-6 hidden items-center gap-7 text-[15px] md:flex">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => cx("font-medium", isActive ? "font-bold text-brand" : "text-neutral-800 hover:text-brand")}>{link.label}</NavLink>)}</nav>
        <div className="ml-auto hidden items-center gap-2 md:flex"><button type="button" onClick={() => setAuthOpen(true)} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold">로그인</button><button type="button" onClick={() => setAuthOpen(true)} className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">회원가입</button></div>
        <button type="button" className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-neutral-200 md:hidden" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen((value) => !value)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && <div className="border-t border-black/5 bg-white px-4 py-3 md:hidden"><div className="flex flex-col gap-1">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)} className={({ isActive }) => cx("rounded-xl px-3 py-2", isActive ? "bg-emerald-50 font-bold text-brand" : "text-neutral-800")}>{link.label}</NavLink>)}</div></div>}
      {authOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-extrabold">바로 플레이할 수 있습니다</h2><p className="mt-2 text-sm leading-6 text-neutral-600">이 화면은 공모전 시연용 프로토타입입니다. 계정을 만들지 않고 음식 카드를 선택해 영양성분을 계산할 수 있습니다.</p><button type="button" onClick={() => setAuthOpen(false)} className="mt-5 w-full rounded-full bg-brand py-3 text-sm font-bold text-white">확인</button></div></div>}
    </header>
  );
}

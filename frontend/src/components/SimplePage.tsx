import type { ReactNode } from "react";
import { useEffect } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
export function SimplePage({ title, children }: { title: string; children: ReactNode }) { useEffect(()=>{document.title=`${title} · Nutri-Deck`;},[title]); return <div className="flex min-h-screen flex-col bg-[#f6f7f6]"><Header/><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main><Footer/></div>; }

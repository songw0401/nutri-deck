import { cx } from "../utils/format";
export function Footer({ tone = "light" }: { tone?: "light" | "dark" }) { return <footer className={cx("relative z-10 px-4 py-5 text-center text-xs", tone === "dark" ? "text-white/70" : "bg-white/75 text-neutral-500 backdrop-blur")}>© Nutri-Deck 2026 · 공공데이터 활용 공모전 시연용 프로토타입</footer>; }

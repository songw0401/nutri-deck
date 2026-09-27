import { BOARD_SPACES, GOAL_POSITION } from "../data/missions";
import { arcPath, spacePoint, spaceZone, stageZoneLabel, type Player } from "../game/boardRules";
import { GamePiece } from "./GamePiece";

const tileTheme = {
  start: { fill: "#fff7e8", ink: "#7c5a32", mark: "START" },
  level1: { fill: "#e7f8ee", ink: "#1b7a45", mark: "기억" },
  level2: { fill: "#fff4d8", ink: "#b45309", mark: "한 끼" },
  level3: { fill: "#e7f3ff", ink: "#1d4e89", mark: "조건" },
  goal: { fill: "#fff6d8", ink: "#92400e", mark: "GOAL" },
} as const;

export function BoardTrack({ players, displayPositions, currentPlayerId }: { players: Player[]; displayPositions: Record<number, number>; currentPlayerId: number | null }) {
  const spaces = Array.from({ length: BOARD_SPACES }, (_, index) => index);
  return (
    <section className="relative mx-auto w-full max-w-[700px]">
      <div className="relative aspect-square w-full rounded-[48px] bg-[radial-gradient(circle_at_50%_42%,#fffaf1_0%,#f3e6cf_55%,#e7d3ae_100%)] p-3 shadow-[0_24px_60px_rgba(92,64,28,0.18),inset_0_0_0_10px_#c8a56a] sm:p-6">
        <svg viewBox="0 0 100 100" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] sm:inset-6 sm:h-[calc(100%-3rem)] sm:w-[calc(100%-3rem)]" aria-hidden>
          <circle cx="50" cy="50" r="36" fill="none" stroke="#efe2cb" strokeWidth="16" />
          <path d={arcPath(1, 3)} fill="none" stroke="#8fd4a8" strokeWidth="15" strokeLinecap="round" />
          <path d={arcPath(4, 5)} fill="none" stroke="#f6c56b" strokeWidth="15" strokeLinecap="round" />
          <path d={arcPath(6, 7)} fill="none" stroke="#8ec5f6" strokeWidth="15" strokeLinecap="round" />
          <circle cx="50" cy="50" r="24" fill="#fffaf3" stroke="#eadcc4" strokeWidth="0.6" />
        </svg>
        <div className="pointer-events-none absolute inset-[27%] z-[1] grid place-items-center text-center">
          <div className="px-3">
            <p className="text-[11px] font-black tracking-[0.18em] text-[#1f9d55] sm:text-xs">NUTRI-DECK</p>
            <p className="mt-1 text-[10px] font-bold tracking-wide text-[#8a6a3b] sm:text-xs">FOOD × MEMORY × GAME</p>
            <p className="mt-2 text-sm font-black leading-5 text-[#3f342c] sm:text-base">배운 영양정보를 기억하고<br />먼저 GOAL에 도착하세요</p>
          </div>
        </div>
        <ZoneTag indexes={[2]} text={`LEVEL 1 · ${stageZoneLabel("level1")}`} />
        <ZoneTag indexes={[4, 5]} text={`LEVEL 2 · ${stageZoneLabel("level2")}`} />
        <ZoneTag indexes={[6, 7]} text={`LEVEL 3 · ${stageZoneLabel("level3")}`} />
        {spaces.map((index) => {
          const point = spacePoint(index);
          const zone = spaceZone(index);
          const theme = tileTheme[zone];
          return (
            <div key={index} className="absolute z-[2] grid h-11 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-2 text-center shadow-[0_6px_0_rgba(90,60,20,0.12)] sm:h-14 sm:w-16" style={{ left: `${point.x}%`, top: `${point.y}%`, background: theme.fill, borderColor: theme.ink, color: theme.ink }}>
              <TileMark zone={zone} />
              <span className="text-[8px] font-black leading-none sm:text-[10px]">{index === 0 || index === GOAL_POSITION ? theme.mark : index}</span>
            </div>
          );
        })}
        {players.map((player) => {
          const position = displayPositions[player.id] ?? player.position;
          const point = spacePoint(position);
          const mates = players.filter((other) => (displayPositions[other.id] ?? other.position) === position);
          const slot = mates.findIndex((other) => other.id === player.id);
          const spread = (slot - (mates.length - 1) / 2) * 58;
          const active = player.id === currentPlayerId;
          return (
            <div key={player.id} className="absolute z-[4]" style={{ left: `${point.x}%`, top: `${point.y}%`, transform: `translate(calc(-50% + ${spread}px), calc(-50% - 46px)) scale(${active ? 1.08 : 1})`, transition: "left 520ms ease, top 520ms ease, transform 520ms ease" }}>
              <GamePiece playerId={player.id} color={player.color} active={active} label={String(player.id)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ZoneTag({ indexes, text }: { indexes: number[]; text: string }) {
  const points = indexes.map((index) => spacePoint(index));
  const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  return <span className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-black text-[#6b5434] shadow-sm sm:text-[10px]" style={{ left: `${50 + (x - 50) * 0.72}%`, top: `${50 + (y - 50) * 0.72}%` }}>{text}</span>;
}

function TileMark({ zone }: { zone: keyof typeof tileTheme }) {
  if (zone === "goal") return <span className="text-sm leading-none">🏆</span>;
  if (zone === "start") return <span className="text-sm leading-none">⚑</span>;
  if (zone === "level1") return <span className="text-sm leading-none">🍃</span>;
  if (zone === "level2") return <span className="text-sm leading-none">🍽️</span>;
  return <span className="text-sm leading-none">📋</span>;
}

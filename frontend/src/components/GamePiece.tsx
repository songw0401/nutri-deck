export function GamePiece({ playerId, color, active, label }: { playerId: number; color: string; active: boolean; label: string }) {
  return (
    <span className="grid justify-items-center" aria-hidden>
      <svg viewBox="0 0 64 78" className="h-12 w-10 drop-shadow-[0_6px_6px_rgba(40,30,10,0.28)] sm:h-14 sm:w-12">
        <ellipse cx="32" cy="70" rx="16" ry="5" fill="rgba(40,30,10,0.25)" />
        <ellipse cx="32" cy="66" rx="14" ry="4.5" fill={color} />
        <ellipse cx="32" cy="64.5" rx="11" ry="3" fill="#fff" opacity="0.35" />
        {playerId === 1 && <ChefBody color={color} />}
        {playerId === 2 && <ExplorerBody color={color} />}
        {playerId === 3 && <DoctorBody color={color} />}
        {playerId === 4 && <FruitBody color={color} />}
      </svg>
      <span className="mt-0.5 rounded-full px-1.5 text-[9px] font-black text-white" style={{ background: color, outline: active ? "2px solid #1c1917" : "2px solid white" }}>{label}</span>
    </span>
  );
}

function ChefBody({ color }: { color: string }) { return <g><path d="M22 40h20l-2 18H24z" fill={color} /><circle cx="32" cy="30" r="9" fill="#f6d7b8" /><path d="M20 24c1-8 8-12 12-12s11 4 12 12c-3-2-6-1-8 1-2-3-5-4-8-3-2-2-5-2-8 2z" fill="#fff" /><circle cx="29" cy="30" r="1" fill="#3f342c" /><circle cx="35" cy="30" r="1" fill="#3f342c" /></g>; }
function ExplorerBody({ color }: { color: string }) { return <g><path d="M22 42h20l-1 16H23z" fill={color} /><circle cx="32" cy="32" r="8.5" fill="#f3c7a0" /><path d="M18 28h28l-2 4H20z" fill="#f4d35e" /><path d="M24 22h16l-2 6H26z" fill="#e8b931" /></g>; }
function DoctorBody({ color }: { color: string }) { return <g><path d="M21 41h22l-2 18H23z" fill={color} /><circle cx="32" cy="30" r="9" fill="#f6d7b8" /><path d="M23 24c2-6 6-8 9-8s7 2 9 8c-4 2-14 2-18 0z" fill="#3f342c" /><circle cx="28.5" cy="31" r="2.2" fill="none" stroke="#1e293b" strokeWidth="1" /><circle cx="35.5" cy="31" r="2.2" fill="none" stroke="#1e293b" strokeWidth="1" /></g>; }
function FruitBody({ color }: { color: string }) { return <g><circle cx="32" cy="40" r="16" fill={color} /><path d="M32 22c2 4 2 6 0 8" stroke="#3f6212" strokeWidth="1.4" fill="none" /><ellipse cx="36" cy="20" rx="5" ry="3" fill="#65a30d" transform="rotate(25 36 20)" /></g>; }

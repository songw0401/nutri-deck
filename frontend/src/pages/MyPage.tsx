import { SimplePage } from "../components/SimplePage";
import { useGame } from "../context/GameContext";
export function MyPage(){const {matches,clearMatches}=useGame();return <SimplePage title="마이페이지"><h1 className="text-3xl font-black">마이페이지</h1><p className="mt-4 text-neutral-600">저장된 게임 기록 {matches.length}개</p><button type="button" onClick={clearMatches} className="mt-4 rounded-full border px-4 py-2 text-sm font-bold">기록 초기화</button></SimplePage>;}

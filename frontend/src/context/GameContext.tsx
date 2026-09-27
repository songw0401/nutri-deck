import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MatchRecord } from "../types";
import { loadMatches, saveMatches } from "../utils/scoreStore";
import { postGameRecord } from "../api/nutritionApi";

interface GameContextValue {
  matches: MatchRecord[];
  recordMatch: (record: MatchRecord) => void;
  clearMatches: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchRecord[]>(() => loadMatches());

  const recordMatch = useCallback((record: MatchRecord) => {
    void postGameRecord(record);
    setMatches((current) => {
      if (current.some((item) => item.id === record.id)) return current;
      const next = [record, ...current].slice(0, 40);
      saveMatches(next);
      return next;
    });
  }, []);

  const clearMatches = useCallback(() => {
    saveMatches([]);
    setMatches([]);
  }, []);

  const value = useMemo(
    () => ({ matches, recordMatch, clearMatches }),
    [matches, recordMatch, clearMatches],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) {
    throw new Error("GameProvider가 필요합니다.");
  }
  return value;
}

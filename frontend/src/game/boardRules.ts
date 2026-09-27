import { getPresetFoodCards, getRandomFoodCards } from "../utils/cardRandomizer";
import type { ConditionJudgement, Food, NutritionTotals } from "../types";
import {
  BOARD_SPACES,
  GOAL_POSITION,
  LEARNED_CARD_COUNT,
  boardDemoFoodCodes,
  studyNutrients,
} from "../data/missions";

export type StageId = "level1" | "level2" | "level3";
export type PlayPhase =
  | "board"
  | "study"
  | "answer"
  | "roundResult"
  | "sessionResult"
  | "moving"
  | "done";

export const PLAYER_ROLES = [
  { role: "셰프", color: "#1f9d55" },
  { role: "탐험가", color: "#ea7a2f" },
  { role: "영양 박사", color: "#2f6fed" },
  { role: "과일 친구", color: "#8b5cf6" },
] as const;

export interface Player {
  id: number;
  name: string;
  role: string;
  color: string;
  position: number;
  totalScore: number;
}

export interface RoundNote {
  round: number;
  label: string;
  points: number;
}

export interface TurnFeedback {
  points: number;
  steps: number;
  reachedGoal: boolean;
  headline: string;
  detail: string;
  answerNames: string[];
  conditions: ConditionJudgement[];
  totals: NutritionTotals | null;
}

export interface BoardSession {
  startedAt: number;
  studyToken: number;
  playerCount: number;
  demoCards: boolean;
  foods: Food[];
  players: Player[];
  stage: StageId;
  round: number;
  phase: PlayPhase;
  currentPlayerIndex: number;
  pendingPoints: number;
  roundLog: RoundNote[];
  feedback: TurnFeedback | null;
  winnerId: number | null;
}

const phases: PlayPhase[] = [
  "board",
  "study",
  "answer",
  "roundResult",
  "sessionResult",
  "moving",
  "done",
];

export function createPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => {
    const role = PLAYER_ROLES[index] ?? PLAYER_ROLES[0];
    return {
      id: index + 1,
      name: `PLAYER ${index + 1}`,
      role: role.role,
      color: role.color,
      position: 0,
      totalScore: 0,
    };
  });
}

export function createSession(playerCount: number, demoCards: boolean): BoardSession {
  const foods = demoCards
    ? getPresetFoodCards(boardDemoFoodCodes)
    : getRandomFoodCards(LEARNED_CARD_COUNT);

  return {
    startedAt: Date.now(),
    studyToken: 0,
    playerCount,
    demoCards,
    foods,
    players: createPlayers(playerCount),
    stage: "level1",
    round: 1,
    phase: "board",
    currentPlayerIndex: 0,
    pendingPoints: 0,
    roundLog: [],
    feedback: null,
    winnerId: null,
  };
}

export function openTurn(session: BoardSession): BoardSession {
  return {
    ...session,
    round: 1,
    pendingPoints: 0,
    roundLog: [],
    feedback: null,
    phase: session.stage === "level1" ? "study" : "answer",
    studyToken: Date.now(),
  };
}

export function recordRound(
  session: BoardSession,
  points: number,
  result: Omit<TurnFeedback, "points" | "steps" | "reachedGoal">,
  label: string,
): BoardSession {
  return {
    ...session,
    phase: "roundResult",
    pendingPoints: session.pendingPoints + points,
    roundLog: [...session.roundLog, { round: session.round, label, points }],
    feedback: {
      ...result,
      points,
      steps: 0,
      reachedGoal: false,
    },
  };
}

export function confirmRound(session: BoardSession): BoardSession {
  const moreLevel1 = session.stage === "level1" && session.round < studyNutrients.length;
  if (moreLevel1) {
    return {
      ...session,
      round: session.round + 1,
      phase: "answer",
      feedback: null,
    };
  }
  if (session.stage === "level1") {
    return { ...session, phase: "sessionResult" };
  }
  return beginMove(session);
}

export function beginMove(session: BoardSession): BoardSession {
  const current = session.players[session.currentPlayerIndex];
  if (!current) return session;

  const points = session.pendingPoints;
  const steps = Math.max(0, Math.min(points, GOAL_POSITION - current.position));
  const position = current.position + steps;
  const reachedGoal = position >= GOAL_POSITION;
  const players = session.players.map((player, index) =>
    index === session.currentPlayerIndex
      ? { ...player, position, totalScore: player.totalScore + points }
      : player,
  );

  return {
    ...session,
    players,
    phase: "moving",
    pendingPoints: 0,
    winnerId: reachedGoal ? current.id : session.winnerId,
    feedback: {
      points,
      steps,
      reachedGoal,
      headline: stageDoneTitle(session.stage),
      detail: moveSentence(steps, reachedGoal),
      answerNames: [],
      conditions: session.feedback?.conditions ?? [],
      totals: session.feedback?.totals ?? null,
    },
  };
}

export function finishMove(session: BoardSession): BoardSession {
  if (session.winnerId || session.feedback?.reachedGoal) {
    return { ...session, phase: "done" };
  }

  const lastPlayer = session.currentPlayerIndex >= session.players.length - 1;
  if (!lastPlayer) {
    return {
      ...session,
      currentPlayerIndex: session.currentPlayerIndex + 1,
      round: 1,
      phase: "board",
      feedback: null,
      pendingPoints: 0,
      roundLog: [],
    };
  }

  if (session.stage === "level1") {
    return {
      ...session,
      stage: "level2",
      round: 1,
      currentPlayerIndex: 0,
      phase: "board",
      feedback: null,
      pendingPoints: 0,
      roundLog: [],
    };
  }

  if (session.stage === "level2") {
    return {
      ...session,
      stage: "level3",
      round: 1,
      currentPlayerIndex: 0,
      phase: "board",
      feedback: null,
      pendingPoints: 0,
      roundLog: [],
    };
  }

  const leader = [...session.players].sort(
    (left, right) => right.position - left.position || left.id - right.id,
  )[0];

  return {
    ...session,
    phase: "done",
    feedback: null,
    winnerId: leader?.id ?? null,
  };
}

export function spaceZone(index: number): "start" | "level1" | "level2" | "level3" | "goal" {
  if (index <= 0) return "start";
  if (index >= GOAL_POSITION) return "goal";
  if (index <= 3) return "level1";
  if (index <= 5) return "level2";
  return "level3";
}

export function spacePoint(index: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / BOARD_SPACES) * Math.PI * 2;
  const radius = 36;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

export function arcPath(from: number, to: number, radius = 36): string {
  const start = -Math.PI / 2 + ((from - 0.42) / BOARD_SPACES) * Math.PI * 2;
  const end = -Math.PI / 2 + ((to + 0.42) / BOARD_SPACES) * Math.PI * 2;
  const x1 = 50 + radius * Math.cos(start);
  const y1 = 50 + radius * Math.sin(start);
  const x2 = 50 + radius * Math.cos(end);
  const y2 = 50 + radius * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}

export function moveSentence(steps: number, reachedGoal: boolean): string {
  if (reachedGoal) {
    return steps > 0 ? `말이 ${steps}칸 이동해 GOAL에 도착합니다.` : "GOAL에 도착합니다.";
  }
  if (steps === 0) return "말은 이동하지 않습니다.";
  return `말이 ${steps}칸 이동합니다.`;
}

export function stageTitle(stage: StageId): string {
  if (stage === "level1") return "영양소 비교 게임";
  if (stage === "level2") return "한 끼 구성 게임";
  return "영양조건 맞추기";
}

export function stageZoneLabel(stage: StageId): string {
  if (stage === "level1") return "영양소 기억";
  if (stage === "level2") return "한 끼 구성";
  return "영양조건";
}

function stageDoneTitle(stage: StageId): string {
  if (stage === "level1") return "LEVEL 1 완료";
  if (stage === "level2") return "LEVEL 2 완료";
  return "LEVEL 3 완료";
}

export function isBoardSession(value: unknown): value is BoardSession {
  if (!value || typeof value !== "object") return false;
  const session = value as BoardSession;
  return (
    Array.isArray(session.players) &&
    Array.isArray(session.foods) &&
    session.foods.length > 0 &&
    Array.isArray(session.roundLog) &&
    typeof session.pendingPoints === "number" &&
    phases.includes(session.phase) &&
    (session.stage === "level1" || session.stage === "level2" || session.stage === "level3")
  );
}

import type { NutrientKey } from "../types";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatNutrient(key: NutrientKey, value: number): string {
  if (key === "energy_kcal") return `${Math.round(value).toLocaleString("ko-KR")}kcal`;
  if (key === "sodium_mg") return `${Math.round(value).toLocaleString("ko-KR")}mg`;
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}g`;
}

export function formatPlayedAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

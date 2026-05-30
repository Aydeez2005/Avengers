import { CardData } from "@/components/SwipeCard";

const KEY = "scout_matches";

export function getMatches(): CardData[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addMatch(card: CardData): void {
  const existing = getMatches();
  if (existing.find((m) => m.id === card.id)) return;
  localStorage.setItem(KEY, JSON.stringify([card, ...existing]));
}

export function clearMatches(): void {
  localStorage.removeItem(KEY);
}

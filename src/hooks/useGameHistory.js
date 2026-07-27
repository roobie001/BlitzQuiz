import { useState } from "react";

const HISTORY_KEY = "blitzquiz-history";
const MAX_HISTORY = 10;
const avgScore =
  history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
    : 0;

export function useGameHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });

  function addGame(entry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  function getBestByMode(mode) {
    const modeGames = history.filter((h) => h.mode === mode);
    if (modeGames.length === 0) return 0;
    return Math.max(...modeGames.map((h) => h.score));
  }

  return { history, addGame, clearHistory, getBestByMode, avgScore };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-quiz-results-v1";

/**
 * Proficiency system:
 *
 * Stars (0-3) based on difficulty of passing attempt:
 *   ⭐       = passed Easy at 70%+
 *   ⭐⭐     = passed Medium at 70%+
 *   ⭐⭐⭐   = passed Hard at 70%+
 *
 * Once a higher star is earned it can't go down.
 *
 * Proficiency score (0-100): weighted average of last 5 attempts
 *   Hard attempt   × 1.5 weight
 *   Medium attempt × 1.0 weight
 *   Easy attempt   × 0.5 weight
 * Capped at 100. Gives a living score that reflects recency + difficulty.
 */

const DIFF_WEIGHT = { hard: 1.5, medium: 1.0, easy: 0.5, mixed: 0.8 };

function calcStars(history, currentStars = 0) {
  // Stars never go down — only upgrade
  let best = currentStars;
  for (const h of (history || [])) {
    if (h.score < 70) continue;
    if (h.difficulty === "hard"   && best < 3) best = 3;
    if (h.difficulty === "medium" && best < 2) best = Math.max(best, 2);
    if (h.difficulty === "easy"   && best < 1) best = Math.max(best, 1);
  }
  return best;
}

function calcProficiency(history) {
  const recent = (history || []).slice(-5);
  if (!recent.length) return 0;
  let weightedSum = 0, totalWeight = 0;
  for (const h of recent) {
    const w = DIFF_WEIGHT[h.difficulty] || 0.8;
    weightedSum += h.score * w;
    totalWeight += w;
  }
  return Math.min(100, Math.round(weightedSum / totalWeight));
}

export function useQuizResults() {
  const [results, setResults] = useState({});
  const [loaded,  setLoaded]  = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    idbGet(KEY).then(stored => {
      if (stored) setResults(stored);
      setLoaded(true);
      skipSave.current = false;
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    idbSet(KEY, results);
  }, [results, loaded]);

  const recordQuizResult = useCallback((rmId, topics, score, total, difficulty = "mixed") => {
    const pct   = Math.round((score / total) * 100);
    const today = new Date().toISOString().slice(0, 10);

    setResults(prev => {
      const next = { ...prev };
      for (const topic of topics) {
        const k   = `${rmId}::${topic}`;
        const old = prev[k] || { stars: 0, bestScore: 0, proficiency: 0, attempts: 0, lastDate: null, history: [] };
        const newHistory = [...(old.history || []).slice(-19), { score: pct, date: today, difficulty }];
        const newStars   = calcStars(newHistory, old.stars || 0);
        next[k] = {
          stars:       newStars,
          bestScore:   Math.max(old.bestScore || 0, pct),
          proficiency: calcProficiency(newHistory),
          attempts:    (old.attempts || 0) + 1,
          lastDate:    today,
          history:     newHistory,
          passed:      pct >= 70, // legacy
        };
      }
      return next;
    });

    return { pct, passed: pct >= 70 };
  }, []);

  const getTopicResult = useCallback((rmId, topic) => {
    return results[`${rmId}::${topic}`] || null;
  }, [results]);

  const hasPassedTopic = useCallback((rmId, topic) => {
    return (results[`${rmId}::${topic}`]?.stars || 0) > 0;
  }, [results]);

  const getStars = useCallback((rmId, topic) => {
    return results[`${rmId}::${topic}`]?.stars || 0;
  }, [results]);

  const getProficiency = useCallback((rmId, topic) => {
    return results[`${rmId}::${topic}`]?.proficiency || 0;
  }, [results]);

  const replaceResults = useCallback((nextResults) => {
    const safeResults = nextResults && typeof nextResults === "object" ? nextResults : {};
    setResults(safeResults);
    idbSet(KEY, safeResults);
  }, []);

  return {
    results,
    recordQuizResult,
    getTopicResult,
    hasPassedTopic,
    getStars,
    getProficiency,
    replaceResults,
  };
}

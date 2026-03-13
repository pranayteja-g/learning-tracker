import { useState, useEffect, useCallback, useRef } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-quiz-results-v1";

/**
 * Star logic:
 * ⭐⭐⭐ = Hard mode, 100% score, achieved 3 separate times
 * No stars for Easy or Medium — those are practice only.
 */
function calcStars(history) {
  const hardPerfect = (history || []).filter(h => h.difficulty === "hard" && h.score === 100);
  if (hardPerfect.length >= 3) return 3;
  return 0;
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
        const old = prev[k] || { stars: 0, bestScore: 0, attempts: 0, lastDate: null, history: [] };
        const newHistory = [...(old.history || []).slice(-19), { score: pct, date: today, difficulty }];
        next[k] = {
          stars:     calcStars(newHistory),
          bestScore: Math.max(old.bestScore || 0, pct),
          attempts:  (old.attempts || 0) + 1,
          lastDate:  today,
          history:   newHistory,
          // keep legacy passed field for backwards compat
          passed:    pct >= 70,
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

  return { results, recordQuizResult, getTopicResult, hasPassedTopic, getStars };
}

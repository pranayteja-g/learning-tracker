import { useState, useEffect, useCallback, useRef } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-quiz-results-v1";

export function useQuizResults() {
  const [results, setResults] = useState({});
  const [loaded,  setLoaded]  = useState(false);
  const skipSave = useRef(true);

  // Load from IDB on mount
  useEffect(() => {
    idbGet(KEY).then(stored => {
      if (stored) setResults(stored);
      setLoaded(true);
      skipSave.current = false;
    });
  }, []);

  // Persist on change
  useEffect(() => {
    if (!loaded) return;
    idbSet(KEY, results);
  }, [results, loaded]);

  const recordQuizResult = useCallback((rmId, topics, score, total) => {
    const pct    = Math.round((score / total) * 100);
    const passed = pct >= 70;
    const today  = new Date().toISOString().slice(0, 10);

    setResults(prev => {
      const next = { ...prev };
      for (const topic of topics) {
        const k   = `${rmId}::${topic}`;
        const old = prev[k] || { passed: false, bestScore: 0, attempts: 0, lastDate: null, history: [] };
        next[k] = {
          passed:    old.passed || passed,
          bestScore: Math.max(old.bestScore, pct),
          attempts:  old.attempts + 1,
          lastDate:  today,
          history:   [...(old.history || []).slice(-9), { score: pct, date: today }],
        };
      }
      return next;
    });

    return { pct, passed };
  }, []);

  const getTopicResult = useCallback((rmId, topic) => {
    return results[`${rmId}::${topic}`] || null;
  }, [results]);

  const hasPassedTopic = useCallback((rmId, topic) => {
    return !!results[`${rmId}::${topic}`]?.passed;
  }, [results]);

  return { results, recordQuizResult, getTopicResult, hasPassedTopic };
}

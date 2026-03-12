import { useState, useCallback } from "react";

const KEY = "learning-tracker-quiz-results-v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

// key: `${rmId}::${topic}`
// value: { passed: bool, bestScore: 0-100, attempts: n, lastDate: "YYYY-MM-DD", history: [{score, date}] }

export function useQuizResults() {
  const [results, setResults] = useState(load);

  const recordQuizResult = useCallback((rmId, topics, score, total) => {
    const pct     = Math.round((score / total) * 100);
    const passed  = pct >= 70;
    const today   = new Date().toISOString().slice(0, 10);

    setResults(prev => {
      const next = { ...prev };
      for (const topic of topics) {
        const k    = `${rmId}::${topic}`;
        const old  = prev[k] || { passed: false, bestScore: 0, attempts: 0, lastDate: null, history: [] };
        next[k] = {
          passed:    old.passed || passed,   // once passed, stays passed
          bestScore: Math.max(old.bestScore, pct),
          attempts:  old.attempts + 1,
          lastDate:  today,
          history:   [...(old.history || []).slice(-9), { score: pct, date: today }],
        };
      }
      save(next);
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

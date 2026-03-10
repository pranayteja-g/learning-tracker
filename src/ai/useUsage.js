import { useState, useEffect, useCallback } from "react";

const USAGE_KEY = "learning-tracker-ai-usage-v1";
const CONFIG_KEY = "learning-tracker-ai-limit-v1";

// Returns today's date string in UTC e.g. "2025-03-10"
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    // Auto-reset: if stored date isn't today, start fresh
    if (data.date !== todayUTC()) {
      return { date: todayUTC(), requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
    return data;
  } catch {
    return { date: todayUTC(), requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
}

function loadLimit() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : { dailyTokenLimit: 50000, enabled: false };
  } catch {
    return { dailyTokenLimit: 50000, enabled: false };
  }
}

export function useUsage() {
  const [usage, setUsage] = useState(loadUsage);
  const [limit, setLimitState] = useState(loadLimit);

  // Check for day rollover every minute
  useEffect(() => {
    const id = setInterval(() => {
      setUsage(prev => {
        if (prev.date !== todayUTC()) {
          const fresh = { date: todayUTC(), requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
          localStorage.setItem(USAGE_KEY, JSON.stringify(fresh));
          return fresh;
        }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const recordUsage = useCallback(({ promptTokens = 0, completionTokens = 0 }) => {
    setUsage(prev => {
      const next = {
        date: todayUTC(),
        requests:         (prev.requests || 0) + 1,
        promptTokens:     (prev.promptTokens || 0) + promptTokens,
        completionTokens: (prev.completionTokens || 0) + completionTokens,
        totalTokens:      (prev.totalTokens || 0) + promptTokens + completionTokens,
      };
      localStorage.setItem(USAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const saveLimit = useCallback((newLimit) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newLimit));
    setLimitState(newLimit);
  }, []);

  const resetUsage = useCallback(() => {
    const fresh = { date: todayUTC(), requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    localStorage.setItem(USAGE_KEY, JSON.stringify(fresh));
    setUsage(fresh);
  }, []);

  // Whether the user is over their self-imposed limit
  const isOverLimit = limit.enabled && usage.totalTokens >= limit.dailyTokenLimit;
  const pct = limit.enabled ? Math.min(100, Math.round((usage.totalTokens / limit.dailyTokenLimit) * 100)) : 0;

  return { usage, limit, recordUsage, saveLimit, resetUsage, isOverLimit, pct };
}

import { useState, useCallback } from "react";

const KEY = "learning-tracker-streak-v1";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) || {
      current: 0, longest: 0, lastStudyDate: null, totalDays: 0,
    };
    const today = todayStr();
    const yesterday = yesterdayStr();
    if (data.lastStudyDate && data.lastStudyDate !== today && data.lastStudyDate !== yesterday) {
      const reset = { ...data, current: 0 };
      localStorage.setItem(KEY, JSON.stringify(reset));
      return reset;
    }
    return data;
  } catch { return { current: 0, longest: 0, lastStudyDate: null, totalDays: 0 }; }
}

function saveStreak(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function useStreak() {
  const [streak, setStreakState] = useState(loadStreak);

  // Call this whenever the user completes a topic
  const recordActivity = useCallback(() => {
    const today = todayStr();
    setStreakState(prev => {
      // Already recorded today — nothing to update
      if (prev.lastStudyDate === today) return prev;

      const yesterday = yesterdayStr();
      const isConsecutive = prev.lastStudyDate === yesterday;
      const newCurrent = isConsecutive ? prev.current + 1 : 1;
      const updated = {
        current:       newCurrent,
        longest:       Math.max(newCurrent, prev.longest),
        lastStudyDate: today,
        totalDays:     prev.totalDays + 1,
      };
      saveStreak(updated);
      return updated;
    });
  }, []);

  const studiedToday = streak.lastStudyDate === todayStr();

  const replaceStreak = useCallback((nextStreak) => {
    const safeStreak = nextStreak && typeof nextStreak === "object"
      ? nextStreak
      : { current: 0, longest: 0, lastStudyDate: null, totalDays: 0 };
    saveStreak(safeStreak);
    setStreakState(safeStreak);
  }, []);

  return { streak, recordActivity, studiedToday, replaceStreak };
}

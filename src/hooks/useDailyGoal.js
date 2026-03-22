import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-daily-goal-v1";

export function useDailyGoal() {
  const [data, setData] = useState({ goal: 5, history: {} }); // goal = topics per day

  useEffect(() => {
    idbGet(KEY).then(stored => { if (stored) setData(stored); });
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const save = useCallback((updated) => {
    setData(updated);
    idbSet(KEY, updated);
  }, []);

  const setGoal = useCallback((n) => {
    save({ ...data, goal: n });
  }, [data, save]);

  const recordTopicDone = useCallback(() => {
    const hist = { ...data.history };
    hist[today] = (hist[today] || 0) + 1;
    save({ ...data, history: hist });
  }, [data, today, save]);

  const todayCount  = data.history?.[today] || 0;
  const goalCount   = data.goal || 5;
  const pct         = Math.min(100, Math.round((todayCount / goalCount) * 100));
  const goalMet     = todayCount >= goalCount;

  // Streak of days goal was met
  const goalStreak = (() => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if ((data.history?.[key] || 0) >= goalCount) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  })();

  return { goal: goalCount, todayCount, pct, goalMet, goalStreak, setGoal, recordTopicDone };
}

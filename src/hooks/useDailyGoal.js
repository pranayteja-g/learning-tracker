import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

const DEFAULT_DATA = { goal: 5, history: {} }; // goal = topics per day

export function useDailyGoal(userId) {
  const [data, setData, loaded] = useCloudField(userId, "daily_goal", DEFAULT_DATA);

  const today = new Date().toISOString().slice(0, 10);

  const setGoal = useCallback((n) => {
    setData(prev => ({ ...prev, goal: n }));
  }, [setData]);

  const recordTopicDone = useCallback(() => {
    setData(prev => {
      const hist = { ...prev.history };
      hist[today] = (hist[today] || 0) + 1;
      return { ...prev, history: hist };
    });
  }, [setData, today]);

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

  return { goal: goalCount, todayCount, pct, goalMet, goalStreak, setGoal, recordTopicDone, loaded };
}

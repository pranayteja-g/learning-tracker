import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

const DEFAULT_STREAK = { current: 0, longest: 0, lastStudyDate: null, totalDays: 0 };

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useStreak(userId) {
  const [streak, setStreak, loaded] = useCloudField(userId, "streak", DEFAULT_STREAK);

  // Roll the streak over if it's stale (not touched today or yesterday) —
  // computed on read so it stays correct across midnight without a save.
  const today = todayStr();
  const yesterday = yesterdayStr();
  const effectiveStreak =
    streak.lastStudyDate && streak.lastStudyDate !== today && streak.lastStudyDate !== yesterday
      ? { ...streak, current: 0 }
      : streak;

  // Call this whenever the user completes a topic
  const recordActivity = useCallback(() => {
    setStreak(prev => {
      if (prev.lastStudyDate === today) return prev; // already recorded today
      const isConsecutive = prev.lastStudyDate === yesterday;
      const newCurrent = isConsecutive ? prev.current + 1 : 1;
      return {
        current:       newCurrent,
        longest:       Math.max(newCurrent, prev.longest),
        lastStudyDate: today,
        totalDays:     prev.totalDays + 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, yesterday]);

  const studiedToday = effectiveStreak.lastStudyDate === today;

  const replaceStreak = useCallback((nextStreak) => {
    setStreak(nextStreak && typeof nextStreak === "object" ? nextStreak : DEFAULT_STREAK);
  }, [setStreak]);

  return { streak: effectiveStreak, recordActivity, studiedToday, replaceStreak, loaded };
}

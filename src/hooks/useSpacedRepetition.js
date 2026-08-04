import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

// SM-2 simplified: interval doubles each successful review
// New topic → review in 1 day
// After pass → 3 days, 7 days, 14 days, 30 days
const INTERVALS = [1, 3, 7, 14, 30, 60]; // days

function nextReviewDate(level) {
  const days = INTERVALS[Math.min(level, INTERVALS.length - 1)];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isDue(nextReview) {
  const today = new Date().toISOString().slice(0, 10);
  return !nextReview || nextReview <= today;
}

export function useSpacedRepetition(userId) {
  const [srData, setSrData, loaded] = useCloudField(userId, "sr_data", {}); // key -> { level, nextReview, lastReview }

  const recordReview = useCallback((rmId, topic, passed) => {
    const k = `${rmId}::${topic}`;
    setSrData(prev => {
      const cur     = prev[k] || { level: 0 };
      const newLevel = passed ? Math.min(cur.level + 1, INTERVALS.length - 1) : 0;
      return {
        ...prev,
        [k]: {
          level:      newLevel,
          nextReview: nextReviewDate(newLevel),
          lastReview: new Date().toISOString().slice(0, 10),
        },
      };
    });
  }, [setSrData]);

  const getDueTopics = useCallback((roadmaps, progress) => {
    const due = [];
    for (const [rmId, rm] of Object.entries(roadmaps)) {
      for (const topics of Object.values(rm.sections || {})) {
        const flat = Array.isArray(topics) ? topics : [];
        for (const t of flat) {
          const topicStr = typeof t === "string" ? t : t?.name;
          if (!topicStr) continue;
          const k = `${rmId}::${topicStr}`;
          if (!progress[k]) continue; // only review completed topics
          const sr = srData[k];
          if (isDue(sr?.nextReview)) {
            due.push({
              rmId, topic: topicStr,
              rmLabel:   rm.label,
              rmColor:   rm.color,
              level:     sr?.level || 0,
              nextReview: sr?.nextReview || "new",
              overdueDays: sr?.nextReview
                ? Math.max(0, Math.floor((new Date() - new Date(sr.nextReview)) / 86400000))
                : 0,
            });
          }
        }
      }
    }
    return due.sort((a, b) => b.overdueDays - a.overdueDays);
  }, [srData]);

  const getTopicLevel = useCallback((rmId, topic) => {
    return srData[`${rmId}::${topic}`]?.level || 0;
  }, [srData]);

  const getNextReview = useCallback((rmId, topic) => {
    return srData[`${rmId}::${topic}`]?.nextReview || null;
  }, [srData]);

  return { srData, loaded, recordReview, getDueTopics, getTopicLevel, getNextReview };
}

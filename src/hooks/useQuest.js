import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

const COOLDOWN_MS = 4 * 60 * 60 * 1000;  // 4 hours

/**
 * Stores quests as { [rmId]: questObject }
 * Each quest: { rmId, title, topics, section, phases, status, phase,
 *               phaseResults, startedAt, completedAt, cooldownUntil }
 */
export function useQuest(userId) {
  const [quests, setQuests, loaded] = useCloudField(userId, "quests", {});

  const startQuest = useCallback((questData) => {
    setQuests(prev => ({
      ...prev,
      [questData.roadmapId]: {
        ...questData,
        status: "active",
        phase: 0,
        phaseResults: {},
        startedAt: Date.now(),
        cooldownUntil: null,
      },
    }));
  }, [setQuests]);

  const advancePhase = useCallback((rmId, phaseResult) => {
    setQuests(prev => {
      const q = prev[rmId];
      if (!q) return prev;
      return {
        ...prev,
        [rmId]: {
          ...q,
          phaseResults: { ...q.phaseResults, [q.phase]: phaseResult },
          phase: q.phase + 1,
        },
      };
    });
  }, [setQuests]);

  const completeQuest = useCallback((rmId, passed) => {
    setQuests(prev => {
      const q = prev[rmId];
      if (!q) return prev;
      return {
        ...prev,
        [rmId]: {
          ...q,
          status: passed ? "completed" : "failed",
          cooldownUntil: passed ? null : Date.now() + COOLDOWN_MS,
          completedAt: Date.now(),
        },
      };
    });
  }, [setQuests]);

  const clearQuest = useCallback((rmId) => {
    setQuests(prev => {
      const updated = { ...prev };
      delete updated[rmId];
      return updated;
    });
  }, [setQuests]);

  const getQuest = useCallback((rmId) => quests[rmId] || null, [quests]);

  const isOnCooldown = useCallback((rmId) => {
    const q = quests[rmId];
    return q?.status === "failed" && q?.cooldownUntil && Date.now() < q.cooldownUntil;
  }, [quests]);

  const cooldownRemaining = useCallback((rmId) => {
    const q = quests[rmId];
    return isOnCooldown(rmId) ? q.cooldownUntil - Date.now() : 0;
  }, [quests, isOnCooldown]);

  const needsNewQuest = useCallback((rmId) => {
    const q = quests[rmId];
    return !q ||
      q.status === "completed" ||
      (q.status === "failed" && !isOnCooldown(rmId));
  }, [quests, isOnCooldown]);

  const replaceQuests = useCallback((nextQuests) => {
    setQuests(nextQuests && typeof nextQuests === "object" ? nextQuests : {});
  }, [setQuests]);

  return {
    quests, loaded,
    getQuest, startQuest, advancePhase, completeQuest, clearQuest,
    isOnCooldown, cooldownRemaining, needsNewQuest,
    replaceQuests,
  };
}

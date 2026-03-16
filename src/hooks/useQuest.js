import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-quests-v2"; // v2 = per-roadmap
const COOLDOWN_MS = 4 * 60 * 60 * 1000;  // 4 hours

/**
 * Stores quests as { [rmId]: questObject }
 * Each quest: { rmId, title, topics, section, phases, status, phase,
 *               phaseResults, startedAt, completedAt, cooldownUntil }
 */
export function useQuest() {
  const [quests, setQuests] = useState({});  // rmId -> quest
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => {
      if (stored) setQuests(stored);
      setLoaded(true);
    });
  }, []);

  const save = useCallback((updated) => {
    setQuests(updated);
    idbSet(KEY, updated);
  }, []);

  const startQuest = useCallback((questData) => {
    setQuests(prev => {
      const updated = {
        ...prev,
        [questData.roadmapId]: {
          ...questData,
          status: "active",
          phase: 0,
          phaseResults: {},
          startedAt: Date.now(),
          cooldownUntil: null,
        },
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const advancePhase = useCallback((rmId, phaseResult) => {
    setQuests(prev => {
      const q = prev[rmId];
      if (!q) return prev;
      const updated = {
        ...prev,
        [rmId]: {
          ...q,
          phaseResults: { ...q.phaseResults, [q.phase]: phaseResult },
          phase: q.phase + 1,
        },
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const completeQuest = useCallback((rmId, passed) => {
    setQuests(prev => {
      const q = prev[rmId];
      if (!q) return prev;
      const updated = {
        ...prev,
        [rmId]: {
          ...q,
          status: passed ? "completed" : "failed",
          cooldownUntil: passed ? null : Date.now() + COOLDOWN_MS,
          completedAt: Date.now(),
        },
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const clearQuest = useCallback((rmId) => {
    setQuests(prev => {
      const updated = { ...prev };
      delete updated[rmId];
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

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

  return {
    quests, loaded,
    getQuest, startQuest, advancePhase, completeQuest, clearQuest,
    isOnCooldown, cooldownRemaining, needsNewQuest,
  };
}

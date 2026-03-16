import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-quest-v1";
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export function useQuest() {
  const [quest,   setQuest]   = useState(null);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => {
      if (stored) setQuest(stored);
      setLoaded(true);
    });
  }, []);

  const saveQuest = useCallback((q) => {
    setQuest(q);
    idbSet(KEY, q);
  }, []);

  const startQuest = useCallback((questData) => {
    const q = {
      ...questData,
      status: "active",        // active | completed | failed | cooldown
      phase: 0,                // 0=read, 1=mcq, 2=code, 3=qa
      phaseResults: {},        // phase -> { score, passed }
      startedAt: Date.now(),
      cooldownUntil: null,
    };
    saveQuest(q);
    return q;
  }, [saveQuest]);

  const advancePhase = useCallback((phaseResult) => {
    setQuest(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        phaseResults: { ...prev.phaseResults, [prev.phase]: phaseResult },
        phase: prev.phase + 1,
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const completeQuest = useCallback((passed) => {
    setQuest(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        status: passed ? "completed" : "failed",
        cooldownUntil: passed ? null : Date.now() + COOLDOWN_MS,
        completedAt: Date.now(),
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const clearQuest = useCallback(() => {
    saveQuest(null);
  }, [saveQuest]);

  const isOnCooldown = quest?.status === "failed" &&
    quest?.cooldownUntil && Date.now() < quest.cooldownUntil;

  const cooldownRemaining = isOnCooldown
    ? quest.cooldownUntil - Date.now()
    : 0;

  const needsNewQuest = (loaded && !quest) ||
    (loaded && quest?.status === "completed") ||
    (loaded && quest?.status === "failed" && !isOnCooldown);

  return {
    quest, loaded,
    startQuest, advancePhase, completeQuest, clearQuest,
    isOnCooldown, cooldownRemaining, needsNewQuest,
  };
}

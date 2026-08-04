import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

export const STATUS_CYCLE = ["not-started", "in-progress", "mastered"];

const uid = () => `log_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

function emptyEntry() {
  return {
    id: uid(),
    title: "",
    category: "",
    status: "not-started",
    notes: "",
    keyPoints: [],
    codeExamples: [],
    qa: [],
    bestPractices: [],
    roadmapId: null,   // optional link to a roadmap
    topic: null,        // optional link to a topic within that roadmap
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useLogbook(userId, onMasterTopic) {
  const [entries, setEntries, loaded] = useCloudField(userId, "logbook", []);

  const addEntry = useCallback((data) => {
    const entry = { ...emptyEntry(), ...data };
    setEntries(prev => [entry, ...prev]);
    return entry;
  }, [setEntries]);

  const updateEntry = useCallback((id, changes) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...changes, updatedAt: Date.now() } : e));
  }, [setEntries]);

  const deleteEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [setEntries]);

  // Cycle not-started -> in-progress -> mastered -> not-started
  // Reaching "mastered" on a linked entry auto-checks the roadmap topic.
  const cycleStatus = useCallback((id) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const idx = STATUS_CYCLE.indexOf(e.status);
      const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      if (nextStatus === "mastered" && e.roadmapId && e.topic && onMasterTopic) {
        onMasterTopic(e.roadmapId, e.topic);
      }
      return { ...e, status: nextStatus, updatedAt: Date.now() };
    }));
  }, [setEntries, onMasterTopic]);

  const setStatus = useCallback((id, status) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (status === "mastered" && e.roadmapId && e.topic && onMasterTopic) {
        onMasterTopic(e.roadmapId, e.topic);
      }
      return { ...e, status, updatedAt: Date.now() };
    }));
  }, [setEntries, onMasterTopic]);

  const getCategories = useCallback(() => {
    return [...new Set(entries.map(e => e.category).filter(Boolean))].sort();
  }, [entries]);

  const getEntryForTopic = useCallback((roadmapId, topic) => {
    return entries.find(e => e.roadmapId === roadmapId && e.topic === topic) || null;
  }, [entries]);

  const getStats = useCallback(() => ({
    total:      entries.length,
    mastered:   entries.filter(e => e.status === "mastered").length,
    inProgress: entries.filter(e => e.status === "in-progress").length,
    notStarted: entries.filter(e => e.status === "not-started").length,
  }), [entries]);

  const replaceEntries = useCallback((nextEntries) => {
    setEntries(Array.isArray(nextEntries) ? nextEntries : []);
  }, [setEntries]);

  return {
    entries, loaded,
    addEntry, updateEntry, deleteEntry, cycleStatus, setStatus,
    getCategories, getEntryForTopic, getStats, replaceEntries,
    emptyEntry,
  };
}

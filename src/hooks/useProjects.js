import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-projects-v1";

// status: "idea" | "inprogress" | "completed"

export function useProjects() {
  const [projects, setProjects] = useState({}); // { [rmId]: [project, ...] }
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => { if (stored) setProjects(stored); setLoaded(true); });
  }, []);

  const save = useCallback((updated) => {
    setProjects(updated);
    idbSet(KEY, updated);
  }, []);

  const addProjects = useCallback((rmId, newProjects) => {
    setProjects(prev => {
      const existing = prev[rmId] || [];
      const stamped  = newProjects.map(p => ({
        ...p,
        id:          `proj_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        status:      "idea",
        milestones:  (p.milestones || []).map(m => ({ ...m, done: false })),
        createdAt:   Date.now(),
        startedAt:   null,
        completedAt: null,
      }));
      const updated = { ...prev, [rmId]: [...existing, ...stamped] };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const updateProject = useCallback((rmId, projId, changes) => {
    setProjects(prev => {
      const list    = prev[rmId] || [];
      const updated = list.map(p => p.id === projId ? { ...p, ...changes } : p);
      const next    = { ...prev, [rmId]: updated };
      idbSet(KEY, next);
      return next;
    });
  }, []);

  const toggleMilestone = useCallback((rmId, projId, milestoneIdx) => {
    setProjects(prev => {
      const list = prev[rmId] || [];
      const updated = list.map(p => {
        if (p.id !== projId) return p;
        const milestones = p.milestones.map((m, i) =>
          i === milestoneIdx ? { ...m, done: !m.done } : m
        );
        return { ...p, milestones };
      });
      const next = { ...prev, [rmId]: updated };
      idbSet(KEY, next);
      return next;
    });
  }, []);

  const setStatus = useCallback((rmId, projId, status) => {
    const changes = {
      status,
      startedAt:   status === "inprogress" ? Date.now() : undefined,
      completedAt: status === "completed"  ? Date.now() : undefined,
    };
    updateProject(rmId, projId, changes);
  }, [updateProject]);

  const deleteProject = useCallback((rmId, projId) => {
    setProjects(prev => {
      const next = { ...prev, [rmId]: (prev[rmId] || []).filter(p => p.id !== projId) };
      idbSet(KEY, next);
      return next;
    });
  }, []);

  const getProjects = useCallback((rmId) => projects[rmId] || [], [projects]);

  const getStats = useCallback((rmId) => {
    const list = projects[rmId] || [];
    return {
      total:       list.length,
      idea:        list.filter(p => p.status === "idea").length,
      inprogress:  list.filter(p => p.status === "inprogress").length,
      completed:   list.filter(p => p.status === "completed").length,
    };
  }, [projects]);

  return { projects, loaded, addProjects, updateProject, toggleMilestone, setStatus, deleteProject, getProjects, getStats };
}

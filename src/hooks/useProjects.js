import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

// status: "idea" | "inprogress" | "completed"

export function useProjects(userId) {
  const [projects, setProjects, loaded] = useCloudField(userId, "projects", {}); // { [rmId]: [project, ...] }

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
      return { ...prev, [rmId]: [...existing, ...stamped] };
    });
  }, [setProjects]);

  const updateProject = useCallback((rmId, projId, changes) => {
    setProjects(prev => {
      const list = prev[rmId] || [];
      return { ...prev, [rmId]: list.map(p => p.id === projId ? { ...p, ...changes } : p) };
    });
  }, [setProjects]);

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
      return { ...prev, [rmId]: updated };
    });
  }, [setProjects]);

  const setStatus = useCallback((rmId, projId, status) => {
    const changes = {
      status,
      startedAt:   status === "inprogress" ? Date.now() : undefined,
      completedAt: status === "completed"  ? Date.now() : undefined,
    };
    updateProject(rmId, projId, changes);
  }, [updateProject]);

  const deleteProject = useCallback((rmId, projId) => {
    setProjects(prev => ({ ...prev, [rmId]: (prev[rmId] || []).filter(p => p.id !== projId) }));
  }, [setProjects]);

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

  const replaceProjects = useCallback((nextProjects) => {
    setProjects(nextProjects && typeof nextProjects === "object" ? nextProjects : {});
  }, [setProjects]);

  return { projects, loaded, addProjects, updateProject, toggleMilestone, setStatus, deleteProject, getProjects, getStats, replaceProjects };
}

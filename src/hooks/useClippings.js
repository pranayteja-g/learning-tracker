import { useCallback } from "react";
import { useCloudField } from "../lib/cloudField.js";

export function useClippings(userId) {
  const [clippings, setClippings, loaded] = useCloudField(userId, "clippings", []);

  const addClipping = useCallback((clipping) => {
    const item = {
      id:        `clip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      title:     clipping.title || "Untitled",
      content:   clipping.content || "",
      tags:      clipping.tags   || [],
      sourceUrl: clipping.sourceUrl || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setClippings(prev => [item, ...prev]);
    return item;
  }, [setClippings]);

  const updateClipping = useCallback((id, changes) => {
    setClippings(prev => prev.map(c => c.id === id
      ? { ...c, ...changes, updatedAt: Date.now() }
      : c));
  }, [setClippings]);

  const deleteClipping = useCallback((id) => {
    setClippings(prev => prev.filter(c => c.id !== id));
  }, [setClippings]);

  const searchClippings = useCallback((query) => {
    if (!query.trim()) return clippings;
    const q = query.toLowerCase();
    return clippings.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [clippings]);

  const replaceClippings = useCallback((nextClippings) => {
    setClippings(Array.isArray(nextClippings) ? nextClippings : []);
  }, [setClippings]);

  return { clippings, loaded, addClipping, updateClipping, deleteClipping, searchClippings, replaceClippings };
}

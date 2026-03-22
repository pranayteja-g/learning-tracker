import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-clippings-v1";

export function useClippings() {
  const [clippings, setClippings] = useState([]);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => { if (stored) setClippings(stored); setLoaded(true); });
  }, []);

  const save = useCallback((updated) => {
    setClippings(updated);
    idbSet(KEY, updated);
  }, []);

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
    setClippings(prev => {
      const updated = [item, ...prev];
      idbSet(KEY, updated);
      return updated;
    });
    return item;
  }, []);

  const updateClipping = useCallback((id, changes) => {
    setClippings(prev => {
      const updated = prev.map(c => c.id === id
        ? { ...c, ...changes, updatedAt: Date.now() }
        : c);
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const deleteClipping = useCallback((id) => {
    setClippings(prev => {
      const updated = prev.filter(c => c.id !== id);
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  const searchClippings = useCallback((query) => {
    if (!query.trim()) return clippings;
    const q = query.toLowerCase();
    return clippings.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [clippings]);

  return { clippings, loaded, addClipping, updateClipping, deleteClipping, searchClippings };
}

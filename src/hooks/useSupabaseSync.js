import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const TABLE = "user_data";

export async function loadFromSupabase(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function saveToSupabase(userId, payload) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      user_id:    userId,
      roadmaps:   payload.roadmaps   ?? {},
      progress:   payload.progress   ?? {},
      notes:      payload.notes      ?? {},
      resources:  payload.resources  ?? {},
      topic_meta: payload.topicMeta  ?? {},
      clippings:  payload.clippings  ?? [],
      projects:   payload.projects   ?? {},
      logbook:    payload.logbook    ?? [],
      xp_data:    payload.xpData     ?? {},
      quests:     payload.quests     ?? {},
      daily_goal: payload.dailyGoal  ?? {},
      sr_data:    payload.srData     ?? {},
    }, { onConflict: "user_id" });
  if (error) throw error;
}

/**
 * Simplified sync:
 * - save()  → debounced 1.5s, batches rapid changes
 * - flush() → immediate, for important saves
 * - onRemoteData fires when window regains focus and Supabase has fresh data
 */
export function useSupabaseSync(userId, getSnapshot, onRemoteData) {
  const savingRef   = useRef(false);
  const snapshotRef = useRef(getSnapshot);
  const onRemoteRef = useRef(onRemoteData);
  const timerRef    = useRef(null);

  useEffect(() => { snapshotRef.current = getSnapshot; },  [getSnapshot]);
  useEffect(() => { onRemoteRef.current = onRemoteData; }, [onRemoteData]);

  // Debounced save — batches rapid toggles
  const save = useCallback(() => {
    if (!userId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        await saveToSupabase(userId, snapshotRef.current());
      } catch (e) {
        console.error("[Sync] Save failed:", e.message);
      } finally {
        savingRef.current = false;
      }
    }, 1500);
  }, [userId]);

  // Immediate flush — for important actions (note saved etc)
  const flush = useCallback(async () => {
    if (!userId) return;
    clearTimeout(timerRef.current);
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await saveToSupabase(userId, snapshotRef.current());
    } catch (e) {
      console.error("[Sync] Flush failed:", e.message);
    } finally {
      savingRef.current = false;
    }
  }, [userId]);

  // Refetch on window focus — cross-device sync
  useEffect(() => {
    if (!userId) return;
    let lastFetch = 0;

    const handleVisible = async () => {
      const now = Date.now();
      if (now - lastFetch < 10_000) return; // throttle to once per 10s
      lastFetch = now;
      try {
        const data = await loadFromSupabase(userId);
        if (data) onRemoteRef.current?.(data);
      } catch (e) {
        console.error("[Sync] Refetch failed:", e.message);
      }
    };

    const onFocus = () => handleVisible();
    const onVisibility = () => { if (document.visibilityState === "visible") handleVisible(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { save, flush };
}

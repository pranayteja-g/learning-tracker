import { useRef, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const TABLE = "user_data";

/**
 * Load all user data from Supabase.
 * Returns null if no row exists yet.
 */
export async function loadFromSupabase(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
    throw error;
  }
  return data || null;
}

/**
 * Save (upsert) all user data to Supabase.
 */
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
 * Hook that provides a debounced save function.
 * Marks dirty on every call, then saves 3s after last change.
 * Also saves on page unload.
 */
export function useSupabaseSync(userId, getSnapshot) {
  const dirtyRef    = useRef(false);
  const timerRef    = useRef(null);
  const savingRef   = useRef(false);

  const flush = useCallback(async () => {
    if (!userId || !dirtyRef.current || savingRef.current) return;
    savingRef.current = true;
    dirtyRef.current  = false;
    try {
      await saveToSupabase(userId, getSnapshot());
    } catch (e) {
      console.error("Supabase save failed:", e.message);
      dirtyRef.current = true; // retry on next trigger
    } finally {
      savingRef.current = false;
    }
  }, [userId, getSnapshot]);

  // Debounced mark-and-save
  const markDirty = useCallback(() => {
    if (!userId) return;
    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 3000);
  }, [userId, flush]);

  // Periodic save every 60s
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(flush, 60_000);
    return () => clearInterval(interval);
  }, [userId, flush]);

  // Save on tab close / navigation away
  useEffect(() => {
    if (!userId) return;
    const handler = () => {
      if (dirtyRef.current) {
        // Use sendBeacon for reliability on page close
        const payload = JSON.stringify({ userId, data: getSnapshot() });
        navigator.sendBeacon?.("/api/sync", payload); // fallback, flush is better
        flush();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [userId, flush, getSnapshot]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { markDirty, flush };
}

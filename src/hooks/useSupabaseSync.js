import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const TABLE = "user_data";

// ── Public helpers ────────────────────────────────────────────────────────────

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
 * Core sync hook.
 *
 * DESIGN:
 *   - markDirty() is called after React has committed new state.
 *     It debounces and saves a snapshot taken AFTER the render.
 *   - The snapshot is always taken fresh at save time, never at mark time.
 *   - If a save is in flight, we set a "pendingAfterSave" flag so we
 *     run one final save when the current one completes.
 *   - On window focus we refetch from Supabase for cross-device sync.
 *
 * USAGE in App.jsx:
 *   const { markDirty } = useSupabaseSync(userId, getSnapshot, onRemoteData);
 *
 *   // After ANY state change, call markDirty() from a useEffect:
 *   useEffect(() => {
 *     if (!isGuest) markDirty();
 *   }, [progress, notes, roadmaps, ...]);
 */
export function useSupabaseSync(userId, getSnapshot, onRemoteData) {
  const savingRef  = useRef(false);
  const pendingRef = useRef(false);   // a save arrived while one was in flight
  const timerRef   = useRef(null);
  const snapRef    = useRef(getSnapshot);
  const remoteRef  = useRef(onRemoteData);

  // Always keep refs current — these are read at save time, not mark time
  useEffect(() => { snapRef.current  = getSnapshot;  }, [getSnapshot]);
  useEffect(() => { remoteRef.current = onRemoteData; }, [onRemoteData]);

  const doSave = useCallback(async () => {
    if (!userId) return;
    if (savingRef.current) {
      // A save is already in flight — remember to run again after it finishes
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    pendingRef.current = false;
    try {
      // Snapshot is taken HERE — after React has committed, so state is fresh
      await saveToSupabase(userId, snapRef.current());
    } catch (e) {
      console.error("[Sync] Save failed:", e.message);
      pendingRef.current = true; // retry
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        // More changes arrived while we were saving — save again
        timerRef.current = setTimeout(doSave, 500);
      }
    }
  }, [userId]);

  // markDirty: debounce 1.5s then save
  const markDirty = useCallback(() => {
    if (!userId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 1500);
  }, [userId, doSave]);

  // Refetch on window focus — cross-device sync
  useEffect(() => {
    if (!userId) return;
    let lastFetch = 0;

    const handleVisible = async () => {
      const now = Date.now();
      if (now - lastFetch < 15_000) return; // throttle: max once per 15s
      lastFetch = now;
      try {
        const data = await loadFromSupabase(userId);
        if (data) remoteRef.current?.(data);
      } catch (e) {
        console.error("[Sync] Refetch failed:", e.message);
      }
    };

    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleVisible();
    });
    return () => {
      window.removeEventListener("focus", handleVisible);
    };
  }, [userId]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { markDirty };
}

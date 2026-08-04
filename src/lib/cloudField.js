/**
 * useCloudField — replaces the old "useIDBState" pattern.
 *
 * Instead of persisting to IndexedDB and lazily syncing to Supabase on a
 * debounce, this hook treats a single Supabase column as the source of
 * truth and writes straight through to it:
 *
 *   - On mount (once userId is available) it loads the column.
 *   - Local React state updates the UI instantly (optimistic).
 *   - Changes are pushed to Supabase after a short debounce (to coalesce
 *     rapid-fire updates like typing), and flushed immediately if the tab
 *     is hidden/closed so a refresh right after an edit doesn't lose it.
 *   - There is no local cache to go stale and "win" over a fresh edit —
 *     Supabase is the only place data lives, so there's nothing to
 *     reconcile on reload.
 *
 * Each domain (progress, notes, streak, quests, ...) lives in its own
 * column, so independent hooks can save independently without clobbering
 * each other's data (Supabase upsert only touches the columns you send).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const TABLE = "user_data";
const SAVE_DEBOUNCE_MS = 300;

export function useCloudField(userId, column, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  const valueRef = useRef(value);
  valueRef.current = value;

  const skipNextSaveRef = useRef(true); // don't save the value we just loaded
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef(null);

  // Load once per userId
  useEffect(() => {
    if (!userId) { setLoaded(false); return; }
    let cancelled = false;
    skipNextSaveRef.current = true;
    setLoaded(false);

    supabase
      .from(TABLE)
      .select(column)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(`[cloud] load "${column}" failed:`, error.message);
        } else if (data && data[column] != null) {
          setValue(data[column]);
        }
        setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId, column]);

  const doSave = useCallback(async () => {
    if (!userId) return;
    if (savingRef.current) { pendingRef.current = true; return; }
    savingRef.current = true;
    pendingRef.current = false;
    setStatus("saving");
    try {
      const { error } = await supabase
        .from(TABLE)
        .upsert({ user_id: userId, [column]: valueRef.current }, { onConflict: "user_id" });
      if (error) throw error;
      setStatus("saved");
    } catch (e) {
      console.error(`[cloud] save "${column}" failed:`, e.message);
      setStatus("error");
      pendingRef.current = true; // retry
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        timerRef.current = setTimeout(doSave, 500);
      }
    }
  }, [userId, column]);

  // Debounced save on change
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded]);

  // Flush immediately if a save is pending and the tab is about to go away —
  // narrows the "refresh right after an edit" window down to network latency
  // instead of the full debounce.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        doSave();
      }
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [doSave]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [value, setValue, loaded, status];
}

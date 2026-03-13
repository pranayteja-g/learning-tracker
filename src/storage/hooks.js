import { useState, useEffect, useRef } from "react";
import { idbGet, idbSet, migrateFromLocalStorage } from "./db.js";
import { STORAGE_KEY, NOTES_KEY, ROADMAPS_KEY, RESOURCES_KEY, TOPIC_META_KEY } from "./keys.js";

const MIGRATE_DONE_KEY = "learning-tracker-idb-migrated-v1";

// Keys to migrate from localStorage → IndexedDB on first run
const MIGRATE_KEYS = [
  STORAGE_KEY, NOTES_KEY, ROADMAPS_KEY, RESOURCES_KEY, TOPIC_META_KEY,
  "learning-tracker-quiz-results-v1",
];

/**
 * Like useState but persisted to IndexedDB.
 * Returns [value, setValue, loaded]
 */
function useIDBState(key, defaultValue) {
  const [value,  setValue]  = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(true); // don't save on first load

  // Load on mount
  useEffect(() => {
    idbGet(key).then(stored => {
      if (stored !== null) setValue(stored);
      setLoaded(true);
      skipNextSave.current = false;
    });
  }, [key]);

  // Save on change (but not the initial load)
  useEffect(() => {
    if (!loaded) return;
    idbSet(key, value);
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

/**
 * Run once: migrate localStorage data into IndexedDB.
 * Marks completion so it never runs again.
 */
async function runMigration() {
  if (localStorage.getItem(MIGRATE_DONE_KEY)) return;
  try {
    const migrated = await migrateFromLocalStorage(MIGRATE_KEYS);
    if (migrated.length > 0) {
      console.log(`[storage] Migrated ${migrated.length} keys to IndexedDB:`, migrated);
    }
    localStorage.setItem(MIGRATE_DONE_KEY, "1");
  } catch (e) {
    console.warn("[storage] Migration failed, will retry next load:", e);
  }
}

export function useAppStorage() {
  const [roadmaps,  setRoadmaps,  roadmapsLoaded]  = useIDBState(ROADMAPS_KEY,   {});
  const [progress,  setProgress,  progressLoaded]  = useIDBState(STORAGE_KEY,    {});
  const [notes,     setNotes,     notesLoaded]     = useIDBState(NOTES_KEY,       {});
  const [resources, setResources, resourcesLoaded] = useIDBState(RESOURCES_KEY,  {});
  const [topicMeta, setTopicMeta, metaLoaded]      = useIDBState(TOPIC_META_KEY, {});

  // Run migration once on first mount
  useEffect(() => { runMigration(); }, []);

  const loaded = roadmapsLoaded && progressLoaded && notesLoaded && resourcesLoaded && metaLoaded;

  return {
    roadmaps, setRoadmaps,
    progress, setProgress,
    notes,    setNotes,
    resources, setResources,
    topicMeta, setTopicMeta,
    loaded,
  };
}

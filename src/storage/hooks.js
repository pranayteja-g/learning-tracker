import { useState, useEffect } from "react";
import { STORAGE_KEY, NOTES_KEY, ROADMAPS_KEY, RESOURCES_KEY, TOPIC_META_KEY } from "./keys.js";

function usePersisted(key, defaultValue = {}) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

export function useAppStorage() {
  const [roadmaps,  setRoadmaps,  roadmapsLoaded]  = usePersisted(ROADMAPS_KEY,   {});
  const [progress,  setProgress,  progressLoaded]  = usePersisted(STORAGE_KEY,    {});
  const [notes,     setNotes,     notesLoaded]     = usePersisted(NOTES_KEY,       {});
  const [resources, setResources, resourcesLoaded] = usePersisted(RESOURCES_KEY,  {});
  const [topicMeta, setTopicMeta, metaLoaded]      = usePersisted(TOPIC_META_KEY, {});

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

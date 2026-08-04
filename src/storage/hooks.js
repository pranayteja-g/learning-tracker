import { useCloudField } from "../lib/cloudField.js";

/**
 * Core app state — roadmaps, progress, notes, resources, topic metadata —
 * now backed directly by Supabase columns instead of IndexedDB.
 * Requires a signed-in user; there is no local/offline fallback.
 */
export function useAppStorage(userId) {
  const [roadmaps,  setRoadmaps,  roadmapsLoaded]  = useCloudField(userId, "roadmaps",   {});
  const [progress,  setProgress,  progressLoaded]  = useCloudField(userId, "progress",   {});
  const [notes,     setNotes,     notesLoaded]     = useCloudField(userId, "notes",      {});
  const [resources, setResources, resourcesLoaded] = useCloudField(userId, "resources",  {});
  const [topicMeta, setTopicMeta, metaLoaded]      = useCloudField(userId, "topic_meta", {});

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

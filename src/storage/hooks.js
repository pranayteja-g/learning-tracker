import { useCloudField } from "../lib/cloudField.js";

/**
 * Core app state — roadmaps, progress, notes, resources, topic metadata —
 * now backed directly by Supabase columns instead of IndexedDB.
 * Requires a signed-in user; there is no local/offline fallback.
 */
export function useAppStorage(userId) {
  const [roadmaps,  setRoadmaps,  roadmapsLoaded,  roadmapsStatus]  = useCloudField(userId, "roadmaps",   {});
  const [progress,  setProgress,  progressLoaded,  progressStatus]  = useCloudField(userId, "progress",   {});
  const [notes,     setNotes,     notesLoaded,     notesStatus]     = useCloudField(userId, "notes",      {});
  const [resources, setResources, resourcesLoaded, resourcesStatus] = useCloudField(userId, "resources",  {});
  const [topicMeta, setTopicMeta, metaLoaded,      metaStatus]      = useCloudField(userId, "topic_meta", {});

  const loaded = roadmapsLoaded && progressLoaded && notesLoaded && resourcesLoaded && metaLoaded;

  // Surface a stuck/failing load (retrying in the background inside
  // useCloudField) so the UI can tell the user something's wrong instead of
  // just spinning forever. See cloudField.js for why we never fake `loaded`.
  const statuses = [roadmapsStatus, progressStatus, notesStatus, resourcesStatus, metaStatus];
  const hasLoadError = statuses.includes("load-error");
  const hasSaveError = statuses.includes("error");

  return {
    roadmaps, setRoadmaps,
    progress, setProgress,
    notes,    setNotes,
    resources, setResources,
    topicMeta, setTopicMeta,
    loaded,
    hasLoadError,
    hasSaveError,
  };
}

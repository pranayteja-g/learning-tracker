import { flatTopicNames, topicName } from "./topics.js";
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function validateRoadmap(data) {
  if (!data.id || !data.label || !data.sections) return "Missing required fields (id, label, sections)";
  if (typeof data.sections !== "object") return "sections must be an object";
  for (const [sec, topics] of Object.entries(data.sections)) {
    if (!Array.isArray(topics)) return `Section "${sec}" must be an array`;
    if (!Array.isArray(topics)) return `Section "${sec}" must be an array of topics`;
    if (topics.some(t => typeof t !== "string")) return `All topics in "${sec}" must be strings`;
  }
  return null;
}

export function getRoadmapStats(roadmap, progress) {
  if (!roadmap) return { total: 0, done: 0, pct: 0 };
  let total = 0, done = 0;
  Object.values(roadmap.sections).forEach(ts =>
    ts.forEach(t => { total++; if (progress[`${roadmap.id}::${t}`]) done++; })
  );
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function getTotalStats(roadmaps, progress) {
  let total = 0, done = 0;
  Object.values(roadmaps).forEach(rm => {
    const s = getRoadmapStats(rm, progress);
    total += s.total; done += s.done;
  });
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function getNextUp(roadmap, progress, count = 5) {
  if (!roadmap) return [];
  const items = [];
  for (const [sec, ts] of Object.entries(roadmap.sections))
    for (const t of flatTopicNames(ts)) {
      if (!progress[`${roadmap.id}::${t}`]) items.push({ section: sec, topic: t });
      if (items.length >= count) return items;
    }
  return items;
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

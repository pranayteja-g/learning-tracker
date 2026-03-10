// Builds minimal, scoped context objects for each AI feature.
// We never send the entire app state — only what's relevant to the request.

export function buildQuizContext({ roadmap, progress, scope, sectionKey }) {
  const rmId = roadmap.id;

  let topics = [];

  if (scope === "section" && sectionKey) {
    const ts = roadmap.sections[sectionKey] || [];
    topics = ts.map(t => ({ topic: t, done: !!progress[`${rmId}::${t}`], section: sectionKey }));
  } else if (scope === "completed") {
    for (const [sec, ts] of Object.entries(roadmap.sections))
      for (const t of ts)
        if (progress[`${rmId}::${t}`]) topics.push({ topic: t, done: true, section: sec });
  } else {
    // full roadmap
    for (const [sec, ts] of Object.entries(roadmap.sections))
      for (const t of ts)
        topics.push({ topic: t, done: !!progress[`${rmId}::${t}`], section: sec });
  }

  return {
    roadmapName: roadmap.label,
    scope,
    sectionKey: sectionKey || null,
    topics,
    totalTopics: topics.length,
    completedCount: topics.filter(t => t.done).length,
  };
}

export function buildQuestionnaireContext({ roadmap, progress, scope, sectionKey }) {
  return buildQuizContext({ roadmap, progress, scope, sectionKey });
}

export function buildExplainContext({ roadmap, topic, sectionKey, notes, resources }) {
  return {
    roadmapName: roadmap.label,
    topic,
    section: sectionKey,
    userNotes: notes || "",
    resourceLinks: (resources || []).map(r => r.title).join(", "),
  };
}

export function buildStudyPlanContext({ roadmap, progress }) {
  const rmId = roadmap.id;
  let completed = [], upcoming = [];

  for (const [sec, ts] of Object.entries(roadmap.sections)) {
    for (const t of ts) {
      if (progress[`${rmId}::${t}`]) completed.push({ topic: t, section: sec });
      else upcoming.push({ topic: t, section: sec });
    }
  }

  const totalTopics  = completed.length + upcoming.length;
  const pct = totalTopics ? Math.round((completed.length / totalTopics) * 100) : 0;

  return {
    roadmapName: roadmap.label,
    completedCount: completed.length,
    totalCount: totalTopics,
    progressPct: pct,
    recentCompleted: completed.slice(-5),   // last 5 done
    nextUpcoming: upcoming.slice(0, 15),    // next 15 to do
  };
}

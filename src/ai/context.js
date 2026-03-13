import { flatTopicNames, topicName } from "../utils/topics.js";
// Builds minimal, scoped context objects for each AI feature.
// We never send the entire app state — only what's relevant to the request.

export function buildQuizContext({ roadmap, progress, scope, sectionKey }) {
  const rmId = roadmap.id;

  let topics = [];

  if (scope === "section" && sectionKey) {
    const ts   = roadmap.sections[sectionKey] || [];
    const flat = flatTopicNames(ts);
    topics = flat.map(t => ({ topic: t, done: !!progress[`${rmId}::${t}`], section: sectionKey }));
  } else if (scope === "completed") {
    for (const [sec, ts] of Object.entries(roadmap.sections))
      for (const t of flatTopicNames(ts))
        if (progress[`${rmId}::${t}`]) topics.push({ topic: t, done: true, section: sec });
  } else {
    // full roadmap
    for (const [sec, ts] of Object.entries(roadmap.sections))
      for (const t of flatTopicNames(ts))
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

export function buildStudyPlanContext({ roadmap, progress, quizResults = {} }) {
  const rmId = roadmap.id;
  let completed = [], upcoming = [], weak = [], strong = [];

  for (const [sec, ts] of Object.entries(roadmap.sections)) {
    for (const t of flatTopicNames(ts)) {
      const done = progress[`${rmId}::${t}`];
      const qr   = quizResults[`${rmId}::${t}`];
      if (done) completed.push({ topic: t, section: sec });
      else upcoming.push({ topic: t, section: sec });
      if (qr?.attempts > 0) {
        if (qr.bestScore < 60)  weak.push({ topic: t, section: sec, score: qr.bestScore });
        if (qr.bestScore >= 80) strong.push({ topic: t, section: sec, score: qr.bestScore });
      }
    }
  }

  const totalTopics = completed.length + upcoming.length;
  const pct = totalTopics ? Math.round((completed.length / totalTopics) * 100) : 0;

  return {
    roadmapName: roadmap.label,
    completedCount: completed.length,
    totalCount: totalTopics,
    progressPct: pct,
    recentCompleted: completed.slice(-5),
    nextUpcoming: upcoming.slice(0, 15),
    weakTopics:  weak.slice(0, 8),
    strongTopics: strong.slice(0, 8),
    hasQuizData: weak.length > 0 || strong.length > 0,
  };
}

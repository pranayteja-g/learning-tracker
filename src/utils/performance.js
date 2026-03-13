import { flatTopicNames } from "./topics.js";

/**
 * Derives rich performance stats from raw quiz results.
 * results shape: { "rmId::topic": { passed, stars, bestScore, attempts, lastDate, history[] } }
 */
export function getPerformanceStats(roadmaps, results) {
  const allTested   = [];
  const allUntested = [];
  const byRoadmap   = {};

  for (const rm of Object.values(roadmaps)) {
    const rmStats = { label: rm.label, color: rm.color, accent: rm.accent,
      sections: {}, passed: 0, attempted: 0, total: 0 };

    for (const [sec, ts] of Object.entries(rm.sections)) {
      const topics = flatTopicNames(ts);
      const secStats = { total: topics.length, attempted: 0, passed: 0, topics: [] };

      for (const topic of topics) {
        const r = results[`${rm.id}::${topic}`];
        rmStats.total++;

        if (r && r.attempts > 0) {
          secStats.attempted++;
          rmStats.attempted++;
          if (r.passed) { secStats.passed++; rmStats.passed++; }
          const entry = { topic, section: sec, rmId: rm.id, rmLabel: rm.label,
            rmColor: rm.color, rmAccent: rm.accent, stars: r.stars || 0, ...r };
          secStats.topics.push(entry);
          allTested.push(entry);
        } else {
          const entry = { topic, section: sec, rmId: rm.id, rmLabel: rm.label,
            rmColor: rm.color, rmAccent: rm.accent };
          allUntested.push(entry);
        }
      }
      rmStats.sections[sec] = secStats;
    }
    byRoadmap[rm.id] = rmStats;
  }

  // Sort tested topics
  const strongest = [...allTested].sort((a, b) => b.bestScore - a.bestScore).slice(0, 8);
  const weakest   = [...allTested]
    .filter(t => !t.passed)
    .sort((a, b) => a.bestScore - b.bestScore)
    .slice(0, 8);
  const needsRetry = [...allTested]
    .filter(t => t.attempts > 0 && t.bestScore < 70)
    .sort((a, b) => a.bestScore - b.bestScore);

  const totalAttempted = allTested.length;
  const totalPassed    = allTested.filter(t => t.passed).length;
  const avgScore       = totalAttempted
    ? Math.round(allTested.reduce((s, t) => s + t.bestScore, 0) / totalAttempted)
    : 0;

  // Recent activity — last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentActivity = [...allTested]
    .filter(t => t.lastDate >= sevenDaysAgo)
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
    .slice(0, 10);

  return {
    totalAttempted, totalPassed, avgScore,
    strongest, weakest, needsRetry,
    allTested, allUntested,
    recentActivity, byRoadmap,
  };
}

/** Builds a compact quiz performance summary string for AI context */
export function buildQuizPerformanceSummary(roadmap, results) {
  const topics = [];
  for (const [sec, ts] of Object.entries(roadmap.sections)) {
    for (const topic of flatTopicNames(ts)) {
      const r = results[`${roadmap.id}::${topic}`];
      if (r?.attempts > 0) {
        topics.push(`${topic} (${r.bestScore}%${r.passed ? " ✓" : " ✗"})`);
      }
    }
  }
  if (!topics.length) return null;
  const passed  = topics.filter(t => t.includes("✓")).length;
  const total   = topics.length;
  return `Quiz performance: ${passed}/${total} topics passed.\nDetailed scores: ${topics.join(", ")}`;
}

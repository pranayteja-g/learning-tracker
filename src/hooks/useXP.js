import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-xp-v1";

export const LEVELS = [
  { name: "Novice",      min: 0,    color: "#888",    icon: "🌱" },
  { name: "Apprentice",  min: 500,  color: "#52b788", icon: "📖" },
  { name: "Journeyman",  min: 1500, color: "#7b5ea7", icon: "⚔️"  },
  { name: "Expert",      min: 3500, color: "#ee9b00", icon: "🔥" },
  { name: "Master",      min: 7000, color: "#e05252", icon: "👑" },
];

export const MILESTONE_BADGES = [
  // Quest count
  { id: "first_quest",     name: "First Quest",        desc: "Complete your first quest",                    icon: "🎯", type: "milestone" },
  { id: "quests_5",        name: "Relentless",          desc: "Complete 5 quests",                            icon: "💪", type: "milestone" },
  { id: "quests_10",       name: "Scholar",             desc: "Complete 10 quests",                           icon: "🎓", type: "milestone" },
  { id: "quests_25",       name: "Veteran",             desc: "Complete 25 quests",                           icon: "🏅", type: "milestone" },
  { id: "quests_50",       name: "Legend",              desc: "Complete 50 quests",                           icon: "🌟", type: "milestone" },
  // Quality
  { id: "perfect_run",     name: "Perfect Run",         desc: "Score 100% on all phases of a quest",          icon: "💯", type: "milestone" },
  { id: "high_scorer",     name: "High Scorer",         desc: "Average 90%+ across 3 quests",                 icon: "🎖️", type: "milestone" },
  // Speed
  { id: "speed_learner",   name: "Speed Learner",       desc: "Complete a quest within 24h of generation",    icon: "⚡", type: "milestone" },
  // Breadth
  { id: "polyglot",        name: "Polyglot",            desc: "Complete quests on 3 different roadmaps",      icon: "🌐", type: "milestone" },
  { id: "all_rounder",     name: "All-Rounder",         desc: "Complete quests on 5 different roadmaps",      icon: "🗺️", type: "milestone" },
  // Difficulty
  { id: "hard_mode",       name: "Hard Mode",           desc: "Complete 3 Hard difficulty quests",            icon: "💀", type: "milestone" },
  { id: "no_easy_way",     name: "No Easy Way",         desc: "Complete 5 quests on Hard difficulty",         icon: "🔱", type: "milestone" },
  // Persistence
  { id: "comeback",        name: "Comeback",            desc: "Complete a quest after failing one",           icon: "🔄", type: "milestone" },
  { id: "iron_will",       name: "Iron Will",           desc: "Pass after failing the same quest twice",      icon: "🪨", type: "milestone" },
  // Phases
  { id: "code_master",     name: "Code Master",         desc: "Score 100% on a Code phase",                   icon: "💻", type: "milestone" },
  { id: "qa_ace",          name: "Q&A Ace",             desc: "Score 100% on a Q&A phase",                    icon: "💬", type: "milestone" },
];

export function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

export function getNextLevel(xp) {
  const cur = getLevel(xp);
  return cur.index < LEVELS.length - 1 ? LEVELS[cur.index + 1] : null;
}

export function xpForQuest(phaseResults, activePhases) {
  let total = 0;
  activePhases.forEach((phase, i) => {
    const result = phaseResults?.[i];
    if (!result) return;
    const score = result.score || 0;
    const base  = phase.key === "read" ? 50 : phase.key === "mcq" ? 150 : phase.key === "code" ? 200 : 150;
    total += Math.round(base * (score / 100));
  });
  return total;
}

export function checkMilestoneBadges(xpData, quest, phaseResults, activePhases) {
  const earned    = new Set(xpData.badges?.filter(b => !b.startsWith?.("ai_")) || []);
  const newBadges = [];
  const add = (id) => { if (!earned.has(id)) { earned.add(id); newBadges.push(id); } };

  const completedCount  = (xpData.completedQuests  || 0) + 1;
  const roadmapsSet     = new Set([...(xpData.completedRoadmaps || []), quest.roadmapId]);
  const hardCount       = (xpData.hardQuestsCount   || 0) + (quest.phases?.mcq?.difficulty === "hard" ? 1 : 0);
  const highScoreCount  = (xpData.highScoreCount    || 0);
  const hadPriorFail    = (xpData.failedQuests      || 0) > 0;
  const sameQuestFails  = (xpData.sameQuestFails?.[quest.title] || 0);

  // Count
  if (completedCount === 1)  add("first_quest");
  if (completedCount >= 5)   add("quests_5");
  if (completedCount >= 10)  add("quests_10");
  if (completedCount >= 25)  add("quests_25");
  if (completedCount >= 50)  add("quests_50");

  // Quality
  const allPerfect = activePhases.every((_, i) => (phaseResults?.[i]?.score || 0) >= 100);
  if (allPerfect) add("perfect_run");
  const avgScore = activePhases.filter((_, i) => phaseResults?.[i]?.score != null)
    .reduce((s, _, i) => s + (phaseResults[i]?.score || 0), 0) / activePhases.length;
  if (avgScore >= 90 && highScoreCount + 1 >= 3) add("high_scorer");

  // Speed
  if (quest.startedAt && Date.now() - quest.startedAt < 24 * 60 * 60 * 1000) add("speed_learner");

  // Breadth
  if (roadmapsSet.size >= 3) add("polyglot");
  if (roadmapsSet.size >= 5) add("all_rounder");

  // Difficulty
  if (hardCount >= 3) add("hard_mode");
  if (hardCount >= 5) add("no_easy_way");

  // Persistence
  if (hadPriorFail) add("comeback");
  if (sameQuestFails >= 2) add("iron_will");

  // Phase specific
  const codeIdx = activePhases.findIndex(p => p.key === "code");
  const qaIdx   = activePhases.findIndex(p => p.key === "qa");
  if (codeIdx >= 0 && (phaseResults?.[codeIdx]?.score || 0) >= 100) add("code_master");
  if (qaIdx   >= 0 && (phaseResults?.[qaIdx]?.score   || 0) >= 100) add("qa_ace");

  return {
    newMilestoneBadges: newBadges,
    allMilestoneBadges: [...earned],
    completedCount,
    roadmapsSet: [...roadmapsSet],
    hardCount,
    highScoreCount: avgScore >= 90 ? highScoreCount + 1 : highScoreCount,
  };
}

export async function generateAIBadge(quest, phaseResults, activePhases, xpData, apiKey) {
  if (!apiKey) return null;
  try {
    const scores = activePhases.map((p, i) => `${p.name}: ${phaseResults?.[i]?.score ?? "N/A"}%`).join(", ");
    const totalQuests = (xpData.completedQuests || 0) + 1;
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? "late night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 120,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `A student just completed a learning quest. Generate a unique, personal badge for this specific performance.

Quest: "${quest.title}" (${quest.roadmapLabel})
Scores: ${scores}
Time of day: ${timeOfDay}
Quest number: ${totalQuests} total completed
Topics: ${quest.topics?.join(", ")}

Create a witty, specific badge that reflects something unique about THIS performance — not generic praise.
Be creative and specific. Reference the topics, time, score pattern, or quest number if interesting.

Respond ONLY with JSON:
{ "name": "Badge Name (2-4 words)", "desc": "One sentence describing what makes this performance special", "icon": "single emoji" }`
        }]
      })
    });

    if (!response.ok) return null;
    const data   = await response.json();
    const text   = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim());
    if (!parsed.name || !parsed.icon) return null;
    return { id: `ai_${Date.now()}`, name: parsed.name, desc: parsed.desc, icon: parsed.icon, type: "ai" };
  } catch {
    return null;
  }
}

export function useXP() {
  const [xpData, setXpData] = useState({
    xp: 0, badges: [], aiBadges: [],
    completedQuests: 0, failedQuests: 0,
    completedRoadmaps: [], hardQuestsCount: 0, highScoreCount: 0,
    sameQuestFails: {},
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => { if (stored) setXpData(stored); setLoaded(true); });
  }, []);

  const awardQuestXP = useCallback(async (quest, phaseResults, activePhases, passed, apiKey) => {
    const earned = passed ? xpForQuest(phaseResults, activePhases) : 0;

    // AI badge (async, non-blocking)
    let aiBadge = null;
    if (passed && apiKey) {
      aiBadge = await generateAIBadge(quest, phaseResults, activePhases, xpData, apiKey);
    }

    setXpData(prev => {
      const { newMilestoneBadges, allMilestoneBadges, completedCount,
              roadmapsSet, hardCount, highScoreCount } = checkMilestoneBadges(prev, quest, phaseResults, activePhases);

      const aiBadges = [...(prev.aiBadges || [])];
      if (aiBadge) aiBadges.push(aiBadge);

      const updated = {
        ...prev,
        xp:               (prev.xp || 0) + earned,
        badges:           allMilestoneBadges,
        aiBadges,
        completedQuests:  passed ? completedCount : prev.completedQuests || 0,
        failedQuests:     !passed ? (prev.failedQuests || 0) + 1 : prev.failedQuests || 0,
        completedRoadmaps: passed ? roadmapsSet : prev.completedRoadmaps || [],
        hardQuestsCount:  passed ? hardCount : prev.hardQuestsCount || 0,
        highScoreCount:   passed ? highScoreCount : prev.highScoreCount || 0,
        sameQuestFails:   !passed ? { ...prev.sameQuestFails, [quest.title]: (prev.sameQuestFails?.[quest.title] || 0) + 1 } : prev.sameQuestFails || {},
        lastQuestXP:      earned,
        lastNewBadges:    newMilestoneBadges,
        lastAIBadge:      aiBadge,
      };
      idbSet(KEY, updated);
      return updated;
    });

    return { earned, aiBadge };
  }, [xpData]);

  return {
    xpData, loaded, awardQuestXP,
    getLevel:     () => getLevel(xpData.xp),
    getNextLevel: () => getNextLevel(xpData.xp),
  };
}

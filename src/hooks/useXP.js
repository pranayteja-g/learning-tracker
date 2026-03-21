import { useState, useEffect, useCallback } from "react";
import { idbGet, idbSet } from "../storage/db.js";

const KEY = "learning-tracker-xp-v1";

export const LEVELS = [
  { name: "Novice",      min: 0,    color: "#888",    icon: "🌱" },
  { name: "Apprentice",  min: 500,  color: "#52b788", icon: "📖" },
  { name: "Journeyman",  min: 1500, color: "#7b5ea7", icon: "⚔️" },
  { name: "Expert",      min: 3500, color: "#ee9b00", icon: "🔥" },
  { name: "Master",      min: 7000, color: "#e05252", icon: "👑" },
];

export const BADGES = [
  { id: "first_quest",    name: "First Quest",     desc: "Complete your first quest",              icon: "🎯" },
  { id: "perfect_run",    name: "Perfect Run",     desc: "Score 100% on all phases of a quest",    icon: "💯" },
  { id: "speed_learner",  name: "Speed Learner",   desc: "Complete a quest within 24 hours of generation", icon: "⚡" },
  { id: "polyglot",       name: "Polyglot",        desc: "Complete quests on 3 different roadmaps", icon: "🌐" },
  { id: "relentless",     name: "Relentless",      desc: "Complete 5 quests total",                icon: "💪" },
  { id: "scholar",        name: "Scholar",         desc: "Complete 10 quests total",               icon: "🎓" },
  { id: "comeback",       name: "Comeback",        desc: "Complete a quest after failing one",     icon: "🔄" },
  { id: "no_hints",       name: "No Hints Needed", desc: "Complete a Hard quest with no retries",  icon: "🧠" },
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
  // Base XP per phase based on score
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

export function checkNewBadges(xpData, quest, phaseResults, activePhases) {
  const earned    = new Set(xpData.badges || []);
  const newBadges = [];

  const add = (id) => { if (!earned.has(id)) { earned.add(id); newBadges.push(id); } };

  const completedCount = (xpData.completedQuests || 0) + 1;
  const roadmapsSet    = new Set([...(xpData.completedRoadmaps || []), quest.roadmapId]);
  const hadPriorFail   = (xpData.failedQuests || 0) > 0;

  if (completedCount === 1) add("first_quest");
  if (completedCount >= 5)  add("relentless");
  if (completedCount >= 10) add("scholar");
  if (roadmapsSet.size >= 3) add("polyglot");
  if (hadPriorFail) add("comeback");

  // Perfect run — all phases 100%
  const allPerfect = activePhases.every((_, i) => (phaseResults?.[i]?.score || 0) >= 100);
  if (allPerfect) add("perfect_run");

  // Speed learner — completed within 24h of startedAt
  if (quest.startedAt && Date.now() - quest.startedAt < 24 * 60 * 60 * 1000) add("speed_learner");

  return { newBadges, allBadges: [...earned], completedCount, roadmapsSet: [...roadmapsSet] };
}

export function useXP() {
  const [xpData, setXpData] = useState({ xp: 0, badges: [], completedQuests: 0, failedQuests: 0, completedRoadmaps: [] });
  const [loaded,  setLoaded] = useState(false);

  useEffect(() => {
    idbGet(KEY).then(stored => {
      if (stored) setXpData(stored);
      setLoaded(true);
    });
  }, []);

  const save = useCallback((updated) => {
    setXpData(updated);
    idbSet(KEY, updated);
  }, []);

  const awardQuestXP = useCallback((quest, phaseResults, activePhases, passed) => {
    setXpData(prev => {
      const earned    = passed ? xpForQuest(phaseResults, activePhases) : 0;
      const { newBadges, allBadges, completedCount, roadmapsSet } = checkNewBadges(
        prev, quest, phaseResults, activePhases
      );
      const updated = {
        ...prev,
        xp:               (prev.xp || 0) + earned,
        badges:           allBadges,
        completedQuests:  passed ? (prev.completedQuests || 0) + 1 : prev.completedQuests || 0,
        failedQuests:     !passed ? (prev.failedQuests || 0) + 1 : prev.failedQuests || 0,
        completedRoadmaps: passed ? roadmapsSet : prev.completedRoadmaps || [],
        lastQuestXP:      earned,
        lastNewBadges:    newBadges,
      };
      idbSet(KEY, updated);
      return updated;
    });
  }, []);

  return { xpData, loaded, awardQuestXP, getLevel: () => getLevel(xpData.xp), getNextLevel: () => getNextLevel(xpData.xp) };
}

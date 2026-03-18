/**
 * Global configuration constants
 * Centralized place for all hardcoded values, limits, colors, timeouts, etc.
 */

// ── UI Colors ──────────────────────────────────────────────────────────
export const COLORS = {
  success: "#52b788",
  warning: "#ee9b00",
  error: "#e05252",
  primary: "#7b5ea7",
  secondary: "#c4b5fd",
  bg: "#13131a",
  bgCard: "#16161b",
  bgLight: "#0f0f13",
  bgDark: "#0d1117",
  border: "#2a2a35",
  borderLight: "#1e1e24",
  text: "#e8e6e0",
  textMuted: "#888",
  textDim: "#555",
};

// ── Difficulty Levels ──────────────────────────────────────────────────
export const DIFFICULTY_COLORS = {
  easy: COLORS.success,
  medium: COLORS.warning,
  hard: COLORS.error,
};

export const SCORE_COLORS = {
  excellent: COLORS.success,
  good: "#8bc4a8",
  developing: COLORS.warning,
  needsPractice: COLORS.error,
};

// ── Quiz & Test Settings ──────────────────────────────────────────────
export const QUIZ_SETTINGS = {
  passingScore: 70,
  mcqRequiredScore: 80,
  codeRequiredScore: 70,
  qaRequiredScore: 70,
  questPassingThreshold: 70,
};

// ── Question Counts ──────────────────────────────────────────────────
export const QUESTION_COUNTS = [5, 10, 15];
export const DEFAULT_QUESTION_COUNT = 5;

// ── Time Settings (in seconds) ──────────────────────────────────────
export const TIME_OPTIONS = [
  { label: "5 min", secs: 300 },
  { label: "10 min", secs: 600 },
  { label: "15 min", secs: 900 },
  { label: "20 min", secs: 1200 },
];

export const DEFAULT_TIME_SECS = 600; // 10 minutes

// ── Quest Settings ──────────────────────────────────────────────────
export const QUEST_SETTINGS = {
  cooldownMs: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  phases: {
    read: { pass: null },
    mcq: { pass: 80 },
    code: { pass: 70 },
    qa: { pass: 70 },
  },
};

// ── AI & Token Settings ─────────────────────────────────────────────
export const AI_SETTINGS = {
  defaultProvider: "groq",
  maxTokens: {
    default: 4096,
    quiz: 8192,
    code: 8192,
    studyPlan: 2048,
    search: 1024,
    structured: 8192,
    explanation: 2048,
  },
  temperature: {
    default: 0.7,
    deterministic: 0.3,
    creative: 1.0,
  },
  timeoutMs: 30000, // 30 seconds
  retryAttempts: 2,
  retryDelayMs: 1000,
};

// ── Topic Difficulty Levels ────────────────────────────────────────
export const TOPIC_DIFFICULTIES = ["easy", "medium", "hard"];

// ── Time Estimation Options ───────────────────────────────────────
export const TIME_ESTIMATE_OPTIONS = ["< 1 hour", "1–2 hours", "2–5 hours", "5–10 hours", "10+ hours"];

// ── Resource Types ────────────────────────────────────────────────
export const RESOURCE_TYPES = {
  docs: { icon: "📄", color: "#7b8cde" },
  tutorial: { icon: "📝", color: "#52b788" },
  video: { icon: "🎬", color: "#e05252" },
  interactive: { icon: "🎮", color: "#ee9b00" },
  course: { icon: "🎓", color: "#c4b5fd" },
};

// ── Interview Question Types ───────────────────────────────────────
export const QUESTION_TYPES = {
  conceptual: { color: "#7b8cde", label: "Conceptual" },
  practical: { color: "#52b788", label: "Practical" },
  "problem-solving": { color: "#ee9b00", label: "Problem Solving" },
  behavioural: { color: "#c4b5fd", label: "Behavioural" },
};

// ── Study Modes ────────────────────────────────────────────────────
export const STUDY_SCOPES = ["section", "roadmap", "completed"];
export const DEFAULT_STUDY_SCOPE = "section";

// ── Cooldown & Streak Settings ─────────────────────────────────────
export const STREAK_SETTINGS = {
  recentActivityDays: 7,
  resetAtMidnightUTC: true,
};

// ── Performance Analysis ───────────────────────────────────────────
export const PERFORMANCE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  developing: 50,
  needsWork: 0,
};

// ── Database Settings ──────────────────────────────────────────────
export const DB_SETTINGS = {
  name: "learning-tracker",
  version: 1,
  store: "kvstore",
  fallbackToLocalStorage: true, // Use localStorage if IndexedDB unavailable
};

// ── Feature Flags & Toggles ────────────────────────────────────────
export const FEATURES = {
  enableQuests: true,
  enableInterview: true,
  enablePractice: true,
  enableSearch: true,
  enableBackup: true,
  enablePWA: true,
};

// ── Search Settings ────────────────────────────────────────────────
export const SEARCH_SETTINGS = {
  debounceMs: 200,
  maxResultsPerType: 10,
};

// ── Responsive Design ──────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile: 768, // px
  tablet: 1024, // px
};

// ── Animation Durations ────────────────────────────────────────────
export const ANIMATIONS = {
  fast: 150, // ms
  normal: 300, // ms
  slow: 500, // ms
};

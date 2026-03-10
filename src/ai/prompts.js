// ── System prompt (shared) ────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a helpful programming tutor assistant embedded inside a learning tracker app.
The user is learning software development topics. Your job is to help them test their knowledge, understand concepts, and plan their learning.
Always be concise, accurate, and encouraging. Respond ONLY with valid JSON when asked for structured output — no markdown fences, no extra text.`;

// ── Quiz prompt ───────────────────────────────────────────────────────────────
export function buildQuizPrompt(ctx, count) {
  const topicList = ctx.topics.map(t => `- ${t.topic} (${t.section})`).join("\n");

  return `Generate exactly ${count} multiple choice quiz questions about the following topics from the "${ctx.roadmapName}" learning roadmap.

Topics to cover:
${topicList}

Rules:
- Each question must test understanding, not just memorization
- Each question has exactly 4 options labeled A, B, C, D
- Exactly one option is correct
- Keep questions concise and clear
- Cover different topics, not the same one repeatedly

Respond with ONLY a JSON array, no other text:
[
  {
    "question": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "A",
    "explanation": "Brief explanation of why this is correct"
  }
]`;
}

// ── Questionnaire prompt ──────────────────────────────────────────────────────
export function buildQuestionnairePrompt(ctx, count) {
  const topicList = ctx.topics.map(t => `- ${t.topic} (${t.section})`).join("\n");

  return `Generate exactly ${count} open-ended study questions about the following topics from the "${ctx.roadmapName}" roadmap.

Topics:
${topicList}

Rules:
- Questions should test deep understanding and ability to explain concepts
- Mix different question styles: "Explain...", "What is the difference between...", "When would you use...", "How does... work"
- Questions should be answerable in 2-5 sentences
- Cover different topics

Respond with ONLY a JSON array, no other text:
[
  {
    "question": "...",
    "topic": "the specific topic this tests",
    "sampleAnswer": "A concise model answer (2-4 sentences)"
  }
]`;
}

// ── Explain prompt ────────────────────────────────────────────────────────────
export function buildExplainPrompt(ctx) {
  const notesSection = ctx.userNotes
    ? `\n\nThe user already has these notes on this topic:\n"${ctx.userNotes}"\nBuild on their existing understanding.`
    : "";

  return `Explain the topic "${ctx.topic}" from the "${ctx.roadmapName}" roadmap (section: "${ctx.section}").${notesSection}

Provide a clear, beginner-friendly explanation structured as follows. Respond with ONLY valid JSON, no other text:
{
  "summary": "1-2 sentence plain English summary",
  "whatItIs": "What this concept is and why it exists (3-5 sentences)",
  "howItWorks": "How it works under the hood or in practice (3-5 sentences)",
  "whenToUse": "When and why you would use this (2-3 sentences)",
  "example": "A simple concrete code example or real-world analogy",
  "commonMistakes": "1-2 common beginner mistakes or misconceptions",
  "keyTakeaway": "One sentence to remember"
}`;
}

// ── Study plan prompt ─────────────────────────────────────────────────────────
export function buildStudyPlanPrompt(ctx) {
  const completed = ctx.recentCompleted.map(t => `- ${t.topic}`).join("\n") || "None yet";
  const upcoming  = ctx.nextUpcoming.map(t => `- ${t.topic} (${t.section})`).join("\n");

  return `Create a personalized study plan for a learner studying "${ctx.roadmapName}".

Current progress: ${ctx.completedCount}/${ctx.totalCount} topics (${ctx.progressPct}% complete)

Recently completed topics:
${completed}

Upcoming topics (in order):
${upcoming}

Create a realistic study plan. Respond with ONLY valid JSON, no other text:
{
  "assessment": "2-3 sentence assessment of where they are and what level they're at",
  "weeklyGoal": "A realistic goal for this week based on their progress",
  "dailyPlan": [
    { "day": "Day 1", "focus": "topic or group", "goal": "what to achieve", "estimatedTime": "X hours" },
    { "day": "Day 2", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 3", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 4", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 5", "focus": "...", "goal": "...", "estimatedTime": "..." }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "milestone": "What completing this week's plan unlocks or sets up for next week"
}`;
}

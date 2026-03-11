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

// ── Roadmap generation system prompt (separate, stricter) ─────────────────────
export const ROADMAP_SYSTEM_PROMPT = `You are an expert curriculum designer specializing in software engineering learning roadmaps.
Your job is to generate exhaustive, professionally structured learning roadmaps in the style of roadmap.sh.
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text whatsoever.
Your output must be deterministic: given the same topic and instructions, always produce the same roadmap.`;

// ── Roadmap generation prompt ─────────────────────────────────────────────────
export function buildRoadmapPrompt(topic, extraInstructions) {
  const extras = extraInstructions?.trim()
    ? `\nAdditional instructions from the user: "${extraInstructions.trim()}"\n`
    : "";

  return `Generate a complete, exhaustive learning roadmap for: "${topic}"
${extras}
STRICT RULES — follow every rule exactly:

COVERAGE:
- Start from absolute zero basics — assume the learner knows nothing
- Cover every major concept, tool, pattern, and subtopic a professional needs
- Include both theoretical concepts and practical skills
- Do NOT skip foundational topics even if they seem obvious
- Aim for 60-120 total topics spread across sections

SECTIONS:
- Group topics into 6-12 logical sections ordered from beginner to advanced
- Section names must be short (2-5 words), clear, and professional
- Each section must have at least 5 topics, ideally 8-15
- Sections must flow logically — prerequisites always come before the concepts that need them

TOPICS:
- Each topic must be a specific, atomic concept — not a vague category
- Topic names must be concise (1-6 words), consistent in style
- Use title case for all topic names
- No duplicate topics across sections
- No vague topics like "Advanced Concepts" or "Other Features"
- Good examples: "Stack vs Heap Memory", "Thread Safety", "Builder Pattern", "SQL Joins"
- Bad examples: "Memory stuff", "Advanced Java", "Various patterns"

ORDERING:
- Within each section, topics must be ordered from simpler to more complex
- A learner should be able to complete topics top-to-bottom without needing knowledge from later sections

CONSISTENCY RULE (critical):
- Topic names must always use the same canonical form
- Always use the most widely recognized industry-standard name for each concept
- Never use synonyms or alternate names — pick one and always use it

Respond with ONLY this JSON structure, nothing else:
{
  "label": "canonical name for this technology (e.g. 'Java', 'React', 'Docker')",
  "sections": {
    "Section Name": ["Topic One", "Topic Two", "Topic Three"],
    "Section Name 2": ["Topic A", "Topic B"]
  }
}`;
}

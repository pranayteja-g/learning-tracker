// ── System prompt (shared) ────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a helpful learning assistant embedded inside a learning tracker app.
The user may be learning anything — software engineering, science, history, mathematics, languages, or any school subject.
Your job is to help them test their knowledge, understand concepts, and plan their learning.
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

Provide a clear, beginner-friendly explanation. Respond with ONLY valid JSON, no other text:
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

// ── Roadmap categories ───────────────────────────────────────────────────────
export const ROADMAP_CATEGORIES = [
  {
    id:    "tech",
    label: "Tech",
    icon:  "💻",
    desc:  "Software, tools, frameworks",
    color: "#4361ee",
    promptModifier: `DOMAIN: Technology / Software Engineering
- Cover tools, libraries, frameworks, CLIs, and dev workflows a practitioner actually uses
- Include both conceptual understanding and hands-on practical skills
- Cover testing, debugging, deployment, and best practices — not just syntax
- Use industry-standard naming (e.g. "REST API" not "web service interface")
- Section style examples: "Core Concepts", "Data Structures", "Tooling & Setup", "Testing", "Advanced Patterns", "Production & Deployment"
- Topic style examples: "Stack vs Heap Memory", "Thread Safety", "SQL Joins", "Docker Volumes", "CI/CD Pipeline"`,
  },
  {
    id:    "school",
    label: "School",
    icon:  "🎓",
    desc:  "Academic & curriculum subjects",
    color: "#52b788",
    promptModifier: `DOMAIN: Academic / School Subject
- Structure around curriculum goals — what a student must understand and be able to demonstrate
- Include foundational facts, key definitions, core theories, and exam-relevant concepts
- Add sections for analytical and applied skills (e.g. essay writing, problem solving, lab work)
- Use standard academic terminology appropriate for the subject
- Section style examples: "Foundations", "Key Concepts", "Core Theories", "Analysis Skills", "Exam Techniques", "Extended Topics"
- Topic style examples: "Mitosis vs Meiosis", "Newton's Third Law", "Primary vs Secondary Sources", "Structuring an Argument"`,
  },
  {
    id:    "language",
    label: "Language",
    icon:  "🌐",
    desc:  "Human languages & linguistics",
    color: "#ee9b00",
    promptModifier: `DOMAIN: Human Language Learning
- Structure around the four core skills: Listening, Speaking, Reading, Writing
- Include Pronunciation & Phonetics as an early section — sounds and stress patterns are foundational
- Cover script/writing system if the language uses a non-Latin alphabet (e.g. Devanagari, Cyrillic, Kanji)
- Vocabulary must be structured by tier: survival vocab → everyday vocab → intermediate → advanced
- Grammar sections must be ordered by frequency of use, not linguistic complexity
- Include a Culture & Context section — idioms, customs, regional variation, formal vs informal register
- Include exam/certification roadmap if one exists (DELF, JLPT, HSK, IELTS, etc.)
- Section style examples: "Sounds & Pronunciation", "Writing System", "Survival Vocabulary", "Core Grammar", "Everyday Conversations", "Intermediate Grammar", "Reading & Writing", "Culture & Idioms", "Fluency & Advanced"
- Topic style examples: "Vowel Sounds", "Hiragana Alphabet", "Numbers 1–100", "Present Tense Conjugation", "Formal vs Informal Address", "Common Idioms"`,
  },
  {
    id:    "science",
    label: "Science",
    icon:  "🔬",
    desc:  "Natural sciences & STEM",
    color: "#c4b5fd",
    promptModifier: `DOMAIN: Natural Science (Biology, Chemistry, Physics, Earth Science, etc.)
- Cover the scientific method as a foundational section before subject-specific content
- Include mathematical and formulaic knowledge where relevant (equations, units, conversions)
- Cover lab skills, experimental design, data interpretation, and safety
- Connect theory to real-world applications and observable phenomena
- Include history of key discoveries where they illuminate the concept
- Section style examples: "Scientific Method", "Foundational Concepts", "Core Theories", "Measurement & Units", "Lab Skills", "Applications", "Advanced Topics"
- Topic style examples: "Hypothesis Formation", "Conservation of Energy", "DNA Replication", "Mole Calculations", "Experimental Variables"`,
  },
  {
    id:    "maths",
    label: "Maths",
    icon:  "📐",
    desc:  "Mathematics & statistics",
    color: "#e05252",
    promptModifier: `DOMAIN: Mathematics
- Structure strictly by prerequisite chain — every topic must only require knowledge of earlier topics
- Include both procedural skills (how to calculate) and conceptual understanding (why it works)
- Cover proof and reasoning skills progressively — introduce mathematical logic early
- Include worked-example patterns and common problem types for each topic
- Cover common mistakes and misconceptions explicitly
- Statistics and probability should be treated as a distinct track if relevant
- Section style examples: "Number Foundations", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Proof & Logic", "Problem Solving"
- Topic style examples: "Order of Operations", "Quadratic Formula", "Pythagorean Theorem", "Limits", "Standard Deviation", "Proof by Induction"`,
  },
  {
    id:    "creative",
    label: "Creative",
    icon:  "🎨",
    desc:  "Arts, music, design & craft",
    color: "#f4a261",
    promptModifier: `DOMAIN: Creative Arts (Visual Art, Music, Design, Writing, Film, Photography, etc.)
- Cover foundational techniques before style and expression
- Include art history and influential works/movements to build contextual understanding
- Cover critique and analysis skills — learning to evaluate work (own and others')
- Include practice-based sections: exercises, projects, portfolio building
- Cover tools, materials, and software relevant to the discipline
- Section style examples: "Foundations & Principles", "Core Techniques", "Tools & Materials", "Influential Works", "Style & Expression", "Critique & Analysis", "Projects & Portfolio"
- Topic style examples: "Colour Theory", "Composition Rules", "Perspective Drawing", "Chord Progressions", "Typography Basics", "User Research"`,
  },
  {
    id:    "general",
    label: "General",
    icon:  "📖",
    desc:  "Everything else",
    color: "#888",
    promptModifier: `DOMAIN: General / Mixed Subject
- Identify the subject domain from the topic name and apply appropriate structure
- Balance theoretical understanding with practical application
- Use clear, universally understood terminology
- Structure sections in a natural learning progression for the subject`,
  },
];

// ── Roadmap generation system prompt ─────────────────────────────────────────
export const ROADMAP_SYSTEM_PROMPT = `You are an expert curriculum designer who creates exhaustive, well-structured learning roadmaps for ANY subject — software engineering, mathematics, science, history, languages, arts, or any school or professional topic.
Your roadmaps are detailed, logically ordered, and tailored to the subject's domain and natural learning structure.
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text whatsoever.
Your output must be deterministic: given the same topic, category, and instructions, always produce the same roadmap.`;

// ── Roadmap generation prompt ─────────────────────────────────────────────────
export function buildRoadmapPrompt(topic, extraInstructions, categoryId) {
  const category = ROADMAP_CATEGORIES.find(c => c.id === categoryId) || ROADMAP_CATEGORIES.find(c => c.id === "general");
  const extras = extraInstructions?.trim()
    ? `\nAdditional instructions from the user: "${extraInstructions.trim()}"\n`
    : "";
  return `Generate a complete, exhaustive learning roadmap for: "${topic}"
${extras}
${category.promptModifier}

UNIVERSAL RULES — apply on top of domain rules above:

COVERAGE:
- Start from absolute zero basics — assume the learner knows nothing about this specific topic
- Be exhaustive — do NOT skip topics that seem too basic or obvious
- Cover every major concept, skill, and area of knowledge a learner needs
- Aim for 60-120 total topics spread across sections

SECTIONS:
- Group topics into 6-12 logical sections ordered from beginner to advanced
- Section names must be short (2-5 words), clear, and natural for the domain
- Each section must have at least 5 topics, ideally 8-15
- Sections must flow logically — prerequisites always before the concepts that need them

TOPICS:
- Each topic must be a specific, atomic concept — not a vague category
- Topic names must be concise (1-6 words), consistent in style, title case
- No duplicate topics across sections
- No vague topics like "Advanced Concepts", "Other Topics", or "Miscellaneous"

ORDERING:
- Within each section, order topics from simpler to more complex
- A learner studying top-to-bottom should never need knowledge from a later section

CONSISTENCY (critical):
- Always use the canonical, most widely-recognised name for each concept
- Never use synonyms or alternate names — pick one and always use it

Respond with ONLY this JSON structure, nothing else:
{
  "label": "canonical name for this subject",
  "sections": {
    "Section Name": ["Topic One", "Topic Two", "Topic Three"],
    "Section Name 2": ["Topic A", "Topic B"]
  }
}`;
}


// ── Find Resources prompt ─────────────────────────────────────────────────────
export const RESOURCES_SYSTEM_PROMPT = `You are a research assistant helping learners find the best free online resources for studying specific topics.
You have access to web search. Use it to find real, working, high-quality free resources.
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.`;

export function buildFindResourcesPrompt(topic, roadmapLabel, audience) {
  const audienceNote = audience?.trim()
    ? `The learner's context: "${audience.trim()}".`
    : "";
  return `Find the best free online resources for learning about: "${topic}" (from a ${roadmapLabel} learning roadmap).
${audienceNote}

Search the web for high-quality free resources. Prioritise:
1. Official documentation or textbooks
2. Reputable tutorial sites (MDN, Khan Academy, freeCodeCamp, GeeksforGeeks, Coursera free tier, MIT OpenCourseWare, etc.)
3. High-quality YouTube videos or playlists
4. Interactive practice tools or sandboxes

Rules:
- Only include resources that are FREE
- Only include URLs you have verified exist from search results — never invent URLs
- Include 4-6 resources total, a mix of types (docs, tutorials, videos, interactive)
- Each resource must have a clear, descriptive title

Respond with ONLY this JSON array, nothing else:
[
  {
    "title": "Descriptive title of the resource",
    "url": "https://actual-verified-url.com/...",
    "type": "docs | tutorial | video | interactive | course",
    "why": "One sentence on why this is great for learning this topic"
  }
]`;
}

// ════════════════════════════════════════════════════════════════════════════
// INTERVIEW PREP PROMPTS
// ════════════════════════════════════════════════════════════════════════════

export const INTERVIEW_SYSTEM_PROMPT = `You are an expert technical interviewer and career coach.
You know exactly what interviewers ask, what great answers look like, and how to give actionable feedback.
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.`;

// ── Interview questions prompt ────────────────────────────────────────────────
export function buildInterviewQuestionsPrompt(ctx) {
  const allTopics = Object.entries(ctx.sections)
    .map(([sec, topics]) => topics.map(t => `${t} (${sec})`).join(", "))
    .join("; ");

  return `You are preparing someone for a ${ctx.roadmapName} job interview.

All topics in this roadmap: ${allTopics}

Generate exactly 10 high-value interview questions. Rules:
- Pick only the most interview-critical topics — what interviewers actually ask
- Mix question types: 3 conceptual ("Explain X", "What is the difference between X and Y"), 3 practical ("How would you...", "Walk me through..."), 2 problem-solving ("What happens when...", "How would you debug..."), 2 behavioural ("Tell me about a time you used X", "Describe a situation where...")
- Each question should have a model answer that is concise, confident, and interview-ready (3-6 sentences)
- Flag the topic and estimated difficulty for each question

Respond with ONLY a JSON array:
[
  {
    "question": "...",
    "type": "conceptual | practical | problem-solving | behavioural",
    "topic": "the specific topic being tested",
    "difficulty": "easy | medium | hard",
    "modelAnswer": "The ideal 3-6 sentence answer an interviewer would love"
  }
]`;
}

// ── Interview answer feedback prompt ─────────────────────────────────────────
export function buildInterviewFeedbackPrompt(question, userAnswer, modelAnswer) {
  return `Interview question: "${question}"

The candidate answered: "${userAnswer}"

The model answer is: "${modelAnswer}"

Give brief, direct, constructive feedback on their answer. Respond with ONLY valid JSON:
{
  "score": 1-5,
  "verdict": "Strong | Good | Needs Work | Off Track",
  "whatWorked": "1-2 sentences on what they got right (skip if score <= 2)",
  "improve": "1-2 sentences on the most important thing to improve or add",
  "tip": "One short actionable tip for answering this type of question in interviews"
}`;
}

// ── Flashcard prompt ──────────────────────────────────────────────────────────
export function buildFlashcardsPrompt(ctx) {
  const allTopics = Object.entries(ctx.sections)
    .flatMap(([sec, topics]) => topics.map(t => `${t} (${sec})`));

  return `Create interview-ready flashcards for a ${ctx.roadmapName} interview.

Topics available: ${allTopics.join(", ")}

Generate exactly 20 flashcards covering the most interview-critical topics. Rules:
- Front: a short, clear prompt (concept name, "What is X?", "X vs Y?")
- Back: a crisp 1-3 sentence answer — exactly what you'd say in an interview
- Tag each card with its topic and section
- Cover a wide variety of topics, not the same one repeatedly
- Answers must be direct and confident, not textbook-style

Respond with ONLY a JSON array:
[
  {
    "front": "What is a closure in JavaScript?",
    "back": "A closure is a function that retains access to its outer scope even after the outer function has returned. It lets you create private variables and is commonly used in callbacks and event handlers.",
    "topic": "Closures",
    "section": "Functions & Scope"
  }
]`;
}

// ── Cheat sheet prompt ────────────────────────────────────────────────────────
export function buildCheatSheetPrompt(ctx) {
  const allTopics = Object.entries(ctx.sections)
    .map(([sec, topics]) => `${sec}: ${topics.join(", ")}`)
    .join("\n");

  return `Create a concise interview cheat sheet for ${ctx.roadmapName}.

Full roadmap:
${allTopics}

Generate a structured cheat sheet a candidate can review 30 minutes before their interview. Rules:
- Group topics into 3 tiers: "Must Know" (very likely to be asked), "Good to Know" (sometimes asked), "Bonus Points" (impresses interviewers)
- For each topic, write ONE interview-ready sentence — the core thing to remember
- Include a "Quick Tips" section with 5 interview strategy tips specific to this technology/subject
- Include a "Red Flags to Avoid" section with 4 common mistakes candidates make
- Be concise — this is a last-minute reference, not a study guide

Respond with ONLY valid JSON:
{
  "title": "${ctx.roadmapName} Interview Cheat Sheet",
  "mustKnow": [
    { "topic": "...", "oneliner": "The core thing to say about this in an interview" }
  ],
  "goodToKnow": [
    { "topic": "...", "oneliner": "..." }
  ],
  "bonusPoints": [
    { "topic": "...", "oneliner": "..." }
  ],
  "quickTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "redFlags": ["mistake 1", "mistake 2", "mistake 3", "mistake 4"]
}`;
}

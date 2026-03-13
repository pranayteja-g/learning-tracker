// ── System prompt (shared) ────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a helpful learning assistant embedded inside a learning tracker app.
The user may be learning anything — software engineering, science, history, mathematics, languages, or any school subject.
Your job is to help them test their knowledge, understand concepts, and plan their learning.
Always be concise, accurate, and encouraging. Respond ONLY with valid JSON when asked for structured output — no markdown fences, no extra text.`;

// ── Quiz prompt ───────────────────────────────────────────────────────────────
export function buildQuizPrompt(ctx, count, difficulty = "mixed") {
  const topicList = ctx.topics.map(t => `- ${t.topic} (${t.section})`).join("\n");

  const difficultyInstructions = {
    easy: `DIFFICULTY REQUIREMENT: ALL ${count} questions MUST be EASY level.
Easy means: definitions, basic recall, "what is X", straightforward yes/no concepts.
A complete beginner should get most correct. No tricky wording. No edge cases.
Every question's "difficulty" field MUST be "easy".`,

    medium: `DIFFICULTY REQUIREMENT: ALL ${count} questions MUST be MEDIUM level.
Medium means: understanding how things work, why they exist, when to use them.
Requires genuine comprehension, not just recall. Some application required.
Every question's "difficulty" field MUST be "medium".`,

    hard: `DIFFICULTY REQUIREMENT: ALL ${count} questions MUST be HARD level.
Hard means: edge cases, subtle distinctions, tricky gotchas, performance implications, comparing similar concepts.
Only someone who deeply understands the topic should get these right.
Every question's "difficulty" field MUST be "hard".`,

    mixed: `DIFFICULTY REQUIREMENT: Mix all levels across the ${count} questions.
Distribute roughly: ${Math.round(count*0.3)} easy, ${Math.round(count*0.5)} medium, ${Math.round(count*0.2)} hard.
Tag each question's "difficulty" field accurately as "easy", "medium", or "hard".`,
  };

  const diffBlock = difficultyInstructions[difficulty] || difficultyInstructions.mixed;

  return `Generate exactly ${count} multiple choice quiz questions about the following topics from the "${ctx.roadmapName}" learning roadmap.

Topics to cover:
${topicList}

${diffBlock}

Other rules:
- Each question has exactly 4 options labeled A, B, C, D
- Exactly one option is correct
- Cover different topics, not the same one repeatedly
- Tag each question with the specific topic it tests
- For code-related topics: include code snippet questions where appropriate

Respond with ONLY a JSON array, no other text:
[
  {
    "question": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "A",
    "explanation": "1-2 sentences max. State the fact directly. No restating the question, no hedging, no 'however' chains. Example: '(int)8.9 truncates to 8. Java casting drops the decimal, it does not round.'",
    "difficulty": "easy | medium | hard",
    "topic": "the specific topic this question tests"
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
- Tag each question with the specific topic it tests

Respond with ONLY a JSON array, no other text:
[
  {
    "question": "...",
    "topic": "the specific topic this tests",
    "sampleAnswer": "A concise model answer (2-4 sentences)"
  }
]`;
}

// ── Questionnaire performance summary ────────────────────────────────────────
export function buildQuestionnaireSummaryPrompt(questions, answers) {
  const qa = questions.map((q, i) => `Q${i+1}: ${q.question}\nUser answer: ${answers[i] || "(no answer)"}\nModel answer: ${q.sampleAnswer}`).join("\n\n");
  return `A learner just completed a Q&A session. Evaluate their performance and give feedback.

${qa}

Analyse their answers and respond with ONLY valid JSON:
{
  "overallScore": "Excellent | Good | Developing | Needs Practice",
  "scorePercent": 0-100,
  "summary": "2-3 sentence overall assessment of their understanding",
  "strongTopics": ["topic 1", "topic 2"],
  "weakTopics": ["topic 1", "topic 2"],
  "perQuestion": [
    {
      "qIndex": 0,
      "verdict": "Strong | Good | Partial | Missed",
      "feedback": "One sentence on what they got right or what was missing"
    }
  ],
  "nextSteps": "2-3 sentences on what they should focus on studying next"
}`;
}

// ── Explain prompt ────────────────────────────────────────────────────────────
export function buildExplainPrompt(ctx) {
  const notesSection = ctx.userNotes
    ? `\n\nThe user already has these notes on this topic:\n"${ctx.userNotes}"\nBuild on their existing understanding.`
    : "";

  const isTechTopic = ctx.roadmapName?.match(/java|python|javascript|react|node|spring|docker|kubernetes|sql|go|rust|c\+\+|swift|kotlin|typescript|angular|vue|django|rails|aws|git/i);

  return `Explain the topic "${ctx.topic}" from the "${ctx.roadmapName}" roadmap (section: "${ctx.section}").${notesSection}

Provide a clear, practical explanation with real code examples where relevant. Respond with ONLY valid JSON, no other text:
{
  "summary": "1-2 sentence plain English summary",
  "whatItIs": "What this concept is and why it exists (3-5 sentences)",
  "howItWorks": "How it works under the hood or in practice (3-5 sentences)",
  "whenToUse": "When and why you would use this (2-3 sentences)",
  "codeExample": {
    "description": "What this example demonstrates",
    "code": "A real, runnable code example — not pseudocode. Use proper syntax. 5-20 lines.",
    "language": "java | python | javascript | sql | bash | etc"
  },
  "commonMistakes": "1-2 common beginner mistakes or misconceptions",
  "keyTakeaway": "One sentence to remember"
}

CRITICAL for codeExample.code:
- Code MUST be multi-line — use \\n between every statement and line
- Never put all code on one line — each statement gets its own line
- Use proper indentation with spaces
- Use actual working code, not placeholder comments or pseudocode
- Show the most common real-world usage pattern (5-20 lines)
- For non-code topics set code to null and use codeExample.description for a real-world analogy instead`;
}

// ── Study plan prompt ─────────────────────────────────────────────────────────
export function buildStudyPlanPrompt(ctx) {
  const quizBlock = ctx.hasQuizData ? `
QUIZ PERFORMANCE (use this to personalise — do not ignore it):
${ctx.weakTopics?.length   ? `Weak topics (score < 60% — must revisit before moving on):\n${ctx.weakTopics.map(t => `  - ${t.topic}: ${t.score}%`).join("\n")}` : ""}
${ctx.strongTopics?.length ? `Strong topics (score ≥ 80% — move past quickly):\n${ctx.strongTopics.map(t => `  - ${t.topic}: ${t.score}%`).join("\n")}` : ""}

RULES when quiz data is present:
- Weak topics MUST appear on Day 1 or Day 2 — do not bury them
- Do NOT suggest time on strong topics unless everything else is done
- Name exact topics per day — no vague "review Java basics" days
- If a weak topic is a prerequisite for upcoming topics, fix it first` : "";

  return `You are a study coach. Create a sharp, realistic 5-day plan for someone learning "${ctx.roadmapName}".

LEARNER SNAPSHOT:
- Progress: ${ctx.completedCount}/${ctx.totalCount} topics (${ctx.progressPct}% complete)
- Recently completed: ${ctx.recentCompleted.length ? ctx.recentCompleted.map(t => t.topic).join(", ") : "nothing yet"}
- Up next in roadmap: ${ctx.nextUpcoming.slice(0, 6).map(t => `${t.topic} (${t.section})`).join(", ")}
${quizBlock}

PLAN REQUIREMENTS:
- Each day has ONE clear focus — no "review everything" days
- Estimate time honestly (most topics = 30–90 min to properly learn)
- Tips must be specific to this learner, not generic advice
- Assessment must be honest — name weak spots directly if quiz data shows them
- Milestone should be specific: what they can build/do/understand after 5 days

Respond with ONLY valid JSON, no other text:
{
  "assessment": "2-3 sentences. Direct and honest. Reference their actual progress % and name weak spots if any.",
  "weeklyGoal": "One specific measurable goal for the 5 days",
  "dailyPlan": [
    { "day": "Day 1", "focus": "exact topic name(s)", "goal": "what they can do after this session", "estimatedTime": "X hrs" },
    { "day": "Day 2", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 3", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 4", "focus": "...", "goal": "...", "estimatedTime": "..." },
    { "day": "Day 5", "focus": "...", "goal": "...", "estimatedTime": "..." }
  ],
  "tips": [
    "Specific tip based on their weak areas or quiz results",
    "Specific tip about how to approach the upcoming topics",
    "Specific tip about retention — what to do after each session"
  ],
  "milestone": "What they unlock after this week — specific about what they can build or do"
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
- Include Pronunciation & Phonetics as an early section
- Cover script/writing system if the language uses a non-Latin alphabet
- Vocabulary structured by tier: survival vocab → everyday → intermediate → advanced
- Grammar sections ordered by frequency of use
- Include a Culture & Context section
- Section style examples: "Sounds & Pronunciation", "Writing System", "Survival Vocabulary", "Core Grammar", "Everyday Conversations", "Culture & Idioms"`,
  },
  {
    id:    "science",
    label: "Science",
    icon:  "🔬",
    desc:  "Natural sciences & STEM",
    color: "#c4b5fd",
    promptModifier: `DOMAIN: Natural Science
- Cover the scientific method as a foundational section
- Include mathematical and formulaic knowledge where relevant
- Cover lab skills, experimental design, data interpretation
- Connect theory to real-world applications
- Section style examples: "Scientific Method", "Foundational Concepts", "Core Theories", "Measurement & Units", "Lab Skills", "Applications"`,
  },
  {
    id:    "maths",
    label: "Maths",
    icon:  "📐",
    desc:  "Mathematics & statistics",
    color: "#e05252",
    promptModifier: `DOMAIN: Mathematics
- Structure strictly by prerequisite chain
- Include both procedural skills and conceptual understanding
- Cover proof and reasoning skills progressively
- Include common problem types and worked-example patterns
- Section style examples: "Number Foundations", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Proof & Logic"`,
  },
  {
    id:    "creative",
    label: "Creative",
    icon:  "🎨",
    desc:  "Arts, music, design & craft",
    color: "#f4a261",
    promptModifier: `DOMAIN: Creative Arts
- Cover foundational techniques before style and expression
- Include art history and influential works/movements
- Cover critique and analysis skills
- Include practice-based sections: exercises, projects, portfolio
- Section style examples: "Foundations & Principles", "Core Techniques", "Tools & Materials", "Style & Expression", "Projects & Portfolio"`,
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

UNIVERSAL RULES:
- Start from absolute zero basics
- Be exhaustive — do NOT skip topics that seem too basic
- Aim for 60-120 total topics across 6-12 sections
- Each section: at least 5 topics, ideally 8-15
- Topics: specific, atomic, 1-6 words, title case, no duplicates
- Order: prerequisites always before concepts that need them

Respond with ONLY this JSON structure:
{
  "label": "canonical name for this subject",
  "sections": {
    "Section Name": ["Topic One", "Topic Two", "Topic Three"],
    "Section Name 2": ["Topic A", "Topic B"]
  }
}`;
}

// ── Find Resources prompt ─────────────────────────────────────────────────────
export const RESOURCES_SYSTEM_PROMPT = `You are a research assistant helping learners find the best free online resources.
You have access to web search. Search for each resource and verify it exists before including it.
CRITICAL: Only include URLs you have confirmed exist from search results. Never guess or construct URLs.
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.`;

export function buildFindResourcesPrompt(topic, roadmapLabel, audience) {
  const audienceNote = audience?.trim()
    ? `The learner's context: "${audience.trim()}".`
    : "";
  return `Find the best free online resources for learning about: "${topic}" (from a ${roadmapLabel} learning roadmap).
${audienceNote}

Search the web for these resources. For each one, verify the URL actually exists and loads before including it.

Prioritise:
1. Official documentation (e.g. docs.oracle.com, developer.mozilla.org, docs.python.org)
2. Reputable free tutorial sites (MDN, freeCodeCamp, GeeksforGeeks, Baeldung, W3Schools)
3. High-quality YouTube videos — search for the video, confirm it exists, include the real youtube.com/watch?v= URL
4. Interactive tools (repl.it, codepen, exercism.io, leetcode)

Rules:
- Only FREE resources
- Only URLs verified from search — never construct or guess URLs
- 4-6 resources total, mixed types
- Prefer pages specifically about "${topic}", not generic homepage links

Respond with ONLY this JSON array:
[
  {
    "title": "Descriptive title of the resource",
    "url": "https://verified-url.com/specific-page",
    "type": "docs | tutorial | video | interactive | course",
    "why": "One sentence on why this is useful for learning ${topic}"
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
- Pick only the most interview-critical topics
- Mix: 3 conceptual, 3 practical, 2 problem-solving, 2 behavioural
- Model answers: concise, confident, interview-ready (3-6 sentences)
- Flag topic and difficulty for each question

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

Give brief, direct, constructive feedback. Respond with ONLY valid JSON:
{
  "score": 1-5,
  "verdict": "Strong | Good | Needs Work | Off Track",
  "whatWorked": "1-2 sentences on what they got right (skip if score <= 2)",
  "improve": "1-2 sentences on the most important thing to improve",
  "tip": "One short actionable tip for this type of interview question"
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
- For code topics: include the most commonly used syntax or a one-liner example in the back
- Cover a wide variety of topics
- Answers must be direct and confident, not textbook-style

Respond with ONLY a JSON array:
[
  {
    "front": "What is a HashMap in Java?",
    "back": "A HashMap stores key-value pairs using hashing for O(1) average lookup. Initialise with: Map<String, Integer> map = new HashMap<>(); Key methods: put(k,v), get(k), containsKey(k), remove(k), entrySet().",
    "topic": "HashMap",
    "section": "Collections"
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
- Group topics into 3 tiers: "Must Know", "Good to Know", "Bonus Points"
- For each topic write ONE interview-ready sentence — the core thing to remember
- For programming topics: include the most important syntax, method signature, or initialisation pattern inline
- Include a "Quick Tips" section with 5 interview strategy tips
- Include a "Red Flags to Avoid" section with 4 common candidate mistakes
- Be concise — this is a last-minute reference

Respond with ONLY valid JSON:
{
  "title": "${ctx.roadmapName} Interview Cheat Sheet",
  "mustKnow": [
    { "topic": "...", "oneliner": "Core thing to say + key syntax/method if applicable" }
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

// ── Topic expansion prompt ────────────────────────────────────────────────────
export function buildTopicExpansionPrompt(topic, sectionName, roadmapLabel) {
  return `A learning roadmap for "${roadmapLabel}" has a topic called "${topic}" inside the section "${sectionName}".

Expand it into specific, atomic subtopics that guide someone to actually learn it.

Rules:
- Generate 6-12 subtopics
- Each must be more specific than the parent
- Order from foundational to advanced
- Title case, concise names (1-6 words)
- No vague subtopics like "${topic} Basics" or "Advanced ${topic}"
- Each subtopic should be independently studyable

Respond with ONLY a JSON array of strings:
["Subtopic One", "Subtopic Two", "Subtopic Three"]`;
}

// ── Topic cheat sheet prompt ──────────────────────────────────────────────────
export function buildTopicCheatSheetPrompt(topic, roadmapLabel, sectionName) {
  return `Create a focused interview cheat sheet for the topic "${topic}" from a ${roadmapLabel} roadmap (section: "${sectionName}").

This is a deep-dive for ONE specific topic. Rules:
- Cover everything an interviewer might ask about "${topic}"
- Include key facts, definitions, and most importantly: common syntax, initialisation patterns, and frequently used methods/operations
- For collections/data structures: show how to initialise, add, remove, iterate, and the most used methods
- For algorithms/patterns: show the core implementation pattern
- Quick Tips: specific to this topic
- Red Flags: mistakes candidates make about this specific topic

Respond with ONLY valid JSON:
{
  "title": "${topic} — Cheat Sheet",
  "oneliner": "One sentence: what ${topic} is in plain English",
  "mustKnow": [
    { "topic": "specific aspect or method", "oneliner": "what it does + syntax example if applicable" }
  ],
  "goodToKnow": [
    { "topic": "...", "oneliner": "..." }
  ],
  "bonusPoints": [
    { "topic": "...", "oneliner": "..." }
  ],
  "quickTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "redFlags": ["mistake 1", "mistake 2", "mistake 3"]
}`;
}

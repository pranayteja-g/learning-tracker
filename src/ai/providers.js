// ── Provider configs ──────────────────────────────────────────────────────────
export const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    keyPlaceholder: "AIza...",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyHint: "Get a free key at aistudio.google.com — no credit card needed",
  },
  groq: {
    name: "Groq",
    model: "llama-3.3-70b-versatile",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    keyHint: "Get a free key at console.groq.com — no credit card needed",
  },
};

export const AI_STORAGE_KEY = "learning-tracker-ai-config-v1";

export function loadAIConfig() {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { provider: "groq", keys: {} };
  } catch {
    return { provider: "groq", keys: {} };
  }
}

export function saveAIConfig(config) {
  localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config));
}

// ── Call the AI ───────────────────────────────────────────────────────────────
// Always returns { text, usage: { promptTokens, completionTokens } }
export async function callAI({ provider, apiKey, systemPrompt, userPrompt }) {
  if (provider === "gemini") return callGemini({ apiKey, systemPrompt, userPrompt });
  if (provider === "groq")   return callGroq({ apiKey, systemPrompt, userPrompt });
  throw new Error("Unknown provider: " + provider);
}

async function callGemini({ apiKey, systemPrompt, userPrompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const meta = data.usageMetadata || {};
  return {
    text,
    usage: {
      promptTokens:     meta.promptTokenCount     || 0,
      completionTokens: meta.candidatesTokenCount || 0,
    },
  };
}

async function callGroq({ apiKey, systemPrompt, userPrompt }) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  // Groq returns exact token counts — perfectly accurate
  const u = data.usage || {};
  return {
    text,
    usage: {
      promptTokens:     u.prompt_tokens     || 0,
      completionTokens: u.completion_tokens || 0,
    },
  };
}

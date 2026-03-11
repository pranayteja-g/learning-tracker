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
export async function callAI({ provider, apiKey, systemPrompt, userPrompt, temperature = 0.7 }) {
  if (provider === "gemini") return callGemini({ apiKey, systemPrompt, userPrompt, temperature });
  if (provider === "groq")   return callGroq({ apiKey, systemPrompt, userPrompt, temperature });
  throw new Error("Unknown provider: " + provider);
}

async function callGemini({ apiKey, systemPrompt, userPrompt, temperature = 0.7 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature, maxOutputTokens: 2048 },
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

async function callGroq({ apiKey, systemPrompt, userPrompt, temperature = 0.7 }) {
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
      temperature,
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

// ── Call AI with web search enabled ──────────────────────────────────────────
// Used for Find Resources — forces the model to search before answering.
// Returns { text, usage } same as callAI.
export async function callAIWithSearch({ provider, apiKey, systemPrompt, userPrompt }) {
  if (provider === "gemini") return callGeminiWithSearch({ apiKey, systemPrompt, userPrompt });
  if (provider === "groq")   return callGroqWithSearch({ apiKey, systemPrompt, userPrompt });
  throw new Error("Unknown provider: " + provider);
}

async function callGeminiWithSearch({ apiKey, systemPrompt, userPrompt }) {
  // Gemini supports Google Search grounding natively
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    tools: [{ google_search: {} }],
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
  // Gemini may return multiple parts — join text parts only
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text  = parts.filter(p => p.text).map(p => p.text).join("") || "";
  const meta  = data.usageMetadata || {};
  return {
    text,
    usage: {
      promptTokens:     meta.promptTokenCount     || 0,
      completionTokens: meta.candidatesTokenCount || 0,
    },
  };
}

async function callGroqWithSearch({ apiKey, systemPrompt, userPrompt }) {
  // Groq (llama-3.3-70b) supports OpenAI-compatible function/tool calling.
  // We define a web_search tool and let the model call it, then run the search
  // via DuckDuckGo instant answer API (no key needed), and feed results back.
  const tools = [{
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current, accurate information. Use this to find real URLs for learning resources.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  }];

  const messages = [
    { role: "system",  content: systemPrompt },
    { role: "user",    content: userPrompt   },
  ];

  // ── Round 1: let model decide what to search ──────────────────────────────
  const res1 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, tools, tool_choice: "auto",
      temperature: 0.3, max_tokens: 1024 }),
  });
  if (!res1.ok) {
    const err = await res1.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res1.status}`);
  }
  const data1 = await res1.json();
  const msg1  = data1.choices?.[0]?.message;
  const usage1 = data1.usage || {};

  // ── Execute tool calls (run real searches) ────────────────────────────────
  const toolResults = [];
  if (msg1?.tool_calls?.length) {
    for (const tc of msg1.tool_calls) {
      let searchResult = "";
      try {
        const args  = JSON.parse(tc.function.arguments);
        const query = encodeURIComponent(args.query || "");
        // DuckDuckGo instant answer — no API key, CORS-friendly
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`
        );
        if (ddg.ok) {
          const ddgData = await ddg.json();
          const snippets = [
            ddgData.Abstract,
            ...(ddgData.RelatedTopics || []).slice(0, 5).map(t => t.Text || ""),
          ].filter(Boolean).join("\n");
          searchResult = snippets || "No results found.";
        }
      } catch {
        searchResult = "Search unavailable.";
      }
      toolResults.push({
        toolCallId: tc.id,
        result: searchResult,
      });
    }
  }

  // If no tool calls were made, just return what we have
  if (!toolResults.length) {
    const text = msg1?.content || "";
    return { text, usage: { promptTokens: usage1.prompt_tokens || 0, completionTokens: usage1.completion_tokens || 0 } };
  }

  // ── Round 2: feed search results back, get final JSON answer ─────────────
  const messages2 = [
    ...messages,
    msg1,
    ...toolResults.map(tr => ({
      role: "tool",
      tool_call_id: tr.toolCallId,
      content: tr.result,
    })),
  ];

  const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: messages2,
      temperature: 0.3, max_tokens: 2048 }),
  });
  if (!res2.ok) {
    const err = await res2.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res2.status}`);
  }
  const data2 = await res2.json();
  const text  = data2.choices?.[0]?.message?.content || "";
  const usage2 = data2.usage || {};

  return {
    text,
    usage: {
      promptTokens:     (usage1.prompt_tokens     || 0) + (usage2.prompt_tokens     || 0),
      completionTokens: (usage1.completion_tokens || 0) + (usage2.completion_tokens || 0),
    },
  };
}

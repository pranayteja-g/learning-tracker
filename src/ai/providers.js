import { AI_SETTINGS } from "../constants/config.js";

// ── Timeout & Retry Utilities ──────────────────────────────────────────────
/**
 * Wraps a fetch call with timeout support
 * @param {Promise} fetchPromise - The fetch promise
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - Resolves or rejects
 */
async function withTimeout(fetchPromise, timeoutMs) {
  return Promise.race([
    fetchPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Wraps an async function with retry logic and exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Max retry attempts
 * @param {number} initialDelayMs - Initial delay before first retry
 * @returns {Promise} - Result or error
 */
async function withRetry(fn, maxAttempts = 2, initialDelayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isTimeout = error.message.includes("timeout");
      const isRetryable = isTimeout || error.message.includes("429") || error.message.includes("5");
      
      if (attempt < maxAttempts - 1 && isRetryable) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[AI] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else if (!isRetryable) {
        throw error;
      }
    }
  }
  throw lastError;
}

// ── Provider configs ──────────────────────────────────────────────────────────
export const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    keyPlaceholder: "AIza...",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyHint: "Get a free key at aistudio.google.com — no credit card needed",
    color: "#4285f4",
    free: true,
  },
  groq: {
    name: "Groq",
    model: "llama-3.3-70b-versatile",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    keyHint: "Get a free key at console.groq.com — no credit card needed",
    color: "#f55036",
    free: true,
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
export async function callAI({ provider, apiKey, systemPrompt, userPrompt, messages = [], temperature = 0.7, maxTokens = 4096 }) {
  if (provider === "gemini") return callGemini({ apiKey, systemPrompt, userPrompt, messages, temperature, maxTokens });
  if (provider === "groq")   return callGroq({ apiKey, systemPrompt, userPrompt, messages, temperature, maxTokens });
  throw new Error("Unknown provider: " + provider);
}

async function callGemini({ apiKey, systemPrompt, userPrompt, messages = [], temperature = 0.7, maxTokens = 4096 }) {
  return withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const history = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [...history, { role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    const res = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      AI_SETTINGS.timeoutMs
    );
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
  }, AI_SETTINGS.retryAttempts, AI_SETTINGS.retryDelayMs);
}

async function callGroq({ apiKey, systemPrompt, userPrompt, messages = [], temperature = 0.7, maxTokens = 4096 }) {
  return withRetry(async () => {
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user",   content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      }),
      AI_SETTINGS.timeoutMs
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error ${res.status}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    if (choice?.finish_reason && choice.finish_reason !== "stop") {
      console.warn("[Groq] finish_reason:", choice.finish_reason, "| completion_tokens:", data.usage?.completion_tokens, "| max_tokens sent:", maxTokens);
    }
    const u = data.usage || {};
    return {
      text,
      usage: {
        promptTokens:     u.prompt_tokens     || 0,
        completionTokens: u.completion_tokens || 0,
      },
    };
  }, AI_SETTINGS.retryAttempts, AI_SETTINGS.retryDelayMs);
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
  return withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      tools: [{ google_search: {} }],
    };
    const res = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      AI_SETTINGS.timeoutMs
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini error ${res.status}`);
    }
    const data = await res.json();
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
  }, AI_SETTINGS.retryAttempts, AI_SETTINGS.retryDelayMs);
}

async function callGroqWithSearch({ apiKey, systemPrompt, userPrompt }) {
  return withRetry(async () => {
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
    const res1 = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, tools, tool_choice: "auto",
          temperature: 0.3, max_tokens: 1024 }),
      }),
      AI_SETTINGS.timeoutMs
    );
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
          const ddg = await withTimeout(
            fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`),
            10000
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

    const res2 = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: messages2,
          temperature: 0.3, max_tokens: 2048 }),
      }),
      AI_SETTINGS.timeoutMs
    );
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
  }, AI_SETTINGS.retryAttempts, AI_SETTINGS.retryDelayMs);
}

import { useState, useRef, useEffect, useCallback } from "react";

// ── NVIDIA NIM Provider ───────────────────────────────────────────────────────
const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_STORAGE_KEY = "learning-tracker-nim-config-v1";

// Popular NVIDIA NIM models
export const NIM_MODELS = [
  { id: "meta/llama-4-scout-17b-16e-instruct",  label: "Llama 4 Scout",    badge: "Vision", vision: true  },
  { id: "meta/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick", badge: "Vision", vision: true  },
  { id: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B", badge: "Smart",  vision: false },
  { id: "mistralai/mistral-large-2-instruct",   label: "Mistral Large 2",  badge: "Fast",   vision: false },
  { id: "qwen/qwen3-235b-a22b",                 label: "Qwen3 235B",       badge: "Huge",   vision: false },
  { id: "google/gemma-3-27b-it",                label: "Gemma 3 27B",      badge: "Vision", vision: true  },
];

function loadNIMConfig() {
  try {
    const raw = localStorage.getItem(NIM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { apiKey: "", model: NIM_MODELS[0].id };
  } catch {
    return { apiKey: "", model: NIM_MODELS[0].id };
  }
}

function saveNIMConfig(cfg) {
  localStorage.setItem(NIM_STORAGE_KEY, JSON.stringify(cfg));
}

async function callNIM({ apiKey, model, messages, onChunk }) {
  const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || `NIM error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const json = line.slice(6);
      if (json === "[DONE]") continue;
      try {
        const data = JSON.parse(json);
        const delta = data.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullText += delta;
          onChunk?.(delta, fullText);
        }
      } catch {}
    }
  }

  return fullText;
}

// ── File helpers ──────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileMime(file) {
  return file.type || "application/octet-stream";
}

function isSupportedImage(file) {
  return file.type.startsWith("image/");
}

function isSupportedDoc(file) {
  return (
    file.type === "application/pdf" ||
    file.type === "text/plain" ||
    file.type.includes("markdown") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".json")
  );
}

async function extractFileContent(file) {
  if (isSupportedImage(file)) {
    const b64 = await fileToBase64(file);
    return { type: "image", b64, mime: getFileMime(file), name: file.name };
  }
  if (isSupportedDoc(file)) {
    const text = await file.text();
    return { type: "text", content: text, name: file.name, mime: file.type };
  }
  // Fallback: try reading as text
  try {
    const text = await file.text();
    return { type: "text", content: text, name: file.name, mime: file.type };
  } catch {
    throw new Error(`Cannot read file: ${file.name}`);
  }
}

// ── Build app context summary for the system prompt ───────────────────────────
function buildAppContext({ roadmaps, progress, notes, clippings, projects, quizResults }) {
  const parts = [];

  if (roadmaps?.length) {
    parts.push(`## Active Learning Roadmaps (${roadmaps.length})\n` +
      roadmaps.map((rm) => {
        const sections = Object.keys(rm.sections || {});
        const totalTopics = sections.reduce(
          (n, s) => n + (rm.sections[s]?.length || 0), 0
        );
        const done = Object.entries(progress || {}).filter(
          ([k, v]) => k.startsWith(rm.id + "::") && v
        ).length;
        return `- **${rm.label}**: ${done}/${totalTopics} topics done across ${sections.length} sections`;
      }).join("\n")
    );
  }

  if (notes && Object.keys(notes).length) {
    const noteEntries = Object.entries(notes).slice(0, 20);
    parts.push(
      `## User Notes (${Object.keys(notes).length} total)\n` +
        noteEntries
          .map(([key, val]) => {
            const content =
              typeof val === "string"
                ? val
                : val?.content || val?.text || JSON.stringify(val);
            return `- **${key.replace("::", " → ")}**: ${String(content).slice(0, 200)}${String(content).length > 200 ? "…" : ""}`;
          })
          .join("\n")
    );
  }

  if (clippings?.length) {
    parts.push(
      `## Clippings / Saved Content (${clippings.length} items)\n` +
        clippings.slice(0, 10)
          .map(
            (c) =>
              `- **${c.title}** [${c.tags?.join(", ") || "no tags"}]: ${String(c.content || "").slice(0, 150)}…`
          )
          .join("\n")
    );
  }

  if (projects?.length) {
    parts.push(
      `## Projects (${projects.length})\n` +
        projects.slice(0, 10)
          .map((p) => `- **${p.name || p.title}**: ${p.description || p.status || ""}`)
          .join("\n")
    );
  }

  if (quizResults?.length) {
    const recent = quizResults.slice(-5);
    parts.push(
      `## Recent Quiz Results\n` +
        recent
          .map(
            (r) =>
              `- ${r.roadmap || "?"} · Score: ${r.score ?? "?"}/${r.total ?? "?"} · ${r.difficulty || ""}`
          )
          .join("\n")
    );
  }

  return parts.join("\n\n");
}

// ── Markdown renderer (lightweight) ──────────────────────────────────────────
function renderMarkdown(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="nim-code-block" data-lang="${lang || "code"}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class=\"nim-inline-code\">$1</code>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Bullet lists
  html = html.replace(/^[\-\*] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Newlines to paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";

  // Cleanup empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>(<h[123]>)/g, "$1");
  html = html.replace(/<\/h[123]><\/p>/g, (m) => m.replace("</p>", ""));
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/<\/ul><\/p>/g, "</ul>");
  html = html.replace(/<p>(<pre)/g, "$1");
  html = html.replace(/<\/pre><\/p>/g, "</pre>");

  return html;
}

// ── Typing animation ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="nim-typing">
      <span />
      <span />
      <span />
    </span>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
    onCopy?.();
  };

  return (
    <div className={`nim-msg ${isUser ? "nim-msg-user" : "nim-msg-assistant"}`}>
      {!isUser && (
        <div className="nim-msg-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#76b900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div className="nim-msg-body">
        {/* Attached files preview */}
        {msg.attachments?.length > 0 && (
          <div className="nim-attachments">
            {msg.attachments.map((a, i) => (
              <div key={i} className="nim-attachment-chip">
                {a.type === "image" ? (
                  <img src={`data:${a.mime};base64,${a.b64}`} alt={a.name} className="nim-attachment-img" />
                ) : (
                  <span className="nim-attachment-file">
                    <span className="nim-attachment-icon">📄</span>
                    <span>{a.name}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Streaming indicator */}
        {msg.streaming && !msg.content && <TypingDots />}

        {/* Content */}
        {msg.content && (
          isUser ? (
            <div className="nim-msg-text">{msg.content}</div>
          ) : (
            <div
              className="nim-msg-text nim-rendered"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          )
        )}

        {/* Streaming cursor */}
        {msg.streaming && msg.content && (
          <span className="nim-cursor">▋</span>
        )}

        {/* Actions */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="nim-msg-actions">
            <button className="nim-action-btn" onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setup panel ───────────────────────────────────────────────────────────────
function NIMSetup({ config, onSave }) {
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [model,  setModel]  = useState(config.model  || NIM_MODELS[0].id);
  const [show,   setShow]   = useState(false);

  return (
    <div className="nim-setup">
      <div className="nim-setup-logo">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#76b900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>NVIDIA NIM</span>
      </div>
      <p className="nim-setup-desc">
        Connect to NVIDIA's inference microservices for blazing-fast access to state-of-the-art models including Llama 4 with vision support.
      </p>

      <div className="nim-setup-field">
        <label>API Key</label>
        <div className="nim-key-row">
          <input
            type={show ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="nvapi-..."
            className="nim-input"
          />
          <button className="nim-toggle-btn" onClick={() => setShow(!show)}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <a href="https://build.nvidia.com" target="_blank" rel="noopener" className="nim-setup-link">
          Get a free key at build.nvidia.com →
        </a>
      </div>

      <div className="nim-setup-field">
        <label>Model</label>
        <div className="nim-model-grid">
          {NIM_MODELS.map((m) => (
            <button
              key={m.id}
              className={`nim-model-chip ${model === m.id ? "active" : ""}`}
              onClick={() => setModel(m.id)}
            >
              <span className="nim-model-name">{m.label}</span>
              <span className={`nim-model-badge nim-badge-${m.badge.toLowerCase()}`}>{m.badge}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="nim-save-btn"
        onClick={() => onSave({ apiKey: apiKey.trim(), model })}
        disabled={!apiKey.trim()}
      >
        Connect to NIM
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function NIMAssistant({
  open,
  onClose,
  // App context props
  roadmaps = [],
  progress = {},
  notes = {},
  clippings = [],
  projects = [],
  quizResults = [],
  isMobile = false,
  onSaveNote,
  onAddClipping,
}) {
  const [config,       setConfig]      = useState(loadNIMConfig);
  const [showSetup,    setShowSetup]   = useState(false);
  const [messages,     setMessages]    = useState([]);
  const [input,        setInput]       = useState("");
  const [attachments,  setAttachments] = useState([]); // { type, b64, mime, name, content }
  const [streaming,    setStreaming]    = useState(false);
  const [error,        setError]       = useState("");
  const [useContext,   setUseContext]  = useState(true);
  const [dragOver,     setDragOver]    = useState(false);

  const fileRef    = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  const hasKey     = !!config.apiKey?.trim();
  const activeModel = NIM_MODELS.find((m) => m.id === config.model) || NIM_MODELS[0];
  const supportsVision = activeModel.vision;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && hasKey && !showSetup) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, hasKey, showSetup]);

  const handleSaveConfig = (cfg) => {
    saveNIMConfig(cfg);
    setConfig(cfg);
    setShowSetup(false);
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    setError("");
    const results = [];
    for (const file of Array.from(files)) {
      try {
        const extracted = await extractFileContent(file);
        results.push(extracted);
      } catch (e) {
        setError(e.message);
      }
    }
    setAttachments((prev) => [...prev, ...results]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeAttachment = (i) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── Build messages for NIM ─────────────────────────────────────────────────
  function buildNIMMessages(history, userText, atts, includeCtx) {
    const appCtx = includeCtx
      ? buildAppContext({ roadmaps, progress, notes, clippings, projects, quizResults })
      : "";

    const systemContent = `You are a highly capable personal learning assistant integrated into the user's Learning Tracker app.
You have full access to their learning data and can help with:
- Explaining topics, answering questions, and discussing their roadmaps
- Analyzing documents, images, PDFs, and other media they share
- Adding notes, summarizing clippings, or helping organize knowledge
- Quizzing, coaching, and suggesting what to study next
- Writing code, solving problems, and deep technical discussions

Be direct, insightful, and genuinely helpful. Match your depth to the question.
${appCtx ? `\n## Current App State\n${appCtx}` : ""}`;

    const nimMessages = [{ role: "system", content: systemContent }];

    // History (text only for older messages)
    for (const m of history) {
      nimMessages.push({ role: m.role, content: m.content });
    }

    // Current user message — may have attachments
    const userParts = [];

    for (const att of atts) {
      if (att.type === "image" && supportsVision) {
        userParts.push({
          type: "image_url",
          image_url: { url: `data:${att.mime};base64,${att.b64}` },
        });
      } else if (att.type === "text" || att.type === "image") {
        // Non-vision model or text doc — inject as text
        userParts.push({
          type: "text",
          text: att.type === "image"
            ? `[Image attached: ${att.name} — vision not supported by this model, describe it if you can]`
            : `[File: ${att.name}]\n\`\`\`\n${att.content?.slice(0, 8000)}\n\`\`\``,
        });
      }
    }

    if (userText.trim()) {
      userParts.push({ type: "text", text: userText });
    }

    nimMessages.push({
      role: "user",
      content: userParts.length === 1 && userParts[0].type === "text"
        ? userParts[0].text
        : userParts,
    });

    return nimMessages;
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || streaming) return;
    if (!hasKey) { setShowSetup(true); return; }

    setError("");
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      attachments: [...attachments],
    };
    const assistantMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      streaming: true,
    };

    const history = messages.filter((m) => !m.streaming);
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setAttachments([]);
    setStreaming(true);

    try {
      const nimMsgs = buildNIMMessages(history, text, userMsg.attachments, useContext);

      let fullText = "";
      await callNIM({
        apiKey: config.apiKey,
        model:  config.model,
        messages: nimMsgs,
        onChunk: (_, accumulated) => {
          fullText = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: accumulated } : m
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: fullText, streaming: false } : m
        )
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error: ${e.message}`, streaming: false, error: true }
            : m
        )
      );
      setError(e.message);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  if (!open) return null;

  return (
    <>
      <style>{NIM_STYLES}</style>
      <div className="nim-overlay" onClick={onClose} />
      <div
        className={`nim-panel ${isMobile ? "nim-panel-mobile" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="nim-drag-overlay">
            <div className="nim-drag-inner">
              <span>📂</span>
              <p>Drop files here</p>
              <small>Images, PDFs, text, code, CSV, JSON…</small>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="nim-header">
          <div className="nim-header-left">
            <div className="nim-header-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#76b900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="nim-header-title">NIM Assistant</div>
              <div className="nim-header-model">{activeModel.label}</div>
            </div>
          </div>
          <div className="nim-header-right">
            <button
              className={`nim-ctx-toggle ${useContext ? "active" : ""}`}
              onClick={() => setUseContext((v) => !v)}
              title={useContext ? "App context ON — click to disable" : "App context OFF — click to enable"}
            >
              <span className="nim-ctx-dot" />
              {isMobile ? "" : (useContext ? "Context ON" : "Context OFF")}
            </button>
            {messages.length > 0 && (
              <button className="nim-icon-btn" onClick={clearChat} title="Clear chat">
                🗑
              </button>
            )}
            <button className="nim-icon-btn" onClick={() => setShowSetup(!showSetup)} title="Settings">
              ⚙
            </button>
            <button className="nim-icon-btn nim-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Setup panel */}
        {showSetup && (
          <div className="nim-setup-wrapper">
            <NIMSetup config={config} onSave={handleSaveConfig} />
          </div>
        )}

        {/* No API key state */}
        {!hasKey && !showSetup && (
          <div className="nim-empty">
            <div className="nim-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#76b900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Connect NVIDIA NIM</h3>
            <p>Access Llama 4, Mistral, Nemotron, and more — with vision support, streaming, and full app context.</p>
            <button className="nim-save-btn" onClick={() => setShowSetup(true)}>
              Set up API key
            </button>
          </div>
        )}

        {/* Chat area */}
        {hasKey && !showSetup && (
          <>
            <div className="nim-messages">
              {messages.length === 0 && (
                <div className="nim-welcome">
                  <div className="nim-welcome-grid">
                    {[
                      { icon: "🗺️", text: "Explain my Java roadmap progress" },
                      { icon: "📸", text: "Analyse this screenshot or diagram" },
                      { icon: "📄", text: "Summarize a PDF or document" },
                      { icon: "🧠", text: "Quiz me on what I've learned" },
                      { icon: "📝", text: "Help me write study notes" },
                      { icon: "💡", text: "What should I study next?" },
                    ].map((s, i) => (
                      <button
                        key={i}
                        className="nim-suggestion"
                        onClick={() => setInput(s.text)}
                      >
                        <span className="nim-suggestion-icon">{s.icon}</span>
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {error && (
                <div className="nim-error-bar">⚠ {error}</div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="nim-attach-preview">
                {attachments.map((att, i) => (
                  <div key={i} className="nim-attach-pill">
                    {att.type === "image" ? (
                      <img src={`data:${att.mime};base64,${att.b64}`} alt={att.name} className="nim-attach-thumb" />
                    ) : (
                      <span className="nim-attach-file-icon">📄</span>
                    )}
                    <span className="nim-attach-name">{att.name}</span>
                    <button className="nim-attach-remove" onClick={() => removeAttachment(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="nim-input-area">
              <button
                className="nim-attach-btn"
                onClick={() => fileRef.current?.click()}
                title="Attach image, PDF, text, or code"
              >
                📎
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.java,.sql,.html,.css"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <textarea
                ref={inputRef}
                className="nim-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  supportsVision
                    ? "Ask anything — or drop an image, PDF, or file…"
                    : "Ask anything — or attach a file…"
                }
                rows={1}
                disabled={streaming}
              />
              <button
                className={`nim-send-btn ${streaming ? "nim-send-stop" : ""}`}
                onClick={streaming ? () => {} : handleSend}
                disabled={!streaming && !input.trim() && attachments.length === 0}
                title={streaming ? "Streaming…" : "Send (Enter)"}
              >
                {streaming ? (
                  <span className="nim-send-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Footer hint */}
            <div className="nim-footer">
              {supportsVision && <span>👁 Vision enabled · </span>}
              Drag &amp; drop files · Enter to send · Shift+Enter for newline
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const NIM_STYLES = `
  .nim-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 1000; backdrop-filter: blur(2px);
  }

  .nim-panel {
    position: fixed; right: 0; top: 0; bottom: 0;
    width: min(480px, 100vw);
    background: #0a0a0e;
    border-left: 1px solid #1a1a22;
    display: flex; flex-direction: column;
    z-index: 1001;
    font-family: 'IBM Plex Mono', 'Fira Code', 'Courier New', monospace;
    overflow: hidden;
  }
  .nim-panel-mobile {
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw; border-left: none;
    border-top: 1px solid #1a1a22;
  }

  /* Header */
  .nim-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #1a1a22;
    background: #0d0d12;
    flex-shrink: 0;
  }
  .nim-header-left { display: flex; align-items: center; gap: 10px; }
  .nim-header-logo {
    width: 32px; height: 32px;
    background: #111116;
    border: 1px solid #76b90030;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .nim-header-title { font-size: 13px; font-weight: 700; color: #e8e6e0; letter-spacing: 0.5px; }
  .nim-header-model { font-size: 10px; color: #76b900; margin-top: 1px; }
  .nim-header-right { display: flex; align-items: center; gap: 6px; }

  .nim-ctx-toggle {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 8px; border-radius: 20px;
    background: #141418; border: 1px solid #222228;
    color: #555; font-size: 10px; cursor: pointer;
    transition: all 0.2s; font-family: inherit;
  }
  .nim-ctx-toggle.active { border-color: #76b90040; color: #76b900; background: #76b90010; }
  .nim-ctx-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor;
  }

  .nim-icon-btn {
    width: 28px; height: 28px; border-radius: 6px;
    background: #141418; border: 1px solid #1e1e24;
    color: #666; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: inherit;
  }
  .nim-icon-btn:hover { color: #e8e6e0; border-color: #2e2e38; background: #1e1e24; }
  .nim-close-btn:hover { color: #e05252; }

  /* Setup */
  .nim-setup-wrapper {
    overflow-y: auto; flex-shrink: 0;
    border-bottom: 1px solid #1a1a22;
    max-height: 70vh;
  }
  .nim-setup {
    padding: 20px;
    display: flex; flex-direction: column; gap: 16px;
  }
  .nim-setup-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 16px; font-weight: 700; color: #76b900;
  }
  .nim-setup-desc { font-size: 12px; color: #666; line-height: 1.5; margin: 0; }

  .nim-setup-field { display: flex; flex-direction: column; gap: 6px; }
  .nim-setup-field label { font-size: 11px; font-weight: 600; color: #888; letter-spacing: 0.5px; text-transform: uppercase; }
  .nim-key-row { display: flex; gap: 6px; }
  .nim-input {
    flex: 1; background: #111116; border: 1px solid #1e1e24;
    border-radius: 8px; padding: 8px 12px;
    color: #e8e6e0; font-size: 12px; font-family: inherit;
    outline: none; transition: border-color 0.2s;
  }
  .nim-input:focus { border-color: #76b90060; }
  .nim-toggle-btn {
    padding: 8px 12px; background: #141418;
    border: 1px solid #1e1e24; border-radius: 8px;
    color: #666; font-size: 11px; cursor: pointer; font-family: inherit;
  }
  .nim-setup-link { font-size: 11px; color: #76b900; text-decoration: none; }
  .nim-setup-link:hover { text-decoration: underline; }

  .nim-model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .nim-model-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 10px; background: #111116;
    border: 1px solid #1e1e24; border-radius: 8px;
    color: #888; font-size: 11px; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .nim-model-chip.active { border-color: #76b900; color: #e8e6e0; background: #76b90010; }
  .nim-model-chip:hover:not(.active) { border-color: #2e2e38; color: #ccc; }
  .nim-model-name { font-size: 11px; }
  .nim-model-badge {
    font-size: 9px; font-weight: 700; padding: 2px 5px;
    border-radius: 4px; letter-spacing: 0.5px;
  }
  .nim-badge-vision { background: #4285f420; color: #4285f4; }
  .nim-badge-smart  { background: #76b90020; color: #76b900; }
  .nim-badge-fast   { background: #f5503620; color: #f55036; }
  .nim-badge-huge   { background: #9b59b620; color: #9b59b6; }

  .nim-save-btn {
    padding: 10px 16px; background: #76b900;
    border: none; border-radius: 8px;
    color: #000; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: opacity 0.15s;
  }
  .nim-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .nim-save-btn:hover:not(:disabled) { opacity: 0.85; }

  /* Empty state */
  .nim-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; padding: 40px 24px; text-align: center;
  }
  .nim-empty-icon {
    width: 64px; height: 64px;
    background: #111116; border: 1px solid #76b90030;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .nim-empty h3 { margin: 0; font-size: 16px; color: #e8e6e0; }
  .nim-empty p  { margin: 0; font-size: 12px; color: #666; line-height: 1.6; max-width: 280px; }

  /* Messages */
  .nim-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
    scroll-behavior: smooth;
  }
  .nim-messages::-webkit-scrollbar { width: 4px; }
  .nim-messages::-webkit-scrollbar-track { background: transparent; }
  .nim-messages::-webkit-scrollbar-thumb { background: #1e1e24; border-radius: 2px; }

  /* Welcome */
  .nim-welcome { padding: 8px 0; }
  .nim-welcome-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .nim-suggestion {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 10px 12px; background: #111116;
    border: 1px solid #1e1e24; border-radius: 10px;
    color: #888; font-size: 11px; cursor: pointer;
    font-family: inherit; text-align: left;
    transition: all 0.15s; line-height: 1.4;
  }
  .nim-suggestion:hover { border-color: #76b90040; color: #ccc; background: #141418; }
  .nim-suggestion-icon { font-size: 14px; flex-shrink: 0; }

  /* Message bubbles */
  .nim-msg {
    display: flex; gap: 8px;
    animation: nimFadeIn 0.2s ease;
  }
  @keyframes nimFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

  .nim-msg-user { flex-direction: row-reverse; }
  .nim-msg-avatar {
    width: 28px; height: 28px; flex-shrink: 0;
    background: #111116; border: 1px solid #76b90030;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    margin-top: 2px;
  }
  .nim-msg-body { max-width: 85%; display: flex; flex-direction: column; gap: 4px; }

  .nim-msg-user .nim-msg-body {
    align-items: flex-end;
  }

  .nim-msg-text {
    padding: 10px 14px; border-radius: 12px;
    font-size: 13px; line-height: 1.6;
  }
  .nim-msg-user .nim-msg-text {
    background: #76b900; color: #000;
    border-bottom-right-radius: 4px;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
  }
  .nim-msg-assistant .nim-msg-text {
    background: #111116; color: #d8d6d0;
    border: 1px solid #1e1e24;
    border-bottom-left-radius: 4px;
  }

  /* Rendered markdown */
  .nim-rendered p  { margin: 0 0 8px; }
  .nim-rendered p:last-child { margin-bottom: 0; }
  .nim-rendered h1, .nim-rendered h2, .nim-rendered h3 {
    margin: 12px 0 6px; color: #e8e6e0; font-size: 13px;
  }
  .nim-rendered ul { margin: 4px 0; padding-left: 16px; }
  .nim-rendered li { margin: 2px 0; }
  .nim-rendered a  { color: #76b900; text-decoration: none; }
  .nim-rendered a:hover { text-decoration: underline; }
  .nim-rendered strong { color: #e8e6e0; }

  .nim-code-block {
    background: #0d0d10; border: 1px solid #1e1e24;
    border-radius: 8px; padding: 12px;
    overflow-x: auto; font-size: 11px;
    line-height: 1.6; margin: 8px 0; font-family: inherit;
    position: relative;
  }
  .nim-code-block::before {
    content: attr(data-lang);
    position: absolute; top: 6px; right: 10px;
    font-size: 9px; color: #444; text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .nim-code-block code { color: #76b900; }
  .nim-inline-code {
    background: #0d0d10; border: 1px solid #1e1e24;
    padding: 1px 5px; border-radius: 4px;
    font-size: 11px; color: #76b900;
  }

  .nim-msg-actions { display: flex; gap: 4px; margin-top: 2px; }
  .nim-action-btn {
    font-size: 10px; padding: 2px 8px;
    background: transparent; border: 1px solid #1e1e24;
    border-radius: 4px; color: #555; cursor: pointer;
    font-family: inherit; transition: all 0.15s;
  }
  .nim-action-btn:hover { color: #e8e6e0; border-color: #2e2e38; }

  .nim-cursor {
    display: inline-block; animation: nimBlink 1s infinite;
    color: #76b900; font-size: 14px;
  }
  @keyframes nimBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  /* Attachments in messages */
  .nim-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
  .nim-attachment-chip {
    border-radius: 8px; overflow: hidden;
    border: 1px solid #1e1e24; max-width: 200px;
  }
  .nim-attachment-img { display: block; max-height: 160px; max-width: 200px; object-fit: cover; }
  .nim-attachment-file {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px; font-size: 11px; color: #888;
  }
  .nim-attachment-icon { font-size: 14px; }

  /* Error */
  .nim-error-bar {
    background: #e0525210; border: 1px solid #e0525230;
    border-radius: 8px; padding: 8px 12px;
    font-size: 11px; color: #e05252;
  }

  /* Attach preview */
  .nim-attach-preview {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 8px 16px; border-top: 1px solid #1a1a22;
    flex-shrink: 0;
  }
  .nim-attach-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 8px; background: #111116;
    border: 1px solid #1e1e24; border-radius: 20px;
    font-size: 11px; color: #888;
  }
  .nim-attach-thumb {
    width: 24px; height: 24px; object-fit: cover; border-radius: 4px;
  }
  .nim-attach-file-icon { font-size: 14px; }
  .nim-attach-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nim-attach-remove {
    width: 16px; height: 16px; background: none;
    border: none; color: #555; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; padding: 0; font-family: inherit;
  }
  .nim-attach-remove:hover { color: #e05252; }

  /* Input area */
  .nim-input-area {
    display: flex; align-items: flex-end; gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #1a1a22;
    background: #0d0d12;
    flex-shrink: 0;
  }
  .nim-attach-btn {
    width: 34px; height: 34px; flex-shrink: 0;
    background: #111116; border: 1px solid #1e1e24;
    border-radius: 8px; color: #555; font-size: 16px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .nim-attach-btn:hover { color: #e8e6e0; border-color: #2e2e38; background: #141418; }
  .nim-textarea {
    flex: 1; background: #111116; border: 1px solid #1e1e24;
    border-radius: 10px; padding: 9px 12px;
    color: #e8e6e0; font-size: 12px; font-family: inherit;
    outline: none; resize: none; min-height: 36px; max-height: 120px;
    overflow-y: auto; line-height: 1.5;
    transition: border-color 0.2s;
    field-sizing: content;
  }
  .nim-textarea:focus { border-color: #76b90060; }
  .nim-textarea::placeholder { color: #444; }
  .nim-textarea:disabled { opacity: 0.5; }

  .nim-send-btn {
    width: 34px; height: 34px; flex-shrink: 0;
    background: #76b900; border: none; border-radius: 8px;
    color: #000; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.15s;
  }
  .nim-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .nim-send-btn:hover:not(:disabled) { opacity: 0.85; }
  .nim-send-stop { background: #e05252; }

  .nim-send-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(0,0,0,0.3);
    border-top-color: #000;
    border-radius: 50%;
    animation: nimSpin 0.6s linear infinite;
  }
  @keyframes nimSpin { to { transform: rotate(360deg); } }

  /* Footer */
  .nim-footer {
    padding: 5px 16px 8px;
    font-size: 9px; color: #333;
    text-align: center; flex-shrink: 0;
    letter-spacing: 0.3px;
  }

  /* Drag overlay */
  .nim-drag-overlay {
    position: absolute; inset: 0; z-index: 10;
    background: rgba(10,10,14,0.92);
    display: flex; align-items: center; justify-content: center;
    border: 2px dashed #76b900;
  }
  .nim-drag-inner { text-align: center; color: #76b900; }
  .nim-drag-inner span { font-size: 36px; display: block; margin-bottom: 8px; }
  .nim-drag-inner p { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
  .nim-drag-inner small { font-size: 11px; color: #76b90080; }

  /* Typing indicator */
  .nim-typing { display: inline-flex; gap: 3px; padding: 4px 0; }
  .nim-typing span {
    width: 5px; height: 5px; border-radius: 50%;
    background: #76b900; display: block;
    animation: nimPulse 1.2s infinite;
  }
  .nim-typing span:nth-child(2) { animation-delay: 0.2s; }
  .nim-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes nimPulse { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
`;

import { useState, useRef, useEffect } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { SYSTEM_PROMPT } from "../../ai/prompts.js";

const FOLLOW_UPS = [
  { label: "💻 Code example",      prompt: "Give me a practical, real-world code example for this topic. Show common usage patterns and explain each part briefly." },
  { label: "🔄 Explain differently", prompt: "Explain this differently — use a different analogy or approach. Assume I didn't quite get the first explanation." },
  { label: "🧠 Quiz me",           prompt: "Give me 3 quick questions to test my understanding of this topic. After each question, tell me the answer." },
  { label: "➡️ What's next",        prompt: "What should I learn next after understanding this topic? What concepts build on it?" },
  { label: "⚠️ Common mistakes",    prompt: "What are the most common mistakes and misconceptions developers have about this topic? How do I avoid them?" },
  { label: "🔍 Go deeper",          prompt: "I want to go deeper. Explain the advanced concepts, edge cases, and nuances of this topic." },
];

function buildSystemPromptWithContext(topic, roadmapName, section) {
  return `${SYSTEM_PROMPT}

You are currently explaining the topic "${topic}" from the "${roadmapName}" roadmap (section: "${section}").
The user may ask follow-up questions. Answer conversationally and concisely.
When showing code, use proper syntax. Keep responses focused on this topic.
Respond in plain text (not JSON) for follow-up messages.`;
}

export function ExplainView({ data, rm, topic, rmKey, sectionKey, onSaveToNotes }) {
  const [messages,   setMessages]   = useState([]);  // {role, content}
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [saved,      setSaved]      = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (content) => {
    const text = content || input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) throw new Error("No API key. Open ⚙️ Settings to configure.");

      const systemPrompt = buildSystemPromptWithContext(topic, rm.label, sectionKey || "");

      const { text: reply } = await callAI({
        provider:     cfg.provider,
        apiKey,
        systemPrompt,
        userPrompt:   text,
        messages:     messages.map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setMessages(prev => prev.slice(0, -1)); // remove the user msg if failed
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!onSaveToNotes) return;
    const lines = [`## AI Explanation: ${topic}`, ""];
    if (data.summary)        lines.push(`**Summary:** ${data.summary}`, "");
    if (data.whatItIs)       lines.push(`**What it is:** ${data.whatItIs}`, "");
    if (data.howItWorks)     lines.push(`**How it works:** ${data.howItWorks}`, "");
    if (data.whenToUse)      lines.push(`**When to use:** ${data.whenToUse}`, "");
    if (data.codeExample?.code) {
      lines.push(`**Example (${data.codeExample.language || "code"}):**`);
      lines.push(`\`\`\`${data.codeExample.language || ""}\n${data.codeExample.code}\n\`\`\``, "");
    }
    if (data.commonMistakes) lines.push(`**Common mistakes:** ${data.commonMistakes}`, "");
    if (data.keyTakeaway)    lines.push(`**Key takeaway:** ${data.keyTakeaway}`);
    if (messages.length > 0) {
      lines.push("", "## Follow-up Chat", "");
      messages.forEach(m => {
        lines.push(`**${m.role === "user" ? "Q" : "A"}:** ${m.content}`, "");
      });
    }
    onSaveToNotes(rmKey, topic, lines.join("\n"));
    setSaved(true);
  };

  const sections = [
    { key: "whatItIs",       label: "What it is",      icon: "📖" },
    { key: "howItWorks",     label: "How it works",    icon: "⚙️" },
    { key: "whenToUse",      label: "When to use it",  icon: "🎯" },
    { key: "commonMistakes", label: "Common mistakes", icon: "⚠️" },
    { key: "keyTakeaway",    label: "Key takeaway",    icon: "💡" },
  ];

  const hasCode   = data.codeExample?.code;
  const hasAnalogy = data.codeExample?.description && !hasCode;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Initial explanation ── */}
      <div style={{ padding: "0 20px 16px" }}>
        {/* Summary */}
        <div style={{ background: rm.color + "18", border: `1px solid ${rm.color}44`,
          borderRadius: 10, padding: "14px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: rm.accent, fontWeight: 700, marginBottom: 6 }}>Summary</div>
          <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{data.summary}</div>
        </div>

        {sections.map(({ key, label, icon }) => data[key] && (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 5, display: "flex", gap: 6, alignItems: "center" }}>
              <span>{icon}</span> {label}
            </div>
            <div style={{ background: "#16161b", borderRadius: 8, padding: "11px",
              border: "1px solid #1e1e24", fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>
              {data[key]}
            </div>
          </div>
        ))}

        {(hasCode || hasAnalogy) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 5, display: "flex", gap: 6, alignItems: "center" }}>
              <span>💻</span>
              {hasCode ? `Example${data.codeExample.language ? ` — ${data.codeExample.language}` : ""}` : "Example"}
            </div>
            {data.codeExample.description && (
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6, fontStyle: "italic" }}>
                {data.codeExample.description}
              </div>
            )}
            {hasCode ? (
              <div style={{ background: "#0d1117", borderRadius: 8, padding: "13px",
                border: "1px solid #1e1e24", overflow: "auto" }}>
                <pre style={{ margin: 0, fontSize: 12, color: "#c9d1d9", lineHeight: 1.7,
                  fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre", overflowX: "auto" }}>
                  {data.codeExample.code}
                </pre>
              </div>
            ) : (
              <div style={{ background: "#16161b", borderRadius: 8, padding: "11px",
                border: "1px solid #1e1e24", fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>
                {data.codeExample.description}
              </div>
            )}
          </div>
        )}

        {/* Save to notes */}
        {onSaveToNotes && (
          <button onClick={handleSave} disabled={saved}
            style={{ width: "100%", marginTop: 4, padding: "9px",
              background: saved ? "#1a2e1a" : "#1e1e24",
              border: `1px solid ${saved ? "#52b78844" : "#2a2a35"}`,
              borderRadius: 8, color: saved ? "#52b788" : "#888",
              fontSize: 12, cursor: saved ? "default" : "pointer",
              fontFamily: "inherit", fontWeight: saved ? 600 : 400 }}>
            {saved ? "✓ Saved to notes" : "📋 Save to notes"}
          </button>
        )}
      </div>

      {/* ── Chat divider ── */}
      <div style={{ padding: "0 20px", marginBottom: 12 }}>
        <div style={{ borderTop: "1px solid #1e1e24", paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 10 }}>💬 Ask a follow-up</div>

          {/* Quick follow-up buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {FOLLOW_UPS.map(f => (
              <button key={f.label} onClick={() => sendMessage(f.prompt)} disabled={loading}
                style={{ padding: "5px 10px", background: "#0f0f13",
                  border: `1px solid #2a2a35`, borderRadius: 20,
                  color: "#888", fontSize: 11, cursor: loading ? "default" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat messages ── */}
      {messages.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "92%",
              }}>
                {m.role === "user" ? (
                  <div style={{ background: rm.color + "22", border: `1px solid ${rm.color}44`,
                    borderRadius: "12px 12px 4px 12px", padding: "9px 13px",
                    fontSize: 13, color: rm.accent, lineHeight: 1.5 }}>
                    {m.content}
                  </div>
                ) : (
                  <div style={{ background: "#16161b", border: "1px solid #1e1e24",
                    borderRadius: "12px 12px 12px 4px", padding: "11px 13px",
                    fontSize: 13, color: "#ccc", lineHeight: 1.7,
                    whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "#16161b",
                border: "1px solid #1e1e24", borderRadius: "12px 12px 12px 4px",
                padding: "11px 16px", fontSize: 13, color: "#555" }}>
                <span style={{ animation: "pulse 1.2s infinite" }}>●</span>
                <span style={{ marginLeft: 4, animation: "pulse 1.2s 0.2s infinite" }}>●</span>
                <span style={{ marginLeft: 4, animation: "pulse 1.2s 0.4s infinite" }}>●</span>
              </div>
            )}
            {error && (
              <div style={{ fontSize: 12, color: "#e05252", padding: "8px 12px",
                background: "#2e1a1a", borderRadius: 8, border: "1px solid #6a2d2d" }}>
                {error}
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Input ── */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about this topic…"
            disabled={loading}
            style={{ flex: 1, background: "#0f0f13", border: "1px solid #2a2a35",
              borderRadius: 8, padding: "9px 12px", color: "#e8e6e0",
              fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{ padding: "9px 14px", background: input.trim() && !loading ? rm.color : "#1e1e24",
              border: "none", borderRadius: 8,
              color: input.trim() && !loading ? "#fff" : "#444",
              fontSize: 14, cursor: input.trim() && !loading ? "pointer" : "default",
              fontFamily: "inherit", fontWeight: 600, transition: "background 0.15s" }}>
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}

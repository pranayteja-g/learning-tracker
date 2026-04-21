import { useState, useRef, useEffect } from "react";
import { loadAIConfig } from "../../ai/providers.js";
import { TOOL_DEFINITIONS, executeTool } from "./SageTools.js";

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const MODEL_TEXT   = "meta/llama-3.3-70b-instruct";
const MODEL_VISION = "meta/llama-4-scout-17b-16e-instruct";

// ── Action summary card ───────────────────────────────────────────────────────
function ActionCard({ actions }) {
  if (!actions?.length) return null;
  return (
    <div style={{ margin: "8px 0", background: "#1a2e1a", border: "1px solid #52b78833",
      borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "#52b788", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        ✅ Actions performed
      </div>
      {actions.map((a, i) => (
        <div key={i} style={{ fontSize: 12, color: "#52b788", lineHeight: 1.6 }}>
          {a.success ? "✓" : "✗"} {a.message || a.error}
        </div>
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Message({ msg, color }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12, gap: 8, alignItems: "flex-start" }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: color + "22", border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14 }}>🌿</div>
      )}
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser ? color : "#16161b",
          border: isUser ? "none" : "1px solid #2a2a35",
          fontSize: 13, color: isUser ? "#fff" : "#ccc", lineHeight: 1.7,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {msg.image && (
            <img src={msg.image} alt="" style={{ width: "100%", maxHeight: 160,
              objectFit: "contain", borderRadius: 6, marginBottom: 8, display: "block" }} />
          )}
          {msg.content}
        </div>
        {msg.actions && <ActionCard actions={msg.actions} />}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function Typing({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%",
        background: color + "22", border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌿</div>
      <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#16161b",
        border: "1px solid #2a2a35", borderRadius: "14px 14px 14px 4px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: color,
            animation: `sage-bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
        <style>{`@keyframes sage-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      </div>
    </div>
  );
}

// ── Main SagePanel ────────────────────────────────────────────────────────────
export function SagePanel({ open, onClose, appContext }) {
  const { roadmaps } = appContext;
  const color = "#52b788";

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [image,     setImage]     = useState(null); // { base64, mimeType, preview }
  const [error,     setError]     = useState("");
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const fileRef    = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open && messages.length === 0) sendGreeting(); }, [open]);

  const sendGreeting = () => {
    const rmList = Object.values(roadmaps).map(r => r.label).join(", ");
    setMessages([{
      role: "assistant",
      content: `Hi! I'm Sage 🌿 — your learning mentor.\n\nI can see your roadmaps: **${rmList || "none yet"}**\n\nI can help you:\n• Answer questions about any topic\n• Save notes directly to your roadmap\n• Read images or documents and extract knowledge\n• Check your progress and suggest what to study\n• Create clippings for anything interesting you find\n\nWhat would you like to explore today?`,
    }]);
  };

  const buildSystemPrompt = () => {
    const rmSummary = Object.values(roadmaps).map(rm => {
      const topics = Object.values(rm.sections).flat()
        .map(t => typeof t === "string" ? t : t?.name).filter(Boolean);
      const done = topics.filter(t => appContext.progress[`${rm.id}::${t}`]).length;
      return `- ${rm.label} (id: ${rm.id}): ${done}/${topics.length} topics done. Sections: ${Object.keys(rm.sections).join(", ")}. Topics: ${topics.join(", ")}`;
    }).join("\n");

    return `You are Sage 🌿, a wise and encouraging learning mentor built into a personal learning tracker app.

The user's learning data:
${rmSummary || "No roadmaps yet."}

XP: ${appContext.xpData?.xp || 0} | Badges: ${(appContext.xpData?.badges || []).length}

Your personality:
- Warm, encouraging, knowledgeable
- Give clear, structured explanations with examples
- For programming topics: always include code examples
- When reading images/documents: extract ALL useful information and save it
- Be proactive: if user shares an image of notes, offer to save them
- After performing actions, briefly summarise what you did

You have tools to interact with the app. Use them when appropriate:
- Use get_progress when asked about progress
- Use add_note to save knowledge to specific topics
- Use create_clipping for general content not tied to a topic
- Use search_notes when asked if they have notes on something
- Use mark_topic_done when user says they've learned/finished something
- You can use multiple tools in one response

Always respond in a helpful, mentor-like tone. Format responses with markdown.`;
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("Image must be under 4MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => setImage({
      base64: ev.target.result.split(",")[1],
      mimeType: file.type,
      preview: ev.target.result,
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !image) return;

    const cfg    = loadAIConfig();
    const apiKey = cfg.keys?.nvidia?.trim();
    if (!apiKey) {
      setError("Add your NVIDIA NIM API key in Settings → AI to use Sage.");
      return;
    }

    setError("");
    const userMsg = { role: "user", content: text || "Please analyse this image.", image: image?.preview };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setImage(null);
    setLoading(true);

    try {
      // Build conversation history for API
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.role === "user" && m.image
          ? [
              { type: "text", text: m.content },
              { type: "image_url", image_url: { url: m.image } }
            ]
          : m.content
      }));

      // Current user message
      const currentContent = image
        ? [
            { type: "text", text: text || "Please analyse this image and extract useful information." },
            { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } }
          ]
        : text;

      const model = image ? MODEL_VISION : MODEL_TEXT;

      const response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            ...history,
            { role: "user", content: currentContent }
          ],
          tools: image ? undefined : TOOL_DEFINITIONS,
          tool_choice: image ? undefined : "auto",
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data    = await response.json();
      const choice  = data.choices?.[0];
      const msg     = choice?.message;
      const actions = [];

      // Execute any tool calls
      if (msg?.tool_calls?.length) {
        const toolResults = [];
        for (const tc of msg.tool_calls) {
          let args;
          try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
          const result = executeTool(tc.function.name, args, appContext);
          actions.push(result);
          toolResults.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        }

        // Second call with tool results to get final response
        const followUp = await fetch(`${NVIDIA_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: MODEL_TEXT,
            max_tokens: 1024,
            messages: [
              { role: "system", content: buildSystemPrompt() },
              ...history,
              { role: "user", content: currentContent },
              msg,
              ...toolResults,
            ],
          })
        });
        const followData = await followUp.json();
        const finalText  = followData.choices?.[0]?.message?.content || "Done!";
        setMessages(prev => [...prev, { role: "assistant", content: finalText, actions }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: msg?.content || "…", actions }]);
      }

    } catch(e) {
      setMessages(prev => [...prev, { role: "assistant",
        content: `Sorry, I ran into an issue: ${e.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!open) return null;

  const hasNvidiaKey = !!loadAIConfig().keys?.nvidia?.trim();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#0f0f13",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", background: "#13131a",
        borderBottom: "1px solid #1e1e24", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%",
          background: color + "22", border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🌿
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Sage</div>
          <div style={{ fontSize: 11, color: "#555" }}>Your learning mentor</div>
        </div>
        <button onClick={() => { setMessages([]); setTimeout(sendGreeting, 50); }}
          style={{ background: "transparent", border: "none", color: "#444",
            fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "4px 8px" }}>
          ↺ Reset
        </button>
        <button onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#555",
            fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>

      {/* No key warning */}
      {!hasNvidiaKey && (
        <div style={{ padding: "10px 16px", background: "#2e1a00",
          border: "1px solid #ee9b0044", margin: "10px 16px",
          borderRadius: 8, fontSize: 12, color: "#ee9b00" }}>
          ⚠️ Add your <strong>NVIDIA NIM API key</strong> in Settings → AI to use Sage.
          Get a free key at <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer"
            style={{ color: "#ee9b00" }}>build.nvidia.com</a>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} color={color} />)}
        {loading && <Typing color={color} />}
        {error && (
          <div style={{ padding: "10px 14px", background: "#2e1a1a", borderRadius: 8,
            color: "#e05252", fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {image && (
        <div style={{ padding: "8px 16px 0", flexShrink: 0 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={image.preview} alt="" style={{ height: 60, borderRadius: 8,
              border: `1px solid ${color}44`, objectFit: "cover" }} />
            <button onClick={() => setImage(null)}
              style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18,
                borderRadius: "50%", background: "#e05252", border: "none",
                color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e24",
        background: "#13131a", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {/* Image upload */}
          <input ref={fileRef} type="file" accept="image/*,.pdf"
            onChange={handleFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: 38, height: 38, borderRadius: 10, background: "#1e1e24",
              border: "1px solid #2a2a35", color: "#555", fontSize: 16,
              cursor: "pointer", flexShrink: 0, display: "flex",
              alignItems: "center", justifyContent: "center" }}>
            📎
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Sage anything… (Shift+Enter for new line)"
            rows={1}
            style={{ flex: 1, padding: "10px 12px", background: "#1e1e24",
              border: "1px solid #2a2a35", borderRadius: 10, color: "#ccc",
              fontSize: 13, fontFamily: "inherit", resize: "none",
              outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />

          {/* Send */}
          <button onClick={send} disabled={loading || (!input.trim() && !image)}
            style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: (input.trim() || image) ? color : "#1e1e24",
              border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s" }}>
            ↑
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 6, textAlign: "center" }}>
          Powered by NVIDIA NIM · Llama 3.3 70B
        </div>
      </div>
    </div>
  );
}

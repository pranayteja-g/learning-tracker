import { useState, useRef } from "react";
import { loadAIConfig } from "../../ai/providers.js";

// ── Voice transcription ───────────────────────────────────────────────────────
function useVoiceRecorder(onTranscript) {
  const [recording, setRecording] = useState(false);
  const [error,     setError]     = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Use Web Speech API for transcription (free, no server)
        setRecording(false);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { setError("Microphone access denied."); }
  };

  const stop = () => { mediaRef.current?.stop(); };

  return { recording, error, start, stop };
}

// ── AI helpers ────────────────────────────────────────────────────────────────
async function generateFromImage(base64, mimeType, title) {
  const apiKey = loadAIConfig().keys?.groq?.trim();
  if (!apiKey) throw new Error("Requires a Groq API key.");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Analyse this image and create comprehensive, well-structured study notes.

Identify the content type and adapt accordingly:
- Code/programming → explain concepts + annotated code examples in same language
- Architecture/diagram → explain each component and how they interact  
- Language learning → vocabulary, grammar rules, example sentences
- Math/science → concept explanation + worked examples
- Article/text → structured summary with key points

Format with markdown (## headings, bullet points, code blocks).
End with a "## Key Takeaways" section.
Be thorough — these are notes the user will study from.` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
        ]
      }]
    })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "API error"); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function generateFromUrl(url, apiKey, provider) {
  if (!apiKey) throw new Error("No AI key configured.");

  const prompt = `Fetch and analyse this URL, then create comprehensive study notes from its content: ${url}

Create well-structured notes with:
- A clear title
- Main concepts explained with examples
- Code examples if it's a technical article (in the appropriate language)
- Key takeaways at the end

Format with markdown headings and bullet points.`;

  // Use Groq with search if available, otherwise ask AI to work from URL knowledge
  const groqKey = loadAIConfig().keys?.groq?.trim();
  if (groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        messages: [
          { role: "system", content: "You are an expert at creating study notes from web content. When given a URL, create detailed, well-structured notes about the content at that URL based on your knowledge of the topic, clearly noting it's based on your training knowledge." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "API error"); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  // Fallback: Gemini
  const geminiKey = loadAIConfig().keys?.gemini?.trim();
  if (!geminiKey) throw new Error("No API key configured.");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "API error"); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ── Add Clipping Modal ────────────────────────────────────────────────────────
function AddClippingModal({ onSave, onClose }) {
  const [mode,     setMode]     = useState("type");   // type | image | url | voice
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [url,      setUrl]      = useState("");
  const [tags,     setTags]     = useState("");
  const [image,    setImage]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState("");      // generated content preview

  // Voice
  const [listening,  setListening]  = useState(false);
  const recognitionRef = useRef(null);

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4*1024*1024) { setError("Image must be under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setImage({ base64: ev.target.result.split(",")[1], mimeType: file.type, preview: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const generate = async () => {
    setLoading(true); setError(""); setPreview("");
    try {
      let text = "";
      if (mode === "image" && image) {
        text = await generateFromImage(image.base64, image.mimeType, title);
      } else if (mode === "url" && url.trim()) {
        text = await generateFromUrl(url.trim());
      }
      if (!text) throw new Error("Nothing generated. Please try again.");
      setPreview(text);
      if (!title) {
        // Extract title from first line of markdown
        const firstLine = text.split("\n").find(l => l.startsWith("#"));
        if (firstLine) setTitle(firstLine.replace(/^#+\s*/, "").trim());
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported in this browser. Try Chrome."); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setContent(transcript);
    };
    r.onerror = () => { setError("Voice recognition error."); setListening(false); };
    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const handleSave = () => {
    const finalContent = preview || content;
    if (!finalContent.trim()) { setError("Please add some content."); return; }
    onSave({
      title:     title.trim() || (url ? url : "New Note"),
      content:   finalContent.trim(),
      tags:      tags.split(",").map(t => t.trim()).filter(Boolean),
      sourceUrl: mode === "url" ? url.trim() : null,
    });
  };

  const btn = (id, icon, label) => (
    <button key={id} onClick={() => { setMode(id); setError(""); setPreview(""); }}
      style={{ flex: 1, padding: "10px 4px", background: mode === id ? "#7b5ea722" : "#1e1e24",
        border: `1px solid ${mode === id ? "#7b5ea7" : "#2a2a35"}`, borderRadius: 8,
        color: mode === id ? "#c4b5fd" : "#666", fontSize: 11, fontWeight: mode === id ? 700 : 400,
        cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>{label}
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: 16 }}>
      <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 14,
        width: "100%", maxWidth: 520, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #1e1e24",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>📝 New Clipping</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none",
            color: "#555", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Mode selector */}
          <div style={{ display: "flex", gap: 6 }}>
            {btn("type",  "⌨️", "Type")}
            {btn("image", "📷", "Image")}
            {btn("url",   "🔗", "URL")}
            {btn("voice", "🎙️", "Voice")}
          </div>

          {/* Title */}
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional — AI will suggest one)"
            style={{ width: "100%", padding: "10px 12px", background: "#0f0f13",
              border: "1px solid #2a2a35", borderRadius: 8, color: "#fff",
              fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />

          {/* Type mode */}
          {mode === "type" && (
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write your notes here…"
              style={{ width: "100%", minHeight: 180, padding: "12px", background: "#0f0f13",
                border: "1px solid #2a2a35", borderRadius: 8, color: "#ccc",
                fontSize: 13, fontFamily: "inherit", lineHeight: 1.7,
                resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          )}

          {/* Image mode */}
          {mode === "image" && (
            <>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
                <div style={{ border: `2px dashed ${image ? "#7b5ea7" : "#2a2a35"}`,
                  borderRadius: 10, overflow: "hidden", textAlign: "center",
                  background: "#0f0f13" }}>
                  {image
                    ? <img src={image.preview} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "contain", display: "block" }} />
                    : <div style={{ padding: "20px" }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                        <div style={{ fontSize: 12, color: "#666" }}>Tap to upload image</div>
                      </div>
                  }
                </div>
              </label>
              {image && !preview && (
                <button onClick={generate} disabled={loading}
                  style={{ width: "100%", padding: "11px", background: loading ? "#1e1e24" : "#7b5ea7",
                    border: "none", borderRadius: 8, color: loading ? "#555" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
                  {loading ? "Analysing…" : "✨ Generate Notes from Image"}
                </button>
              )}
            </>
          )}

          {/* URL mode */}
          {mode === "url" && (
            <>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                style={{ width: "100%", padding: "10px 12px", background: "#0f0f13",
                  border: "1px solid #2a2a35", borderRadius: 8, color: "#fff",
                  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              {url && !preview && (
                <button onClick={generate} disabled={loading}
                  style={{ width: "100%", padding: "11px", background: loading ? "#1e1e24" : "#7b5ea7",
                    border: "none", borderRadius: 8, color: loading ? "#555" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
                  {loading ? "Generating…" : "✨ Generate Notes from URL"}
                </button>
              )}
            </>
          )}

          {/* Voice mode */}
          {mode === "voice" && (
            <>
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <button onClick={listening ? stopVoice : startVoice}
                  style={{ width: 72, height: 72, borderRadius: "50%",
                    background: listening ? "#e05252" : "#7b5ea7",
                    border: `3px solid ${listening ? "#e0525244" : "#7b5ea744"}`,
                    cursor: "pointer", fontSize: 28,
                    boxShadow: listening ? "0 0 0 8px #e0525222" : "none",
                    transition: "all 0.3s" }}>
                  {listening ? "⏹" : "🎙️"}
                </button>
                <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
                  {listening ? "Listening… tap to stop" : "Tap to start recording"}
                </div>
              </div>
              {content && (
                <div style={{ background: "#0f0f13", borderRadius: 8, padding: "12px",
                  border: "1px solid #2a2a35", fontSize: 13, color: "#aaa", lineHeight: 1.7,
                  maxHeight: 150, overflowY: "auto" }}>
                  {content}
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {preview && (
            <div style={{ background: "#0f0f13", border: "1px solid #52b78833",
              borderRadius: 8, padding: "12px", maxHeight: 200, overflowY: "auto",
              fontSize: 12, color: "#aaa", lineHeight: 1.7,
              whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {preview}
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 12px", background: "#2e1a1a", borderRadius: 7,
              color: "#e05252", fontSize: 12, border: "1px solid #e0525233" }}>{error}</div>
          )}

          {/* Tags */}
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma separated, e.g. java, concurrency, interview)"
            style={{ width: "100%", padding: "10px 12px", background: "#0f0f13",
              border: "1px solid #2a2a35", borderRadius: 8, color: "#888",
              fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />

          {/* Save */}
          <button onClick={handleSave}
            disabled={!((preview || content) && (title || url || content))}
            style={{ width: "100%", padding: "12px",
              background: (preview || content) ? "#7b5ea7" : "#1e1e24",
              border: "none", borderRadius: 9, color: (preview || content) ? "#fff" : "#444",
              fontSize: 14, fontWeight: 700,
              cursor: (preview || content) ? "pointer" : "default",
              fontFamily: "inherit" }}>
            💾 Save Clipping
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Clipping Detail ───────────────────────────────────────────────────────────
function ClippingDetail({ clipping, onUpdate, onDelete, onClose }) {
  const [editing,  setEditing]  = useState(false);
  const [content,  setContent]  = useState(clipping.content);
  const [title,    setTitle]    = useState(clipping.title);

  const save = () => { onUpdate(clipping.id, { title, content }); setEditing(false); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f0f13", zIndex: 300,
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24",
        background: "#13131a", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none",
          color: "#666", fontSize: 20, cursor: "pointer", padding: 0 }}>‹</button>
        {editing
          ? <input value={title} onChange={e => setTitle(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }} />
          : <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        }
        <button onClick={() => editing ? save() : setEditing(true)}
          style={{ padding: "5px 12px", background: editing ? "#52b788" : "#7b5ea722",
            border: `1px solid ${editing ? "#52b788" : "#7b5ea744"}`,
            borderRadius: 6, color: editing ? "#fff" : "#c4b5fd",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {editing ? "✓ Save" : "✏️ Edit"}
        </button>
        <button onClick={() => { if (confirm("Delete this clipping?")) { onDelete(clipping.id); onClose(); }}}
          style={{ background: "transparent", border: "none", color: "#444",
            fontSize: 14, cursor: "pointer", padding: "4px" }}>🗑️</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {clipping.tags?.map(t => (
            <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4,
              background: "#7b5ea722", color: "#c4b5fd", border: "1px solid #7b5ea733" }}>
              #{t}
            </span>
          ))}
          {clipping.sourceUrl && (
            <a href={clipping.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4,
                background: "#1e1e24", color: "#7b8cde", textDecoration: "none" }}>
              🔗 Source
            </a>
          )}
          <span style={{ fontSize: 10, color: "#333" }}>
            {new Date(clipping.createdAt).toLocaleDateString()}
          </span>
        </div>

        {editing
          ? <textarea value={content} onChange={e => setContent(e.target.value)}
              style={{ width: "100%", minHeight: 400, padding: "12px", background: "#0f0f13",
                border: "1px solid #2a2a35", borderRadius: 8, color: "#ccc",
                fontSize: 14, fontFamily: "inherit", lineHeight: 1.8,
                resize: "none", outline: "none", boxSizing: "border-box" }} />
          : <div style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8,
              whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {content}
            </div>
        }
      </div>
    </div>
  );
}

// ── Main ClippingsSection ─────────────────────────────────────────────────────
export function ClippingsSection({ clippings, onAdd, onUpdate, onDelete, isMobile }) {
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState("");
  const [tagFilter, setTagFilter] = useState(null);

  const allTags = [...new Set(clippings.flatMap(c => c.tags || []))];

  const filtered = clippings.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) || c.tags?.some(t => t.toLowerCase().includes(q));
    const matchTag = !tagFilter || c.tags?.includes(tagFilter);
    return matchSearch && matchTag;
  });

  const detail = selected ? clippings.find(c => c.id === selected) : null;

  if (detail) return (
    <ClippingDetail
      clipping={detail}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClose={() => setSelected(null)}
    />
  );

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>
          📝 Clippings
          {clippings.length > 0 && (
            <span style={{ fontSize: 11, color: "#444", fontWeight: 400, marginLeft: 6 }}>
              {clippings.length}
            </span>
          )}
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: "6px 14px", background: "#7b5ea722",
            border: "1px solid #7b5ea744", borderRadius: 7,
            color: "#c4b5fd", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit" }}>
          + New
        </button>
      </div>

      {/* Search */}
      {clippings.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search clippings…"
          style={{ width: "100%", padding: "9px 12px", background: "#0f0f13",
            border: "1px solid #2a2a35", borderRadius: 8, color: "#888",
            fontSize: 12, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box", marginBottom: 10 }} />
      )}

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          <button onClick={() => setTagFilter(null)}
            style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
              background: !tagFilter ? "#7b5ea722" : "transparent",
              border: `1px solid ${!tagFilter ? "#7b5ea744" : "#2a2a35"}`,
              color: !tagFilter ? "#c4b5fd" : "#555", fontFamily: "inherit" }}>
            All
          </button>
          {allTags.map(t => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                background: tagFilter === t ? "#7b5ea722" : "transparent",
                border: `1px solid ${tagFilter === t ? "#7b5ea744" : "#2a2a35"}`,
                color: tagFilter === t ? "#c4b5fd" : "#555", fontFamily: "inherit" }}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {clippings.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: "#444" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
          <div style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>No clippings yet</div>
          <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6, marginBottom: 16 }}>
            Save notes, articles, voice memos or generate notes from images and URLs
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 22px", background: "#7b5ea7", border: "none",
              borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit" }}>
            + Add First Clipping
          </button>
        </div>
      )}

      {/* Clipping cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(c => (
          <div key={c.id} onClick={() => setSelected(c.id)}
            style={{ background: "#0f0f13", border: "1px solid #1e1e24",
              borderRadius: 9, padding: "12px 14px", cursor: "pointer",
              transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#2a2a35"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e24"}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 5 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc", flex: 1,
                marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              <span style={{ fontSize: 10, color: "#333", flexShrink: 0 }}>↗</span>
            </div>
            <div style={{ fontSize: 12, color: "#444", overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              lineHeight: 1.5, marginBottom: c.tags?.length ? 8 : 0 }}>
              {c.content}
            </div>
            {c.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {c.tags.map(t => (
                  <span key={t} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3,
                    background: "#7b5ea71a", color: "#7b5ea7", border: "1px solid #7b5ea722" }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && clippings.length > 0 && (
          <div style={{ textAlign: "center", padding: "20px", color: "#444", fontSize: 13 }}>
            No clippings match your search
          </div>
        )}
      </div>

      {showAdd && (
        <AddClippingModal
          onSave={(data) => { onAdd(data); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}

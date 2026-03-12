import { useRef, useState } from "react";
import { TEMPLATES } from "../../constants/templates.js";
import { downloadJSON } from "../../utils/roadmap.js";
import { loadAIConfig, saveAIConfig, PROVIDERS } from "../../ai/providers.js";

export function WelcomeScreen({ onImportBackup, onImportRoadmap, onCreate }) {
  const fileRef    = useRef(null);
  const roadmapRef = useRef(null);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [aiConfig, setAIConfig] = useState(loadAIConfig);
  const [showKey,  setShowKey]  = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const currentKey = aiConfig.keys?.[aiConfig.provider] || "";

  const handleProviderChange = (p) => {
    const updated = { ...aiConfig, provider: p };
    setAIConfig(updated);
    saveAIConfig(updated);
    setKeySaved(false);
  };

  const handleKeyChange = (val) => {
    const updated = { ...aiConfig, keys: { ...aiConfig.keys, [aiConfig.provider]: val } };
    setAIConfig(updated);
    saveAIConfig(updated);
    setKeySaved(false);
  };

  const handleSaveKey = () => {
    saveAIConfig(aiConfig);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const hasKey = !!currentKey.trim();

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
            Learning Tracker
          </h1>
          <p style={{ color: "#555", fontSize: 14, margin: 0 }}>
            Track your progress across any learning roadmap
          </p>
        </div>

        {/* ── AI Generate (primary CTA) ── */}
        <div style={{ background: "#16161b", border: "1px solid #7b5ea744", borderRadius: 12,
          padding: "20px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>✨ Generate with AI</div>
            <span style={{ fontSize: 10, background: "#7b5ea722", color: "#c4b5fd",
              padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Recommended</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Enter any topic and AI builds a complete structured roadmap in seconds. Free with Groq or Gemini.
          </div>

          {/* Inline key setup */}
          {!hasKey ? (
            <div>
              {!showKeySetup ? (
                <button onClick={() => setShowKeySetup(true)}
                  style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #7b5ea7, #4361ee)",
                    border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  🔑 Set up free AI key to generate
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Provider picker */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(PROVIDERS).map(([id, p]) => (
                      <button key={id} onClick={() => handleProviderChange(id)}
                        style={{ flex: 1, padding: "9px 8px", borderRadius: 7, cursor: "pointer",
                          fontFamily: "inherit", fontSize: 12, fontWeight: aiConfig.provider === id ? 700 : 400,
                          background: aiConfig.provider === id ? "#7b5ea722" : "#0f0f13",
                          border: `1px solid ${aiConfig.provider === id ? "#7b5ea7" : "#2a2a35"}`,
                          color: aiConfig.provider === id ? "#c4b5fd" : "#666" }}>
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {/* Key input */}
                  <div style={{ position: "relative" }}>
                    <input type={showKey ? "text" : "password"}
                      value={currentKey}
                      onChange={e => handleKeyChange(e.target.value)}
                      placeholder={PROVIDERS[aiConfig.provider]?.placeholder || "Paste API key…"}
                      style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35",
                        borderRadius: 7, padding: "10px 40px 10px 12px", color: "#e8e6e0",
                        fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    <button onClick={() => setShowKey(v => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 14 }}>
                      {showKey ? "🙈" : "👁"}
                    </button>
                  </div>

                  {/* Get key link */}
                  <div style={{ fontSize: 11, color: "#444" }}>
                    Get a free key at{" "}
                    <a href={aiConfig.provider === "groq" ? "https://console.groq.com/keys" : "https://aistudio.google.com/apikey"}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "#7b8cde" }}>
                      {aiConfig.provider === "groq" ? "console.groq.com/keys" : "aistudio.google.com/apikey"}
                    </a>
                    {" "}— free, no credit card needed.
                  </div>

                  <button onClick={() => { handleSaveKey(); if (currentKey.trim()) onCreate(); }}
                    disabled={!currentKey.trim()}
                    style={{ width: "100%", padding: "11px",
                      background: currentKey.trim() ? "linear-gradient(135deg, #7b5ea7, #4361ee)" : "#1e1e24",
                      border: "none", borderRadius: 8,
                      color: currentKey.trim() ? "#fff" : "#444",
                      fontSize: 13, cursor: currentKey.trim() ? "pointer" : "default",
                      fontFamily: "inherit", fontWeight: 600 }}>
                    {keySaved ? "✓ Saved — opening editor…" : "Save key & generate roadmap →"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Has key — go straight to editor */
            <button onClick={onCreate}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #7b5ea7, #4361ee)",
                border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              ✨ Generate AI roadmap
            </button>
          )}
        </div>

        {/* ── Build manually ── */}
        <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 12,
          padding: "20px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>✏️ Build your own</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Create a custom roadmap from scratch with your own sections and topics.
          </div>
          <button onClick={onCreate}
            style={{ width: "100%", padding: "11px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Create manually
          </button>
        </div>

        {/* ── Templates ── */}
        <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 12,
          padding: "20px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>🆕 Start from a template</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Download a pre-built roadmap file then import it.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
            {Object.values(TEMPLATES).map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#0f0f13", borderRadius: 8, padding: "10px 13px", border: `1px solid ${t.color}33` }}>
                <div>
                  <div style={{ fontSize: 13, color: "#ccc" }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                    {Object.keys(t.sections).length} sections · {Object.values(t.sections).flat().length} topics
                  </div>
                </div>
                <button onClick={() => downloadJSON(t, `${t.id}-roadmap.json`)}
                  style={{ padding: "6px 12px", background: t.color + "22", border: `1px solid ${t.color}44`,
                    borderRadius: 6, color: t.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => roadmapRef.current?.click()}
            style={{ width: "100%", padding: "10px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ⬆ Import a roadmap file (.json)
          </button>
          <input ref={roadmapRef} type="file" accept=".json" onChange={onImportRoadmap} style={{ display: "none" }} />
        </div>

        {/* ── Restore backup ── */}
        <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>🔄 Restore a backup</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Already have progress saved? Import your backup to restore everything.
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "10px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ⬆ Import backup file
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={onImportBackup} style={{ display: "none" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 20 }}>
          All data stored locally in your browser · Export regularly to back up
        </p>
      </div>
    </div>
  );
}

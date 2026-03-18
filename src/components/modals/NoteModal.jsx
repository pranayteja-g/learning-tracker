import { useState, useRef, useEffect } from "react";
import { isValidUrl } from "../../utils/roadmap.js";
import { callAIWithSearch, loadAIConfig } from "../../ai/providers.js";
import { RESOURCES_SYSTEM_PROMPT, buildFindResourcesPrompt, buildTopicCheatSheetPrompt, INTERVIEW_SYSTEM_PROMPT } from "../../ai/prompts.js";
import { useUsage } from "../../ai/useUsage.js";
import { safeParseJSON } from "../../utils/jsonParse.js";
import { CheatSheetView } from "../interview/CheatSheetView.jsx";

const DIFFICULTIES = ["easy", "medium", "hard"];
const TIME_OPTIONS = ["< 1 hour", "1–2 hours", "2–5 hours", "5–10 hours", "10+ hours"];

const TYPE_ICONS = { docs: "📄", tutorial: "📝", video: "🎬", interactive: "🎮", course: "🎓" };
const TYPE_COLORS = { docs: "#7b8cde", tutorial: "#52b788", video: "#e05252", interactive: "#ee9b00", course: "#c4b5fd" };

export function NoteModal({ noteModal, roadmaps, notes, resources, topicMeta, onSave, onClose }) {
  const { roadmap: rmKey, topic } = noteModal;
  const rm = roadmaps[rmKey];

  const [note,        setNote]        = useState(notes[`${rmKey}::${topic}`] || "");
  const [difficulty,  setDifficulty]  = useState(topicMeta[`${rmKey}::${topic}`]?.difficulty || "");
  const [timeEst,     setTimeEst]     = useState(topicMeta[`${rmKey}::${topic}`]?.timeEst || "");
  const [links,       setLinks]       = useState(resources[`${rmKey}::${topic}`] || []);
  const [linkTitle,   setLinkTitle]   = useState("");
  const [linkUrl,     setLinkUrl]     = useState("");
  const [linkError,   setLinkError]   = useState("");
  const [tab,         setTab]         = useState("notes");
  const [expanded,    setExpanded]    = useState(false);
  const [editing,     setEditing]     = useState(false);

  // AI resource finding state
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [aiResults,   setAiResults]   = useState(null); // suggested resources before adding
  const [audience,    setAudience]    = useState("");
  const [showAudience, setShowAudience] = useState(false);
  const [cheatSheet,   setCheatSheet]   = useState(null);
  const [csLoading,    setCsLoading]    = useState(false);
  const [csError,      setCsError]      = useState("");

  const { recordUsage } = useUsage();
  const textareaRef = useRef(null);

  // Clear AI results and cheat sheet when switching away from resources tab
  useEffect(() => { if (tab !== "resources") { setAiResults(null); setCheatSheet(null); } }, [tab]);

  const addLink = () => {
    if (!linkUrl.trim()) { setLinkError("URL is required"); return; }
    if (!isValidUrl(linkUrl.trim())) { setLinkError("Enter a valid URL (include https://)"); return; }
    setLinks(l => [...l, { title: linkTitle.trim() || linkUrl.trim(), url: linkUrl.trim() }]);
    setLinkTitle(""); setLinkUrl(""); setLinkError("");
  };

  const removeLink = i => setLinks(l => l.filter((_, idx) => idx !== i));

  const handleSave = () => onSave({ rmKey, topic, note, difficulty, timeEst, links });

  // ── Find Resources via AI + web search ────────────────────────────────────
  const findResources = async () => {
    const aiConfig = loadAIConfig();
    if (!aiConfig.keys?.[aiConfig.provider]?.trim()) {
      setAiError("No AI key set. Open the 🤖 AI panel → Settings to add one.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiResults(null);
    try {
      const { text, usage } = await callAIWithSearch({
        provider:     aiConfig.provider,
        apiKey:       aiConfig.keys[aiConfig.provider],
        systemPrompt: RESOURCES_SYSTEM_PROMPT,
        userPrompt:   buildFindResourcesPrompt(topic, rm?.label || rmKey, audience),
      });
      recordUsage(usage);
      const parsed = safeParseJSON(text);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No resources found. Try again.");
      setAiResults(parsed);
    } catch (e) {
      setAiError(e.message || "Search failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Find topic-specific cheat sheet ──────────────────────────────────────
  const findTopicCheatSheet = async () => {
    const aiConfig = loadAIConfig();
    if (!aiConfig.keys?.[aiConfig.provider]?.trim()) {
      setCsError("No AI key set. Open the 🤖 AI panel → Settings to add one."); return;
    }
    const sectionKey = Object.entries(rm?.sections || {}).find(([, ts]) => ts.includes(topic))?.[0] || "";
    setCsLoading(true); setCsError(""); setCheatSheet(null);
    try {
      const { text, usage } = await callAIWithSearch({
        provider:     aiConfig.keys[aiConfig.provider] ? aiConfig.provider : "groq",
        apiKey:       aiConfig.keys[aiConfig.provider],
        systemPrompt: INTERVIEW_SYSTEM_PROMPT,
        userPrompt:   buildTopicCheatSheetPrompt(topic, rm?.label || rmKey, sectionKey),
      });
      recordUsage(usage);
      const parsed = JSON.parse(text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim());
      if (!parsed.mustKnow) throw new Error("Incomplete cheat sheet returned.");
      setCheatSheet(parsed);
    } catch(e) {
      setCsError(e.message || "Generation failed. Try again.");
    } finally {
      setCsLoading(false);
    }
  };

  const addAiResource = (r) => {
    if (links.find(l => l.url === r.url)) return; // already added
    setLinks(l => [...l, { title: r.title, url: r.url }]);
  };

  const addAllAiResources = () => {
    const newLinks = (aiResults || []).filter(r => !links.find(l => l.url === r.url));
    setLinks(l => [...l, ...newLinks.map(r => ({ title: r.title, url: r.url }))]);
  };

  const tabs = ["notes", "resources", "meta"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "8px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 12, width: "100%", maxWidth: expanded && tab === "notes" ? 820 : 620, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", transition: "max-width 0.2s",
        display: "flex", flexDirection: "column", maxHeight: "92vh", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: rm?.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
                {rm?.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{topic}</div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#555",
              fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 0 0 8px" }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1e1e24" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "7px 14px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, textTransform: "capitalize",
                color: tab === t ? rm?.accent : "#555",
                borderBottom: tab === t ? `2px solid ${rm?.color}` : "2px solid transparent",
                marginBottom: -1,
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>

          {/* ── Notes tab ── */}
          {tab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                {editing && (
                  <button onClick={() => setExpanded(v => !v)}
                    style={{ fontSize: 11, padding: "4px 10px", background: "transparent",
                      border: "1px solid #2a2a35", borderRadius: 5,
                      color: expanded ? "#c4b5fd" : "#555", cursor: "pointer", fontFamily: "inherit" }}>
                    {expanded ? "⊡ Collapse" : "⊞ Expand"}
                  </button>
                )}
                <button onClick={() => { setEditing(v => !v); }}
                  style={{ fontSize: 11, padding: "4px 12px", background: editing ? "#7b5ea722" : "#1e1e24",
                    border: `1px solid ${editing ? "#7b5ea7" : "#2a2a35"}`, borderRadius: 5,
                    color: editing ? "#c4b5fd" : "#888", cursor: "pointer", fontFamily: "inherit", fontWeight: editing ? 600 : 400 }}>
                  {editing ? "✓ Done" : "✏️ Edit"}
                </button>
              </div>

              {editing ? (
                <textarea ref={textareaRef} value={note} onChange={e => setNote(e.target.value)}
                  autoFocus
                  placeholder="Add your notes, key concepts, takeaways…"
                  style={{ width: "100%", minHeight: expanded ? 420 : 220,
                    background: "#0f0f13", border: "1px solid #2a2a35",
                    borderRadius: 7, padding: "12px 14px", color: "#e8e6e0",
                    fontSize: expanded ? 15 : 14, fontFamily: "inherit",
                    resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.8 }} />
              ) : (
                <div onClick={() => setEditing(true)}
                  style={{ width: "100%", minHeight: 220,
                    background: "#0f0f13", border: "1px solid #1e1e24",
                    borderRadius: 7, padding: "12px 14px", color: note ? "#e8e6e0" : "#444",
                    fontSize: 14, fontFamily: "inherit", lineHeight: 1.8,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    cursor: "text", boxSizing: "border-box" }}>
                  {note || "No notes yet. Tap ✏️ Edit to add notes, key concepts, takeaways…"}
                </div>
              )}
            </div>
          )}

          {/* ── Resources tab ── */}
          {tab === "resources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Find Resources with AI ── */}
              <div style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 10, padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>🔍 Find Resources</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      AI searches the web for real, free learning links
                    </div>
                  </div>
                  <button onClick={() => setShowAudience(v => !v)}
                    style={{ fontSize: 11, padding: "4px 8px", background: "transparent",
                      border: `1px solid ${showAudience ? "#7b5ea7" : "#2a2a35"}`,
                      borderRadius: 5, color: showAudience ? "#c4b5fd" : "#555",
                      cursor: "pointer", fontFamily: "inherit" }}>
                    {showAudience ? "Hide" : "⚙️ Context"}
                  </button>
                </div>

                {showAudience && (
                  <input value={audience} onChange={e => setAudience(e.target.value)}
                    placeholder="e.g. beginner, 12-year-old student, backend developer…"
                    style={{ width: "100%", background: "#16161b", border: "1px solid #2a2a35",
                      borderRadius: 6, padding: "7px 10px", color: "#e8e6e0", fontSize: 12,
                      fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                )}

                <button onClick={findResources} disabled={aiLoading}
                  style={{ width: "100%", padding: "9px", fontWeight: 600, fontSize: 13,
                    background: aiLoading ? "#1e1e24" : `linear-gradient(135deg, ${rm?.color}, #4361ee)`,
                    border: "none", borderRadius: 7,
                    color: aiLoading ? "#444" : "#fff",
                    cursor: aiLoading ? "default" : "pointer",
                    fontFamily: "inherit" }}>
                  {aiLoading ? "🔍 Searching the web…" : "✨ Find Best Free Resources"}
                </button>

                {aiError && (
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "#2e1a1a",
                    border: "1px solid #6a2d2d", borderRadius: 6, fontSize: 12, color: "#e05252" }}>
                    ✕ {aiError}
                  </div>
                )}
              </div>

              {/* ── Topic Cheat Sheet ── */}
              <div style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 10, padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>🗺️ Topic Cheat Sheet</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Interview-focused summary for this topic only</div>
                  </div>
                </div>
                <button onClick={findTopicCheatSheet} disabled={csLoading}
                  style={{ width: "100%", padding: "9px", fontWeight: 600, fontSize: 13,
                    background: csLoading ? "#1e1e24" : `linear-gradient(135deg, #e07b39, #ee9b00)`,
                    border: "none", borderRadius: 7,
                    color: csLoading ? "#444" : "#fff",
                    cursor: csLoading ? "default" : "pointer", fontFamily: "inherit" }}>
                  {csLoading ? "⚙️ Generating cheat sheet…" : "✨ Generate Topic Cheat Sheet"}
                </button>
                {csError && (
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "#2e1a1a",
                    border: "1px solid #6a2d2d", borderRadius: 6, fontSize: 12, color: "#e05252" }}>
                    ✕ {csError}
                  </div>
                )}
              </div>

              {/* Cheat sheet result */}
              {cheatSheet && <CheatSheetView data={cheatSheet} rm={rm} />}

              {/* ── AI suggested results ── */}
              {aiResults && (
                <div style={{ background: "#0f0f13", border: `1px solid ${rm?.color}44`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e1e24",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: rm?.accent }}>
                      ✅ {aiResults.length} resources found
                    </div>
                    <button onClick={addAllAiResources}
                      style={{ fontSize: 11, padding: "5px 10px", background: rm?.color + "22",
                        border: `1px solid ${rm?.color}44`, borderRadius: 5, color: rm?.accent,
                        cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                      + Add All
                    </button>
                  </div>

                  {aiResults.map((r, i) => {
                    const alreadyAdded = !!links.find(l => l.url === r.url);
                    const typeColor    = TYPE_COLORS[r.type] || "#666";
                    const typeIcon     = TYPE_ICONS[r.type]  || "🔗";
                    return (
                      <div key={i} style={{ padding: "12px 14px",
                        borderBottom: i < aiResults.length - 1 ? "1px solid #1e1e24" : "none",
                        background: alreadyAdded ? "#16161b" : "transparent" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 11, background: typeColor + "20",
                                color: typeColor, padding: "1px 6px", borderRadius: 3,
                                fontWeight: 600, flexShrink: 0 }}>
                                {typeIcon} {r.type}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: "#e8e6e0", fontWeight: 500, marginBottom: 3,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.title}
                            </div>
                            <a href={r.url} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: 11, color: "#555", textDecoration: "none", display: "block",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: r.why ? 4 : 0 }}>
                              {r.url}
                            </a>
                            {r.why && (
                              <div style={{ fontSize: 11, color: "#666", fontStyle: "italic", lineHeight: 1.5 }}>{r.why}</div>
                            )}
                          </div>
                          <button onClick={() => addAiResource(r)} disabled={alreadyAdded}
                            style={{ flexShrink: 0, padding: "5px 10px",
                              background: alreadyAdded ? "#1e1e24" : rm?.color + "22",
                              border: `1px solid ${alreadyAdded ? "#2a2a35" : rm?.color + "44"}`,
                              borderRadius: 5, color: alreadyAdded ? "#444" : rm?.accent,
                              fontSize: 11, cursor: alreadyAdded ? "default" : "pointer",
                              fontFamily: "inherit", fontWeight: 600 }}>
                            {alreadyAdded ? "✓ Added" : "+ Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Saved links ── */}
              {links.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8 }}>Saved Resources ({links.length})</div>
                  {links.map((link, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
                      background: "#0f0f13", borderRadius: 7, marginBottom: 6, border: "1px solid #1e1e24" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: rm?.accent, marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</div>
                        <a href={link.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: "#555", textDecoration: "none",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                          onClick={e => e.stopPropagation()}>{link.url}</a>
                      </div>
                      <button onClick={() => removeLink(i)} style={{ background: "transparent", border: "none",
                        color: "#444", fontSize: 16, cursor: "pointer", flexShrink: 0, padding: "2px 4px" }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Manual add ── */}
              <div style={{ background: "#0f0f13", borderRadius: 8, padding: "12px", border: "1px solid #1e1e24" }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>Add a link manually</div>
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)}
                  placeholder="Title (e.g. Official Docs)"
                  style={{ width: "100%", background: "#16161b", border: "1px solid #2a2a35", borderRadius: 6,
                    padding: "8px 10px", color: "#e8e6e0", fontSize: 13, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                <input value={linkUrl} onChange={e => { setLinkUrl(e.target.value); setLinkError(""); }}
                  placeholder="https://..."
                  onKeyDown={e => e.key === "Enter" && addLink()}
                  style={{ width: "100%", background: "#16161b", border: `1px solid ${linkError ? "#6a2d2d" : "#2a2a35"}`,
                    borderRadius: 6, padding: "8px 10px", color: "#e8e6e0", fontSize: 13, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box", marginBottom: linkError ? 4 : 8 }} />
                {linkError && <div style={{ fontSize: 11, color: "#e05252", marginBottom: 8 }}>{linkError}</div>}
                <button onClick={addLink} style={{ width: "100%", padding: "8px", background: rm?.color + "22",
                  border: `1px solid ${rm?.color}44`, borderRadius: 6, color: rm?.accent, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit" }}>+ Add Link</button>
              </div>
            </div>
          )}

          {/* ── Meta tab ── */}
          {tab === "meta" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Difficulty</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {DIFFICULTIES.map(d => {
                    const colors = { easy: "#52b788", medium: "#ee9b00", hard: "#e05252" };
                    const active = difficulty === d;
                    return (
                      <button key={d} onClick={() => setDifficulty(active ? "" : d)}
                        style={{ flex: 1, padding: "9px", border: `1px solid ${active ? colors[d] : "#2a2a35"}`,
                          borderRadius: 7, background: active ? colors[d] + "22" : "transparent",
                          color: active ? colors[d] : "#555", fontSize: 13, cursor: "pointer",
                          fontFamily: "inherit", textTransform: "capitalize", fontWeight: active ? 600 : 400 }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Estimated time</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TIME_OPTIONS.map(t => {
                    const active = timeEst === t;
                    return (
                      <button key={t} onClick={() => setTimeEst(active ? "" : t)}
                        style={{ padding: "7px 12px", border: `1px solid ${active ? rm?.color : "#2a2a35"}`,
                          borderRadius: 7, background: active ? rm?.color + "22" : "transparent",
                          color: active ? rm?.accent : "#555", fontSize: 12, cursor: "pointer",
                          fontFamily: "inherit", fontWeight: active ? 600 : 400 }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 18px", borderTop: "1px solid #1e1e24",
          display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent",
            border: "1px solid #2a2a35", borderRadius: 6, color: "#666", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: "8px 20px", background: rm?.color,
            border: "none", borderRadius: 6, color: "#fff", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

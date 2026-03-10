import { useState, useRef, useEffect } from "react";
import { isValidUrl } from "../../utils/roadmap.js";

const DIFFICULTIES = ["easy", "medium", "hard"];
const TIME_OPTIONS = ["< 1 hour", "1–2 hours", "2–5 hours", "5–10 hours", "10+ hours"];

export function NoteModal({ noteModal, roadmaps, notes, resources, topicMeta, onSave, onClose }) {
  const { roadmap: rmKey, topic } = noteModal;
  const rm = roadmaps[rmKey];

  const [note,       setNote]       = useState(notes[`${rmKey}::${topic}`] || "");
  const [difficulty, setDifficulty] = useState(topicMeta[`${rmKey}::${topic}`]?.difficulty || "");
  const [timeEst,    setTimeEst]    = useState(topicMeta[`${rmKey}::${topic}`]?.timeEst || "");
  const [links,      setLinks]      = useState(resources[`${rmKey}::${topic}`] || []);
  const [linkTitle,  setLinkTitle]  = useState("");
  const [linkUrl,    setLinkUrl]    = useState("");
  const [linkError,  setLinkError]  = useState("");
  const [tab,        setTab]        = useState("notes");
  const textareaRef = useRef(null);

  useEffect(() => { if (tab === "notes" && textareaRef.current) textareaRef.current.focus(); }, [tab]);

  const addLink = () => {
    if (!linkUrl.trim()) { setLinkError("URL is required"); return; }
    if (!isValidUrl(linkUrl.trim())) { setLinkError("Enter a valid URL (include https://)"); return; }
    setLinks(l => [...l, { title: linkTitle.trim() || linkUrl.trim(), url: linkUrl.trim() }]);
    setLinkTitle(""); setLinkUrl(""); setLinkError("");
  };

  const removeLink = (i) => setLinks(l => l.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({ rmKey, topic, note, difficulty, timeEst, links });
  };

  const tabs = ["notes", "resources", "meta"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 12, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

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

          {/* Notes tab */}
          {tab === "notes" && (
            <textarea ref={textareaRef} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add your notes, key concepts, takeaways…"
              style={{ width: "100%", minHeight: 160, background: "#0f0f13", border: "1px solid #2a2a35",
                borderRadius: 7, padding: "10px 12px", color: "#e8e6e0", fontSize: 14, fontFamily: "inherit",
                resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }} />
          )}

          {/* Resources tab */}
          {tab === "resources" && (
            <div>
              {links.length > 0 && (
                <div style={{ marginBottom: 14 }}>
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

              <div style={{ background: "#0f0f13", borderRadius: 8, padding: "12px", border: "1px solid #1e1e24" }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>Add a resource link</div>
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

          {/* Meta tab */}
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
        <div style={{ padding: "12px 20px 18px", borderTop: "1px solid #1e1e24", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent",
            border: "1px solid #2a2a35", borderRadius: 6, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: "8px 20px", background: rm?.color,
            border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

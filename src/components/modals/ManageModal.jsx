import { useRef, useState } from "react";
import { StorageIndicator } from "../ui/StorageIndicator.jsx";
import { TEMPLATES } from "../../constants/templates.js";
import { downloadJSON } from "../../utils/roadmap.js";
import { flatTopicNames } from "../../utils/topics.js";
import { loadAIConfig, saveAIConfig, PROVIDERS } from "../../ai/providers.js";
import { NetworkSyncPanel } from "../sync/NetworkSyncPanel.jsx";

export function ManageModal({ roadmaps, onClose, onImportRoadmap, onDelete, onEdit, onCreate,
  onExportBackup, onImportBackup, syncState }) {

  const fileRef    = useRef(null);
  const backupRef  = useRef(null);
  const [tab, setTab] = useState("roadmaps"); // "roadmaps" | "data" | "settings" | "sync"
  const [aiConfig, setAIConfig] = useState(loadAIConfig);
  const [showKey,  setShowKey]  = useState({});
  const handleSaveAI = () => {
    saveAIConfig(aiConfig);
    // Show brief confirmation
    setTab("roadmaps");
  };

  const tabStyle = (t) => ({
    flex: 1, padding: "8px", border: "none", borderRadius: 6,
    cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: tab === t ? 700 : 400,
    background: tab === t ? "#7b5ea722" : "transparent",
    color: tab === t ? "#c4b5fd" : "#666",
    borderBottom: tab === t ? "2px solid #7b5ea7" : "2px solid transparent",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 12, width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)", maxHeight: "88vh",
        display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #1e1e24" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>⚙️ Settings</div>
            <button onClick={onClose} style={{ background: "transparent", border: "none",
              color: "#666", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
            <button style={tabStyle("roadmaps")} onClick={() => setTab("roadmaps")}>🗺️ Roadmaps</button>
            <button style={tabStyle("data")}     onClick={() => setTab("data")}>💾 Data</button>
            <button style={tabStyle("sync")}     onClick={() => setTab("sync")}>🔗 Sync</button>
            <button style={tabStyle("settings")} onClick={() => setTab("settings")}>🤖 AI</button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>

          {/* ── Roadmaps tab ── */}
          {tab === "roadmaps" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {Object.values(roadmaps).length === 0 && (
                  <div style={{ fontSize: 13, color: "#555", textAlign: "center", padding: "20px 0" }}>
                    No roadmaps yet
                  </div>
                )}
                {Object.values(roadmaps).map(rm => (
                  <div key={rm.id} style={{ display: "flex", alignItems: "center", gap: 8,
                    background: "#0f0f13", borderRadius: 8, padding: "11px 13px",
                    border: `1px solid ${rm.color}33` }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: rm.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rm.label}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                        {Object.keys(rm.sections).length} sections ·{" "}
                        {Object.values(rm.sections).reduce((acc, ts) => acc + flatTopicNames(ts).length, 0)} topics
                      </div>
                    </div>
                    <button onClick={() => { onEdit(rm); onClose(); }}
                      style={{ padding: "5px 10px", background: rm.color + "22", border: `1px solid ${rm.color}44`,
                        borderRadius: 6, color: rm.accent, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(rm.id)}
                      style={{ padding: "5px 10px", background: "#1f1212", border: "1px solid #3a2020",
                        borderRadius: 6, color: "#e05252", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14, borderTop: "1px solid #1e1e24" }}>
                <button onClick={() => { onCreate(); onClose(); }}
                  style={{ width: "100%", padding: "10px", background: "#7b5ea7", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  ✏️ Create new roadmap
                </button>
                <button onClick={() => fileRef.current?.click()}
                  style={{ width: "100%", padding: "10px", background: "#1e1e24", border: "1px solid #2a2a35",
                    borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  ⬆ Import roadmap file (.json)
                </button>
                <input ref={fileRef} type="file" accept=".json"
                  onChange={e => { onImportRoadmap(e); onClose(); }} style={{ display: "none" }} />

                <div style={{ fontSize: 11, color: "#444", textAlign: "center", margin: "4px 0 2px" }}>or download a template</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.values(TEMPLATES).map(t => (
                    <button key={t.id} onClick={() => downloadJSON(t, `${t.id}-roadmap.json`)}
                      style={{ flex: 1, padding: "7px 4px", background: t.color + "22", border: `1px solid ${t.color}44`,
                        borderRadius: 6, color: t.accent, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      {t.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Data tab ── */}
          {tab === "data" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <StorageIndicator />
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 4 }}>
                Export a full backup of all your roadmaps, progress, notes and resources.
                Import to restore on any device.
              </div>
              <button onClick={() => { onExportBackup(); onClose(); }}
                style={{ width: "100%", padding: "12px", background: "#1e2e1e", border: "1px solid #52b78844",
                  borderRadius: 8, color: "#52b788", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                ⬇ Export full backup
              </button>
              <button onClick={() => backupRef.current?.click()}
                style={{ width: "100%", padding: "12px", background: "#1e1e24", border: "1px solid #2a2a35",
                  borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ⬆ Import backup
              </button>
              <input ref={backupRef} type="file" accept=".json"
                onChange={e => { onImportBackup(e); onClose(); }} style={{ display: "none" }} />
              <div style={{ fontSize: 11, color: "#444", marginTop: 8, padding: "10px", background: "#0f0f13",
                borderRadius: 8, lineHeight: 1.6 }}>
                ⚠️ Importing a backup will merge with your current data, not replace it.
              </div>
            </div>
          )}

          {/* ── Network Sync tab ── */}
          {tab === "sync" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <NetworkSyncPanel 
                useSync={syncState}
              />
            </div>
          )}

          {/* ── AI Settings tab ── */}
          {tab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Provider selector */}
              <div>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  AI Provider
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(PROVIDERS).map(([id, p]) => (
                    <button key={id} onClick={() => setAIConfig(c => ({ ...c, provider: id }))}
                      style={{ flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                        fontFamily: "inherit", border: `1px solid ${aiConfig.provider === id ? p.color : "#2a2a35"}`,
                        background: aiConfig.provider === id ? p.color + "22" : "#0f0f13",
                        color: aiConfig.provider === id ? "#fff" : "#666" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: aiConfig.provider === id ? p.color : "#444", marginTop: 2 }}>
                        {p.free ? "Free tier" : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API keys */}
              {Object.entries(PROVIDERS).map(([id, p]) => (
                <div key={id}>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 6 }}>{p.name} API Key</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type={showKey[id] ? "text" : "password"}
                      value={aiConfig.keys?.[id] || ""}
                      onChange={e => setAIConfig(c => ({ ...c, keys: { ...c.keys, [id]: e.target.value } }))}
                      placeholder={`Paste your ${p.name} key…`}
                      style={{ flex: 1, background: "#0f0f13", border: "1px solid #2a2a35",
                        borderRadius: 7, padding: "9px 12px", color: "#e8e6e0",
                        fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <button onClick={() => setShowKey(s => ({ ...s, [id]: !s[id] }))}
                      style={{ padding: "9px 12px", background: "#1e1e24", border: "1px solid #2a2a35",
                        borderRadius: 7, color: "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {showKey[id] ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
                    <a href={p.keyUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#4361ee" }}>Get a free {p.name} key →</a>
                  </div>
                </div>
              ))}

              <button onClick={handleSaveAI}
                style={{ width: "100%", padding: "11px", background: "#7b5ea7", border: "none",
                  borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 600, marginTop: 4 }}>
                Save AI Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

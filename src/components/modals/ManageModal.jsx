import { useRef, useState } from "react";
import { SyncTab } from "./SyncTab.jsx";
import { StorageIndicator } from "../ui/StorageIndicator.jsx";
import { TEMPLATES } from "../../constants/templates.js";
import { downloadJSON } from "../../utils/roadmap.js";
import { flatTopicNames } from "../../utils/topics.js";
import { loadAIConfig, saveAIConfig, PROVIDERS, fetchAvailableModels } from "../../ai/providers.js";
import { color, radius, space, font, input, label, button, divider } from "../../styles/theme.js";

const TABS = [
  { id: "roadmaps", label: "Roadmaps" },
  { id: "data",     label: "Data" },
  { id: "settings", label: "AI" },
  { id: "sync",     label: "Sync" },
  { id: "account",  label: "Account" },
];

export function ManageModal({ roadmaps, onClose, onImportRoadmap, onDelete, onEdit, onCreate,
  onExportBackup, onImportBackup, onGetSnapshot, onApplySnapshot, defaultTab = "roadmaps",
  user, onSignOut, onResetPassword, isGuest }) {

  const fileRef = useRef(null);
  const backupRef = useRef(null);
  const [tab, setTab] = useState(defaultTab);
  const [aiConfig, setAIConfig] = useState(loadAIConfig);
  const [showKey, setShowKey] = useState({});
  const [modelLists, setModelLists] = useState({});   // provider -> fetched model array
  const [modelState, setModelState] = useState({});   // provider -> "loading" | "idle" | error message

  const handleSaveAI = () => {
    saveAIConfig(aiConfig);
    setTab("roadmaps");
  };

  const handleFetchModels = async (id) => {
    const key = aiConfig.keys?.[id];
    if (!key?.trim()) return;
    setModelState(s => ({ ...s, [id]: "loading" }));
    try {
      const list = await fetchAvailableModels(id, key);
      setModelLists(m => ({ ...m, [id]: list }));
      setModelState(s => ({ ...s, [id]: "idle" }));
    } catch (e) {
      setModelState(s => ({ ...s, [id]: e.message || "Couldn't fetch models" }));
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: color.surface,
        border: `1px solid ${color.rule}`, borderRadius: radius.lg, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "88vh",
        display: "flex", flexDirection: "column", fontFamily: font.body }}>

        {/* Header */}
        <div style={{ padding: `${space.lg}px ${space.xl}px 0` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
            <div style={{ fontSize: 19, fontFamily: font.display, color: color.text }}>Settings</div>
            <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none",
              color: color.textFaint, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
          </div>
          {/* Underline tabs — one row, no per-tab background/border chrome */}
          <div style={{ display: "flex", gap: space.lg, borderBottom: `1px solid ${color.rule}` }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ background: "transparent", border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13.5, padding: "0 0 10px",
                  color: tab === t.id ? color.text : color.textFaint,
                  fontWeight: tab === t.id ? 600 : 400,
                  borderBottom: tab === t.id ? `2px solid ${color.accent}` : "2px solid transparent",
                  marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: `${space.lg}px ${space.xl}px` }}>

          {/* ── Roadmaps ── */}
          {tab === "roadmaps" && (
            <>
              {Object.values(roadmaps).length === 0 && (
                <div style={{ fontSize: 13.5, color: color.textFaint, textAlign: "center", padding: "24px 0" }}>
                  No roadmaps yet
                </div>
              )}
              {Object.values(roadmaps).map((rm, i) => (
                <div key={rm.id} style={{ display: "flex", alignItems: "center", gap: space.sm,
                  padding: "10px 0", borderTop: i > 0 ? `1px solid ${color.ruleSoft}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: rm.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: color.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rm.label}</div>
                    <div style={{ fontSize: 12, color: color.textFaint, marginTop: 1 }}>
                      {Object.keys(rm.sections).length} sections · {Object.values(rm.sections).reduce((acc, ts) => acc + flatTopicNames(ts).length, 0)} topics
                    </div>
                  </div>
                  <button onClick={() => { onEdit(rm); onClose(); }}
                    style={{ ...button("ghost"), padding: "5px 10px", fontSize: 12 }}>Edit</button>
                  <button onClick={() => onDelete(rm.id)}
                    style={{ ...button("danger"), padding: "5px 10px", fontSize: 12 }}>Delete</button>
                </div>
              ))}

              <div style={{ display: "flex", flexDirection: "column", gap: space.sm, marginTop: space.lg,
                paddingTop: space.lg, borderTop: `1px solid ${color.rule}` }}>
                <button onClick={() => { onCreate(); onClose(); }}
                  style={{ ...button("primary"), width: "100%", padding: "11px" }}>
                  Create new roadmap
                </button>
                <button onClick={() => fileRef.current?.click()}
                  style={{ ...button("default"), width: "100%", padding: "11px" }}>
                  Import roadmap file (.json)
                </button>
                <input ref={fileRef} type="file" accept=".json"
                  onChange={e => { onImportRoadmap(e); onClose(); }} style={{ display: "none" }} />

                <div style={{ fontSize: 12, color: color.textFaint, textAlign: "center", margin: "6px 0 0" }}>
                  or start from a template
                </div>
                <div style={{ display: "flex", gap: space.xs }}>
                  {Object.values(TEMPLATES).map(t => (
                    <button key={t.id} onClick={() => downloadJSON(t, `${t.id}-roadmap.json`)}
                      style={{ flex: 1, padding: "7px 4px", background: "transparent",
                        border: `1px solid ${color.rule}`, borderRadius: radius.sm,
                        color: color.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {t.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Data ── */}
          {tab === "data" && (
            <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
              <StorageIndicator />
              <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
                Export a full backup of all your roadmaps, progress, notes and resources.
                Import to restore on any device.
              </div>
              <button onClick={() => { onExportBackup(); onClose(); }}
                style={{ ...button("success"), width: "100%", padding: "12px" }}>
                Export full backup
              </button>
              <button onClick={() => backupRef.current?.click()}
                style={{ ...button("default"), width: "100%", padding: "12px" }}>
                Import backup
              </button>
              <input ref={backupRef} type="file" accept=".json"
                onChange={e => { onImportBackup(e); onClose(); }} style={{ display: "none" }} />
              <div style={{ fontSize: 12, color: color.textFaint, lineHeight: 1.6 }}>
                Importing a backup merges with your current data — it won't replace it.
              </div>
            </div>
          )}

          {/* ── Sync ── */}
          {tab === "sync" && (
            <SyncTab onGetSnapshot={onGetSnapshot} onApplySnapshot={onApplySnapshot} />
          )}

          {/* ── Account ── */}
          {tab === "account" && (
            <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%",
                    background: color.accentSoft, border: `1px solid ${color.accentBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: color.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                    <div style={{ fontSize: 12, color: color.success, marginTop: 2 }}>Cloud sync active</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13.5, color: color.textMuted }}>
                  You're in guest mode — data is stored locally only.
                </div>
              )}

              {user && onResetPassword && (
                <button onClick={async () => {
                    try {
                      await onResetPassword(user.email);
                      alert("Password reset email sent to " + user.email);
                    } catch(e) { alert("Failed: " + e.message); }
                  }}
                  style={{ ...button("default"), width: "100%", padding: "11px", textAlign: "left" }}>
                  Send password reset email
                </button>
              )}

              {isGuest && (
                <div>
                  <button onClick={() => onClose()}
                    style={{ ...button("primary"), width: "100%", padding: "11px" }}>
                    Sign in or create account
                  </button>
                  <div style={{ fontSize: 12, color: color.textFaint, marginTop: space.sm, lineHeight: 1.6 }}>
                    Sign in to sync your data across devices and keep it backed up online.
                  </div>
                </div>
              )}

              {user && onSignOut && (
                <div style={{ paddingTop: space.md, borderTop: `1px solid ${color.rule}` }}>
                  <button onClick={() => {
                      if (window.confirm("Sign out of your account?")) { onSignOut(); onClose(); }
                    }}
                    style={{ ...button("danger"), width: "100%", padding: "11px" }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── AI ── */}
          {tab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>

              {/* Provider — one segmented control, not two separate cards */}
              <div>
                <div style={label}>AI provider</div>
                <div style={{ display: "flex", border: `1px solid ${color.rule}`, borderRadius: radius.sm, overflow: "hidden" }}>
                  {Object.entries(PROVIDERS).filter(([,p]) => !p.sageOnly).map(([id, p], i) => (
                    <button key={id} onClick={() => setAIConfig(c => ({ ...c, provider: id }))}
                      style={{ flex: 1, padding: "10px 8px", border: "none", cursor: "pointer",
                        fontFamily: "inherit", borderLeft: i > 0 ? `1px solid ${color.rule}` : "none",
                        background: aiConfig.provider === id ? color.accentSoft : "transparent",
                        color: aiConfig.provider === id ? color.accent : color.textMuted }}>
                      <div style={{ fontSize: 13.5, fontWeight: aiConfig.provider === id ? 600 : 400 }}>{p.name}</div>
                      {p.free && <div style={{ fontSize: 11, color: aiConfig.provider === id ? color.accent : color.textFaint, marginTop: 2, opacity: 0.8 }}>Free tier</div>}
                    </button>
                  ))}
                </div>
              </div>

              {Object.entries(PROVIDERS).filter(([,p]) => !p.sageOnly).map(([id, p]) => (
                <div key={id}>
                  <div style={label}>{p.name} API key</div>
                  <div style={{ display: "flex", gap: space.xs }}>
                    <input
                      type={showKey[id] ? "text" : "password"}
                      value={aiConfig.keys?.[id] || ""}
                      onChange={e => setAIConfig(c => ({ ...c, keys: { ...c.keys, [id]: e.target.value } }))}
                      placeholder={`Paste your ${p.name} key…`}
                      style={{ ...input, flex: 1 }} />
                    <button onClick={() => setShowKey(s => ({ ...s, [id]: !s[id] }))}
                      style={{ ...button("default"), padding: "9px 12px", fontSize: 12 }}>
                      {showKey[id] ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: color.textFaint, marginTop: space.xs }}>
                    <a href={p.keyUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: color.accent }}>Get a free {p.name} key ↗</a>
                  </div>

                  {/* Model picker — providers periodically retire model IDs
                      (this is what broke Groq before), so let the user see
                      and pick from whatever's actually live for their key
                      instead of trusting a string baked into the app. */}
                  {aiConfig.keys?.[id]?.trim() && (
                    <div style={{ marginTop: space.sm }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <div style={{ ...label, marginBottom: 0 }}>Model</div>
                        <button onClick={() => handleFetchModels(id)} disabled={modelState[id] === "loading"}
                          style={{ fontSize: 11.5, background: "transparent", border: "none",
                            color: color.accent, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                          {modelState[id] === "loading" ? "Fetching…" : "Fetch available models"}
                        </button>
                      </div>

                      {modelLists[id] ? (
                        <select
                          value={aiConfig.models?.[id] || p.model}
                          onChange={e => setAIConfig(c => ({ ...c, models: { ...c.models, [id]: e.target.value } }))}
                          style={{ ...input, fontSize: 12.5, fontFamily: font.mono }}>
                          {!modelLists[id].some(m => m.id === (aiConfig.models?.[id] || p.model)) && (
                            <option value={aiConfig.models?.[id] || p.model}>
                              {aiConfig.models?.[id] || p.model} (saved, not in fetched list)
                            </option>
                          )}
                          {modelLists[id].map(m => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ ...input, color: color.textMuted, fontSize: 12.5, fontFamily: font.mono }}>
                          {aiConfig.models?.[id] || p.model}
                        </div>
                      )}

                      {modelState[id] && modelState[id] !== "loading" && modelState[id] !== "idle" && (
                        <div style={{ fontSize: 12, color: color.danger, marginTop: space.xs }}>{modelState[id]}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <hr style={divider} />

              {/* ── Sage / NVIDIA key — de-emphasized, it's an optional extra ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13.5, color: color.text }}>Sage AI — NVIDIA NIM</div>
                  <span style={{ fontSize: 11, color: color.success }}>Free</span>
                </div>
                <div style={{ fontSize: 12.5, color: color.textMuted, marginBottom: space.sm, lineHeight: 1.6 }}>
                  Uses NVIDIA NIM for intelligent app control — add notes, mark topics, create clippings, read images.
                  Get a free key at{" "}
                  <a href="https://build.nvidia.com/settings/api-keys" target="_blank" rel="noopener noreferrer"
                    style={{ color: color.accent }}>build.nvidia.com</a>
                </div>
                <div style={{ display: "flex", gap: space.xs }}>
                  <input
                    type={showKey["nvidia"] ? "text" : "password"}
                    value={aiConfig.keys?.nvidia || ""}
                    onChange={e => setAIConfig(c => ({ ...c, keys: { ...c.keys, nvidia: e.target.value } }))}
                    placeholder="nvapi-..."
                    style={{ ...input, flex: 1 }} />
                  <button onClick={() => setShowKey(s => ({ ...s, nvidia: !s.nvidia }))}
                    style={{ ...button("default"), padding: "9px 12px", fontSize: 12 }}>
                    {showKey["nvidia"] ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button onClick={handleSaveAI} style={{ ...button("primary"), width: "100%", padding: "12px" }}>
                Save AI settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { COLOR_PALETTE } from "../../constants/templates.js";
import { slugify } from "../../utils/roadmap.js";
import { callAI, loadAIConfig, PROVIDERS } from "../../ai/providers.js";
import { ROADMAP_SYSTEM_PROMPT, buildRoadmapPrompt, ROADMAP_CATEGORIES, buildTopicExpansionPrompt } from "../../ai/prompts.js";

function isValidHex(str) { return /^#[0-9a-fA-F]{6}$/.test(str); }

function safeParseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch {
    throw new Error("AI returned an unexpected format. Please try again.");
  }
}

// ── AI Generation Panel ───────────────────────────────────────────────────────
function AIGeneratePanel({ onGenerated, defaultColor, defaultAccent }) {
  const aiConfig = loadAIConfig();
  const hasKey   = !!aiConfig.keys?.[aiConfig.provider]?.trim();

  const [topic,    setTopic]    = useState("");
  const [extras,   setExtras]   = useState("");
  const [category, setCategory] = useState("tech");
  const [loading,  setLoad]     = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState(null);

  const selectedCat = ROADMAP_CATEGORIES.find(c => c.id === category);

  const generate = async () => {
    if (!topic.trim()) { setError("Enter a topic name first."); return; }
    setLoad(true); setError(""); setPreview(null);
    try {
      const { text } = await callAI({
        temperature:  0,
        provider:     aiConfig.provider,
        apiKey:       aiConfig.keys[aiConfig.provider],
        systemPrompt: ROADMAP_SYSTEM_PROMPT,
        userPrompt:   buildRoadmapPrompt(topic.trim(), extras, category),
      });
      const data = safeParseJSON(text);
      if (!data.label || !data.sections) throw new Error("Incomplete roadmap returned. Try again.");
      const totalTopics   = Object.values(data.sections).flat().length;
      const totalSections = Object.keys(data.sections).length;
      setPreview({ ...data, totalTopics, totalSections });
    } catch (e) {
      setError(e.message || "Generation failed. Please try again.");
    } finally {
      setLoad(false);
    }
  };

  const accept = () => {
    if (!preview) return;
    onGenerated({ label: preview.label, sections: preview.sections, color: defaultColor, accent: defaultAccent });
  };

  if (!hasKey) return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🔑</div>
      <div style={{ fontSize: 13, color: "#ccc", marginBottom: 6 }}>No AI key configured</div>
      <div style={{ fontSize: 12, color: "#555" }}>Open the 🤖 AI panel → Settings to add a free Groq or Gemini key.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Category picker */}
      <div>
        <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 8,
          textTransform: "uppercase", letterSpacing: 1 }}>Category</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 4 }}>
          {ROADMAP_CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <button key={cat.id} onClick={() => { setCategory(cat.id); setPreview(null); }}
                style={{ padding: "10px 6px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${active ? cat.color : "#2a2a35"}`,
                  background: active ? cat.color + "22" : "#0f0f13",
                  fontFamily: "inherit", textAlign: "center", transition: "all 0.15s" }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{cat.icon}</div>
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 400,
                  color: active ? cat.color : "#666" }}>{cat.label}</div>
              </button>
            );
          })}
        </div>
        {/* Category description */}
        <div style={{ fontSize: 11, color: "#555", padding: "6px 10px", background: "#0f0f13",
          borderRadius: 6, border: `1px solid ${selectedCat.color}33` }}>
          <span style={{ color: selectedCat.color }}>{selectedCat.icon}</span>{" "}
          <strong style={{ color: "#777" }}>{selectedCat.label}:</strong>{" "}
          {selectedCat.desc}
        </div>
      </div>

      {/* Topic input */}
      <div>
        <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 7,
          textTransform: "uppercase", letterSpacing: 1 }}>Topic *</label>
        <input value={topic} onChange={e => { setTopic(e.target.value); setError(""); setPreview(null); }}
          onKeyDown={e => e.key === "Enter" && !loading && generate()}
          placeholder={
            category === "tech"     ? "e.g. Docker, TypeScript, PostgreSQL, Kubernetes…" :
            category === "school"   ? "e.g. Biology, World History, Geography, Economics…" :
            category === "language" ? "e.g. French, Japanese, Hindi, Arabic, Spanish…" :
            category === "science"  ? "e.g. Organic Chemistry, Quantum Physics, Genetics…" :
            category === "maths"    ? "e.g. Calculus, Linear Algebra, Statistics, Geometry…" :
            category === "creative" ? "e.g. Watercolour Painting, Music Theory, UX Design…" :
            "e.g. Public Speaking, Chess, Cooking, Personal Finance…"
          }
          style={{ width: "100%", background: "#0f0f13",
            border: `1px solid ${error && !topic.trim() ? "#6a2d2d" : "#2a2a35"}`,
            borderRadius: 7, padding: "10px 12px", color: "#e8e6e0", fontSize: 14,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Extra instructions */}
      <div>
        <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 7,
          textTransform: "uppercase", letterSpacing: 1 }}>Extra Instructions (optional)</label>
        <textarea value={extras} onChange={e => setExtras(e.target.value)}
          placeholder={
            category === "tech"     ? "e.g. focus on backend, include testing, skip GUI…" :
            category === "school"   ? "e.g. GCSE level, include exam techniques, for 14-year-olds…" :
            category === "language" ? "e.g. focus on conversational fluency, include JLPT N5 prep…" :
            category === "science"  ? "e.g. A-level depth, include lab skills, focus on calculations…" :
            category === "maths"    ? "e.g. include proofs, focus on problem-solving, university level…" :
            category === "creative" ? "e.g. digital tools only, beginner-friendly, include portfolio tips…" :
            "Any specific focus, audience, or depth requirements…"
          }
          rows={2}
          style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 7, padding: "10px 12px", color: "#e8e6e0", fontSize: 13,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            resize: "vertical", lineHeight: 1.6 }} />
      </div>

      {/* Info row */}
      <div style={{ fontSize: 11, color: "#444", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#7b8cde" }}>ℹ</span>
        Temperature 0 · max consistency · via {PROVIDERS[aiConfig.provider]?.name}
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={loading || !topic.trim()}
        style={{ width: "100%", padding: "12px", fontWeight: 700, fontSize: 14,
          background: loading || !topic.trim() ? "#1e1e24"
            : `linear-gradient(135deg, ${selectedCat.color}, ${selectedCat.color}99)`,
          border: "none", borderRadius: 8,
          color: loading || !topic.trim() ? "#444" : "#fff",
          cursor: loading || !topic.trim() ? "default" : "pointer",
          fontFamily: "inherit", transition: "background 0.2s" }}>
        {loading
          ? `⚙️ Generating ${selectedCat.label} roadmap…`
          : `${selectedCat.icon} Generate ${selectedCat.label} Roadmap`}
      </button>

      {error && (
        <div style={{ padding: "10px 13px", background: "#2e1a1a", border: "1px solid #6a2d2d",
          borderRadius: 8, fontSize: 13, color: "#e05252" }}>✕ {error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ background: "#0f0f13", border: `1px solid ${selectedCat.color}44`,
          borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, background: selectedCat.color + "22",
                  color: selectedCat.color, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                  {selectedCat.icon} {selectedCat.label}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 6 }}>{preview.label}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                {preview.totalSections} sections · {preview.totalTopics} topics
              </div>
            </div>
            <div style={{ fontSize: 20 }}>✅</div>
          </div>

          {/* Section summary */}
          <div style={{ maxHeight: 260, overflowY: "auto", padding: "10px 16px" }}>
            {Object.entries(preview.sections).map(([sec, topics]) => (
              <div key={sec} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: selectedCat.color, marginBottom: 5 }}>
                  {sec} <span style={{ color: "#444", fontWeight: 400 }}>({topics.length})</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {topics.map(t => (
                    <span key={t} style={{ fontSize: 11, background: "#16161b", border: "1px solid #2a2a35",
                      borderRadius: 4, padding: "2px 7px", color: "#888" }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e24", display: "flex", gap: 8 }}>
            <button onClick={accept}
              style={{ flex: 1, padding: "10px", background: selectedCat.color, border: "none",
                borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit" }}>
              Open in Editor →
            </button>
            <button onClick={generate} disabled={loading}
              style={{ padding: "10px 14px", background: "#1e1e24", border: "1px solid #2a2a35",
                borderRadius: 7, color: "#666", fontSize: 13,
                cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}
              title="Regenerate">
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Editor Modal ─────────────────────────────────────────────────────────
export function RoadmapEditorModal({ existing, onSave, onClose }) {
  const isEdit = !!existing;

  // Tab: "manual" | "ai"  (only show AI tab when creating, not editing)
  const [tab, setTab] = useState(isEdit ? "manual" : "ai");

  const [label,     setLabel]     = useState(existing?.label || "");
  const [color,     setColor]     = useState(existing?.color  || COLOR_PALETTE[0].color);
  const [accent,    setAccent]    = useState(existing?.accent || COLOR_PALETTE[0].accent);
  const [hexColor,  setHexColor]  = useState(existing?.color  || COLOR_PALETTE[0].color);
  const [hexAccent, setHexAccent] = useState(existing?.accent || COLOR_PALETTE[0].accent);
  const [expanding, setExpanding] = useState(null); // "si-ti" key of topic being expanded
  const [sections,  setSections]  = useState(
    existing
      ? Object.entries(existing.sections).map(([name, topics]) => ({ name, topics: [...topics], newTopic: "" }))
      : [{ name: "", topics: [], newTopic: "" }]
  );
  const [errors, setErrors] = useState({});

  // ── Color helpers ────────────────────────────────────────────────────────────
  const pickPalette = (c, a) => { setColor(c); setAccent(a); setHexColor(c); setHexAccent(a); };
  const handleHexColor  = v => { setHexColor(v);  if (isValidHex(v)) setColor(v); };
  const handleHexAccent = v => { setHexAccent(v); if (isValidHex(v)) setAccent(v); };

  // ── Section helpers ──────────────────────────────────────────────────────────
  const addSection     = () => setSections(s => [...s, { name: "", topics: [], newTopic: "" }]);
  const removeSection  = i  => setSections(s => s.filter((_, idx) => idx !== i));
  const updateSectionName = (i, name) =>
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name } : sec));

  const moveSectionUp   = i => { if (i === 0) return; setSections(s => { const c=[...s]; [c[i-1],c[i]]=[c[i],c[i-1]]; return c; }); };
  const moveSectionDown = i => setSections(s => { if (i>=s.length-1) return s; const c=[...s]; [c[i],c[i+1]]=[c[i+1],c[i]]; return c; });

  const addTopic = i => {
    const t = sections[i].newTopic.trim();
    if (!t) return;
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, topics: [...sec.topics, t], newTopic: "" } : sec));
  };
  const removeTopic = (si, ti) => setSections(s => s.map((sec, idx) => idx === si
    ? { ...sec, topics: sec.topics.filter((_, tidx) => tidx !== ti) } : sec));
  const renameTopic = (si, ti, val) => setSections(s => s.map((sec, idx) => idx === si
    ? { ...sec, topics: sec.topics.map((t, tidx) => tidx === ti ? val : t) } : sec));
  const moveTopicUp   = (si, ti) => { if (ti===0) return; setSections(s => s.map((sec,idx) => { if(idx!==si) return sec; const t=[...sec.topics]; [t[ti-1],t[ti]]=[t[ti],t[ti-1]]; return {...sec,topics:t}; })); };
  const moveTopicDown = (si, ti) => setSections(s => s.map((sec,idx) => { if(idx!==si) return sec; if(ti>=sec.topics.length-1) return sec; const t=[...sec.topics]; [t[ti],t[ti+1]]=[t[ti+1],t[ti]]; return {...sec,topics:t}; }));

  // ── Expand a topic into subtopics via AI ────────────────────────────────────
  const expandTopic = async (si, ti) => {
    const aiConfig = loadAIConfig();
    if (!aiConfig.keys?.[aiConfig.provider]?.trim()) return;
    const key = `${si}-${ti}`;
    setExpanding(key);
    try {
      const topic   = sections[si].topics[ti];
      const secName = sections[si].name;
      const { text } = await callAI({
        provider:     aiConfig.provider,
        apiKey:       aiConfig.keys[aiConfig.provider],
        systemPrompt: "You are an expert curriculum designer. Respond with ONLY valid JSON — no markdown fences, no extra text.",
        userPrompt:   buildTopicExpansionPrompt(topic, secName, label || "this roadmap"),
        temperature:  0,
      });
      const cleaned = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const subtopics = JSON.parse(cleaned);
      if (!Array.isArray(subtopics)) throw new Error("bad format");
      // Replace the original topic with the expanded subtopics
      setSections(s => s.map((sec, idx) => {
        if (idx !== si) return sec;
        const newTopics = [...sec.topics];
        newTopics.splice(ti, 1, ...subtopics);
        return { ...sec, topics: newTopics };
      }));
    } catch(e) {
      // silently fail — topic stays unchanged
    } finally {
      setExpanding(null);
    }
  };

  // ── AI generated → load into editor ─────────────────────────────────────────
  const handleAIGenerated = (rm) => {
    setLabel(rm.label);
    setSections(Object.entries(rm.sections).map(([name, topics]) => ({ name, topics: [...topics], newTopic: "" })));
    setTab("manual"); // switch to editor so user can tweak
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const errs = {};
    if (!label.trim()) errs.label = "Roadmap name is required";
    sections.forEach((sec, i) => { if (!sec.name.trim()) errs[`sec_${i}`] = "Section name required"; });
    if (sections.filter(s => s.name.trim()).length === 0) errs.sections = "Add at least one section";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const id = isEdit ? existing.id : slugify(label.trim()) || `roadmap-${Date.now()}`;
    const sectionsObj = {};
    sections.filter(s => s.name.trim()).forEach(s => { sectionsObj[s.name.trim()] = s.topics.filter(Boolean); });
    onSave({ id, label: label.trim(), color, accent, sections: sectionsObj });
  };

  const inputStyle = err => ({
    width: "100%", background: "#0f0f13", border: `1px solid ${err ? "#6a2d2d" : "#2a2a35"}`,
    borderRadius: 7, padding: "9px 12px", color: "#e8e6e0", fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 14, width: "100%", maxWidth: 600, maxHeight: "92vh",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "20px 22px 0", borderBottom: "1px solid #1e1e24" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {isEdit ? "Edit Roadmap" : "Create Roadmap"}
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none",
              color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Tabs — only show when creating */}
          {!isEdit && (
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { id: "ai",     label: "✨ Generate with AI",  },
                { id: "manual", label: "✏️ Build manually",    },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: "9px 18px", border: "none", background: "transparent",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                    color: tab === t.id ? "#fff" : "#555", fontWeight: tab === t.id ? 700 : 400,
                    borderBottom: tab === t.id ? "2px solid #7b5ea7" : "2px solid transparent",
                    marginBottom: -1 }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>

          {/* ── AI TAB ── */}
          {tab === "ai" && (
            <AIGeneratePanel
              onGenerated={handleAIGenerated}
              defaultColor={color}
              defaultAccent={accent}
            />
          )}

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <>
              {/* Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 7 }}>Roadmap name *</label>
                <input value={label} onChange={e => { setLabel(e.target.value); setErrors(v => ({...v, label: ""})); }}
                  placeholder="e.g. React, AWS, Docker…"
                  style={inputStyle(errors.label)} />
                {errors.label && <div style={{ fontSize: 11, color: "#e05252", marginTop: 4 }}>{errors.label}</div>}
              </div>

              {/* Color */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 10 }}>Color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {COLOR_PALETTE.map((p, i) => (
                    <button key={i} onClick={() => pickPalette(p.color, p.accent)}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: p.color, border: "none",
                        cursor: "pointer", outline: color === p.color ? "3px solid #fff" : "none",
                        outlineOffset: 2, flexShrink: 0 }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Primary", val: hexColor, onChange: handleHexColor, preview: isValidHex(hexColor) ? hexColor : "#333" },
                    { label: "Accent",  val: hexAccent, onChange: handleHexAccent, preview: isValidHex(hexAccent) ? hexAccent : "#333" },
                  ].map(({ label, val, onChange, preview }) => (
                    <div key={label} style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>{label} (hex)</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: preview, flexShrink: 0 }} />
                        <input value={val} onChange={e => onChange(e.target.value)}
                          maxLength={7} style={{ ...inputStyle(false), padding: "6px 10px", fontSize: 13, fontFamily: "monospace" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#888" }}>Sections & Topics</label>
                  <button onClick={addSection} style={{ padding: "5px 12px", background: color + "22",
                    border: `1px solid ${color}44`, borderRadius: 6, color: accent,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ Add Section</button>
                </div>
                {errors.sections && <div style={{ fontSize: 11, color: "#e05252", marginBottom: 8 }}>{errors.sections}</div>}

                {sections.map((sec, si) => (
                  <div key={si} style={{ background: "#0f0f13", borderRadius: 10, padding: "14px",
                    marginBottom: 12, border: "1px solid #1e1e24" }}>
                    {/* Section header */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[
                          { fn: () => moveSectionUp(si),   disabled: si === 0,               arrow: "▲" },
                          { fn: () => moveSectionDown(si), disabled: si === sections.length-1, arrow: "▼" },
                        ].map(({ fn, disabled, arrow }) => (
                          <button key={arrow} onClick={fn} disabled={disabled}
                            style={{ background: "transparent", border: "none",
                              color: disabled ? "#333" : "#555", cursor: disabled ? "default" : "pointer",
                              fontSize: 10, lineHeight: 1, padding: "1px 3px" }}>{arrow}</button>
                        ))}
                      </div>
                      <input value={sec.name}
                        onChange={e => { updateSectionName(si, e.target.value); setErrors(v => ({...v, [`sec_${si}`]: ""})); }}
                        placeholder={`Section ${si + 1} name`}
                        style={{ ...inputStyle(errors[`sec_${si}`]), flex: 1, padding: "8px 10px", fontSize: 13 }} />
                      <button onClick={() => removeSection(si)}
                        style={{ background: "transparent", border: "none", color: "#444",
                          fontSize: 18, cursor: "pointer", flexShrink: 0, padding: "0 2px" }}>×</button>
                    </div>
                    {errors[`sec_${si}`] && <div style={{ fontSize: 11, color: "#e05252", marginBottom: 6 }}>{errors[`sec_${si}`]}</div>}

                    {/* Topics */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                      {sec.topics.map((topic, ti) => (
                        <div key={ti} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {[
                              { fn: () => moveTopicUp(si, ti),   disabled: ti === 0,                 arrow: "▲" },
                              { fn: () => moveTopicDown(si, ti), disabled: ti === sec.topics.length-1, arrow: "▼" },
                            ].map(({ fn, disabled, arrow }) => (
                              <button key={arrow} onClick={fn} disabled={disabled}
                                style={{ background: "transparent", border: "none",
                                  color: disabled ? "#252525" : "#444", cursor: disabled ? "default" : "pointer",
                                  fontSize: 9, lineHeight: 1, padding: "1px 3px" }}>{arrow}</button>
                            ))}
                          </div>
                          <input value={topic} onChange={e => renameTopic(si, ti, e.target.value)}
                            style={{ flex: 1, background: "#16161b", border: "1px solid #2a2a35",
                              borderRadius: 5, padding: "6px 10px", color: "#ccc",
                              fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                          <button
                            onClick={() => expandTopic(si, ti)}
                            disabled={!!expanding}
                            title="Expand this topic into subtopics with AI"
                            style={{ background: "transparent", border: "1px solid #2a2a35",
                              borderRadius: 4, color: expanding === `${si}-${ti}` ? "#7b5ea7" : "#444",
                              fontSize: 11, cursor: expanding ? "default" : "pointer",
                              padding: "3px 6px", flexShrink: 0 }}>
                            {expanding === `${si}-${ti}` ? "⚙️" : "✨"}
                          </button>
                          <button onClick={() => removeTopic(si, ti)}
                            style={{ background: "transparent", border: "none", color: "#444",
                              fontSize: 16, cursor: "pointer", padding: "0 2px" }}>×</button>
                        </div>
                      ))}
                    </div>

                    {/* Add topic */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={sec.newTopic}
                        onChange={e => setSections(s => s.map((x, i) => i === si ? { ...x, newTopic: e.target.value } : x))}
                        onKeyDown={e => e.key === "Enter" && addTopic(si)}
                        placeholder="Add a topic…"
                        style={{ flex: 1, background: "#16161b", border: "1px solid #2a2a35", borderRadius: 5,
                          padding: "6px 10px", color: "#888", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                      <button onClick={() => addTopic(si)}
                        style={{ padding: "6px 12px", background: color + "22",
                          border: `1px solid ${color}44`, borderRadius: 5, color: accent,
                          fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer — only show save button on manual tab */}
        {tab === "manual" && (
          <div style={{ padding: "14px 22px 20px", borderTop: "1px solid #1e1e24",
            display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ padding: "9px 18px", background: "transparent", border: "1px solid #2a2a35",
                borderRadius: 7, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={handleSave}
              style={{ padding: "9px 22px", background: color, border: "none", borderRadius: 7,
                color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              {isEdit ? "Save Changes" : "Create Roadmap"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

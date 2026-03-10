import { useState } from "react";
import { COLOR_PALETTE } from "../../constants/templates.js";
import { slugify } from "../../utils/roadmap.js";

function isValidHex(str) {
  return /^#[0-9a-fA-F]{6}$/.test(str);
}

export function RoadmapEditorModal({ existing, onSave, onClose }) {
  const isEdit = !!existing;

  const [label,    setLabel]    = useState(existing?.label || "");
  const [color,    setColor]    = useState(existing?.color || COLOR_PALETTE[0].color);
  const [accent,   setAccent]   = useState(existing?.accent || COLOR_PALETTE[0].accent);
  const [hexColor, setHexColor] = useState(existing?.color || COLOR_PALETTE[0].color);
  const [hexAccent,setHexAccent]= useState(existing?.accent || COLOR_PALETTE[0].accent);
  const [sections, setSections] = useState(
    existing
      ? Object.entries(existing.sections).map(([name, topics]) => ({ name, topics: [...topics], newTopic: "" }))
      : [{ name: "", topics: [], newTopic: "" }]
  );
  const [errors, setErrors] = useState({});

  // ── Color helpers ──────────────────────────────────────────────────────────
  const pickPalette = (c, a) => {
    setColor(c); setAccent(a); setHexColor(c); setHexAccent(a);
  };

  const handleHexColor = (val) => {
    setHexColor(val);
    if (isValidHex(val)) setColor(val);
  };

  const handleHexAccent = (val) => {
    setHexAccent(val);
    if (isValidHex(val)) setAccent(val);
  };

  // ── Section helpers ────────────────────────────────────────────────────────
  const addSection = () => setSections(s => [...s, { name: "", topics: [], newTopic: "" }]);

  const removeSection = (i) => setSections(s => s.filter((_, idx) => idx !== i));

  const updateSectionName = (i, name) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name } : sec));

  const moveSectionUp = (i) => {
    if (i === 0) return;
    setSections(s => { const c = [...s]; [c[i-1], c[i]] = [c[i], c[i-1]]; return c; });
  };

  const moveSectionDown = (i) => {
    setSections(s => { if (i >= s.length - 1) return s; const c = [...s]; [c[i], c[i+1]] = [c[i+1], c[i]]; return c; });
  };

  const addTopic = (i) => {
    const topic = sections[i].newTopic.trim();
    if (!topic) return;
    setSections(s => s.map((sec, idx) => idx === i
      ? { ...sec, topics: [...sec.topics, topic], newTopic: "" }
      : sec
    ));
  };

  const removeTopic = (si, ti) => setSections(s => s.map((sec, idx) => idx === si
    ? { ...sec, topics: sec.topics.filter((_, tidx) => tidx !== ti) }
    : sec
  ));

  const renameTopic = (si, ti, val) => setSections(s => s.map((sec, idx) => idx === si
    ? { ...sec, topics: sec.topics.map((t, tidx) => tidx === ti ? val : t) }
    : sec
  ));

  const moveTopicUp = (si, ti) => {
    if (ti === 0) return;
    setSections(s => s.map((sec, idx) => {
      if (idx !== si) return sec;
      const t = [...sec.topics]; [t[ti-1], t[ti]] = [t[ti], t[ti-1]]; return { ...sec, topics: t };
    }));
  };

  const moveTopicDown = (si, ti) => {
    setSections(s => s.map((sec, idx) => {
      if (idx !== si) return sec;
      if (ti >= sec.topics.length - 1) return sec;
      const t = [...sec.topics]; [t[ti], t[ti+1]] = [t[ti+1], t[ti]]; return { ...sec, topics: t };
    }));
  };

  // ── Validate & save ────────────────────────────────────────────────────────
  const handleSave = () => {
    const errs = {};
    if (!label.trim()) errs.label = "Roadmap name is required";
    sections.forEach((sec, i) => {
      if (!sec.name.trim()) errs[`sec_${i}`] = "Section name required";
    });
    const validSections = sections.filter(s => s.name.trim());
    if (validSections.length === 0) errs.sections = "Add at least one section";

    if (Object.keys(errs).length) { setErrors(errs); return; }

    const id = isEdit ? existing.id : slugify(label.trim()) || `roadmap-${Date.now()}`;
    const sectionsObj = {};
    sections.filter(s => s.name.trim()).forEach(s => {
      sectionsObj[s.name.trim()] = s.topics.filter(Boolean);
    });

    onSave({ id, label: label.trim(), color, accent, sections: sectionsObj });
  };

  const inputStyle = (err) => ({
    width: "100%", background: "#0f0f13", border: `1px solid ${err ? "#6a2d2d" : "#2a2a35"}`,
    borderRadius: 7, padding: "9px 12px", color: "#e8e6e0", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 14, width: "100%", maxWidth: 580, maxHeight: "92vh",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #1e1e24",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
            {isEdit ? "Edit Roadmap" : "Create Roadmap"}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none",
            color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>

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
                    cursor: "pointer", outline: color === p.color ? `3px solid #fff` : "none",
                    outlineOffset: 2, flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Primary (hex)</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: isValidHex(hexColor) ? hexColor : "#333", flexShrink: 0 }} />
                  <input value={hexColor} onChange={e => handleHexColor(e.target.value)}
                    placeholder="#e76f51" maxLength={7}
                    style={{ ...inputStyle(false), padding: "6px 10px", fontSize: 13, fontFamily: "monospace" }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Accent (hex)</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: isValidHex(hexAccent) ? hexAccent : "#333", flexShrink: 0 }} />
                  <input value={hexAccent} onChange={e => handleHexAccent(e.target.value)}
                    placeholder="#f4a261" maxLength={7}
                    style={{ ...inputStyle(false), padding: "6px 10px", fontSize: 13, fontFamily: "monospace" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#888" }}>Sections & Topics</label>
              <button onClick={addSection} style={{ padding: "5px 12px", background: color + "22",
                border: `1px solid ${color}44`, borderRadius: 6, color: accent, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit" }}>+ Add Section</button>
            </div>
            {errors.sections && <div style={{ fontSize: 11, color: "#e05252", marginBottom: 8 }}>{errors.sections}</div>}

            {sections.map((sec, si) => (
              <div key={si} style={{ background: "#0f0f13", borderRadius: 10, padding: "14px",
                marginBottom: 12, border: "1px solid #1e1e24" }}>
                {/* Section header */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveSectionUp(si)} disabled={si === 0}
                      style={{ background: "transparent", border: "none", color: si === 0 ? "#333" : "#555",
                        cursor: si === 0 ? "default" : "pointer", fontSize: 10, lineHeight: 1, padding: "1px 3px" }}>▲</button>
                    <button onClick={() => moveSectionDown(si)} disabled={si === sections.length - 1}
                      style={{ background: "transparent", border: "none", color: si === sections.length-1 ? "#333" : "#555",
                        cursor: si === sections.length-1 ? "default" : "pointer", fontSize: 10, lineHeight: 1, padding: "1px 3px" }}>▼</button>
                  </div>
                  <input value={sec.name} onChange={e => { updateSectionName(si, e.target.value); setErrors(v => ({...v, [`sec_${si}`]: ""})); }}
                    placeholder={`Section ${si + 1} name`}
                    style={{ ...inputStyle(errors[`sec_${si}`]), flex: 1, padding: "8px 10px", fontSize: 13 }} />
                  <button onClick={() => removeSection(si)} style={{ background: "transparent", border: "none",
                    color: "#444", fontSize: 18, cursor: "pointer", flexShrink: 0, padding: "0 2px" }}>×</button>
                </div>
                {errors[`sec_${si}`] && <div style={{ fontSize: 11, color: "#e05252", marginBottom: 6 }}>{errors[`sec_${si}`]}</div>}

                {/* Topics */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                  {sec.topics.map((topic, ti) => (
                    <div key={ti} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <button onClick={() => moveTopicUp(si, ti)} disabled={ti === 0}
                          style={{ background: "transparent", border: "none", color: ti === 0 ? "#252525" : "#444",
                            cursor: ti === 0 ? "default" : "pointer", fontSize: 9, lineHeight: 1, padding: "1px 3px" }}>▲</button>
                        <button onClick={() => moveTopicDown(si, ti)} disabled={ti === sec.topics.length - 1}
                          style={{ background: "transparent", border: "none", color: ti === sec.topics.length-1 ? "#252525" : "#444",
                            cursor: ti === sec.topics.length-1 ? "default" : "pointer", fontSize: 9, lineHeight: 1, padding: "1px 3px" }}>▼</button>
                      </div>
                      <input value={topic} onChange={e => renameTopic(si, ti, e.target.value)}
                        style={{ flex: 1, background: "#16161b", border: "1px solid #2a2a35", borderRadius: 5,
                          padding: "6px 10px", color: "#ccc", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                      <button onClick={() => removeTopic(si, ti)} style={{ background: "transparent", border: "none",
                        color: "#444", fontSize: 16, cursor: "pointer", padding: "0 2px" }}>×</button>
                    </div>
                  ))}
                </div>

                {/* Add topic input */}
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={sec.newTopic}
                    onChange={e => setSections(s => s.map((x, i) => i === si ? { ...x, newTopic: e.target.value } : x))}
                    onKeyDown={e => e.key === "Enter" && addTopic(si)}
                    placeholder="Add a topic…"
                    style={{ flex: 1, background: "#16161b", border: "1px solid #2a2a35", borderRadius: 5,
                      padding: "6px 10px", color: "#888", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  <button onClick={() => addTopic(si)} style={{ padding: "6px 12px", background: color + "22",
                    border: `1px solid ${color}44`, borderRadius: 5, color: accent, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit" }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px 20px", borderTop: "1px solid #1e1e24",
          display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "transparent",
            border: "1px solid #2a2a35", borderRadius: 7, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: "9px 22px", background: color,
            border: "none", borderRadius: 7, color: "#fff", fontSize: 13, cursor: "pointer",
            fontFamily: "inherit", fontWeight: 600 }}>
            {isEdit ? "Save Changes" : "Create Roadmap"}
          </button>
        </div>
      </div>
    </div>
  );
}

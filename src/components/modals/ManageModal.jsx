import { useRef } from "react";
import { TEMPLATES } from "../../constants/templates.js";
import { downloadJSON } from "../../utils/roadmap.js";

export function ManageModal({ roadmaps, onClose, onImportRoadmap, onDelete, onEdit, onCreate }) {
  const fileRef = useRef(null);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 12, padding: "22px", width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Manage Roadmaps</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none",
            color: "#666", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Existing roadmaps */}
        <div style={{ overflowY: "auto", flex: 1, marginBottom: 16 }}>
          {Object.values(roadmaps).map(rm => (
            <div key={rm.id} style={{ display: "flex", alignItems: "center", gap: 8,
              background: "#0f0f13", borderRadius: 8, padding: "11px 13px", marginBottom: 8,
              border: `1px solid ${rm.color}33` }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: rm.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{rm.label}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                  {Object.keys(rm.sections).length} sections · {Object.values(rm.sections).flat().length} topics
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

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14, borderTop: "1px solid #1e1e24" }}>
          <button onClick={() => { onCreate(); onClose(); }}
            style={{ width: "100%", padding: "10px", background: "#7b5ea7", border: "none",
              borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            ✏️ Create new roadmap
          </button>
          <button onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "10px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ⬆ Import roadmap file
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={e => { onImportRoadmap(e); onClose(); }} style={{ display: "none" }} />

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
      </div>
    </div>
  );
}

import { useRef } from "react";
import { TEMPLATES } from "../../constants/templates.js";
import { downloadJSON } from "../../utils/roadmap.js";

export function WelcomeScreen({ onImportBackup, onImportRoadmap, onCreate }) {
  const fileRef    = useRef(null);
  const roadmapRef = useRef(null);

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

        {/* Create from scratch */}
        <div style={{ background: "#16161b", border: "1px solid #7b5ea744", borderRadius: 12,
          padding: "20px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>✏️ Build your own</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Create a custom roadmap from scratch with your own sections and topics.
          </div>
          <button onClick={onCreate}
            style={{ width: "100%", padding: "11px", background: "#7b5ea7", border: "none",
              borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Create roadmap
          </button>
        </div>

        {/* Import template */}
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

        {/* Restore backup */}
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

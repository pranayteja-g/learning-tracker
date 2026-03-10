import { RadialProgress } from "../ui/RadialProgress.jsx";
import { getRoadmapStats, getTotalStats, getNextUp } from "../../utils/roadmap.js";

export function Dashboard({ roadmaps, progress, notes, resources, topicMeta, isMobile, onOpenRoadmap }) {
  const t        = getTotalStats(roadmaps, progress);
  const allNotes = Object.entries(notes).filter(([, v]) => v?.trim());

  return (
    <div style={{ padding: isMobile ? "16px" : "28px", overflowY: "auto",
      maxHeight: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 88px)",
      paddingBottom: isMobile ? "80px" : "28px" }}>

      {/* Overall */}
      <div style={{ background: "#16161b", border: "1px solid #2a2a3a", borderRadius: 12,
        padding: "20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <RadialProgress pct={t.pct} color="#7b5ea7" size={72} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.pct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Overall Progress</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
            {t.done} <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>/ {t.total}</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {Object.keys(roadmaps).length} roadmaps · {allNotes.length} notes
          </div>
        </div>
      </div>

      {/* Per-roadmap cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))",
        gap: 12, marginBottom: 24 }}>
        {Object.values(roadmaps).map(val => {
          const s    = getRoadmapStats(val, progress);
          const next = getNextUp(val, progress, 3);
          return (
            <div key={val.id} style={{ background: "#16161b", border: `1px solid ${val.color}33`, borderRadius: 12, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ position: "relative", width: 52, height: 52 }}>
                  <RadialProgress pct={s.pct} color={val.color} size={52} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{val.label}</div>
                  <div style={{ fontSize: 12, color: val.accent }}>{s.done} / {s.total} topics</div>
                </div>
              </div>

              {/* Section mini-bars */}
              <div style={{ marginBottom: 10 }}>
                {Object.entries(val.sections).map(([sec, ts]) => {
                  const d = ts.filter(t => progress[`${val.id}::${t}`]).length;
                  return (
                    <div key={sec} style={{ marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginBottom: 2 }}>
                        <span>{sec}</span><span>{d}/{ts.length}</span>
                      </div>
                      <div style={{ background: "#0f0f13", borderRadius: 3, height: 3 }}>
                        <div style={{ height: "100%", width: `${Math.round((d/ts.length)*100)}%`, background: val.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {next.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Up next</div>
                  {next.map(({ topic }) => (
                    <div key={topic} style={{ fontSize: 12, color: "#777", padding: "2px 0", display: "flex", gap: 5 }}>
                      <span style={{ color: val.accent }}>→</span> {topic}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => onOpenRoadmap(val.id)}
                style={{ width: "100%", padding: "8px", background: val.color + "22",
                  border: `1px solid ${val.color}44`, borderRadius: 6, color: val.accent,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Open →</button>
            </div>
          );
        })}
      </div>

      {/* Notes summary */}
      {allNotes.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            📝 Notes ({allNotes.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(250px, 1fr))", gap: 8 }}>
            {allNotes.map(([key, text]) => {
              const [rmId, topic] = key.split("::");
              const val = roadmaps[rmId];
              return (
                <div key={key} style={{ background: "#16161b", border: `1px solid ${val?.color}33`,
                  borderRadius: 8, padding: "11px 13px", cursor: "default" }}>
                  <div style={{ fontSize: 10, color: val?.accent, marginBottom: 3 }}>{val?.label} · {topic}</div>
                  <div style={{ fontSize: 12, color: "#777", overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

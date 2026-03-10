export function TopicCard({ topic, rmKey, rm, isDone, hasNote, hasMeta, hasResources, onToggle, onOpenNote }) {
  const meta = hasMeta || {};
  const diffColors = { easy: "#52b788", medium: "#ee9b00", hard: "#e05252" };

  return (
    <div style={{ background: isDone ? rm.color + "12" : "#16161b", borderRadius: 8,
      border: `1px solid ${isDone ? rm.color + "40" : "#1e1e24"}`, transition: "all 0.15s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", cursor: "pointer" }}
        onClick={() => onToggle(rmKey, topic)}>
        {/* Checkbox */}
        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${isDone ? rm.color : "#444"}`,
          background: isDone ? rm.color : "transparent", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
          {isDone && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
        </div>

        {/* Topic name */}
        <span style={{ flex: 1, fontSize: 14, color: isDone ? rm.accent : "#ccc",
          textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.7 : 1 }}>{topic}</span>

        {/* Badges */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {meta.difficulty && (
            <span style={{ fontSize: 10, color: diffColors[meta.difficulty],
              background: diffColors[meta.difficulty] + "20", padding: "2px 6px", borderRadius: 4,
              textTransform: "capitalize" }}>{meta.difficulty}</span>
          )}
          {meta.timeEst && (
            <span style={{ fontSize: 10, color: "#666", background: "#1e1e24",
              padding: "2px 6px", borderRadius: 4 }}>⏱ {meta.timeEst}</span>
          )}
          {hasResources && (
            <span style={{ fontSize: 10, color: "#7b8cde", background: "#4361ee20",
              padding: "2px 6px", borderRadius: 4 }}>🔗</span>
          )}
          {hasNote && (
            <span style={{ fontSize: 10, color: rm.accent, background: rm.color + "20",
              padding: "2px 6px", borderRadius: 4 }}>note</span>
          )}
          <button onClick={e => { e.stopPropagation(); onOpenNote(rmKey, topic); }}
            style={{ padding: "5px 9px", background: "transparent", border: "1px solid #2a2a35",
              borderRadius: 4, color: "#555", fontSize: 13, cursor: "pointer" }}>✏️</button>
        </div>
      </div>

      {/* Note preview */}
      {hasNote && (
        <div style={{ padding: "5px 13px 10px 43px", fontSize: 12, color: "#666", fontStyle: "italic",
          borderTop: `1px solid ${rm.color}1a` }}>
          {hasNote.length > 130 ? hasNote.slice(0, 130) + "…" : hasNote}
        </div>
      )}
    </div>
  );
}

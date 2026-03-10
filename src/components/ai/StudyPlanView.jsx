export function StudyPlanView({ data, rm }) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Assessment */}
      <div style={{ background: rm.color + "18", border: `1px solid ${rm.color}44`,
        borderRadius: 10, padding: "14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: rm.accent, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 6 }}>📊 Assessment</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{data.assessment}</div>
      </div>

      {/* Weekly goal */}
      <div style={{ background: "#16161b", border: "1px solid #2a2a35",
        borderRadius: 10, padding: "12px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 6 }}>🎯 This Week's Goal</div>
        <div style={{ fontSize: 13, color: "#e8e6e0", lineHeight: 1.5 }}>{data.weeklyGoal}</div>
      </div>

      {/* Daily plan */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 10 }}>📅 5-Day Plan</div>
        {(data.dailyPlan || []).map((day, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, background: rm.color + "22",
              border: `1px solid ${rm.color}44`, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: rm.accent, textTransform: "uppercase" }}>Day</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: rm.color }}>{i + 1}</div>
            </div>
            <div style={{ flex: 1, background: "#16161b", borderRadius: 8,
              padding: "10px 12px", border: "1px solid #1e1e24" }}>
              <div style={{ fontSize: 13, color: "#e8e6e0", fontWeight: 500, marginBottom: 2 }}>{day.focus}</div>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>{day.goal}</div>
              <div style={{ fontSize: 10, color: "#555" }}>⏱ {day.estimatedTime}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {data.tips?.length > 0 && (
        <div style={{ background: "#16161b", borderRadius: 10, padding: "12px",
          marginBottom: 14, border: "1px solid #1e1e24" }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 8 }}>💬 Tips</div>
          {data.tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#888" }}>
              <span style={{ color: rm.accent, flexShrink: 0 }}>→</span> {tip}
            </div>
          ))}
        </div>
      )}

      {/* Milestone */}
      {data.milestone && (
        <div style={{ background: "#1a2a1a", border: "1px solid #52b78844",
          borderRadius: 10, padding: "12px" }}>
          <div style={{ fontSize: 11, color: "#52b788", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 6 }}>🏆 Milestone</div>
          <div style={{ fontSize: 13, color: "#a0d4a0", lineHeight: 1.5 }}>{data.milestone}</div>
        </div>
      )}
    </div>
  );
}

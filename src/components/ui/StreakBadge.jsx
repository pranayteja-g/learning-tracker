// ── Streak badge — shown in header ───────────────────────────────────────────
export function StreakBadge({ streak, isMobile }) {
  const { current, longest, studiedToday } = streak;

  if (current === 0 && !studiedToday) {
    return (
      <div title="Start a streak by completing a topic today!"
        style={{ display: "flex", alignItems: "center", gap: 4,
          padding: isMobile ? "4px 8px" : "5px 10px",
          background: "#1e1e24", borderRadius: 20,
          fontSize: isMobile ? 11 : 12, color: "#444", cursor: "default" }}>
        <span style={{ fontSize: isMobile ? 13 : 14 }}>🔥</span>
        {!isMobile && <span>Start streak</span>}
      </div>
    );
  }

  const color = current >= 30 ? "#ee9b00" : current >= 7 ? "#e05252" : "#7b5ea7";

  return (
    <div title={`${current} day streak · Longest: ${longest} days`}
      style={{ display: "flex", alignItems: "center", gap: 4,
        padding: isMobile ? "4px 8px" : "5px 10px",
        background: color + "22",
        border: `1px solid ${color}44`,
        borderRadius: 20, cursor: "default" }}>
      <span style={{ fontSize: isMobile ? 13 : 14 }}>
        {studiedToday ? "🔥" : "💤"}
      </span>
      <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color }}>
        {current}d
      </span>
      {!isMobile && (
        <span style={{ fontSize: 11, color: color + "99" }}>
          {studiedToday ? "today ✓" : "study today!"}
        </span>
      )}
    </div>
  );
}

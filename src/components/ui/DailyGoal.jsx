import { useState } from "react";

export function DailyGoalWidget({ goal, todayCount, pct, goalMet, goalStreak, onSetGoal, color = "#7b5ea7" }) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(String(goal));

  const save = () => {
    const n = parseInt(input);
    if (n >= 1 && n <= 50) onSetGoal(n);
    setEditing(false);
  };

  const dots = Array.from({ length: goal }, (_, i) => i < todayCount);

  return (
    <div style={{ background: goalMet ? "#1a2e1a" : "#16161b",
      borderRadius: 12, border: `1px solid ${goalMet ? "#52b78833" : "#1e1e24"}`,
      padding: "14px 16px", marginBottom: 12, transition: "all 0.3s" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{goalMet ? "🎯" : "📌"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: goalMet ? "#52b788" : "#fff" }}>
              Daily Goal {goalMet && "— Met! ✓"}
            </div>
            {goalStreak > 1 && (
              <div style={{ fontSize: 10, color: "#ee9b00" }}>🔥 {goalStreak} day streak</div>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(e => !e)}
          style={{ fontSize: 11, color: "#444", background: "transparent", border: "none",
            cursor: "pointer", fontFamily: "inherit", padding: "2px 6px" }}>
          {editing ? "✕" : "⚙️"}
        </button>
      </div>

      {editing ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#888", flex: 1 }}>Topics per day:</div>
          <input type="number" min={1} max={50} value={input}
            onChange={e => setInput(e.target.value)}
            style={{ width: 56, padding: "5px 8px", background: "#0f0f13",
              border: "1px solid #2a2a35", borderRadius: 6, color: "#fff",
              fontSize: 13, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
          <button onClick={save}
            style={{ padding: "5px 12px", background: color, border: "none",
              borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit" }}>
            Save
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ background: "#0f0f13", borderRadius: 4, height: 6,
            overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", borderRadius: 4, transition: "width 0.4s",
              width: `${pct}%`,
              background: goalMet ? "#52b788" : color }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Dots */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: "70%" }}>
              {dots.slice(0, 20).map((done, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%",
                  background: done ? (goalMet ? "#52b788" : color) : "#1e1e24",
                  transition: "background 0.3s" }} />
              ))}
              {goal > 20 && <span style={{ fontSize: 10, color: "#444" }}>+{goal - 20}</span>}
            </div>
            <div style={{ fontSize: 12, color: goalMet ? "#52b788" : "#888",
              fontVariantNumeric: "tabular-nums" }}>
              {todayCount} / {goal}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

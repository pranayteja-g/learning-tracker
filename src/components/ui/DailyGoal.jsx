import { useState } from "react";
import { color as themeColor, radius, font } from "../../styles/theme.js";

export function DailyGoalWidget({ goal, todayCount, pct, goalMet, goalStreak, onSetGoal, color = themeColor.accent }) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(String(goal));

  const save = () => {
    const n = parseInt(input);
    if (n >= 1 && n <= 50) onSetGoal(n);
    setEditing(false);
  };

  const dots = Array.from({ length: goal }, (_, i) => i < todayCount);

  return (
    <div style={{
      background: goalMet ? "#121d17" : "#16151a",
      borderRadius: radius.md, border: `1px solid ${goalMet ? "#6f9a8233" : "#222027"}`,
      padding: "14px 16px", fontFamily: font.body, transition: "border-color 0.2s"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{goalMet ? "🎯" : "📌"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: goalMet ? "#6f9a82" : "#e9e4d9" }}>
              Daily Target {goalMet && "· Completed!"}
            </div>
            {goalStreak > 1 && (
              <div style={{ fontSize: 11, color: "#d9a441", marginTop: 1 }}>{goalStreak} day streak</div>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(e => !e)}
          title="Configure daily target"
          style={{
            fontSize: 12, color: "#8c8577", background: "transparent", border: "none",
            cursor: "pointer", fontFamily: "inherit", padding: "2px 6px"
          }}>
          {editing ? "✕" : "⚙"}
        </button>
      </div>

      {editing ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <div style={{ fontSize: 12, color: "#948d80", flex: 1 }}>Topics target:</div>
          <input type="number" min={1} max={50} value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              width: 56, padding: "5px 8px", background: "#0d0c11",
              border: "1px solid #282630", borderRadius: radius.sm, color: "#e9e4d9",
              fontSize: 13, outline: "none", fontFamily: "inherit", textAlign: "center"
            }} />
          <button onClick={save}
            style={{
              padding: "5px 12px", background: color, border: "none",
              borderRadius: radius.sm, color: "#0f0e12", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit"
            }}>
            Save
          </button>
        </div>
      ) : (
        <>
          <div style={{
            background: "#0d0c11", borderRadius: 4, height: 5,
            overflow: "hidden", marginBottom: 10
          }}>
            <div style={{
              height: "100%", borderRadius: 4, transition: "width 0.4s",
              width: `${pct}%`,
              background: goalMet ? "#6f9a82" : color
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: "70%" }}>
              {dots.slice(0, 20).map((done, i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: done ? (goalMet ? "#6f9a82" : color) : "#252329",
                  transition: "background 0.3s"
                }} />
              ))}
              {goal > 20 && <span style={{ fontSize: 10, color: "#6e685f" }}>+{goal - 20}</span>}
            </div>
            <div style={{
              fontSize: 12, color: goalMet ? "#6f9a82" : "#948d80",
              fontVariantNumeric: "tabular-nums"
            }}>
              {todayCount} / {goal}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

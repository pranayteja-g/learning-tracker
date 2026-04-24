import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "25m", secs: 25 * 60, type: "pomodoro" },
  { label: "15m", secs: 15 * 60, type: "short" },
  { label: "10m", secs: 10 * 60, type: "short" },
  { label: "5m", secs: 5 * 60, type: "break" },
];

export function StudyTimer({ color = "#7b5ea7", isMobile }) {
  const [selected, setSelected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].secs);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            navigator.vibrate?.([200, 100, 200]);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const total = PRESETS[selected].secs;
  const pct = ((total - timeLeft) / total) * 100;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const selectPreset = (i) => {
    setSelected(i);
    setTimeLeft(PRESETS[i].secs);
    setRunning(false);
    setFinished(false);
  };

  const toggle = () => {
    setFinished(false);
    setRunning((r) => !r);
  };
  const reset = () => {
    setRunning(false);
    setFinished(false);
    setTimeLeft(PRESETS[selected].secs);
  };

  const R = 32;
  const C = 2 * Math.PI * R;
  const dash = C - (pct / 100) * C;

  return (
    <div style={{ background: "#16161b", borderRadius: 12, border: "1px solid #1e1e24", padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => selectPreset(i)}
            style={{
              flex: 1,
              padding: "5px 0",
              background: selected === i ? color + "22" : "transparent",
              border: `1px solid ${selected === i ? color : "#2a2a35"}`,
              borderRadius: 6,
              color: selected === i ? "#fff" : "#555",
              fontSize: 11,
              fontWeight: selected === i ? 700 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={40} cy={40} r={R} fill="none" stroke="#1e1e24" strokeWidth={6} />
            <circle
              cx={40}
              cy={40}
              r={R}
              fill="none"
              stroke={finished ? "#52b788" : color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dash}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span
              style={{
                fontSize: finished ? 22 : 15,
                fontWeight: 700,
                color: finished ? "#52b788" : "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {finished ? "🎉" : `${mins}:${secs}`}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            {finished ? "Time's up! Great work." : running ? "Stay focused..." : "Ready to start"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={toggle}
              style={{
                flex: 1,
                padding: "8px",
                background: running ? "#2e1a1a" : color,
                border: "none",
                borderRadius: 7,
                color: running ? "#e05252" : "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {running ? "⏸ Pause" : finished ? "↺ Again" : "▶ Start"}
            </button>
            <button
              onClick={reset}
              style={{
                padding: "8px 12px",
                background: "#1e1e24",
                border: "1px solid #2a2a35",
                borderRadius: 7,
                color: "#555",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

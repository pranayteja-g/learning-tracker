import { useState, useEffect, useRef } from "react";
import { color as themeColor, radius, font } from "../../styles/theme.js";

const PRESETS = [
  { label: "25m", secs: 25 * 60 },
  { label: "15m", secs: 15 * 60 },
  { label: "10m", secs: 10 * 60 },
  { label: "5m",  secs:  5 * 60 },
];

export function StudyTimer({ color = themeColor.accent, _isMobile }) {
  const [selected,  setSelected]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(PRESETS[0].secs);
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
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

  const total   = PRESETS[selected].secs;
  const pct     = ((total - timeLeft) / total) * 100;
  const mins    = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs    = String(timeLeft % 60).padStart(2, "0");

  const selectPreset = (i) => {
    setSelected(i);
    setTimeLeft(PRESETS[i].secs);
    setRunning(false);
    setFinished(false);
  };

  const toggle = () => { setFinished(false); setRunning(r => !r); };
  const reset  = () => { setRunning(false); setFinished(false); setTimeLeft(PRESETS[selected].secs); };

  const R  = 30;
  const C  = 2 * Math.PI * R;
  const dash = C - (pct / 100) * C;

  return (
    <div style={{
      background: "#16151a", borderRadius: radius.md, border: "1px solid #222027",
      padding: "14px 16px", fontFamily: font.body
    }}>
      {/* Preset tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => selectPreset(i)}
            style={{
              flex: 1, padding: "5px 0",
              background: selected === i ? color + "20" : "transparent",
              border: `1px solid ${selected === i ? color + "55" : "#222027"}`,
              borderRadius: radius.sm, color: selected === i ? color : "#8c8577",
              fontSize: 11.5, fontWeight: selected === i ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit"
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={36} cy={36} r={R} fill="none" stroke="#222027" strokeWidth={5} />
            <circle cx={36} cy={36} r={R} fill="none" stroke={finished ? "#6f9a82" : color}
              strokeWidth={5} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={dash}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontSize: finished ? 20 : 14, fontWeight: 700,
              color: finished ? "#6f9a82" : "#e9e4d9", fontVariantNumeric: "tabular-nums"
            }}>
              {finished ? "🎉" : `${mins}:${secs}`}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#948d80", marginBottom: 8 }}>
            {finished ? "Session finished!" : running ? "Stay focused…" : "Ready to study"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggle}
              style={{
                flex: 1, padding: "8px", background: running ? "#331a1a" : color,
                border: "none", borderRadius: radius.sm,
                color: running ? "#e06b6b" : "#0f0e12",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>
              {running ? "Pause" : finished ? "Again" : "Start"}
            </button>
            <button onClick={reset}
              style={{
                padding: "8px 12px", background: "transparent", border: "1px solid #282630",
                borderRadius: radius.sm, color: "#8c8577", fontSize: 12, cursor: "pointer", fontFamily: "inherit"
              }}>
              ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

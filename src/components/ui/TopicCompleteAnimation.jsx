import { useEffect, useState } from "react";

// Burst of particles when a topic is checked
export function TopicCompleteAnimation({ color = "#52b788", onDone }) {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i / 12) * 360,
      distance: 28 + Math.random() * 20,
      size: 4 + Math.random() * 4,
      color: [color, "#c4b5fd", "#52b788", "#ee9b00"][Math.floor(Math.random() * 4)],
    }))
  );

  useEffect(() => {
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes burst {
          0%   { transform: translate(-50%, -50%) rotate(var(--a)) translateX(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--d)) scale(0); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: "50%", top: "50%",
          width: p.size, height: p.size,
          background: p.color, borderRadius: "50%",
          "--a": `${p.angle}deg`,
          "--d": `${p.distance}px`,
          animation: "burst 0.55s ease-out forwards",
        }} />
      ))}
      {/* Checkmark flash */}
      <div style={{
        position: "absolute", fontSize: 16,
        animation: "burst 0.4s ease-out forwards",
        "--a": "0deg", "--d": "0px",
      }}>✓</div>
    </div>
  );
}

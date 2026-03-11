import { useState, useEffect } from "react";

export function FlashcardView({ cards, rm }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState({});

  const card = cards[idx];
  const total = cards.length;
  const knownCount = Object.values(known).filter(Boolean).length;

  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space")      { e.preventDefault(); setFlipped(f => !f); }
      if (e.code === "ArrowRight") { next(); }
      if (e.code === "ArrowLeft")  { prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idx]);

  const next = () => { setIdx(i => Math.min(total - 1, i + 1)); setFlipped(false); };
  const prev = () => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); };

  const markKnown = (val) => {
    setKnown(k => ({ ...k, [idx]: val }));
    if (idx < total - 1) { setTimeout(next, 300); }
  };

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#555" }}>{idx + 1} / {total}</div>
        <div style={{ fontSize: 12, color: "#52b788" }}>✓ {knownCount} known</div>
      </div>
      <div style={{ background: "#1e1e24", borderRadius: 4, height: 4, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`,
          background: rm.color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>

      {/* Card */}
      <div onClick={() => setFlipped(f => !f)}
        style={{ minHeight: 200, background: flipped ? rm.color + "18" : "#16161b",
          border: `1px solid ${flipped ? rm.color + "66" : "#2a2a35"}`,
          borderRadius: 12, padding: "24px 20px", cursor: "pointer",
          display: "flex", flexDirection: "column", justifyContent: "center",
          transition: "all 0.2s", marginBottom: 12, userSelect: "none" }}>

        {/* Topic badge */}
        <div style={{ fontSize: 10, color: rm.accent, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 12 }}>
          {card.section} → {card.topic}
        </div>

        {!flipped ? (
          <>
            <div style={{ fontSize: 16, color: "#e8e6e0", fontWeight: 600,
              lineHeight: 1.5, textAlign: "center", flex: 1, display: "flex",
              alignItems: "center", justifyContent: "center" }}>
              {card.front}
            </div>
            <div style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 16 }}>
              Tap or press Space to reveal
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: rm.color, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 10 }}>Answer</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.7 }}>{card.back}</div>
          </>
        )}
      </div>

      {/* Know it / Review buttons — only show when flipped */}
      {flipped && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => markKnown(false)}
            style={{ flex: 1, padding: "10px", background: "#2e1a1a", border: "1px solid #6a2d2d",
              borderRadius: 8, color: "#e05252", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            😕 Review again
          </button>
          <button onClick={() => markKnown(true)}
            style={{ flex: 1, padding: "10px", background: "#1a2e1a", border: "1px solid #52b78844",
              borderRadius: 8, color: "#52b788", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              fontWeight: 600 }}>
            ✓ Got it
          </button>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={prev} disabled={idx === 0}
          style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 7, color: idx === 0 ? "#333" : "#888",
            fontSize: 13, cursor: idx === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
          ← Prev
        </button>
        <button onClick={next} disabled={idx === total - 1}
          style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 7, color: idx === total - 1 ? "#333" : "#888",
            fontSize: 13, cursor: idx === total - 1 ? "default" : "pointer", fontFamily: "inherit" }}>
          Next →
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#333" }}>
        Space = flip · ← → = navigate
      </div>

      {/* Completion */}
      {knownCount === total && (
        <div style={{ marginTop: 14, padding: "12px", background: "#1a2e1a",
          border: "1px solid #52b78844", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 16, marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: 13, color: "#52b788", fontWeight: 600 }}>All cards reviewed!</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>You're ready to ace this interview.</div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { MILESTONE_BADGES, LEVELS, getLevel, getNextLevel } from "../../hooks/useXP.js";

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    dur: 2 + Math.random() * 2,
    color: ["#7b5ea7","#52b788","#ee9b00","#e05252","#c4b5fd","#7b8cde"][Math.floor(Math.random()*6)],
    size: 6 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 120,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 300, overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: 0,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          "--drift": `${p.drift}px`,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ── XP Bar ────────────────────────────────────────────────────────────────────
function XPBar({ prevXP, newXP, color }) {
  const [displayed, setDisplayed] = useState(prevXP);
  const prevLevel = getLevel(prevXP);
  const newLevel  = getLevel(newXP);
  const nextLevel = getNextLevel(newXP);
  const leveledUp = newLevel.index > prevLevel.index;

  const barMin   = newLevel.min;
  const barMax   = nextLevel ? nextLevel.min : newLevel.min + 1000;
  const prevPct  = Math.min(100, ((prevXP - barMin) / (barMax - barMin)) * 100);
  const newPct   = Math.min(100, ((newXP  - barMin) / (barMax - barMin)) * 100);
  const [pct, setPct] = useState(leveledUp ? 0 : prevPct);

  useEffect(() => {
    const t = setTimeout(() => setPct(newPct), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const from  = prevXP, to = newXP, dur = 1200;
    const step  = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setDisplayed(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: "#16161b", borderRadius: 10, padding: "14px 16px", border: "1px solid #2a2a35" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{newLevel.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: newLevel.color }}>{newLevel.name}</div>
            {leveledUp && (
              <div style={{ fontSize: 11, color: "#52b788", fontWeight: 700 }}>🎉 Level Up!</div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {displayed.toLocaleString()} XP
        </div>
      </div>
      <div style={{ background: "#0f0f13", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, background: newLevel.color,
          width: `${pct}%`, transition: "width 1s ease-out" }} />
      </div>
      {nextLevel && (
        <div style={{ fontSize: 11, color: "#444", marginTop: 5, textAlign: "right" }}>
          {(barMax - newXP).toLocaleString()} XP to {nextLevel.name}
        </div>
      )}
    </div>
  );
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, isNew, isAI }) {
  if (!badge) return null;
  const bg     = isAI ? "#1a1a2e" : isNew ? "#1a2420" : "#16161b";
  const border = isAI ? "#7b5ea766" : isNew ? "#52b78866" : "#2a2a35";
  const color  = isAI ? "#c4b5fd"  : isNew ? "#52b788"   : "#888";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 8, padding: "10px 12px" }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{badge.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{badge.name}</span>
          {isNew  && <span style={{ fontSize: 9, background: "#52b78833", color: "#52b788", borderRadius: 3, padding: "1px 5px" }}>NEW</span>}
          {isAI   && <span style={{ fontSize: 9, background: "#7b5ea733", color: "#c4b5fd", borderRadius: 3, padding: "1px 5px" }}>✨ AI</span>}
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{badge.desc}</div>
      </div>
    </div>
  );
}

// ── Main QuestRewardScreen ────────────────────────────────────────────────────
export function QuestRewardScreen({ quest, phaseResults, activePhases, xpEarned, prevXP, newXP, newBadges, aiBadge, onClose }) {

  const allScores = activePhases.map((p, i) => ({
    name: p.name,
    score: phaseResults?.[i]?.score ?? (p.key === "read" ? 100 : null),
    passed: phaseResults?.[i]?.passed ?? (p.key === "read"),
  }));

  const avgScore = Math.round(
    allScores.filter(s => s.score != null).reduce((a, s) => a + s.score, 0) /
    allScores.filter(s => s.score != null).length
  );

  return (
    <>
      <Confetti />
      <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "#0f0f13",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", paddingTop: "calc(16px + env(safe-area-inset-top))",
          background: "#13131a", borderBottom: "1px solid #1e1e24", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🏆 Quest Complete!</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{quest.title} · {quest.roadmapLabel}</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>

          {/* Score hero */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#52b788", lineHeight: 1 }}>
              {avgScore}%
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Average across all phases</div>
            {xpEarned > 0 && (
              <div style={{ display: "inline-block", marginTop: 10,
                background: "#7b5ea722", border: "1px solid #7b5ea744",
                borderRadius: 20, padding: "4px 14px",
                fontSize: 14, fontWeight: 700, color: "#c4b5fd" }}>
                +{xpEarned} XP
              </div>
            )}
          </div>

          {/* Phase breakdown */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 10 }}>Phase Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allScores.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                  background: "#16161b", borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${s.passed ? "#52b78833" : "#2a2a35"}` }}>
                  <span style={{ fontSize: 16 }}>
                    {["📖","🧠","💻","💬"][i] || "📝"}
                  </span>
                  <div style={{ flex: 1, fontSize: 13, color: "#ccc" }}>{s.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: s.passed ? "#52b788" : "#888" }}>
                    {s.score != null ? `${s.score}%` : "✓"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 10 }}>Your Progress</div>
            <XPBar prevXP={prevXP} newXP={newXP} />
          </div>

          {/* AI story badge */}
          {aiBadge && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 10 }}>✨ Your Story Badge</div>
              <BadgeCard badge={aiBadge} isNew={true} isAI={true} />
            </div>
          )}

          {/* Milestone badges */}
          {newBadges.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 10 }}>🏅 Milestones Unlocked</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {newBadges.map(id => {
                  const badge = MILESTONE_BADGES.find(b => b.id === id);
                  return badge ? <BadgeCard key={id} badge={badge} isNew={true} isAI={false} /> : null;
                })}
              </div>
            </div>
          )}

          {/* Close */}
          <button onClick={onClose}
            style={{ width: "100%", padding: "13px", background: "#7b5ea7",
              border: "none", borderRadius: 9, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Continue Learning →
          </button>
        </div>
      </div>
    </>
  );
}

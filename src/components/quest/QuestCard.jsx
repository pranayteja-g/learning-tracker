import { useState, useEffect } from "react";

function CooldownTimer({ ms }) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return <span>{h}h {String(m).padStart(2,"0")}m {String(s).padStart(2,"0")}s</span>;
}

const PHASE_LABELS = ["📖 Read", "🧠 MCQ", "💻 Code", "💬 Q&A"];
const PHASE_DESC   = ["Review topics", "Hard quiz", "Code challenges", "Open Q&A"];

export function QuestCard({ quest, loading, onBegin, onGenerate, isOnCooldown, cooldownRemaining, isMobile }) {
  if (loading) {
    return (
      <div style={cardStyle(isMobile)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>🎯</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Generating your quest…</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>AI mentor is analysing your progress</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7b5ea7",
                animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
      </div>
    );
  }

  if (isOnCooldown) {
    return (
      <div style={cardStyle(isMobile, "#e0525211", "#e0525233")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e05252" }}>Quest Failed — Cooldown Active</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{quest?.title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05252", fontVariantNumeric: "tabular-nums" }}>
              <CooldownTimer ms={cooldownRemaining} />
            </div>
            <div style={{ fontSize: 10, color: "#555" }}>until retry</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#555", fontStyle: "italic" }}>
          Use this time to review: {quest?.topics?.join(", ")}
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div style={cardStyle(isMobile)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Daily Quest</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Let your AI mentor assign your next challenge</div>
          </div>
          <button onClick={onGenerate}
            style={{ padding: "7px 14px", background: "#7b5ea7", border: "none",
              borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Generate Quest
          </button>
        </div>
      </div>
    );
  }

  if (quest.status === "completed") {
    return (
      <div style={cardStyle(isMobile, "#52b78811", "#52b78833")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>✅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#52b788" }}>Quest Completed!</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{quest.title}</div>
          </div>
          <button onClick={onGenerate}
            style={{ padding: "7px 14px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 7, color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            New Quest
          </button>
        </div>
      </div>
    );
  }

  // Active quest
  const currentPhaseLabel = PHASE_LABELS[quest.phase] || "Complete";
  const isComplete = quest.phase >= 4;

  return (
    <div style={cardStyle(isMobile, "#7b5ea711", "#7b5ea733")}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{quest.title}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{quest.description}</div>
        </div>
      </div>

      {/* Topics */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {quest.topics?.map(t => (
          <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4,
            background: "#7b5ea722", color: "#c4b5fd", border: "1px solid #7b5ea744" }}>
            {t}
          </span>
        ))}
      </div>

      {/* Phase progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {PHASE_LABELS.map((label, i) => {
          const done    = i < quest.phase;
          const current = i === quest.phase && !isComplete;
          const passed  = quest.phaseResults?.[i]?.passed;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, marginBottom: 4,
                background: done ? (passed === false ? "#e05252" : "#52b788")
                  : current ? "#7b5ea7" : "#1e1e24" }} />
              <div style={{ fontSize: 9, color: done ? (passed === false ? "#e05252" : "#52b788")
                : current ? "#c4b5fd" : "#444",
                textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reason */}
      {quest.reason && (
        <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginBottom: 10 }}>
          💡 {quest.reason}
        </div>
      )}

      {/* CTA */}
      {!isComplete ? (
        <button onClick={onBegin}
          style={{ width: "100%", padding: "10px", background: "#7b5ea7",
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {quest.phase === 0 ? "Begin Quest →" : `Continue — ${currentPhaseLabel}`}
        </button>
      ) : (
        <div style={{ textAlign: "center", fontSize: 13, color: "#52b788", fontWeight: 700 }}>
          All phases complete — submitting…
        </div>
      )}
    </div>
  );
}

function cardStyle(isMobile, bg = "#16161b", border = "#2a2a35") {
  return {
    background: bg, border: `1px solid ${border}`,
    borderRadius: 12, padding: "14px 16px",
    marginBottom: 14,
  };
}

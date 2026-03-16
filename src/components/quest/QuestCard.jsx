import { useState, useEffect } from "react";

function CooldownTimer({ ms, cooldownUntil }) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    setRemaining(ms);
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, [cooldownUntil]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return <span>{h}h {String(m).padStart(2,"0")}m {String(s).padStart(2,"0")}s</span>;
}

const PHASE_LABELS = ["📖", "🧠", "💻", "💬"];

// Single roadmap quest card
export function QuestCard({ rm, quest, loading, onBegin, onGenerate, isOnCooldown, cooldownRemaining }) {
  const color  = rm?.color  || "#7b5ea7";
  const accent = rm?.accent || "#c4b5fd";

  if (loading) {
    return (
      <div style={card(color)}>
        <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 6 }}>{rm?.label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span style={{ fontSize: 12, color: "#555" }}>Generating quest…</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: "50%",
                background: color, animation: `bq-pulse 1.2s ${i*0.2}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bq-pulse{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
      </div>
    );
  }

  if (isOnCooldown) {
    return (
      <div style={card(color, "#e0525218", "#e0525233")}>
        <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 6 }}>{rm?.label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e05252", marginBottom: 4 }}>🔒 {quest?.title}</div>
        <div style={{ fontSize: 11, color: "#e05252", fontVariantNumeric: "tabular-nums" }}>
          <CooldownTimer ms={cooldownRemaining} cooldownUntil={quest?.cooldownUntil} />
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Review: {quest?.topics?.slice(0,2).join(", ")}</div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div style={card(color)}>
        <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 8 }}>{rm?.label}</div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>No quest assigned yet</div>
        <button onClick={onGenerate}
          style={{ width: "100%", padding: "8px", background: color + "22",
            border: `1px solid ${color}44`, borderRadius: 7,
            color: accent, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit" }}>
          🎯 Generate Quest
        </button>
      </div>
    );
  }

  if (quest.status === "completed") {
    return (
      <div style={card(color, "#52b78811", "#52b78833")}>
        <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 6 }}>{rm?.label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#52b788", marginBottom: 4 }}>✅ {quest.title}</div>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>Quest completed!</div>
        <button onClick={onGenerate}
          style={{ width: "100%", padding: "7px", background: "#1e1e24",
            border: "1px solid #2a2a35", borderRadius: 6,
            color: "#666", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
          New Quest →
        </button>
      </div>
    );
  }

  // Active quest
  return (
    <div style={card(color, color + "11", color + "33")}>
      <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 6 }}>{rm?.label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🎯 {quest.title}</div>

      {/* Topics */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {quest.topics?.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4,
            background: color + "22", color: accent, border: `1px solid ${color}33` }}>
            {t}
          </span>
        ))}
        {quest.topics?.length > 3 && (
          <span style={{ fontSize: 10, color: "#555" }}>+{quest.topics.length - 3}</span>
        )}
      </div>

      {/* Phase dots */}
      <div style={{ display: "flex", gap: 3, marginBottom: 12, alignItems: "center" }}>
        {PHASE_LABELS.map((icon, i) => {
          const done    = i < quest.phase;
          const current = i === quest.phase;
          const passed  = quest.phaseResults?.[i]?.passed;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <div style={{ width: current ? 24 : 18, height: 18, borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, transition: "all 0.2s",
                background: done ? (passed === false ? "#e0525233" : "#52b78833")
                  : current ? color + "44" : "#1e1e24",
                border: `1px solid ${done ? (passed === false ? "#e05252" : "#52b788")
                  : current ? color : "#2a2a35"}`,
                color: done ? (passed === false ? "#e05252" : "#52b788")
                  : current ? accent : "#444" }}>
                {icon}
              </div>
              {i < 3 && <div style={{ width: 6, height: 1, background: done ? "#52b78844" : "#1e1e24" }} />}
            </div>
          );
        })}
      </div>

      <button onClick={onBegin}
        style={{ width: "100%", padding: "8px", background: color,
          border: "none", borderRadius: 7, color: "#fff",
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        {quest.phase === 0 ? "Begin →" : `Continue — Phase ${quest.phase + 1}/4`}
      </button>
    </div>
  );
}

// Quest board — grid of all roadmap quest cards
export function QuestBoard({ roadmaps, quests, loadingRmIds = [], onBegin, onGenerate,
  isOnCooldown, cooldownRemaining, isMobile }) {

  const rmList = Object.values(roadmaps);
  if (!rmList.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
          🎯 Quest Board
        </div>
        <div style={{ fontSize: 10, color: "#444" }}>4-phase mastery test per roadmap</div>
      </div>

      {/* Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? rmList.length === 1 ? "1fr" : "repeat(2, 1fr)"
          : "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {rmList.map(rm => (
          <QuestCard
            key={rm.id}
            rm={rm}
            quest={quests[rm.id] || null}
            loading={loadingRmIds.includes(rm.id)}
            isOnCooldown={isOnCooldown(rm.id)}
            cooldownRemaining={cooldownRemaining(rm.id)}
            onBegin={() => onBegin(rm.id)}
            onGenerate={() => onGenerate(rm.id)}
          />
        ))}
      </div>
    </div>
  );
}

function card(color, bg = "#16161b", border = "#2a2a35") {
  return {
    background: bg, border: `1px solid ${border}`,
    borderRadius: 10, padding: "12px 14px",
  };
}

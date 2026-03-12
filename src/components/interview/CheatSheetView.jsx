import { useRef } from "react";

const TIER_CONFIG = {
  mustKnow:    { label: "🔴 Must Know",    color: "#e05252", desc: "Very likely to be asked" },
  goodToKnow:  { label: "🟡 Good to Know", color: "#ee9b00", desc: "Sometimes asked" },
  bonusPoints: { label: "🟢 Bonus Points", color: "#52b788", desc: "Impresses interviewers" },
};

function downloadMarkdown(data) {
  const lines = [
    `# ${data.title}`,
    ``,
    `## 🔴 Must Know`,
    ...data.mustKnow.map(t => `- **${t.topic}** — ${t.oneliner}`),
    ``,
    `## 🟡 Good to Know`,
    ...data.goodToKnow.map(t => `- **${t.topic}** — ${t.oneliner}`),
    ``,
    `## 🟢 Bonus Points`,
    ...data.bonusPoints.map(t => `- **${t.topic}** — ${t.oneliner}`),
    ``,
    `## 💡 Quick Tips`,
    ...data.quickTips.map((tip, i) => `${i+1}. ${tip}`),
    ``,
    `## ⚠️ Red Flags to Avoid`,
    ...data.redFlags.map((r, i) => `${i+1}. ${r}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${data.title.replace(/\s+/g, "_")}.md`;
  a.click(); URL.revokeObjectURL(url);
}

function printCheatSheet() {
  window.print();
}

export function CheatSheetView({ data, rm }) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Header + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff",
            wordBreak: "break-word" }}>{data.title}</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            {data.mustKnow.length + data.goodToKnow.length + data.bonusPoints.length} topics
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => downloadMarkdown(data)}
            style={{ padding: "6px 10px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            title="Download as Markdown">
            ⬇ .md
          </button>
          <button onClick={printCheatSheet}
            style={{ padding: "6px 10px", background: "#1e1e24", border: "1px solid #2a2a35",
              borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            title="Print / Save as PDF">
            🖨 Print
          </button>
        </div>
      </div>

      {/* Tier sections */}
      {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
        const items = data[key] || [];
        if (!items.length) return null;
        return (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
              <div style={{ fontSize: 10, color: "#444" }}>{cfg.desc} · {items.length} topics</div>
            </div>
            <div style={{ background: "#0f0f13", borderRadius: 8, border: `1px solid ${cfg.color}22`,
              overflow: "hidden" }}>
              {items.map((item, i) => (
                <div key={i} style={{ padding: "9px 13px", borderBottom: i < items.length - 1 ? "1px solid #1e1e24" : "none",
                  display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color,
                    flexShrink: 0, maxWidth: "100%" }}>
                    {item.topic}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5,
                    wordBreak: "break-word", overflowWrap: "anywhere", minWidth: 0, flex: 1 }}>
                    — {item.oneliner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick Tips */}
      {data.quickTips?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#7b8cde", marginBottom: 8 }}>💡 Quick Tips</div>
          <div style={{ background: "#0f0f13", borderRadius: 8, border: "1px solid #7b8cde22",
            padding: "4px 0", overflow: "hidden" }}>
            {data.quickTips.map((tip, i) => (
              <div key={i} style={{ padding: "8px 13px",
                borderBottom: i < data.quickTips.length - 1 ? "1px solid #1e1e24" : "none",
                display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: "#7b8cde", flexShrink: 0, fontWeight: 700 }}>{i+1}.</span>
                <span style={{ fontSize: 12, color: "#888", lineHeight: 1.5,
                  wordBreak: "break-word", overflowWrap: "anywhere" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {data.redFlags?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e05252", marginBottom: 8 }}>⚠️ Red Flags to Avoid</div>
          <div style={{ background: "#0f0f13", borderRadius: 8, border: "1px solid #e0525222",
            padding: "4px 0", overflow: "hidden" }}>
            {data.redFlags.map((flag, i) => (
              <div key={i} style={{ padding: "8px 13px",
                borderBottom: i < data.redFlags.length - 1 ? "1px solid #1e1e24" : "none",
                display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: "#e05252", flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: 12, color: "#888", lineHeight: 1.5,
                  wordBreak: "break-word", overflowWrap: "anywhere" }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

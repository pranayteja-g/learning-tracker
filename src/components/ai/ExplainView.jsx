import { useState } from "react";

export function ExplainView({ data, rm, topic, rmKey, onSaveToNotes }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!onSaveToNotes) return;
    const lines = [`## AI Explanation: ${topic}`, ""];
    if (data.summary)        lines.push(`**Summary:** ${data.summary}`, "");
    if (data.whatItIs)       lines.push(`**What it is:** ${data.whatItIs}`, "");
    if (data.howItWorks)     lines.push(`**How it works:** ${data.howItWorks}`, "");
    if (data.whenToUse)      lines.push(`**When to use:** ${data.whenToUse}`, "");
    if (data.codeExample?.code) {
      lines.push(`**Example (${data.codeExample.language || "code"}):**`);
      lines.push(`\`\`\`${data.codeExample.language || ""}\n${data.codeExample.code}\n\`\`\``, "");
    }
    if (data.commonMistakes) lines.push(`**Common mistakes:** ${data.commonMistakes}`, "");
    if (data.keyTakeaway)    lines.push(`**Key takeaway:** ${data.keyTakeaway}`);
    onSaveToNotes(rmKey, topic, lines.join("\n"));
    setSaved(true);
  };

  const sections = [
    { key: "whatItIs",       label: "What it is",      icon: "📖", mono: false },
    { key: "howItWorks",     label: "How it works",    icon: "⚙️", mono: false },
    { key: "whenToUse",      label: "When to use it",  icon: "🎯", mono: false },
    { key: "commonMistakes", label: "Common mistakes", icon: "⚠️", mono: false },
    { key: "keyTakeaway",    label: "Key takeaway",    icon: "💡", mono: false },
  ];

  const hasCode = data.codeExample?.code;
  const hasAnalogy = data.codeExample?.description && !hasCode;

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Summary */}
      <div style={{ background: rm.color + "18", border: `1px solid ${rm.color}44`,
        borderRadius: 10, padding: "14px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: rm.accent, fontWeight: 700, marginBottom: 6 }}>Summary</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{data.summary}</div>
      </div>

      {sections.map(({ key, label, icon }) => data[key] && (
        <div key={key} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
            <span>{icon}</span> {label}
          </div>
          <div style={{ background: "#16161b", borderRadius: 8, padding: "12px",
            border: "1px solid #1e1e24", fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>
            {data[key]}
          </div>
        </div>
      ))}

      {/* Code example */}
      {(hasCode || hasAnalogy) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
            <span>💻</span>
            {hasCode
              ? `Example${data.codeExample.language ? ` — ${data.codeExample.language}` : ""}`
              : "Example"}
          </div>
          {data.codeExample.description && (
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontStyle: "italic" }}>
              {data.codeExample.description}
            </div>
          )}
          {hasCode ? (
            <div style={{ background: "#0d1117", borderRadius: 8, padding: "14px",
              border: "1px solid #1e1e24", overflow: "auto" }}>
              <pre style={{ margin: 0, fontSize: 12, color: "#c9d1d9", lineHeight: 1.7,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                whiteSpace: "pre", overflowX: "auto" }}>
                {data.codeExample.code}
              </pre>
            </div>
          ) : (
            <div style={{ background: "#16161b", borderRadius: 8, padding: "12px",
              border: "1px solid #1e1e24", fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>
              {data.codeExample.description}
            </div>
          )}
        </div>
      )}

      {/* Save to notes */}
      {onSaveToNotes && (
        <button onClick={handleSave} disabled={saved}
          style={{ width: "100%", marginTop: 8, padding: "10px",
            background: saved ? "#1a2e1a" : "#1e1e24",
            border: `1px solid ${saved ? "#52b78844" : "#2a2a35"}`,
            borderRadius: 8, color: saved ? "#52b788" : "#888",
            fontSize: 13, cursor: saved ? "default" : "pointer",
            fontFamily: "inherit", fontWeight: saved ? 600 : 400 }}>
          {saved ? "✓ Saved to notes" : "📋 Save explanation to notes"}
        </button>
      )}
    </div>
  );
}

export function ExplainView({ data, rm }) {
  const sections = [
    { key: "whatItIs",       label: "What it is",         icon: "📖" },
    { key: "howItWorks",     label: "How it works",       icon: "⚙️" },
    { key: "whenToUse",      label: "When to use it",     icon: "🎯" },
    { key: "example",        label: "Example",            icon: "💻" },
    { key: "commonMistakes", label: "Common mistakes",    icon: "⚠️" },
    { key: "keyTakeaway",    label: "Key takeaway",       icon: "💡" },
  ];

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
            border: "1px solid #1e1e24", fontSize: 13, color: "#bbb", lineHeight: 1.7,
            fontFamily: key === "example" ? "monospace" : "inherit",
            whiteSpace: key === "example" ? "pre-wrap" : "normal" }}>
            {data[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

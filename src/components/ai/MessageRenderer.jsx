/**
 * Renders AI chat message content with proper code block handling.
 * Parses ```lang\ncode\n``` blocks and renders them as styled <pre> elements.
 */
export function MessageRenderer({ content, accentColor }) {
  // Split on code fences: ```lang\ncode\n```
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1] || "", content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === "code") {
          return (
            <div key={i} style={{ marginTop: i > 0 ? 10 : 0, marginBottom: 6 }}>
              {part.lang && (
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 4, fontFamily: "monospace" }}>
                  {part.lang}
                </div>
              )}
              <div style={{ background: "#0d1117", borderRadius: 8, border: "1px solid #1e1e24",
                overflowX: "auto" }}>
                <pre style={{ margin: 0, padding: "12px 14px", fontSize: 12,
                  color: "#c9d1d9", lineHeight: 1.7,
                  fontFamily: "'Fira Code','Consolas',monospace",
                  whiteSpace: "pre", minWidth: "max-content" }}>
                  {part.content.replace(/\n$/, "")}
                </pre>
              </div>
            </div>
          );
        }

        // Text: render inline backticks as code too
        return (
          <div key={i} style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            marginTop: i > 0 && parts[i-1]?.type === "code" ? 8 : 0 }}>
            {part.content.split(/(`[^`]+`)/g).map((chunk, j) =>
              chunk.startsWith("`") && chunk.endsWith("`") ? (
                <code key={j} style={{ background: "#1e1e2e", borderRadius: 3,
                  padding: "1px 5px", fontSize: 12, fontFamily: "monospace",
                  color: accentColor || "#c9d1d9", border: "1px solid #2a2a35" }}>
                  {chunk.slice(1, -1)}
                </code>
              ) : chunk
            )}
          </div>
        );
      })}
    </div>
  );
}

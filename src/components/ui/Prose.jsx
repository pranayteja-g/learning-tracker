import { color, font } from "../../styles/theme.js";

// A small, dependency-free markdown-lite renderer for reading content the
// user writes or AI generates (notes, clippings, log entries). Handles the
// subset that actually shows up in this app's content: headers, bold/italic,
// bullet & numbered lists, inline code, and fenced code blocks. Previously
// this content rendered as raw text, so AI-generated notes (which are
// explicitly prompted to use "## headings, bullet points, code blocks")
// showed literal `##` and `**` characters instead of formatting.

function parseInline(text, accentColor) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(p => p !== "");
  return parts.map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={i} style={{ color: color.text, fontWeight: 700 }}>{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return <code key={i} style={{ background: color.surfaceAlt, border: `1px solid ${color.rule}`,
        borderRadius: 4, padding: "1px 6px", fontFamily: font.mono, fontSize: "0.88em",
        color: accentColor || color.text }}>{chunk.slice(1, -1)}</code>;
    }
    if (chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2) {
      return <em key={i}>{chunk.slice(1, -1)}</em>;
    }
    return chunk;
  });
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push({ type: "h", level: Math.min(level, 3), text: line.replace(/^#+\s+/, "") });
      i++; continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++;
      }
      blocks.push({ type: "ul", items }); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++;
      }
      blocks.push({ type: "ol", items }); continue;
    }
    const paraLines = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
      !/^#{1,3}\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) {
      paraLines.push(lines[i]); i++;
    }
    blocks.push({ type: "p", text: paraLines.join("\n") });
  }
  return blocks;
}

const H_SIZE = { 1: 8, 2: 4, 3: 1 };   // added to base size

export function Prose({ content, accentColor, size = 15.5 }) {
  if (!content?.trim()) return null;

  // Split out fenced code blocks first; markdown-lite parsing only applies
  // to the text between them.
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  const segments = [];
  let last = 0, m;
  while ((m = fenceRe.exec(content)) !== null) {
    if (m.index > last) segments.push({ type: "md", content: content.slice(last, m.index) });
    segments.push({ type: "code", lang: m[1] || "", content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < content.length) segments.push({ type: "md", content: content.slice(last) });
  if (segments.length === 0) segments.push({ type: "md", content });

  return (
    <div style={{ fontFamily: font.body }}>
      {segments.map((seg, si) => {
        if (seg.type === "code") {
          return (
            <div key={si} style={{ margin: "12px 0" }}>
              {seg.lang && <div style={{ fontSize: 11, color: color.textFaint, fontFamily: font.mono,
                marginBottom: 4 }}>{seg.lang}</div>}
              <div style={{ background: color.surfaceAlt, border: `1px solid ${color.rule}`,
                borderRadius: 8, overflowX: "auto" }}>
                <pre style={{ margin: 0, padding: "12px 14px", fontSize: size - 3, color: color.text,
                  lineHeight: 1.6, fontFamily: font.mono, whiteSpace: "pre" }}>
                  {seg.content.replace(/\n$/, "")}
                </pre>
              </div>
            </div>
          );
        }
        return parseBlocks(seg.content).map((b, bi) => {
          const key = `${si}-${bi}`;
          if (b.type === "h") {
            return <div key={key} style={{ fontFamily: font.display, fontWeight: 400,
              fontSize: size + H_SIZE[b.level], color: color.text,
              margin: (si === 0 && bi === 0) ? "0 0 10px" : "22px 0 10px" }}>
              {parseInline(b.text, accentColor)}
            </div>;
          }
          if (b.type === "ul" || b.type === "ol") {
            const Tag = b.type === "ul" ? "ul" : "ol";
            return <Tag key={key} style={{ margin: "0 0 14px", paddingLeft: 22, color: color.text }}>
              {b.items.map((it, ii) => <li key={ii} style={{ fontSize: size - 1, lineHeight: 1.75,
                marginBottom: 4 }}>{parseInline(it, accentColor)}</li>)}
            </Tag>;
          }
          return <p key={key} style={{ margin: "0 0 14px", fontSize: size - 1, lineHeight: 1.75,
            color: color.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {parseInline(b.text, accentColor)}
          </p>;
        });
      })}
    </div>
  );
}

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { topicName, isExpanded, allTopicNames } from "../../utils/topics.js";
import { color as themeColor, radius, font } from "../../styles/theme.js";

// ── Build search index from all roadmaps ──────────────────────────────────────
function buildIndex(roadmaps, notes, resources) {
  const items = [];

  for (const [rmKey, rm] of Object.entries(roadmaps)) {
    for (const [section, topics] of Object.entries(rm.sections || {})) {
      items.push({
        type: "section",
        label: section,
        rmKey, rmLabel: rm.label, rmColor: rm.color, rmAccent: rm.accent,
        section,
        searchText: section.toLowerCase(),
      });

      const addTopic = (t, parentName = null, depth = 0) => {
        const name = topicName(t);
        const noteKey = `${rmKey}::${name}`;
        const note = notes?.[noteKey] || "";
        const hasResources = (resources?.[noteKey] || []).length > 0;

        items.push({
          type: "topic",
          label: name,
          parent: parentName,
          depth,
          rmKey, rmLabel: rm.label, rmColor: rm.color, rmAccent: rm.accent,
          section,
          hasNote: !!note,
          hasResources,
          notePreview: note ? note.slice(0, 80) : "",
          searchText: [name, note, section].join(" ").toLowerCase(),
        });

        if (isExpanded(t)) {
          t.subtopics.forEach(st => addTopic(st, name, depth + 1));
        }
      };

      topics.forEach(t => addTopic(t));
    }
  }

  return items;
}

// ── Highlight matching text ───────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{
        background: themeColor.accentSoft, color: themeColor.accent,
        borderRadius: 2, padding: "0 2px"
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ── Result item ───────────────────────────────────────────────────────────────
function ResultItem({ item, query, onSelect, isActive }) {
  return (
    <div onClick={() => onSelect(item)}
      style={{
        padding: "10px 16px", cursor: "pointer", borderBottom: `1px solid ${themeColor.ruleSoft}`,
        background: isActive ? "#201e26" : "transparent",
        display: "flex", gap: 12, alignItems: "flex-start",
        transition: "background 0.1s"
      }}>
      <div style={{
        fontSize: item.type === "section" ? 14 : 12,
        color: item.type === "section" ? themeColor.accent : "#8c8577",
        flexShrink: 0, marginTop: 1, minWidth: 18,
        paddingLeft: item.depth * 8
      }}>
        {item.type === "section" ? "📁" : "•"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: item.type === "section" ? themeColor.accent : "#e9e4d9",
          fontWeight: item.type === "section" ? 600 : 400
        }}>
          <Highlight text={item.label} query={query} />
        </div>
        <div style={{
          fontSize: 11, color: "#787268", marginTop: 2,
          display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap"
        }}>
          <span style={{ color: item.rmColor || themeColor.accent }}>{item.rmLabel}</span>
          {item.type === "topic" && <span>· {item.section}</span>}
          {item.parent && <span>· under {item.parent}</span>}
          {item.hasNote && <span style={{ color: themeColor.accent }}>· note</span>}
          {item.hasResources && <span>· 🔗</span>}
        </div>
        {item.notePreview && query && item.notePreview.toLowerCase().includes(query.toLowerCase()) && (
          <div style={{ fontSize: 11, color: "#8c8577", marginTop: 4, fontStyle: "italic", lineHeight: 1.5 }}>
            <Highlight text={item.notePreview + (item.notePreview.length === 80 ? "…" : "")} query={query} />
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#47444c", flexShrink: 0, marginTop: 2 }}>↵</div>
    </div>
  );
}

// ── Main search overlay ───────────────────────────────────────────────────────
export function SearchOverlay({ open, onClose, roadmaps, notes, resources, onNavigate, isMobile }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const index = useMemo(
    () => buildIndex(roadmaps, notes, resources),
    [roadmaps, notes, resources]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return index.filter(item => item.searchText.includes(q)).slice(0, 40);
  }, [query, index]);

  const handleSelect = useCallback((item) => {
    onNavigate(item);
    onClose();
  }, [onNavigate, onClose]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[activeIdx]) {
        handleSelect(results[activeIdx]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, activeIdx, handleSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  const totalTopics = Object.values(roadmaps)
    .flatMap(rm => Object.values(rm.sections || {}))
    .flatMap(ts => allTopicNames(ts)).length;

  return (
    <>
      <div onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          zIndex: 300, backdropFilter: "blur(3px)"
        }} />

      <div style={{
        position: "fixed", top: isMobile ? 0 : "12%", left: isMobile ? 0 : "50%",
        transform: isMobile ? "none" : "translateX(-50%)",
        width: isMobile ? "100%" : 560,
        height: isMobile ? "100%" : "auto",
        maxHeight: isMobile ? "100%" : "72vh",
        background: themeColor.surface,
        border: isMobile ? "none" : `1px solid ${themeColor.rule}`,
        borderRadius: isMobile ? 0 : radius.lg,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        zIndex: 301, display: "flex", flexDirection: "column",
        overflow: "hidden", fontFamily: font.body
      }}>

        {/* Input bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
          borderBottom: `1px solid ${themeColor.rule}`, background: themeColor.surface
        }}>
          <span style={{ fontSize: 16, color: "#8c8577" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder={`Search across ${totalTopics} topics, notes, sections…`}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: themeColor.text, fontSize: 14, fontFamily: "inherit"
            }} />
          {query && (
            <button onClick={() => { setQuery(""); setActiveIdx(0); }}
              style={{
                background: "transparent", border: "none", color: "#666",
                cursor: "pointer", fontSize: 14, padding: "2px 6px"
              }}>✕</button>
          )}
          <button onClick={onClose}
            style={{
              background: "transparent", border: "none", color: "#8c8577",
              cursor: "pointer", fontSize: 12, padding: "3px 8px"
            }}>Esc</button>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1, maxHeight: isMobile ? "calc(100vh - 120px)" : 420 }}>
          {query.trim() && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6e685f", fontSize: 13 }}>
              No matches found for "{query}"
            </div>
          )}

          {!query.trim() && (
            <div style={{ padding: "24px 20px", color: "#6e685f", fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: themeColor.textMuted, marginBottom: 6 }}>Search shortcuts</div>
              <div>Type topic name, keyword, or text from personal study notes.</div>
              <div style={{ marginTop: 8 }}>Use <kbd style={{ background: themeColor.surfaceAlt, padding: "2px 5px", borderRadius: 3, border: `1px solid ${themeColor.rule}` }}>↑</kbd> <kbd style={{ background: themeColor.surfaceAlt, padding: "2px 5px", borderRadius: 3, border: `1px solid ${themeColor.rule}` }}>↓</kbd> to navigate and <kbd style={{ background: themeColor.surfaceAlt, padding: "2px 5px", borderRadius: 3, border: `1px solid ${themeColor.rule}` }}>Enter</kbd> to select.</div>
            </div>
          )}

          {results.map((item, i) => (
            <div key={`${item.type}-${item.rmKey}-${item.label}`} data-idx={i}>
              <ResultItem
                item={item}
                query={query}
                isActive={i === activeIdx}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>

        {/* Footer info */}
        {results.length > 0 && (
          <div style={{
            padding: "8px 16px", borderTop: `1px solid ${themeColor.rule}`,
            fontSize: 11, color: "#6e685f", display: "flex", justifyContent: "space-between"
          }}>
            <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
            <span>Press Enter to navigate</span>
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { topicName, isExpanded, allTopicNames } from "../../utils/topics.js";

// ── Build search index from all roadmaps ──────────────────────────────────────
function buildIndex(roadmaps, notes, resources) {
  const items = [];

  for (const [rmKey, rm] of Object.entries(roadmaps)) {
    for (const [section, topics] of Object.entries(rm.sections)) {

      // Section itself
      items.push({
        type: "section",
        label: section,
        rmKey, rmLabel: rm.label, rmColor: rm.color, rmAccent: rm.accent,
        section,
        searchText: section.toLowerCase(),
      });

      // Iterate topics (including nested)
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
      <mark style={{ background: "#7b5ea755", color: "#c4b5fd",
        borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ── Result item ───────────────────────────────────────────────────────────────
function ResultItem({ item, query, onSelect, isActive }) {
  const typeConfig = {
    section: { icon: "📂", color: "#ee9b00" },
    topic:   { icon: item.depth > 0 ? "  ·" : "•", color: "#ccc" },
  };
  const cfg = typeConfig[item.type];

  return (
    <div onClick={() => onSelect(item)}
      style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #1e1e24",
        background: isActive ? "#1e1e2e" : "transparent",
        display: "flex", gap: 12, alignItems: "flex-start",
        transition: "background 0.1s" }}>

      {/* Icon */}
      <div style={{ fontSize: item.type === "section" ? 14 : 12,
        color: cfg.color, flexShrink: 0, marginTop: 1, minWidth: 18,
        paddingLeft: item.depth * 10 }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: item.type === "section" ? cfg.color : "#e8e6e0",
          fontWeight: item.type === "section" ? 700 : 400 }}>
          <Highlight text={item.label} query={query} />
        </div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 2,
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: item.rmColor }}>{item.rmLabel}</span>
          {item.type === "topic" && <span>→ {item.section}</span>}
          {item.parent && <span style={{ color: "#333" }}>under {item.parent}</span>}
          {item.hasNote && <span style={{ color: "#7b5ea7" }}>note</span>}
          {item.hasResources && <span style={{ color: "#4361ee" }}>🔗</span>}
        </div>
        {item.notePreview && query && item.notePreview.toLowerCase().includes(query.toLowerCase()) && (
          <div style={{ fontSize: 11, color: "#555", marginTop: 4,
            fontStyle: "italic", lineHeight: 1.5 }}>
            <Highlight text={item.notePreview + (item.notePreview.length === 80 ? "…" : "")} query={query} />
          </div>
        )}
      </div>

      {/* Arrow */}
      <div style={{ fontSize: 12, color: "#333", flexShrink: 0, marginTop: 2 }}>→</div>
    </div>
  );
}

// ── Main search overlay ───────────────────────────────────────────────────────
export function SearchOverlay({ open, onClose, roadmaps, notes, resources,
  onNavigate, isMobile }) {

  const [query,       setQuery]       = useState("");
  const [activeIdx,   setActiveIdx]   = useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const index = useMemo(
    () => buildIndex(roadmaps, notes, resources),
    [roadmaps, notes, resources]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return index
      .filter(item => item.searchText.includes(q))
      .slice(0, 40); // cap results
  }, [query, index]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // Reset active when results change
  useEffect(() => setActiveIdx(0), [results.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, results.length - 1));
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
  }, [open, results, activeIdx]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleSelect = (item) => {
    onNavigate(item);
    onClose();
  };

  if (!open) return null;

  const totalTopics = Object.values(roadmaps)
    .flatMap(rm => Object.values(rm.sections))
    .flatMap(ts => allTopicNames(ts)).length;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 300, backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: isMobile ? 0 : "10vh",
        left: isMobile ? 0 : "50%",
        right: isMobile ? 0 : "auto",
        bottom: isMobile ? 0 : "auto",
        transform: isMobile ? "none" : "translateX(-50%)",
        width: isMobile ? "100%" : 560,
        maxHeight: isMobile ? "100%" : "75vh",
        background: "#16161b",
        border: isMobile ? "none" : "1px solid #2a2a35",
        borderRadius: isMobile ? 0 : 14,
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        zIndex: 301,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Search input */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24",
          display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 16, color: "#555", flexShrink: 0 }}>🔍</span>
          <input ref={inputRef}
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${totalTopics} topics across ${Object.keys(roadmaps).length} roadmap${Object.keys(roadmaps).length !== 1 ? "s" : ""}…`}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#e8e6e0", fontSize: 15, fontFamily: "inherit" }} />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ background: "transparent", border: "none", color: "#555",
                fontSize: 16, cursor: "pointer", flexShrink: 0 }}>×</button>
          )}
          {isMobile && (
            <button onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#888",
                fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              Cancel
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {!query.trim() && (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 13, color: "#555" }}>
                Search topics, sections, and notes across all roadmaps
              </div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 8 }}>
                {!isMobile && "↑↓ navigate · Enter to jump · Esc to close"}
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🤷</div>
              <div style={{ fontSize: 13, color: "#555" }}>
                No results for "<strong style={{ color: "#888" }}>{query}</strong>"
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, color: "#333",
                textTransform: "uppercase", letterSpacing: 1 }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((item, i) => (
                <div key={`${item.rmKey}-${item.type}-${item.label}-${i}`} data-idx={i}>
                  <ResultItem item={item} query={query}
                    onSelect={handleSelect} isActive={i === activeIdx} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {!isMobile && results.length > 0 && (
          <div style={{ padding: "8px 16px", borderTop: "1px solid #1e1e24",
            display: "flex", gap: 16, fontSize: 10, color: "#333" }}>
            <span>↑↓ navigate</span>
            <span>↵ jump to topic</span>
            <span>Esc close</span>
          </div>
        )}
      </div>
    </>
  );
}

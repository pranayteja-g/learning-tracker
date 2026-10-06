import { topicName, isExpanded, isCollapsed, subtopics } from "../../utils/topics.js";

// ── Single checkable row ───────────────────────────────────────────────────────
function TopicRow({
  name, rmKey, rm, isDone, hasNote, hasMeta, hasResources,
  onToggle, onOpenNote, indent = 0, isParent = false, isOpen = false,
  onToggleCollapse, subtopicCount = 0, allSubDone = false, hasPassed = false, stars = 0
}) {
  const meta = hasMeta || {};
  const diffColors = { easy: "#6f9a82", medium: "#d9a441", hard: "#c2543f" };

  const handleRowClick = () => {
    if (isParent) {
      onToggleCollapse?.(name);
    } else {
      onToggle(rmKey, name);
    }
  };

  return (
    <div style={{
      background: isDone && !isParent ? (rm.color || "#d9a441") + "0c" : isParent ? "#16151a" : "#131217",
      borderRadius: indent > 0 ? 6 : 8,
      border: `1px solid ${isDone && !isParent ? (rm.color || "#d9a441") + "33" : isParent ? "#222027" : "#1d1c22"}`,
      transition: "background 0.15s, border-color 0.15s"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: indent === 1 ? "9px 12px" : indent === 2 ? "7px 10px" : "11px 14px",
        cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
      }}>

        {/* Collapse arrow for parent */}
        {isParent ? (
          <div onClick={handleRowClick}
            style={{
              width: 20, height: 20, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, color: "#777", fontSize: 10,
              transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"
            }}>
            ▶
          </div>
        ) : (
          /* Checkbox */
          <div onClick={() => onToggle(rmKey, name)}
            style={{
              width: 19, height: 19, borderRadius: 5,
              border: `1.5px solid ${isDone ? (rm.color || "#d9a441") : "#47454f"}`,
              background: isDone ? (rm.color || "#d9a441") : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s"
            }}>
            {isDone && <span style={{ color: "#000", fontWeight: 800, fontSize: 11 }}>✓</span>}
          </div>
        )}

        {/* Topic name */}
        <span onClick={handleRowClick} style={{
          flex: 1,
          fontSize: indent === 0 && isParent ? 13.5 : indent === 1 ? 13 : 12.5,
          fontWeight: isParent ? 600 : isDone ? 400 : 500,
          color: allSubDone && isParent ? (rm.accent || "#e9e4d9") : isDone ? "#827d75" : "#e9e4d9",
          textDecoration: isDone && !isParent ? "line-through" : "none",
          opacity: isDone && !isParent ? 0.75 : 1,
          paddingTop: 2, paddingBottom: 2,
        }}>
          {name}
          {isParent && (
            <span style={{ fontSize: 11, color: "#6e685f", marginLeft: 8, fontWeight: 400 }}>
              {subtopicCount} subtopics{allSubDone ? " · completed" : ""}
            </span>
          )}
        </span>

        {/* Unboxed clean metadata (zero-pill discipline) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, fontSize: 11, color: "#787268" }}>
          {!isParent && meta.difficulty && (
            <span style={{ color: diffColors[meta.difficulty] || "#787268", textTransform: "capitalize", fontWeight: 500 }}>
              {meta.difficulty}
            </span>
          )}
          {!isParent && meta.timeEst && (
            <span>{meta.timeEst}</span>
          )}
          {hasResources && (
            <span title="Has resources">🔗</span>
          )}
          {hasNote && !isParent && (
            <span style={{ color: rm.accent || "#d9a441" }}>note</span>
          )}
          {stars > 0 && !isParent && (
            <span title={`${stars === 3 ? "Mastered" : stars === 2 ? "Advanced" : "Passed"} (${stars}/3 stars)`}
              style={{ fontSize: 11, letterSpacing: -1 }}>
              {"⭐".repeat(stars)}
            </span>
          )}
          {hasPassed && stars === 0 && !isParent && (
            <span title="Attempted" style={{ fontSize: 11, color: "#666" }}>○</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onOpenNote(rmKey, name); }}
            title="Edit topic notes & resources"
            style={{
              padding: "4px 8px", background: "transparent", border: "1px solid #282630",
              borderRadius: 5, color: "#8a8479", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            ✏️
          </button>
        </div>
      </div>

      {/* Note preview */}
      {hasNote && !isParent && (
        <div style={{
          padding: "4px 14px 9px 40px", fontSize: 12, color: "#8c8577", fontStyle: "italic",
          borderTop: `1px solid ${rm.color || "#d9a441"}15`, lineHeight: 1.5
        }}>
          {hasNote.length > 130 ? hasNote.slice(0, 130) + "…" : hasNote}
        </div>
      )}
    </div>
  );
}

// ── Main TopicCard ─────────────────────────────────────────────────────────────
export function TopicCard({
  topic, rmKey, rm, progress, notes, resources, topicMeta,
  onToggle, onOpenNote, onToggleCollapse, hasPassedQuiz, getStars
}) {
  const name     = topicName(topic);
  const expanded = isExpanded(topic);
  const open     = expanded && !isCollapsed(topic);
  const subs     = subtopics(topic);

  // Plain topic
  if (!expanded) {
    const isDone  = !!progress[`${rmKey}::${name}`];
    const noteVal = notes?.[`${rmKey}::${name}`] || "";
    return (
      <TopicRow name={name} rmKey={rmKey} rm={rm} isDone={isDone}
        hasNote={noteVal}
        hasMeta={topicMeta?.[`${rmKey}::${name}`] || {}}
        hasResources={(resources?.[`${rmKey}::${name}`] || []).length > 0}
        onToggle={onToggle} onOpenNote={onOpenNote}
        hasPassed={hasPassedQuiz?.(rmKey, name)} stars={getStars?.(rmKey, name) || 0} />
    );
  }

  // Expanded parent
  const allSubDone = subs.length > 0 && subs.every(st => {
    if (isExpanded(st)) return subtopics(st).every(sst => !!progress[`${rmKey}::${topicName(sst)}`]);
    return !!progress[`${rmKey}::${topicName(st)}`];
  });

  return (
    <div style={{
      border: `1px solid ${open ? (rm.color || "#d9a441") + "33" : "#222027"}`,
      borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s"
    }}>
      <TopicRow name={name} rmKey={rmKey} rm={rm} isDone={false}
        isParent onToggleCollapse={onToggleCollapse}
        isOpen={open} subtopicCount={subs.length} allSubDone={allSubDone}
        hasNote={notes?.[`${rmKey}::${name}`] || ""}
        hasResources={(resources?.[`${rmKey}::${name}`] || []).length > 0}
        hasMeta={topicMeta?.[`${rmKey}::${name}`] || {}}
        onToggle={onToggle} onOpenNote={onOpenNote} />

      {open && (
        <div style={{
          background: "#0d0c11", borderTop: `1px solid ${(rm.color || "#d9a441")}20`,
          padding: "8px 8px 8px 24px", display: "flex", flexDirection: "column", gap: 5
        }}>
          {subs.map(st => {
            const stName     = topicName(st);
            const stExpanded = isExpanded(st);
            const stOpen     = stExpanded && !isCollapsed(st);
            const stSubs     = subtopics(st);

            if (!stExpanded) {
              const isDone  = !!progress[`${rmKey}::${stName}`];
              const noteVal = notes?.[`${rmKey}::${stName}`] || "";
              return (
                <TopicRow key={stName} name={stName} rmKey={rmKey} rm={rm} isDone={isDone}
                  indent={1} hasNote={noteVal}
                  hasMeta={topicMeta?.[`${rmKey}::${stName}`] || {}}
                  hasResources={(resources?.[`${rmKey}::${stName}`] || []).length > 0}
                  onToggle={onToggle} onOpenNote={onOpenNote}
                  hasPassed={hasPassedQuiz?.(rmKey, stName)} stars={getStars?.(rmKey, stName) || 0} />
              );
            }

            const allL2Done = stSubs.every(sst => !!progress[`${rmKey}::${topicName(sst)}`]);
            return (
              <div key={stName} style={{
                border: `1px solid ${stOpen ? (rm.color || "#d9a441") + "26" : "#222027"}`,
                borderRadius: 6, overflow: "hidden"
              }}>
                <TopicRow name={stName} rmKey={rmKey} rm={rm} isDone={false}
                  isParent indent={1}
                  onToggleCollapse={() => onToggleCollapse?.(name, stName)}
                  isOpen={stOpen} subtopicCount={stSubs.length} allSubDone={allL2Done}
                  hasNote={notes?.[`${rmKey}::${stName}`] || ""}
                  hasResources={(resources?.[`${rmKey}::${stName}`] || []).length > 0}
                  hasMeta={topicMeta?.[`${rmKey}::${stName}`] || {}}
                  onToggle={onToggle} onOpenNote={onOpenNote} />

                {stOpen && (
                  <div style={{
                    background: "#08080c", borderTop: `1px solid ${(rm.color || "#d9a441")}15`,
                    padding: "6px 6px 6px 20px", display: "flex", flexDirection: "column", gap: 4
                  }}>
                    {stSubs.map(sst => {
                      const sstName = topicName(sst);
                      const isDone  = !!progress[`${rmKey}::${sstName}`];
                      const noteVal = notes?.[`${rmKey}::${sstName}`] || "";
                      return (
                        <TopicRow key={sstName} name={sstName} rmKey={rmKey} rm={rm} isDone={isDone}
                          indent={2} hasNote={noteVal}
                          hasMeta={topicMeta?.[`${rmKey}::${sstName}`] || {}}
                          hasResources={(resources?.[`${rmKey}::${sstName}`] || []).length > 0}
                          onToggle={onToggle} onOpenNote={onOpenNote}
                          hasPassed={hasPassedQuiz?.(rmKey, sstName)} stars={getStars?.(rmKey, sstName) || 0} />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

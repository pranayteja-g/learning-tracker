import { topicName, isExpanded, isCollapsed, subtopics } from "../../utils/topics.js";

// ── Single checkable row ───────────────────────────────────────────────────────
function TopicRow({ name, rmKey, rm, isDone, hasNote, hasMeta, hasResources,
  onToggle, onOpenNote, indent = 0, isParent = false, isOpen = false,
  onToggleCollapse, subtopicCount = 0, allSubDone = false, hasPassed = false, stars = 0 }) {

  const meta = hasMeta || {};
  const diffColors = { easy: "#52b788", medium: "#ee9b00", hard: "#e05252" };

  const handleRowClick = () => {
    if (isParent) {
      onToggleCollapse?.(name);
    } else {
      onToggle(rmKey, name);
    }
  };

  return (
    <div style={{
      background: isDone && !isParent ? rm.color + "12" : isParent ? "#16161b" : "#13131a",
      borderRadius: indent > 0 ? 6 : 8,
      border: `1px solid ${isDone && !isParent ? rm.color + "40" : isParent ? "#1e1e24" : "#191924"}`,
      transition: "all 0.15s"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: indent === 1 ? "9px 10px 9px 12px" : indent === 2 ? "7px 10px 7px 10px" : "12px 13px",
        cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
      }}>

        {/* Collapse arrow for parent — takes up left tap zone */}
        {isParent ? (
          <div onClick={handleRowClick}
            style={{ width: 20, height: 20, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, color: "#555", fontSize: 10,
              transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
            ▶
          </div>
        ) : (
          /* Checkbox — tap here OR anywhere on the name area */
          <div onClick={() => onToggle(rmKey, name)}
            style={{ width: 20, height: 20, borderRadius: 4,
              border: `2px solid ${isDone ? rm.color : "#444"}`,
              background: isDone ? rm.color : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s" }}>
            {isDone && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
          </div>
        )}

        {/* Topic name — tapping here also toggles */}
        <span onClick={handleRowClick} style={{
          flex: 1,
          fontSize: indent === 0 && isParent ? 14 : indent === 1 ? 13 : 12,
          color: allSubDone && isParent ? rm.accent : isDone ? rm.accent : "#ccc",
          textDecoration: isDone && !isParent ? "line-through" : "none",
          opacity: isDone && !isParent ? 0.7 : 1,
          paddingTop: 2, paddingBottom: 2, // extra tap area vertically
        }}>
          {name}
          {isParent && (
            <span style={{ fontSize: 10, color: "#444", marginLeft: 8 }}>
              {subtopicCount} subtopics{allSubDone ? " ✓" : ""}
            </span>
          )}
        </span>

        {/* Badges + note button — isolated from toggle */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {!isParent && meta.difficulty && (
            <span style={{ fontSize: 10, color: diffColors[meta.difficulty],
              background: diffColors[meta.difficulty] + "20", padding: "2px 6px",
              borderRadius: 4, textTransform: "capitalize" }}>{meta.difficulty}</span>
          )}
          {!isParent && meta.timeEst && (
            <span style={{ fontSize: 10, color: "#666", background: "#1e1e24",
              padding: "2px 6px", borderRadius: 4 }}>⏱ {meta.timeEst}</span>
          )}
          {hasResources && (
            <span style={{ fontSize: 10, color: "#7b8cde", background: "#4361ee20",
              padding: "2px 6px", borderRadius: 4 }}>🔗</span>
          )}
          {hasNote && !isParent && (
            <span style={{ fontSize: 10, color: rm.accent, background: rm.color + "20",
              padding: "2px 6px", borderRadius: 4 }}>note</span>
          )}
          {stars > 0 && !isParent && (
            <span title={`${stars === 3 ? "Mastered" : stars === 2 ? "Advanced" : "Passed"} (${stars}/3 stars)`}
              style={{ fontSize: 12, letterSpacing: -2 }}>
              {"⭐".repeat(stars)}
            </span>
          )}
          {hasPassed && stars === 0 && !isParent && (
            <span title="Attempted" style={{ fontSize: 11, color: "#555" }}>○</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onOpenNote(rmKey, name); }}
            style={{ padding: "6px 10px", background: "transparent", border: "1px solid #2a2a35",
              borderRadius: 4, color: "#555", fontSize: 13, cursor: "pointer",
              minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✏️
          </button>
        </div>
      </div>

      {/* Note preview */}
      {hasNote && !isParent && (
        <div style={{ padding: "5px 13px 10px 43px", fontSize: 12, color: "#666", fontStyle: "italic",
          borderTop: `1px solid ${rm.color}1a`, lineHeight: 1.5 }}>
          {hasNote.length > 130 ? hasNote.slice(0, 130) + "…" : hasNote}
        </div>
      )}
    </div>
  );
}

// ── Main TopicCard ─────────────────────────────────────────────────────────────
export function TopicCard({ topic, rmKey, rm, progress, notes, resources, topicMeta,
  onToggle, onOpenNote, onToggleCollapse, hasPassedQuiz, getStars }) {

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
    <div style={{ border: `1px solid ${open ? rm.color + "33" : "#1e1e24"}`,
      borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>

      <TopicRow name={name} rmKey={rmKey} rm={rm} isDone={false}
        isParent onToggleCollapse={onToggleCollapse}
        isOpen={open} subtopicCount={subs.length} allSubDone={allSubDone}
        hasNote={notes?.[`${rmKey}::${name}`] || ""}
        hasResources={(resources?.[`${rmKey}::${name}`] || []).length > 0}
        hasMeta={topicMeta?.[`${rmKey}::${name}`] || {}}
        onToggle={onToggle} onOpenNote={onOpenNote} />

      {open && (
        <div style={{ background: "#0f0f13", borderTop: `1px solid ${rm.color}22`,
          padding: "8px 8px 8px 28px", display: "flex", flexDirection: "column", gap: 5 }}>
          {subs.map((st, si) => {
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
              <div key={stName} style={{ border: `1px solid ${stOpen ? rm.color + "22" : "#1e1e24"}`,
                borderRadius: 6, overflow: "hidden" }}>
                <TopicRow name={stName} rmKey={rmKey} rm={rm} isDone={false}
                  isParent indent={1}
                  onToggleCollapse={() => onToggleCollapse?.(name, stName)}
                  isOpen={stOpen} subtopicCount={stSubs.length} allSubDone={allL2Done}
                  hasNote={notes?.[`${rmKey}::${stName}`] || ""}
                  hasResources={(resources?.[`${rmKey}::${stName}`] || []).length > 0}
                  hasMeta={topicMeta?.[`${rmKey}::${stName}`] || {}}
                  onToggle={onToggle} onOpenNote={onOpenNote} />

                {stOpen && (
                  <div style={{ background: "#0a0a10", borderTop: `1px solid ${rm.color}15`,
                    padding: "6px 6px 6px 22px", display: "flex", flexDirection: "column", gap: 4 }}>
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

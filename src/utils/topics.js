// ── Topic shape helpers ────────────────────────────────────────────────────────
// A topic entry is either a plain string OR { name, subtopics, collapsed }
// These helpers normalise both shapes so all code works with either.

export function topicName(t)      { return typeof t === "string" ? t : t.name; }
export function isExpanded(t)     { return typeof t !== "string" && Array.isArray(t.subtopics); }
export function isCollapsed(t)    { return isExpanded(t) && t.collapsed !== false; }
export function subtopics(t)      { return isExpanded(t) ? t.subtopics : []; }

// Returns all leaf topic names for a section (used for progress counting)
export function flatTopicNames(sectionTopics) {
  return sectionTopics.flatMap(t =>
    isExpanded(t) ? t.subtopics.flatMap(st =>
      isExpanded(st) ? st.subtopics.map(topicName) : [topicName(st)]
    ) : [topicName(t)]
  );
}

// Returns all topic names including parents (for AI context etc.)
export function allTopicNames(sectionTopics) {
  const names = [];
  sectionTopics.forEach(t => {
    names.push(topicName(t));
    if (isExpanded(t)) {
      t.subtopics.forEach(st => {
        names.push(topicName(st));
        if (isExpanded(st)) st.subtopics.forEach(sst => names.push(topicName(sst)));
      });
    }
  });
  return names;
}

// Toggle collapsed state of a parent topic
export function toggleCollapsed(sectionTopics, topicName_) {
  return sectionTopics.map(t =>
    topicName(t) === topicName_ && isExpanded(t)
      ? { ...t, collapsed: !isCollapsed(t) }
      : t
  );
}

// Expand a flat topic into a parent+subtopics structure
export function expandTopic(sectionTopics, targetName, subtopicNames) {
  return sectionTopics.map(t => {
    if (topicName(t) !== targetName) return t;
    // If already expanded, expand a subtopic
    if (isExpanded(t)) return t; // handled separately
    return { name: targetName, subtopics: subtopicNames, collapsed: true };
  });
}

// Expand a subtopic one level deeper
export function expandSubtopic(sectionTopics, parentName, subtopicTarget, newSubtopics) {
  return sectionTopics.map(t => {
    if (topicName(t) !== parentName || !isExpanded(t)) return t;
    const newSubs = t.subtopics.map(st =>
      topicName(st) === subtopicTarget
        ? { name: topicName(st), subtopics: newSubtopics, collapsed: true }
        : st
    );
    return { ...t, subtopics: newSubs };
  });
}

// Remove expansion — flatten back to string
export function collapseTopic(sectionTopics, targetName) {
  return sectionTopics.map(t =>
    topicName(t) === targetName && isExpanded(t) ? targetName : t
  );
}

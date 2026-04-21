/**
 * Sage Tool Definitions — what Sage can do to the app
 */
import { allTopicNames, flatTopicNames } from "../../utils/topics.js";

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_progress",
      description: "Get the user's learning progress, roadmap stats, completed topics, quiz scores and XP. Use when user asks about their progress, how they're doing, what they've completed, or wants a summary.",
      parameters: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "Specific roadmap ID to check, or omit for all" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_note",
      description: "Add or append notes to a specific topic in a roadmap. Use when the user wants to save information to a topic, or when you extract knowledge from an image/document.",
      parameters: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "The roadmap ID" },
          topic:     { type: "string", description: "The exact topic name" },
          content:   { type: "string", description: "The note content (markdown supported)" },
          replace:   { type: "boolean", description: "Replace existing note (default: append)" }
        },
        required: ["roadmapId", "topic", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mark_topic_done",
      description: "Mark a topic as completed in a roadmap.",
      parameters: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "The roadmap ID" },
          topic:     { type: "string", description: "The exact topic name" }
        },
        required: ["roadmapId", "topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_clipping",
      description: "Create a standalone clipping/note in the Dashboard. Use for content not tied to a specific topic — articles, ideas, extracted content from images or URLs.",
      parameters: {
        type: "object",
        properties: {
          title:     { type: "string", description: "Title for the clipping" },
          content:   { type: "string", description: "The full content/notes" },
          tags:      { type: "array", items: { type: "string" }, description: "Relevant tags" },
          sourceUrl: { type: "string", description: "Source URL if applicable" }
        },
        required: ["title", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_notes",
      description: "Search through the user's existing notes and clippings.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_due_topics",
      description: "Get completed topics the user should review today.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "add_roadmap_topic",
      description: "Add a new topic to an existing section in a roadmap.",
      parameters: {
        type: "object",
        properties: {
          roadmapId:   { type: "string" },
          sectionName: { type: "string" },
          topicName:   { type: "string" }
        },
        required: ["roadmapId", "sectionName", "topicName"]
      }
    }
  }
];

export function executeTool(name, args, appContext) {
  const {
    roadmaps,
    progress,
    notes,
    clippings,
    setProgress,
    saveNote,
    addClipping,
    setRoadmaps,
    xpData,
    getDueTopics,
    recordActivity,
    recordTopicDone,
  } = appContext;

  switch (name) {
    case "get_progress": {
      const rmList = args.roadmapId
        ? [roadmaps[args.roadmapId]].filter(Boolean)
        : Object.values(roadmaps);
      const result = rmList.map(rm => {
        const allTopics = Object.values(rm.sections).flatMap(flatTopicNames);
        const done = allTopics.filter(t => progress[`${rm.id}::${t}`]).length;
        return { roadmap: rm.label, id: rm.id, total: allTopics.length, done, pct: Math.round((done / allTopics.length) * 100) };
      });
      const xp = xpData?.xp || 0;
      const level = xp >= 7000 ? "Master" : xp >= 3500 ? "Expert" : xp >= 1500 ? "Journeyman" : xp >= 500 ? "Apprentice" : "Novice";
      return { success: true, data: { roadmaps: result, xp, level, badges: (xpData?.badges || []).length } };
    }

    case "add_note": {
      const rm = roadmaps[args.roadmapId];
      if (!rm) return { success: false, error: `Roadmap "${args.roadmapId}" not found` };
      const knownTopics = Object.values(rm.sections).flatMap(allTopicNames);
      if (!knownTopics.includes(args.topic)) {
        return { success: false, error: `Topic "${args.topic}" was not found in ${rm.label}` };
      }
      const existing = notes[`${args.roadmapId}::${args.topic}`] || "";
      const newNote  = args.replace ? args.content : (existing ? `${existing}\n\n---\n\n${args.content}` : args.content);
      saveNote({ rmKey: args.roadmapId, topic: args.topic, note: newNote, difficulty: "", timeEst: "", links: [] });
      return { success: true, message: `Note ${args.replace ? "saved" : "appended"} to "${args.topic}" in ${rm.label}` };
    }

    case "mark_topic_done": {
      const rm = roadmaps[args.roadmapId];
      if (!rm) return { success: false, error: `Roadmap "${args.roadmapId}" not found` };
      const knownTopics = Object.values(rm.sections).flatMap(flatTopicNames);
      if (!knownTopics.includes(args.topic)) {
        return { success: false, error: `Topic "${args.topic}" was not found in ${rm.label}` };
      }
      const progressKey = `${args.roadmapId}::${args.topic}`;
      const wasDone = !!progress[progressKey];
      setProgress(prev => ({ ...prev, [progressKey]: true }));
      if (!wasDone) {
        recordActivity?.();
        recordTopicDone?.();
      }
      return { success: true, message: `Marked "${args.topic}" as done in ${rm.label}` };
    }

    case "create_clipping": {
      addClipping({ title: args.title, content: args.content, tags: args.tags || [], sourceUrl: args.sourceUrl || null });
      return { success: true, message: `Clipping "${args.title}" saved to Dashboard` };
    }

    case "search_notes": {
      const q = args.query.toLowerCase();
      const results = [];
      Object.entries(notes).forEach(([key, text]) => {
        if (text?.toLowerCase().includes(q)) {
          const [rmId, topic] = key.split("::");
          results.push({ type: "note", roadmap: roadmaps[rmId]?.label, topic, preview: text.slice(0, 120) });
        }
      });
      clippings.forEach(c => {
        if (c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q))
          results.push({ type: "clipping", title: c.title, preview: c.content.slice(0, 120) });
      });
      return { success: true, data: results, count: results.length };
    }

    case "get_due_topics": {
      const due = typeof getDueTopics === "function" ? getDueTopics() : [];
      return {
        success: true,
        data: due.map(item => ({
          roadmap: roadmaps[item.rmKey]?.label || item.rmKey,
          roadmapId: item.rmKey,
          topic: item.topic,
        })),
        count: due.length,
      };
    }

    case "add_roadmap_topic": {
      const rm = roadmaps[args.roadmapId];
      if (!rm) return { success: false, error: "Roadmap not found" };
      const section = rm.sections[args.sectionName];
      if (!section) return { success: false, error: `Section "${args.sectionName}" not found` };
      setRoadmaps(prev => ({
        ...prev,
        [args.roadmapId]: { ...rm, sections: { ...rm.sections, [args.sectionName]: [...section, args.topicName] } }
      }));
      return { success: true, message: `Added "${args.topicName}" to ${args.sectionName} in ${rm.label}` };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

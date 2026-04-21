import { useState, useRef, useEffect, useCallback } from "react";
import { idbSet } from "./storage/db.js";
import { useAppStorage }         from "./storage/hooks.js";
import { useIsMobile }           from "./hooks/useIsMobile.js";
import { validateRoadmap, downloadJSON, getRoadmapStats, getNextUp } from "./utils/roadmap.js";
import { flatTopicNames, topicName, isExpanded } from "./utils/topics.js";
import { safeParseJSON } from "./utils/jsonParse.js";
import { Toast }                 from "./components/ui/Toast.jsx";
import { TopicCard }             from "./components/ui/TopicCard.jsx";
import { RadialProgress }        from "./components/ui/RadialProgress.jsx";
import { NoteModal }             from "./components/modals/NoteModal.jsx";
import { ManageModal }           from "./components/modals/ManageModal.jsx";
import { RoadmapEditorModal }    from "./components/modals/RoadmapEditorModal.jsx";
import { WelcomeScreen }         from "./components/screens/WelcomeScreen.jsx";
import { Dashboard }             from "./components/screens/Dashboard.jsx";
import { PracticePanel }         from "./components/practice/PracticePanel.jsx";
import { SearchOverlay }         from "./components/ui/SearchOverlay.jsx";
import { StreakBadge }           from "./components/ui/StreakBadge.jsx";
import { InstallPrompt }        from "./components/ui/InstallPrompt.jsx";
import { useStreak }            from "./hooks/useStreak.js";
import { useQuizResults }       from "./hooks/useQuizResults.js";
import { useQuest }               from "./hooks/useQuest.js";
import { useXP }                  from "./hooks/useXP.js";
import { OnboardingFlow }         from "./components/screens/OnboardingFlow.jsx";
import { DailyGoalWidget }        from "./components/ui/DailyGoal.jsx";
import { StudyTimer }             from "./components/ui/StudyTimer.jsx";
import { CompletionCertificate }  from "./components/ui/CompletionCertificate.jsx";
import { useDailyGoal }           from "./hooks/useDailyGoal.js";
import { useSpacedRepetition }    from "./hooks/useSpacedRepetition.js";
import { useProjects }            from "./hooks/useProjects.js";
import { useClippings }           from "./hooks/useClippings.js";
import { ProjectBoard }           from "./components/screens/ProjectBoard.jsx";
import { SagePanel }              from "./components/sage/SagePanel.jsx";

import { QuestBoard }             from "./components/quest/QuestCard.jsx";
import { QuestModal }             from "./components/quest/QuestModal.jsx";
import { buildQuestPrompt }       from "./ai/prompts.js";
import { callAI }                 from "./ai/providers.js";
import { loadAIConfig }           from "./ai/providers.js";
import { AITimeoutTester }        from "./components/debug/AITimeoutTester.jsx";

// ── Compact inline timer for home screen ────────────────────────────────────
function CompactTimer({ color }) {
  const PRESETS = [25*60, 15*60, 10*60, 5*60];
  const LABELS  = ["25m", "15m", "10m", "5m"];
  const [sel,     setSel]     = useState(0);
  const [left,    setLeft]    = useState(PRESETS[0]);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(t); setRunning(false); setDone(true);
        navigator.vibrate?.([200,100,200]); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mins = String(Math.floor(left/60)).padStart(2,"0");
  const secs = String(left%60).padStart(2,"0");
  const pct  = ((PRESETS[sel]-left)/PRESETS[sel])*100;
  const R = 18, C = 2*Math.PI*R;

  const pick = (i) => { setSel(i); setLeft(PRESETS[i]); setRunning(false); setDone(false); };

  return (
    <div style={{ background: "#16161b", borderRadius: 10, border: "1px solid #1e1e24",
      padding: "10px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position:"relative", flexShrink:0, width:44, height:44 }}>
        <svg width={44} height={44} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={22} cy={22} r={R} fill="none" stroke="#1e1e24" strokeWidth={4}/>
          <circle cx={22} cy={22} r={R} fill="none" stroke={done?"#52b788":color}
            strokeWidth={4} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C*(1-pct/100)}
            style={{ transition:"stroke-dashoffset 1s linear" }}/>
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <span style={{ fontSize:done?16:10, fontWeight:700, color:"#fff", fontVariantNumeric:"tabular-nums" }}>
            {done?"🎉":`${mins}:${secs}`}
          </span>
        </div>
      </div>
      <div style={{ display:"flex", gap:4, flex:1 }}>
        {LABELS.map((l,i) => (
          <button key={i} onClick={() => pick(i)}
            style={{ flex:1, padding:"5px 0", background:sel===i?color+"22":"transparent",
              border:`1px solid ${sel===i?color:"#2a2a35"}`, borderRadius:5,
              color:sel===i?"#fff":"#555", fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
      </div>
      <button onClick={() => { setDone(false); setRunning(r=>!r); }}
        style={{ padding:"7px 12px", background:running?"#2e1a1a":color, border:"none",
          borderRadius:7, color:running?"#e05252":"#fff",
          fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
        {running?"⏸":"▶"}
      </button>
    </div>
  );
}

export default function App() {
  const { roadmaps, setRoadmaps, progress, setProgress, notes, setNotes,
          resources, setResources, topicMeta, setTopicMeta, loaded } = useAppStorage();
  const isMobile = useIsMobile();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeRoadmap,  setActiveRoadmap]  = useState(null);
  const [activeSection,  setActiveSection]  = useState(null);
  const [view,           setView]           = useState("sections");
  const [mobileScreen,   setMobileScreen]   = useState("roadmaps");
  const [noteModal,      setNoteModal]      = useState(null);
  const [showManage,     setShowManage]     = useState(false);
  const [manageTab,      setManageTab]      = useState("roadmaps");
  const [editorModal,    setEditorModal]    = useState(null);
  const [feedback,       setFeedback]       = useState(null);
  const [practiceOpen,   setPracticeOpen]   = useState(false);
  const [activeQuestRmId, setActiveQuestRmId] = useState(null);
  const [loadingQuestRmIds, setLoadingQuestRmIds] = useState([]);
  const [questBoardOpen,    setQuestBoardOpen]    = useState(false);
  const [certificate,       setCertificate]       = useState(null);
  const [projectBoardRm,    setProjectBoardRm]    = useState(null);
  const [sageOpen,          setSageOpen]          = useState(false);  // roadmap to show cert for
  const [searchOpen,     setSearchOpen]     = useState(false);
  const { streak, recordActivity, studiedToday } = useStreak();
  const { results: quizResults, recordQuizResult, hasPassedTopic, getStars } = useQuizResults();
  const { quests, loaded: questLoaded, startQuest, advancePhase, completeQuest,
          isOnCooldown, cooldownRemaining, needsNewQuest, getQuest } = useQuest();
  const { xpData, awardQuestXP } = useXP();
  const { goal, todayCount, pct: goalPct, goalMet, goalStreak, setGoal, recordTopicDone } = useDailyGoal();
  const { getDueTopics } = useSpacedRepetition();
  const { projects, addProjects, toggleMilestone, setStatus: setProjectStatus, deleteProject, getProjects, getStats: getProjectStats } = useProjects();
  const { clippings, addClipping, updateClipping, deleteClipping } = useClippings();
  const importRef = useRef(null);

  const showFeedback = (ok, msg) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const rmKeys   = Object.keys(roadmaps);
  const rmKey    = activeRoadmap && roadmaps[activeRoadmap] ? activeRoadmap : rmKeys[0] || null;
  const rm       = rmKey ? roadmaps[rmKey] : null;
  const sections = rm ? Object.keys(rm.sections) : [];
  const curSec   = activeSection && rm?.sections[activeSection] ? activeSection : sections[0];
  const stats    = rm ? getRoadmapStats(rm, progress) : { total: 0, done: 0, pct: 0 };
  const nextUp   = rm ? getNextUp(rm, progress) : [];

  // ── Topic actions ──────────────────────────────────────────────────────────
  const toggle = (key, topic) => {
    const wasUndone = !progress[`${key}::${topic}`];
    setProgress(p => ({ ...p, [`${key}::${topic}`]: !p[`${key}::${topic}`] }));
    if (wasUndone) { recordActivity(); recordTopicDone(); }
  };

  const openNote = (key, topic) => setNoteModal({ roadmap: key, topic });

  const saveNote = ({ rmKey, topic, note, difficulty, timeEst, links }) => {
    setNotes(n => ({ ...n, [`${rmKey}::${topic}`]: note }));
    setTopicMeta(m => ({ ...m, [`${rmKey}::${topic}`]: { difficulty, timeEst } }));
    setResources(r => ({ ...r, [`${rmKey}::${topic}`]: links }));
    setNoteModal(null);
  };

  // Append AI explanation to a topic's notes (never overwrites)
  const appendToNote = (rmKey, topic, text) => {
    setNotes(n => {
      const existing = n[`${rmKey}::${topic}`] || "";
      const separator = existing.trim() ? "\n\n---\n\n" : "";
      return { ...n, [`${rmKey}::${topic}`]: existing + separator + text };
    });
    showFeedback(true, `Explanation saved to "${topic}" notes`);
  };

  // Global Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Navigate to a search result
  const handleSearchNavigate = (item) => {
    if (item.type === "section") {
      setActiveRoadmap(item.rmKey);
      setActiveSection(item.section);
      if (isMobile) setMobileScreen("topics"); else setView("topics");
    } else {
      // topic — navigate to its section
      setActiveRoadmap(item.rmKey);
      setActiveSection(item.section);
      if (isMobile) setMobileScreen("topics"); else setView("topics");
      // Open note modal if it has a note, otherwise just navigate
    }
  };

  const toggleAll = (key, sectionKey) => {
    const ts    = roadmaps[key].sections[sectionKey];
    const flat  = flatTopicNames(ts);
    const allDone = flat.every(t => progress[`${key}::${t}`]);
    flat.forEach(t => setProgress(p => ({ ...p, [`${key}::${t}`]: !allDone })));
  };

  // Toggle collapsed state of a parent topic (up to 2 levels)
  const handleToggleCollapse = (sectionKey, parentName, subName) => {
    setRoadmaps(prev => {
      const rm = prev[rmKey];
      const section = rm.sections[sectionKey];
      let newSection;
      if (!subName) {
        // Toggle top-level parent
        newSection = section.map(t =>
          topicName(t) === parentName && isExpanded(t)
            ? { ...t, collapsed: t.collapsed === false ? true : false }
            : t
        );
      } else {
        // Toggle level-2 parent inside a top-level parent
        newSection = section.map(t => {
          if (topicName(t) !== parentName || !isExpanded(t)) return t;
          const newSubs = t.subtopics.map(st =>
            topicName(st) === subName && isExpanded(st)
              ? { ...st, collapsed: st.collapsed === false ? true : false }
              : st
          );
          return { ...t, subtopics: newSubs };
        });
      }
      return { ...prev, [rmKey]: { ...rm, sections: { ...rm.sections, [sectionKey]: newSection } } };
    });
  };

  // ── Roadmap CRUD ───────────────────────────────────────────────────────────
  const handleSaveRoadmap = (saved) => {
    setRoadmaps(prev => ({ ...prev, [saved.id]: saved }));
    setActiveRoadmap(saved.id);
    setActiveSection(null);
    if (isMobile) setMobileScreen("sections"); else setView("sections");
    setEditorModal(null);
    showFeedback(true, `"${saved.label}" ${editorModal?.existing ? "updated" : "created"}!`);
  };

  const handleDeleteRoadmap = (id) => {
    if (rmKeys.length === 1) { showFeedback(false, "Can't delete the only roadmap."); return; }
    setRoadmaps(prev => { const c = {...prev}; delete c[id]; return c; });
    showFeedback(true, "Roadmap deleted.");
  };

  // ── Import / Export ────────────────────────────────────────────────────────
  const handleImportRoadmap = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.roadmaps || data.progress) { handleImportBackupData(data); return; }
        const err = validateRoadmap(data);
        if (err) { showFeedback(false, err); return; }
        const newRm = { id: data.id, label: data.label, color: data.color || "#7b5ea7", accent: data.accent || "#a78cde", sections: data.sections };
        setRoadmaps(prev => ({ ...prev, [newRm.id]: newRm }));
        setActiveRoadmap(newRm.id);
        if (isMobile) setMobileScreen("sections"); else setView("sections");
        showFeedback(true, `"${newRm.label}" imported!`);
      } catch { showFeedback(false, "Invalid file format."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportBackupData = (data) => {
    // Core data — merge
    if (data.roadmaps)  setRoadmaps(prev  => ({ ...prev,  ...data.roadmaps }));
    if (data.progress)  setProgress(prev  => ({ ...prev,  ...data.progress }));
    if (data.notes)     setNotes(prev     => ({ ...prev,  ...data.notes }));
    if (data.resources) setResources(prev => ({ ...prev,  ...data.resources }));
    if (data.topicMeta) setTopicMeta(prev => ({ ...prev,  ...data.topicMeta }));
    // Extended data — restore directly via IDB
    if (data.clippings && Array.isArray(data.clippings)) {
      idbSet("learning-tracker-clippings-v1", data.clippings);
    }
    if (data.projects && typeof data.projects === "object") {
      idbSet("learning-tracker-projects-v1", data.projects);
    }
    if (data.quests && typeof data.quests === "object") {
      idbSet("learning-tracker-quests-v2", data.quests);
    }
    if (data.xpData && typeof data.xpData === "object") {
      idbSet("learning-tracker-xp-v1", data.xpData);
    }
    const firstKey = data.roadmaps ? Object.keys(data.roadmaps)[0] : null;
    if (firstKey) { setActiveRoadmap(firstKey); if (isMobile) setMobileScreen("sections"); }
    showFeedback(true, "Backup restored! Reload the app to see all data.");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.progress && !data.roadmaps) throw new Error("Invalid");
        handleImportBackupData(data);
      } catch { showFeedback(false, "Invalid backup file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    downloadJSON(
      {
        version: 3,
        exportedAt: new Date().toISOString(),
        // Core learning data
        roadmaps, progress, notes, resources, topicMeta,
        // Extended data
        clippings,
        projects,
        quests,
        xpData,
      },
      `learning-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
    );
  };

  const handleGetSnapshot = () => ({
    version: 3,
    exportedAt: new Date().toISOString(),
    roadmaps, progress, notes, resources, topicMeta,
    clippings, projects, quests, xpData,
  });

  const handleApplySnapshot = async (data) => {
    handleImportBackupData(data);
  };

  const generateQuest = useCallback(async (rmId) => {
    const roadmap = roadmaps[rmId];
    if (!roadmap) return;
    setLoadingQuestRmIds(prev => [...prev, rmId]);
    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) return;
      const prompt = buildQuestPrompt({ roadmap, quizResults, progress });
      if (!prompt) return;
      const { text } = await callAI({ provider: cfg.provider, apiKey,
        systemPrompt: "You are a study mentor. Assign a quest. Respond ONLY with valid JSON.",
        userPrompt: prompt, maxTokens: 1024 });
      const data = safeParseJSON(text);
      startQuest({ ...data, roadmapId: rmId });
    } catch(e) { console.error("Quest generation failed:", e); }
    finally { setLoadingQuestRmIds(prev => prev.filter(id => id !== rmId)); }
  }, [progress, quizResults, roadmaps, startQuest]);

  // Auto-generate quests for all roadmaps that need one on load
  useEffect(() => {
    if (!loaded || !questLoaded || !Object.keys(roadmaps).length) return;
    Object.keys(roadmaps).forEach(rmId => {
      if (needsNewQuest(rmId) && !loadingQuestRmIds.includes(rmId)) {
        generateQuest(rmId);
      }
    });
  }, [generateQuest, loaded, loadingQuestRmIds, needsNewQuest, questLoaded, roadmaps]);

  // ── Global style: prevent iOS zoom on input focus ────────────────────────
  const globalStyle = `
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
    * { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  `;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#555", fontFamily: "Georgia, serif" }}>Loading…</div>
  );


  const sageAppContext = {
    roadmaps, progress, notes, clippings, xpData,
    setProgress,
    setRoadmaps,
    getDueTopics,
    recordActivity,
    recordTopicDone,
    saveNote: (args) => {
      setNotes(prev => ({ ...prev, [`${args.rmKey}::${args.topic}`]: args.note }));
    },
    addClipping,
  };

  // ── Welcome ────────────────────────────────────────────────────────────────
  if (rmKeys.length === 0) return (
    <>
      <style>{globalStyle}</style>
      <OnboardingFlow
        onComplete={() => {}}
        onCreate={(tmpl) => {
          if (tmpl) handleSaveRoadmap({ ...tmpl, id: tmpl.id || tmpl.label.toLowerCase().replace(/\s+/g,"-") });
        }}
      />
      {feedback && <Toast feedback={feedback} isMobile={isMobile} />}
    </>
  );

  // ── Shared: Topic list ─────────────────────────────────────────────────────
  const renderTopicList = (sectionKey) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rm.sections[sectionKey]?.map(topic => (
        <TopicCard key={topicName(topic)} topic={topic} rmKey={rmKey} rm={rm}
          progress={progress} notes={notes} resources={resources} topicMeta={topicMeta}
          hasPassedQuiz={hasPassedTopic} getStars={getStars} onToggle={toggle} onOpenNote={openNote}
          onToggleCollapse={(parentName, subName) => handleToggleCollapse(sectionKey, parentName, subName)} />
      ))}
    </div>
  );

  // ── Shared: Next-up list ───────────────────────────────────────────────────
  const renderNextUpList = () => (
    <div>
      {nextUp.length === 0
        ? <div style={{ color: rm.accent, fontSize: 15 }}>🎉 Roadmap complete!</div>
        : nextUp.map(({ section, topic }, i) => (
          <div key={topic} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px",
            background: "#16161b", borderRadius: 8, marginBottom: 8, border: "1px solid #1e1e24" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: rm.color + "22",
              color: rm.accent, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#e8e6e0" }}>{topic}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{section}</div>
            </div>
            <button onClick={() => openNote(rmKey, topic)}
              style={{ padding: "5px 9px", background: "transparent", border: "1px solid #2a2a35",
                borderRadius: 4, color: "#666", fontSize: 12, cursor: "pointer" }}>✏️</button>
            <div onClick={() => toggle(rmKey, topic)}
              style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${rm.color}`,
                background: progress[`${rmKey}::${topic}`] ? rm.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {progress[`${rmKey}::${topic}`] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
            </div>
          </div>
        ))
      }
    </div>
  );

  // Overlays inlined directly in JSX to prevent remounting on re-render

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE
  // ════════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const goToRoadmap = (key) => { setActiveRoadmap(key); setActiveSection(null); setMobileScreen("sections"); };
    const screenTitle = { roadmaps: "Learning Tracker", quests: "🎯 Quests", dashboard: "Dashboard", sections: rm?.label, topics: curSec, nextup: "🎯 Next Up" };

    return (
      <div style={{ fontFamily: "'Georgia', serif", minHeight: "100dvh", background: "#0f0f13", color: "#e8e6e0", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "12px 16px 12px", borderBottom: "1px solid #1e1e24",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "fixed", top: 0, left: 0, right: 0, background: "#0f0f13", zIndex: 50,
          paddingTop: "calc(12px + env(safe-area-inset-top))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {["sections","topics","nextup"].includes(mobileScreen) && (
              <button onClick={() => mobileScreen === "topics" ? setMobileScreen("sections") : mobileScreen === "nextup" ? setMobileScreen("sections") : setMobileScreen("roadmaps")}
                style={{ background: "transparent", border: "none", color: "#888",
                  fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1, marginRight: 2 }}>‹</button>
            )}
            <div>
              {mobileScreen === "roadmaps" && (
                <div style={{ fontSize: 11, color: "#555", marginBottom: 1 }}>Learning Tracker</div>
              )}
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {screenTitle[mobileScreen]}
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <StreakBadge streak={{ ...streak, studiedToday }} isMobile={true} />
            <button onClick={() => setSearchOpen(true)}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer", background: "#1e1e24",
                color: "#888", fontSize: 15 }}>🔍</button>
            <button onClick={() => setSageOpen(true)}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer",
                background: sageOpen ? "#76b90022" : "#1e1e24",
                color: sageOpen ? "#76b900" : "#888", fontSize: 15 }}>🌿</button>
            <button onClick={() => setShowManage(true)}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer", background: "#1e1e24",
                color: "#888", fontSize: 15 }}>⚙️</button>

          </div>
        </div>
        <input ref={importRef} type="file" accept=".json" onChange={handleImportRoadmap} style={{ display: "none" }} />

        {/* Content area — offset for fixed header + bottom nav */}
        <div style={{ paddingTop: "calc(56px + env(safe-area-inset-top))", paddingBottom: "calc(56px + env(safe-area-inset-bottom))", minHeight: "100dvh", boxSizing: "border-box" }}>

        {mobileScreen === "dashboard" && (
          <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
            topicMeta={topicMeta} isMobile={true} onOpenRoadmap={goToRoadmap} quizResults={quizResults}
            onOpenNote={(modal) => setNoteModal(modal)}
            clippings={clippings} onAddClipping={addClipping} onUpdateClipping={updateClipping} onDeleteClipping={deleteClipping} />
        )}

        {mobileScreen === "quests" && (
          <div style={{ padding: "16px", paddingBottom: "96px" }}>
            <QuestBoard
              roadmaps={roadmaps} quests={quests}
              loadingRmIds={loadingQuestRmIds}
              isOnCooldown={isOnCooldown} cooldownRemaining={cooldownRemaining}
              isMobile={true}
              singleColumn={true}
              onBegin={(rmId) => setActiveQuestRmId(rmId)}
              onGenerate={generateQuest}
            />
          </div>
        )}

        {mobileScreen === "roadmaps" && (
          <div style={{ padding: "20px 16px", paddingBottom: "100px" }}>
            {/* Practice quick access */}
            <button onClick={() => setPracticeOpen(o => !o)}
              style={{ width: "100%", padding: "11px", background: "#1e1e24", border: "1px solid #2a2a35",
                borderRadius: 10, color: "#888", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, marginBottom: 10 }}>
              🤖 <span>Practice</span>
            </button>

            {/* Daily goal */}
            <DailyGoalWidget goal={goal} todayCount={todayCount} pct={goalPct}
              goalMet={goalMet} goalStreak={goalStreak} onSetGoal={setGoal}
              color={rm?.color || "#7b5ea7"} />

            {/* Study timer */}
            <StudyTimer color={rm?.color || "#7b5ea7"} isMobile={true} />

            {/* Roadmap cards — clean & simple */}
            <div style={{ fontSize: 11, color: "#444", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 12 }}>Your Roadmaps</div>
            {Object.values(roadmaps).map(val => {
              const s = getRoadmapStats(val, progress);
              return (
                <div key={val.id} onClick={() => goToRoadmap(val.id)}
                  style={{ background: "#16161b", borderRadius: 12, marginBottom: 10,
                    cursor: "pointer", overflow: "hidden",
                    border: `1px solid ${val.color}33` }}>
                  {/* Color accent bar */}
                  <div style={{ height: 3, background: val.color, width: `${s.pct}%`,
                    minWidth: s.pct > 0 ? 8 : 0, transition: "width 0.4s" }} />
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{val.label}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{s.done} of {s.total} topics</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: s.pct > 0 ? val.color : "#333" }}>
                        {s.pct}%
                      </span>
                      <span style={{ color: "#333", fontSize: 18 }}>›</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {Object.keys(roadmaps).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#444" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>No roadmaps yet</div>
                <button onClick={() => setShowManage(true)}
                  style={{ padding: "10px 20px", background: "#7b5ea7", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Create your first roadmap
                </button>
              </div>
            )}
          </div>
        )}

        {mobileScreen === "sections" && rm && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <div style={{ background: "#16161b", borderRadius: 10, padding: "13px 16px", marginBottom: 12,
              border: `1px solid ${rm.color}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Progress</span>
                  <span style={{ fontSize: 12, color: rm.accent }}>{stats.done} / {stats.total}</span>
                </div>
                <div style={{ background: "#0f0f13", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color, borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
              <button onClick={() => setEditorModal({ existing: rm })}
                style={{ marginLeft: 12, padding: "6px 12px", background: rm.color + "22",
                  border: `1px solid ${rm.color}44`, borderRadius: 6, color: rm.accent,
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setMobileScreen("nextup")}
                style={{ flex: 1, padding: "13px 16px", background: "#16161b", border: `1px solid ${rm.color}44`,
                  borderRadius: 10, color: rm.accent, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🎯 Next Up</span><span style={{ color: "#555", fontSize: 16 }}>›</span>
              </button>
              <button onClick={() => setProjectBoardRm(rmKey)}
                style={{ flex: 1, padding: "13px 16px", background: "#16161b", border: `1px solid ${rm.color}44`,
                  borderRadius: 10, color: rm.accent, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🔨 Projects</span>
                <span style={{ fontSize: 11, color: "#555" }}>{getProjectStats(rmKey).inprogress > 0 ? `${getProjectStats(rmKey).inprogress} active` : ""}</span>
              </button>
            </div>

            {sections.map(section => {
              const ts   = rm.sections[section];
              const flat = flatTopicNames(ts);
              const done = flat.filter(t => progress[`${rmKey}::${t}`]).length;
              return (
                <div key={section} onClick={() => { setActiveSection(section); setMobileScreen("topics"); }}
                  style={{ background: "#16161b", borderRadius: 10, padding: "13px 16px", marginBottom: 8,
                    border: `1px solid ${done === flat.length ? rm.color + "55" : "#1e1e24"}`, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, color: done === ts.length ? rm.accent : "#ccc", fontWeight: 500 }}>{section}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{done}/{flat.length} completed</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {done === flat.length && <span style={{ color: rm.accent }}>✓</span>}
                    <span style={{ color: "#444", fontSize: 20 }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mobileScreen === "topics" && rm && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#555" }}>
                {flatTopicNames(rm.sections[curSec] || []).filter(t => progress[`${rmKey}::${t}`]).length} of {flatTopicNames(rm.sections[curSec] || []).length} completed
              </span>
              <button onClick={() => toggleAll(rmKey, curSec)}
                style={{ fontSize: 12, padding: "5px 12px", background: "#1e1e24", border: "1px solid #2a2a35",
                  borderRadius: 5, color: "#777", cursor: "pointer", fontFamily: "inherit" }}>
                {flatTopicNames(rm.sections[curSec] || []).every(t => progress[`${rmKey}::${t}`]) ? "Uncheck all" : "Check all"}
              </button>
            </div>
            {renderTopicList(curSec)}
          </div>
        )}

        {mobileScreen === "nextup" && rm && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 14px" }}>Your next topics in order</p>
            {renderNextUpList()}
          </div>
        )}

        {activeQuestRmId && getQuest(activeQuestRmId) && (
          <QuestModal
            quest={getQuest(activeQuestRmId)} rmId={activeQuestRmId}
            roadmaps={roadmaps} progress={progress}
            onAdvancePhase={advancePhase}
            onCompleteQuest={(rmId, passed, allResults, activePhases) => {
              completeQuest(rmId, passed);
              if (!passed) return null;
              const prevXP  = xpData.xp || 0;
              const apiKey  = loadAIConfig().keys?.groq?.trim();
              return {
                prevXP,
                xpData,
                awardXP: () => awardQuestXP(getQuest(rmId) || {}, allResults, activePhases, true, apiKey),
              };
            }}
            onClose={() => setActiveQuestRmId(null)}
          />
        )}
        </div>{/* end content area */}

        {/* Bottom nav — 3 tabs */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#13131a",
          borderTop: "1px solid #1e1e24", display: "flex", zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* Learn tab */}
          {(() => {
            const active = ["roadmaps","sections","topics","nextup"].includes(mobileScreen);
            return (
              <button onClick={() => setMobileScreen("roadmaps")}
                style={{ flex: 1, padding: "12px 4px 14px", border: "none", background: "transparent",
                  color: active ? (rm?.color || "#7b5ea7") : "#444", cursor: "pointer", fontFamily: "inherit",
                  borderTop: active ? `2px solid ${rm?.color || "#7b5ea7"}` : "2px solid transparent" }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>📚</div>
                <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>Learn</div>
              </button>
            );
          })()}
          {/* Quests tab */}
          {(() => {
            const active = mobileScreen === "quests";
            const hasActive = Object.values(quests).some(q => q?.status === "active");
            return (
              <button onClick={() => setMobileScreen("quests")}
                style={{ flex: 1, padding: "12px 4px 14px", border: "none", background: "transparent",
                  color: active ? "#c4b5fd" : "#444", cursor: "pointer", fontFamily: "inherit",
                  borderTop: active ? "2px solid #7b5ea7" : "2px solid transparent",
                  position: "relative" }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>🎯</div>
                <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>Quests</div>
                {hasActive && !active && (
                  <div style={{ position: "absolute", top: 8, right: "calc(50% - 14px)",
                    width: 7, height: 7, borderRadius: "50%", background: "#7b5ea7" }} />
                )}
              </button>
            );
          })()}
          {/* Dashboard tab */}
          {(() => {
            const active = mobileScreen === "dashboard";
            return (
              <button onClick={() => setMobileScreen("dashboard")}
                style={{ flex: 1, padding: "12px 4px 14px", border: "none", background: "transparent",
                  color: active ? "#c4b5fd" : "#444", cursor: "pointer", fontFamily: "inherit",
                  borderTop: active ? "2px solid #7b5ea7" : "2px solid transparent" }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>📊</div>
                <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>Dashboard</div>
              </button>
            );
          })()}
        </div>

              <style>{globalStyle}</style>
      {searchOpen && (
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}
          roadmaps={roadmaps} notes={notes} resources={resources}
          onNavigate={handleSearchNavigate} isMobile={isMobile} />
      )}
      {projectBoardRm && roadmaps[projectBoardRm] && (
        <ProjectBoard
          rm={roadmaps[projectBoardRm]}
          projects={getProjects(projectBoardRm)}
          onSetStatus={setProjectStatus}
          onToggleMilestone={toggleMilestone}
          onDelete={deleteProject}
          onClose={() => setProjectBoardRm(null)}
        />
      )}
      <SagePanel open={sageOpen} onClose={() => setSageOpen(false)} appContext={sageAppContext} />
      {certificate && (
        <CompletionCertificate
          roadmap={certificate.rm}
          stats={certificate.stats}
          onClose={() => setCertificate(null)}
        />
      )}
      <InstallPrompt />
      {feedback    && <Toast feedback={feedback} isMobile={isMobile} />}
      {noteModal   && <NoteModal noteModal={noteModal} roadmaps={roadmaps} notes={notes}
                        resources={resources} topicMeta={topicMeta} onSave={saveNote} onClose={() => setNoteModal(null)} />}
      {showManage  && <ManageModal roadmaps={roadmaps} defaultTab={manageTab} onClose={() => { setShowManage(false); setManageTab("roadmaps"); }}
                        onImportRoadmap={handleImportRoadmap} onDelete={handleDeleteRoadmap}
                        onExportBackup={handleExport} onImportBackup={handleImportBackup}
                        onGetSnapshot={handleGetSnapshot} onApplySnapshot={handleApplySnapshot}
                        onEdit={r => { setEditorModal({ existing: r }); setShowManage(false); }}
                        onCreate={() => { setEditorModal({ existing: null }); setShowManage(false); }} />}
      {editorModal !== null && <RoadmapEditorModal existing={editorModal.existing}
                        onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />}
      <PracticePanel open={practiceOpen} onClose={() => setPracticeOpen(false)}
        onOpenSettings={() => { setManageTab("settings"); setShowManage(true); }}
        onSaveProjects={(rmId, projs) => { addProjects(rmId, projs); setPracticeOpen(false); setProjectBoardRm(rmId); }}
        roadmap={rm} roadmaps={roadmaps} progress={progress}
        notes={notes} resources={resources} topicMeta={topicMeta} curSection={curSec} isMobile={isMobile}
        onSaveToNotes={appendToNote} quizResults={quizResults}
        onQuizComplete={(rmId, topics, score, total, difficulty) => { recordQuizResult(rmId, topics, score, total, difficulty); recordActivity(); }} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100dvh", background: "#0f0f13", color: "#e8e6e0", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "22px 28px 0", borderBottom: "1px solid #1e1e24" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}>Learning Tracker</h1>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>roadmap.sh</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <StreakBadge streak={{ ...streak, studiedToday }} isMobile={false} />
            <button onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              style={{ padding: "7px 14px", border: "none", borderRadius: 7, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>🔍 Search</button>
            <button onClick={() => setShowManage(true)}
              style={{ padding: "7px 14px", border: "none", borderRadius: 7, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⚙️ Settings</button>
            <button onClick={() => setSageOpen(true)}
              title="Open Sage"
              style={{ padding: "7px 12px", border: "none", borderRadius: 7, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12,
                background: sageOpen ? "#76b90022" : "#1e1e24",
                color: sageOpen ? "#76b900" : "#888",
                borderWidth: 1, borderStyle: "solid",
                borderColor: sageOpen ? "#76b90044" : "transparent" }}>Sage</button>
            <button onClick={() => setView(v => v === "dashboard" ? "sections" : "dashboard")}
              style={{ padding: "7px 14px", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                background: view === "dashboard" ? "#1e1e2f" : "#1e1e24",
                color: view === "dashboard" ? "#c4b5fd" : "#888",
                borderWidth: 1, borderStyle: "solid",
                borderColor: view === "dashboard" ? "#7b5ea744" : "transparent" }}>📊 Dashboard</button>
            <button onClick={() => setPracticeOpen(o => !o)}
              style={{ padding: "7px 16px", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                background: practiceOpen ? "#7b5ea7" : "linear-gradient(135deg, #7b5ea7, #4361ee)",
                color: "#fff" }}>🤖 Practice</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportRoadmap} style={{ display: "none" }} />
          </div>
        </div>

        {view !== "dashboard" && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.values(roadmaps).map(val => {
              const s      = getRoadmapStats(val, progress);
              const active = val.id === rmKey;
              return (
                <button key={val.id} onClick={() => { setActiveRoadmap(val.id); setActiveSection(null); setView("sections"); }}
                  style={{ padding: "8px 16px", border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 400,
                    background: active ? val.color : "#1a1a1f", color: active ? "#fff" : "#888", position: "relative", top: 1 }}>
                  {val.label} <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 4 }}>{s.pct}%</span>
                  {s.pct === 100 && <span style={{ marginLeft: 4 }}>🎓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {view === "dashboard" && (
        <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
          topicMeta={topicMeta} isMobile={false} quizResults={quizResults}
          onOpenRoadmap={(key) => { setActiveRoadmap(key); setView("sections"); setActiveSection(null); }}
          onOpenNote={(modal) => setNoteModal(modal)}
          clippings={clippings} onAddClipping={addClipping} onUpdateClipping={updateClipping} onDeleteClipping={deleteClipping} />
      )}

      {view !== "dashboard" && rm && (
        <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
          {/* Sidebar */}
          <div style={{ width: 200, borderRight: "1px solid #1e1e24", overflowY: "auto", padding: "14px 0", flexShrink: 0 }}>
            <div style={{ padding: "0 14px 12px", borderBottom: "1px solid #1e1e24" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Progress</div>
              <div style={{ background: "#1e1e24", borderRadius: 4, height: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 12, color: rm.accent, marginTop: 4 }}>{stats.done} / {stats.total}</div>
              {stats.pct === 100 && (
                <button onClick={() => setCertificate({ rm, stats })}
                  style={{ width: "100%", marginTop: 8, padding: "6px", background: rm.color + "22",
                    border: `1px solid ${rm.color}44`, borderRadius: 6, color: rm.accent,
                    fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                  🎓 View Certificate
                </button>
              )}
            </div>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e1e24", display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => setView(v => v === "nextup" ? "sections" : "nextup")}
                style={{ width: "100%", padding: "6px 10px", background: view === "nextup" ? rm.color : "#1e1e24",
                  border: "none", borderRadius: 5, color: view === "nextup" ? "#fff" : rm.accent,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>🎯 Next Up</button>
              <button onClick={() => setEditorModal({ existing: rm })}
                style={{ width: "100%", padding: "6px 10px", background: "#1e1e24", border: "none",
                  borderRadius: 5, color: "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>✏️ Edit roadmap</button>
            </div>
            {sections.map(section => {
              const ts     = rm.sections[section];
              const flat   = flatTopicNames(ts);
              const done   = flat.filter(t => progress[`${rmKey}::${t}`]).length;
              const active = curSec === section && view === "sections";
              return (
                <button key={section} onClick={() => { setActiveSection(section); setView("sections"); }}
                  style={{ width: "100%", padding: "8px 14px", background: active ? "#1e1e24" : "transparent",
                    border: "none", borderLeft: active ? `3px solid ${rm.color}` : "3px solid transparent",
                    cursor: "pointer", textAlign: "left", color: done === ts.length ? rm.accent : "#999",
                    fontSize: 12, fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: active ? 600 : 400 }}>{section}</span>
                  <span style={{ fontSize: 10, color: "#555" }}>{done}/{ts.length}</span>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
            {/* Daily goal + timer row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <DailyGoalWidget goal={goal} todayCount={todayCount} pct={goalPct}
                goalMet={goalMet} goalStreak={goalStreak} onSetGoal={setGoal}
                color={rm?.color || "#7b5ea7"} />
              <StudyTimer color={rm?.color || "#7b5ea7"} isMobile={false} />
            </div>
            {/* Collapsible Quest Board */}
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setQuestBoardOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: "6px 0", fontFamily: "inherit" }}>
                <span style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
                  🎯 Quest Board
                </span>
                <div style={{ flex: 1, height: 1, background: "#1e1e24", marginLeft: 8 }} />
                {Object.values(quests).some(q => q?.status === "active") && (
                  <span style={{ fontSize: 10, background: "#7b5ea722", color: "#c4b5fd",
                    border: "1px solid #7b5ea744", borderRadius: 4, padding: "1px 6px" }}>
                    {Object.values(quests).filter(q => q?.status === "active").length} active
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#444", marginLeft: 6 }}>
                  {questBoardOpen ? "▲" : "▼"}
                </span>
              </button>
              {questBoardOpen && (
                <div style={{ marginTop: 12 }}>
                  <QuestBoard
                    roadmaps={roadmaps} quests={quests}
                    loadingRmIds={loadingQuestRmIds}
                    isOnCooldown={isOnCooldown} cooldownRemaining={cooldownRemaining}
                    isMobile={false}
                    onBegin={(rmId) => setActiveQuestRmId(rmId)}
                    onGenerate={generateQuest}
                  />
                </div>
              )}
            </div>
            {view === "nextup" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#fff" }}>🎯 Next Up</h2>
                <p style={{ color: "#555", fontSize: 12, margin: "0 0 18px" }}>Your next topics in order</p>
                {renderNextUpList()}
              </>
            )}
            {view === "sections" && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 3px", fontSize: 16, color: "#fff" }}>{curSec}</h2>
                    <span style={{ fontSize: 12, color: "#555" }}>
                      {rm.sections[curSec]?.filter(t => progress[`${rmKey}::${t}`]).length} of {rm.sections[curSec]?.length} completed
                    </span>
                  </div>
                  <button onClick={() => toggleAll(rmKey, curSec)}
                    style={{ fontSize: 11, padding: "4px 10px", background: "#1e1e24", border: "1px solid #2a2a35",
                      borderRadius: 5, color: "#777", cursor: "pointer", fontFamily: "inherit" }}>
                    {rm.sections[curSec]?.every(t => progress[`${rmKey}::${t}`]) ? "Uncheck all" : "Check all"}
                  </button>
                </div>
                {renderTopicList(curSec)}
              </>
            )}
          </div>
        </div>
      )}

            <style>{globalStyle}</style>
      {searchOpen && (
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}
          roadmaps={roadmaps} notes={notes} resources={resources}
          onNavigate={handleSearchNavigate} isMobile={isMobile} />
      )}
      {projectBoardRm && roadmaps[projectBoardRm] && (
        <ProjectBoard
          rm={roadmaps[projectBoardRm]}
          projects={getProjects(projectBoardRm)}
          onSetStatus={setProjectStatus}
          onToggleMilestone={toggleMilestone}
          onDelete={deleteProject}
          onClose={() => setProjectBoardRm(null)}
        />
      )}
      <SagePanel open={sageOpen} onClose={() => setSageOpen(false)} appContext={sageAppContext} />
      {certificate && (
        <CompletionCertificate
          roadmap={certificate.rm}
          stats={certificate.stats}
          onClose={() => setCertificate(null)}
        />
      )}
      <InstallPrompt />
      {feedback    && <Toast feedback={feedback} isMobile={isMobile} />}
      {noteModal   && <NoteModal noteModal={noteModal} roadmaps={roadmaps} notes={notes}
                        resources={resources} topicMeta={topicMeta} onSave={saveNote} onClose={() => setNoteModal(null)} />}
      {showManage  && <ManageModal roadmaps={roadmaps} defaultTab={manageTab} onClose={() => { setShowManage(false); setManageTab("roadmaps"); }}
                        onImportRoadmap={handleImportRoadmap} onDelete={handleDeleteRoadmap}
                        onExportBackup={handleExport} onImportBackup={handleImportBackup}
                        onGetSnapshot={handleGetSnapshot} onApplySnapshot={handleApplySnapshot}
                        onEdit={r => { setEditorModal({ existing: r }); setShowManage(false); }}
                        onCreate={() => { setEditorModal({ existing: null }); setShowManage(false); }} />}
      {editorModal !== null && <RoadmapEditorModal existing={editorModal.existing}
                        onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />}
      <PracticePanel open={practiceOpen} onClose={() => setPracticeOpen(false)}
        onOpenSettings={() => { setManageTab("settings"); setShowManage(true); }}
        onSaveProjects={(rmId, projs) => { addProjects(rmId, projs); setPracticeOpen(false); setProjectBoardRm(rmId); }}
        roadmap={rm} roadmaps={roadmaps} progress={progress}
        notes={notes} resources={resources} topicMeta={topicMeta} curSection={curSec} isMobile={isMobile}
        onSaveToNotes={appendToNote} quizResults={quizResults}
        onQuizComplete={(rmId, topics, score, total, difficulty) => { recordQuizResult(rmId, topics, score, total, difficulty); recordActivity(); }} />
      {activeQuestRmId && getQuest(activeQuestRmId) && (
        <QuestModal
          quest={getQuest(activeQuestRmId)} rmId={activeQuestRmId}
          roadmaps={roadmaps} progress={progress}
          onAdvancePhase={advancePhase}
          onCompleteQuest={completeQuest}
          onClose={() => setActiveQuestRmId(null)}
        />
      )}
      {import.meta.env.DEV && (
        <AITimeoutTester />
      )}
    </div>
  );
}

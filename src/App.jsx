import React, { useState, useRef, useEffect } from "react";
import { useAuth }              from "./hooks/useAuth.js";
import { AuthModal }            from "./components/auth/AuthModal.jsx";
import { useAppStorage }         from "./storage/hooks.js";
import { useIsMobile }           from "./hooks/useIsMobile.js";
import { validateRoadmap, downloadJSON, getRoadmapStats, getNextUp } from "./utils/roadmap.js";
import { flatTopicNames, topicName, isExpanded } from "./utils/topics.js";
import { safeParseJSON }         from "./utils/jsonParse.js";
import { Toast }                 from "./components/ui/Toast.jsx";
import { TopicCard }             from "./components/ui/TopicCard.jsx";
import { NoteModal }             from "./components/modals/NoteModal.jsx";
import { ManageModal }           from "./components/modals/ManageModal.jsx";
import { RoadmapEditorModal }    from "./components/modals/RoadmapEditorModal.jsx";
import { Dashboard }             from "./components/screens/Dashboard.jsx";
import { PracticePanel }         from "./components/practice/PracticePanel.jsx";
import { SearchOverlay }         from "./components/ui/SearchOverlay.jsx";
import { StreakBadge }           from "./components/ui/StreakBadge.jsx";
import { InstallPrompt }        from "./components/ui/InstallPrompt.jsx";
import { useStreak }            from "./hooks/useStreak.js";
import { useQuizResults }       from "./hooks/useQuizResults.js";
import { useQuest }             from "./hooks/useQuest.js";
import { useXP }                from "./hooks/useXP.js";
import { OnboardingFlow }       from "./components/screens/OnboardingFlow.jsx";
import { DailyGoalWidget }      from "./components/ui/DailyGoal.jsx";
import { StudyTimer }           from "./components/ui/StudyTimer.jsx";
import { CompletionCertificate }from "./components/ui/CompletionCertificate.jsx";
import { useDailyGoal }         from "./hooks/useDailyGoal.js";
import { useSpacedRepetition }  from "./hooks/useSpacedRepetition.js";
import { useProjects }          from "./hooks/useProjects.js";
import { useClippings }         from "./hooks/useClippings.js";
import { ProjectBoard }         from "./components/screens/ProjectBoard.jsx";
import { LogbookScreen }        from "./components/screens/LogbookScreen.jsx";
import { useLogbook }           from "./hooks/useLogbook.js";
import { QuestBoard }           from "./components/quest/QuestCard.jsx";
import { QuestModal }           from "./components/quest/QuestModal.jsx";
import { buildQuestPrompt }     from "./ai/prompts.js";
import { callAI, loadAIConfig } from "./ai/providers.js";
import { color as themeColor, radius, font } from "./styles/theme.js";

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, resetPassword } = useAuth();
  const userId = user?.id;
  const {
    roadmaps, setRoadmaps, progress, setProgress, notes, setNotes,
    resources, setResources, topicMeta, setTopicMeta, loaded,
    hasLoadError, hasSaveError
  } = useAppStorage(userId);
  const isMobile = useIsMobile();
  const isGuest = false;

  // ── Navigation & View Modes ──────────────────────────────────────────────
  const [activeRoadmap,  setActiveRoadmap]  = useState(null);
  const [activeSection,  setActiveSection]  = useState(null);
  // Views: "curriculum" | "practice" | "logbook" | "dashboard" | "nextup"
  const [view,           setView]           = useState("curriculum");
  const [mobileScreen,   setMobileScreen]   = useState("sections"); // "sections" | "topics" | "practice" | "logbook" | "dashboard" | "nextup"

  // Dropdown states
  const [rmDropdownOpen, setRmDropdownOpen] = useState(false);
  const [focusTrayOpen,  setFocusTrayOpen]  = useState(false);

  // Modals & Panels
  const [noteModal,       setNoteModal]       = useState(null);
  const [showManage,      setShowManage]      = useState(false);
  const [manageTab,       setManageTab]       = useState("roadmaps");
  const [editorModal,     setEditorModal]     = useState(null);
  const [feedback,        setFeedback]        = useState(null);
  const [practiceOpen,    setPracticeOpen]    = useState(false);
  const [activeQuestRmId, setActiveQuestRmId] = useState(null);
  const [loadingQuestRmIds, setLoadingQuestRmIds] = useState([]);
  const [questBoardOpen,  setQuestBoardOpen]  = useState(false);
  const [certificate,     setCertificate]     = useState(null);
  const [projectBoardRm,  setProjectBoardRm]  = useState(null);
  const [searchOpen,      setSearchOpen]      = useState(false);

  // Hooks & Stores
  const { streak, recordActivity, studiedToday } = useStreak(userId);
  const { results: quizResults, recordQuizResult, hasPassedTopic, getStars, replaceResults } = useQuizResults(userId);
  const { quests, loaded: questLoaded, startQuest, advancePhase, completeQuest,
          isOnCooldown, cooldownRemaining, needsNewQuest, getQuest, replaceQuests } = useQuest(userId);
  const { xpData, awardQuestXP, replaceXpData } = useXP(userId);
  const { goal, todayCount, pct: goalPct, goalMet, goalStreak, setGoal, recordTopicDone } = useDailyGoal(userId);
  const { _getDueTopics, _recordReview, _getTopicLevel, _getNextReview } = useSpacedRepetition(userId);
  const { projects, addProjects, toggleMilestone, setStatus: setProjectStatus, deleteProject, getProjects, getStats: getProjectStats, replaceProjects } = useProjects(userId);
  const { clippings, addClipping, updateClipping, deleteClipping, replaceClippings } = useClippings(userId);

  const logbookMasterTopic = (roadmapId, topic) => {
    setProgress(prev => ({ ...prev, [`${roadmapId}::${topic}`]: true }));
  };

  const {
    entries: logbookEntries, addEntry: addLogEntry, updateEntry: updateLogEntry,
    deleteEntry: deleteLogEntry, cycleStatus: cycleLogStatus, getStats: getLogStats,
    emptyEntry: emptyLogEntry, replaceEntries: replaceLogbookEntries
  } = useLogbook(userId, logbookMasterTopic);

  const importRef = useRef(null);
  const dropdownRef = useRef(null);

  const showFeedback = (ok, msg) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRmDropdownOpen(false);
      }
    };
    if (rmDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [rmDropdownOpen]);

  // Derived Roadmap & Section data
  const rmKeys   = Object.keys(roadmaps);
  const rmKey    = activeRoadmap && roadmaps[activeRoadmap] ? activeRoadmap : rmKeys[0] || null;
  const rm       = rmKey ? roadmaps[rmKey] : null;
  const sections = rm ? Object.keys(rm.sections || {}) : [];
  const curSec   = activeSection && rm?.sections[activeSection] ? activeSection : sections[0] || null;
  const stats    = rm ? getRoadmapStats(rm, progress) : { total: 0, done: 0, pct: 0 };
  const nextUp   = rm ? getNextUp(rm, progress) : [];

  // Actions
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

  const appendToNote = (rmKey, topic, text) => {
    setNotes(n => {
      const existing = n[`${rmKey}::${topic}`] || "";
      const separator = existing.trim() ? "\n\n---\n\n" : "";
      return { ...n, [`${rmKey}::${topic}`]: existing + separator + text };
    });
    showFeedback(true, `Explanation saved to "${topic}" notes`);
  };

  useEffect(() => {
    if (hasSaveError) {
      showFeedback(false, "Couldn't save to server — retrying. Local changes are preserved.");
    }
  }, [hasSaveError]);

  // Global Cmd+K / Ctrl+K
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

  const handleSearchNavigate = (item) => {
    setActiveRoadmap(item.rmKey);
    setActiveSection(item.section);
    if (isMobile) {
      setMobileScreen("topics");
    } else {
      setView("curriculum");
    }
  };

  const toggleAll = (key, sectionKey) => {
    const ts    = roadmaps[key]?.sections[sectionKey] || [];
    const flat  = flatTopicNames(ts);
    const allDone = flat.every(t => progress[`${key}::${t}`]);
    setProgress(prev => {
      const next = { ...prev };
      flat.forEach(t => { next[`${key}::${t}`] = !allDone; });
      return next;
    });
  };

  const handleToggleCollapse = (sectionKey, parentName, subName) => {
    setRoadmaps(prev => {
      const currentRm = prev[rmKey];
      if (!currentRm) return prev;
      const section = currentRm.sections[sectionKey];
      if (!section) return prev;

      let newSection;
      if (!subName) {
        newSection = section.map(t =>
          topicName(t) === parentName && isExpanded(t)
            ? { ...t, collapsed: t.collapsed === false ? true : false }
            : t
        );
      } else {
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
      return { ...prev, [rmKey]: { ...currentRm, sections: { ...currentRm.sections, [sectionKey]: newSection } } };
    });
  };

  const handleSaveRoadmap = (saved) => {
    setRoadmaps(prev => ({ ...prev, [saved.id]: saved }));
    setActiveRoadmap(saved.id);
    setActiveSection(null);
    if (isMobile) setMobileScreen("sections"); else setView("curriculum");
    setEditorModal(null);
    showFeedback(true, `"${saved.label}" saved!`);
  };

  const handleDeleteRoadmap = (id) => {
    if (rmKeys.length === 1) { showFeedback(false, "Can't delete the only roadmap."); return; }
    setRoadmaps(prev => { const c = {...prev}; delete c[id]; return c; });
    showFeedback(true, "Roadmap deleted.");
  };

  // Import / Export
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
        const newRm = { id: data.id, label: data.label, color: data.color || "#d9a441", accent: data.accent || "#f0c265", sections: data.sections };
        setRoadmaps(prev => ({ ...prev, [newRm.id]: newRm }));
        setActiveRoadmap(newRm.id);
        if (isMobile) setMobileScreen("sections"); else setView("curriculum");
        showFeedback(true, `"${newRm.label}" imported!`);
      } catch { showFeedback(false, "Invalid roadmap format."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportBackupData = (data) => {
    if (data.roadmaps)  setRoadmaps(prev  => ({ ...prev,  ...data.roadmaps }));
    if (data.progress)  setProgress(prev  => ({ ...prev,  ...data.progress }));
    if (data.notes)     setNotes(prev     => ({ ...prev,  ...data.notes }));
    if (data.resources) setResources(prev => ({ ...prev,  ...data.resources }));
    if (data.topicMeta) setTopicMeta(prev => ({ ...prev,  ...data.topicMeta }));
    if (data.clippings && Array.isArray(data.clippings)) replaceClippings(data.clippings);
    if (data.projects && typeof data.projects === "object") replaceProjects(data.projects);
    if (data.quests && typeof data.quests === "object") replaceQuests(data.quests);
    if (data.xpData && typeof data.xpData === "object") replaceXpData(data.xpData);
    if (data.logbook && Array.isArray(data.logbook)) replaceLogbookEntries(data.logbook);
    if (data.quizResults && typeof data.quizResults === "object") replaceResults(data.quizResults);

    const firstKey = data.roadmaps ? Object.keys(data.roadmaps)[0] : null;
    if (firstKey) { setActiveRoadmap(firstKey); if (isMobile) setMobileScreen("sections"); }
    showFeedback(true, "Backup restored successfully!");
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

  const handleExport = async () => {
    downloadJSON(
      {
        version: 3,
        exportedAt: new Date().toISOString(),
        roadmaps, progress, notes, resources, topicMeta,
        clippings, projects, quests, xpData,
        logbook: logbookEntries,
        quizResults,
      },
      `learning-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
    );
  };

  const generateQuest = async (rmId) => {
    const roadmap = roadmaps[rmId];
    if (!roadmap) return;
    setLoadingQuestRmIds(prev => [...prev, rmId]);
    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) return;
      const prompt = buildQuestPrompt({ roadmap, quizResults, progress });
      if (!prompt) return;
      const { text } = await callAI({
        provider: cfg.provider, apiKey,
        systemPrompt: "You are a study mentor. Assign a quest. Respond ONLY with valid JSON.",
        userPrompt: prompt, maxTokens: 1024
      });
      const data = safeParseJSON(text);
      startQuest({ ...data, roadmapId: rmId });
    } catch(e) { console.error("Quest generation failed:", e); }
    finally { setLoadingQuestRmIds(prev => prev.filter(id => id !== rmId)); }
  };

  useEffect(() => {
    if (!loaded || !questLoaded || !Object.keys(roadmaps).length) return;
    Object.keys(roadmaps).forEach(rmId => {
      if (needsNewQuest(rmId) && !loadingQuestRmIds.includes(rmId)) {
        generateQuest(rmId);
      }
    });
  }, [loaded, questLoaded]);

  // Auth gate
  if (authLoading) return (
    <div style={{ minHeight: "100dvh", background: "#0d0d11", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 28, color: "#d9a441" }}>🌿</div>
    </div>
  );

  if (!user) return (
    <AuthModal
      onSignIn={signIn}
      onSignUp={signUp}
      onResetPassword={resetPassword}
      loading={authLoading}
    />
  );

  if (!loaded) return (
    <div style={{
      minHeight: "100vh", background: "#0d0d11", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", color: "#8c8577", fontFamily: font.display, gap: 12, padding: 24, textAlign: "center"
    }}>
      <div style={{ fontSize: 18, color: "#e9e4d9" }}>Loading curriculum…</div>
      {hasLoadError && (
        <div style={{ maxWidth: 360, fontSize: 13, color: "#d9a441", fontFamily: font.body }}>
          Reconnecting to the cloud storage service. Your local progress is intact.
        </div>
      )}
    </div>
  );

  // Onboarding
  if (rmKeys.length === 0) return (
    <>
      <OnboardingFlow
        onComplete={() => {}}
        onCreate={(tmpl) => {
          if (tmpl) handleSaveRoadmap({ ...tmpl, id: tmpl.id || tmpl.label.toLowerCase().replace(/\s+/g,"-") });
        }}
      />
      {feedback && <Toast feedback={feedback} isMobile={isMobile} />}
    </>
  );

  // Render Topic List
  const renderTopicList = (sectionKey) => {
    const topicList = rm?.sections[sectionKey] || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {topicList.map(topic => (
          <TopicCard key={topicName(topic)} topic={topic} rmKey={rmKey} rm={rm}
            progress={progress} notes={notes} resources={resources} topicMeta={topicMeta}
            hasPassedQuiz={hasPassedTopic} getStars={getStars} onToggle={toggle} onOpenNote={openNote}
            onToggleCollapse={(parentName, subName) => handleToggleCollapse(sectionKey, parentName, subName)} />
        ))}
      </div>
    );
  };

  // Render Next-Up List
  const renderNextUpList = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {nextUp.length === 0 ? (
        <div style={{ color: rm?.accent || "#d9a441", fontSize: 15, padding: "24px 0", textAlign: "center" }}>
          🎉 Roadmap complete! You've mastered all current topics.
        </div>
      ) : (
        nextUp.map(({ section, topic }, i) => (
          <div key={topic} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            background: "#16151a", borderRadius: radius.sm, border: "1px solid #222027"
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: (rm.color || "#d9a441") + "20",
              color: rm.accent || "#d9a441", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: "#e9e4d9", fontWeight: 500 }}>{topic}</div>
              <div style={{ fontSize: 11.5, color: "#787268", marginTop: 2 }}>{section}</div>
            </div>
            <button onClick={() => openNote(rmKey, topic)}
              title="Notes"
              style={{
                padding: "5px 9px", background: "transparent", border: "1px solid #282630",
                borderRadius: 4, color: "#8c8577", fontSize: 12, cursor: "pointer"
              }}>
              ✏️
            </button>
            <div onClick={() => toggle(rmKey, topic)}
              style={{
                width: 20, height: 20, borderRadius: 4, border: `2px solid ${rm.color || "#d9a441"}`,
                background: progress[`${rmKey}::${topic}`] ? (rm.color || "#d9a441") : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0
              }}>
              {progress[`${rmKey}::${topic}`] && <span style={{ color: "#000", fontWeight: 800, fontSize: 11 }}>✓</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const screenTitle = {
      sections: rm?.label || "Curriculum",
      topics: curSec || "Topics",
      nextup: "Next Up",
      practice: "Practice Studio",
      logbook: "Logbook",
      dashboard: "Analytics"
    };

    return (
      <div style={{
        fontFamily: font.body, minHeight: "100dvh", background: "#0d0d11",
        color: "#e9e4d9", display: "flex", flexDirection: "column"
      }}>
        {/* Mobile Header */}
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #201e26",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "fixed", top: 0, left: 0, right: 0, background: "#0d0d11", zIndex: 50,
          paddingTop: "calc(12px + env(safe-area-inset-top))"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {["topics", "nextup"].includes(mobileScreen) && (
              <button onClick={() => setMobileScreen("sections")}
                style={{
                  background: "transparent", border: "none", color: "#8c8577",
                  fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1
                }}>‹</button>
            )}
            <h1 style={{
              margin: 0, fontSize: 16, fontWeight: 600, color: "#e9e4d9",
              fontFamily: font.display, lineHeight: 1.2
            }}>
              {screenTitle[mobileScreen]}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StreakBadge streak={{ ...streak, studiedToday }} isMobile={true} />
            <button onClick={() => setSearchOpen(true)}
              style={{
                width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: radius.sm, cursor: "pointer", background: "#17161c",
                color: "#8c8577", fontSize: 14
              }}>🔍</button>
            <button onClick={() => setShowManage(true)}
              style={{
                width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: radius.sm, cursor: "pointer", background: "#17161c",
                color: "#8c8577", fontSize: 14
              }}>⚙️</button>
          </div>
        </div>

        {/* Content area */}
        <div style={{
          paddingTop: "calc(56px + env(safe-area-inset-top))",
          paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
          minHeight: "100dvh", boxSizing: "border-box"
        }}>

          {mobileScreen === "sections" && rm && (
            <div style={{ padding: "16px" }}>
              {/* Roadmap switcher card */}
              <div style={{
                background: "#16151a", borderRadius: radius.md, padding: "14px 16px",
                border: `1px solid ${rm.color || "#d9a441"}33`, marginBottom: 14
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e9e4d9" }}>{rm.label}</span>
                  <span style={{ fontSize: 12, color: rm.accent || "#d9a441" }}>{stats.done} / {stats.total} · {stats.pct}%</span>
                </div>
                <div style={{ background: "#0d0c11", borderRadius: 4, height: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color || "#d9a441", borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button onClick={() => setMobileScreen("nextup")}
                  style={{
                    flex: 1, padding: "11px 14px", background: "#16151a", border: "1px solid #222027",
                    borderRadius: radius.sm, color: "#e9e4d9", fontSize: 13, cursor: "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                  <span>🎯 Next Up</span>
                  <span style={{ color: "#787268", fontSize: 12 }}>{nextUp.length} remaining</span>
                </button>
                <button onClick={() => setProjectBoardRm(rmKey)}
                  style={{
                    flex: 1, padding: "11px 14px", background: "#16151a", border: "1px solid #222027",
                    borderRadius: radius.sm, color: "#e9e4d9", fontSize: 13, cursor: "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                  <span>🔨 Projects</span>
                  <span style={{ color: "#787268", fontSize: 12 }}>{getProjectStats(rmKey).inprogress} active</span>
                </button>
              </div>

              {/* Sections list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sections.map(section => {
                  const ts   = rm.sections[section] || [];
                  const flat = flatTopicNames(ts);
                  const done = flat.filter(t => progress[`${rmKey}::${t}`]).length;
                  const isSectionDone = done === flat.length && flat.length > 0;
                  return (
                    <div key={section} onClick={() => { setActiveSection(section); setMobileScreen("topics"); }}
                      style={{
                        background: "#16151a", borderRadius: radius.sm, padding: "13px 16px",
                        border: `1px solid ${isSectionDone ? (rm.color || "#d9a441") + "44" : "#222027"}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between"
                      }}>
                      <div>
                        <div style={{ fontSize: 13.5, color: isSectionDone ? (rm.accent || "#d9a441") : "#e9e4d9", fontWeight: 500 }}>
                          {section}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#787268", marginTop: 2 }}>
                          {done}/{flat.length} topics completed
                        </div>
                      </div>
                      <span style={{ color: "#666", fontSize: 18 }}>›</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mobileScreen === "topics" && rm && (
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#787268" }}>
                  {flatTopicNames(rm.sections[curSec] || []).filter(t => progress[`${rmKey}::${t}`]).length} of {flatTopicNames(rm.sections[curSec] || []).length} completed
                </span>
                <button onClick={() => toggleAll(rmKey, curSec)}
                  style={{
                    fontSize: 12, padding: "5px 12px", background: "#17161c", border: "1px solid #282630",
                    borderRadius: radius.sm, color: "#8c8577", cursor: "pointer"
                  }}>
                  {flatTopicNames(rm.sections[curSec] || []).every(t => progress[`${rmKey}::${t}`]) ? "Uncheck all" : "Check all"}
                </button>
              </div>
              {renderTopicList(curSec)}
            </div>
          )}

          {mobileScreen === "nextup" && rm && (
            <div style={{ padding: "16px" }}>
              <p style={{ color: "#787268", fontSize: 13, margin: "0 0 14px" }}>Recommended study sequence</p>
              {renderNextUpList()}
            </div>
          )}

          {mobileScreen === "practice" && (
            <div style={{ padding: "16px" }}>
              <button onClick={() => setPracticeOpen(true)}
                style={{
                  width: "100%", padding: "14px", background: themeColor.accent, color: themeColor.onAccent,
                  borderRadius: radius.sm, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  marginBottom: 16
                }}>
                Launch Practice Studio
              </button>
              <DailyGoalWidget goal={goal} todayCount={todayCount} pct={goalPct}
                goalMet={goalMet} goalStreak={goalStreak} onSetGoal={setGoal}
                color={rm?.color || themeColor.accent} />
              <div style={{ marginTop: 12 }}>
                <StudyTimer color={rm?.color || themeColor.accent} _isMobile={true} />
              </div>
            </div>
          )}

          {mobileScreen === "logbook" && (
            <div style={{ height: "calc(100dvh - 120px)" }}>
              <LogbookScreen
                entries={logbookEntries} roadmaps={roadmaps}
                onAdd={addLogEntry} onUpdate={updateLogEntry} onDelete={deleteLogEntry}
                onCycleStatus={cycleLogStatus} getStats={getLogStats} emptyEntry={emptyLogEntry}
              />
            </div>
          )}

          {mobileScreen === "dashboard" && (
            <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
              topicMeta={topicMeta} isMobile={true} onOpenRoadmap={(key) => { setActiveRoadmap(key); setMobileScreen("sections"); }}
              quizResults={quizResults} onOpenNote={(modal) => setNoteModal(modal)}
              clippings={clippings} onAddClipping={addClipping} onUpdateClipping={updateClipping} onDeleteClipping={deleteClipping} />
          )}

        </div>

        {/* Mobile Bottom Navigation */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: "#111014",
          borderTop: "1px solid #201e26", display: "flex", zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom)"
        }}>
          {[
            { id: "sections", label: "Curriculum", icon: "📚" },
            { id: "practice", label: "Practice",   icon: "🤖" },
            { id: "logbook",  label: "Logbook",    icon: "📓" },
            { id: "dashboard",label: "Analytics",  icon: "📊" },
          ].map(tab => {
            const isActive = tab.id === "sections"
              ? ["sections", "topics", "nextup"].includes(mobileScreen)
              : mobileScreen === tab.id;
            return (
              <button key={tab.id} onClick={() => setMobileScreen(tab.id)}
                style={{
                  flex: 1, padding: "10px 4px 12px", border: "none", background: "transparent",
                  color: isActive ? themeColor.accent : "#6e685f", cursor: "pointer", fontFamily: font.body,
                  borderTop: isActive ? `2px solid ${themeColor.accent}` : "2px solid transparent"
                }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{tab.icon}</div>
                <div style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 400 }}>{tab.label}</div>
              </button>
            );
          })}
        </div>

        {/* Shared Modals */}
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}
          roadmaps={roadmaps} notes={notes} resources={resources}
          onNavigate={handleSearchNavigate} isMobile={isMobile} />
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
        {certificate && (
          <CompletionCertificate roadmap={certificate.rm} stats={certificate.stats} onClose={() => setCertificate(null)} />
        )}
        <InstallPrompt />
        {feedback && <Toast feedback={feedback} isMobile={isMobile} />}
        {noteModal && (
          <NoteModal noteModal={noteModal} roadmaps={roadmaps} notes={notes}
            resources={resources} topicMeta={topicMeta} onSave={saveNote} onClose={() => setNoteModal(null)} />
        )}
        {showManage && (
          <ManageModal roadmaps={roadmaps} defaultTab={manageTab} onClose={() => { setShowManage(false); setManageTab("roadmaps"); }}
            onImportRoadmap={handleImportRoadmap} onDelete={handleDeleteRoadmap}
            onExportBackup={handleExport} onImportBackup={handleImportBackup}
            onEdit={r => { setEditorModal({ existing: r }); setShowManage(false); }}
            onCreate={() => { setEditorModal({ existing: null }); setShowManage(false); }}
            user={user} onSignOut={signOut} onResetPassword={resetPassword} isGuest={isGuest} />
        )}
        {editorModal !== null && (
          <RoadmapEditorModal existing={editorModal.existing} onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />
        )}
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
  // DESKTOP VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      fontFamily: font.body, minHeight: "100vh", background: "#0d0d11",
      color: "#e9e4d9", display: "flex", flexDirection: "column"
    }}>
      {/* Top Application Bar */}
      <header style={{
        padding: "12px 24px", borderBottom: "1px solid #201e26",
        background: "#111014", display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, zIndex: 40
      }}>
        {/* Brand & Roadmap Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: themeColor.accent }}>🌿</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", letterSpacing: "-0.2px" }}>
              Learning Tracker
            </span>
          </div>

          {/* Clean Roadmap Dropdown Selector */}
          {rm && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setRmDropdownOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                  background: "#18171d", border: "1px solid #26242c", borderRadius: radius.sm,
                  color: "#e9e4d9", fontSize: 13, cursor: "pointer", fontFamily: font.body
                }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: rm.color || themeColor.accent }} />
                <span style={{ fontWeight: 600 }}>{rm.label}</span>
                <span style={{ fontSize: 11, color: "#787268" }}>{stats.pct}%</span>
                <span style={{ fontSize: 10, color: "#666", marginLeft: 2 }}>▾</span>
              </button>

              {rmDropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, width: 260,
                  background: "#17161c", border: "1px solid #282630", borderRadius: radius.sm,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)", zIndex: 100, overflow: "hidden",
                  padding: 4
                }}>
                  <div style={{ fontSize: 11, color: "#6e685f", padding: "6px 10px", fontWeight: 600 }}>Switch Roadmap</div>
                  {Object.values(roadmaps).map(r => {
                    const rStats = getRoadmapStats(r, progress);
                    const isCurrent = r.id === rmKey;
                    return (
                      <button key={r.id}
                        onClick={() => { setActiveRoadmap(r.id); setActiveSection(null); setRmDropdownOpen(false); }}
                        style={{
                          width: "100%", padding: "8px 10px", display: "flex", alignItems: "center",
                          justifyContent: "space-between", background: isCurrent ? "#201e26" : "transparent",
                          border: "none", borderRadius: 4, cursor: "pointer", textAlign: "left",
                          color: isCurrent ? "#fff" : "#948d80", fontSize: 12.5, fontFamily: font.body
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.color || themeColor.accent }} />
                          <span style={{ fontWeight: isCurrent ? 600 : 400 }}>{r.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#6e685f" }}>{rStats.pct}%</span>
                      </button>
                    );
                  })}
                  <div style={{ borderTop: "1px solid #222027", marginTop: 4, paddingTop: 4 }}>
                    <button
                      onClick={() => { setShowManage(true); setManageTab("roadmaps"); setRmDropdownOpen(false); }}
                      style={{
                        width: "100%", padding: "6px 10px", background: "transparent", border: "none",
                        color: themeColor.accent, fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: font.body
                      }}>
                      + Manage / Add Roadmap
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Clean Segmented View Controller */}
        <div style={{
          display: "flex", background: "#16151a", border: "1px solid #252329",
          borderRadius: radius.sm, padding: 2
        }}>
          {[
            { id: "curriculum", label: "Curriculum", icon: "📚" },
            { id: "practice",   label: "Practice Studio", icon: "🤖" },
            { id: "logbook",    label: "Logbook",    icon: "📓" },
            { id: "dashboard",  label: "Analytics",  icon: "📊" },
          ].map(tab => {
            const isActive = view === tab.id;
            return (
              <button key={tab.id} onClick={() => setView(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                  border: "none", borderRadius: 4, cursor: "pointer", fontFamily: font.body,
                  fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                  background: isActive ? "#222028" : "transparent",
                  color: isActive ? "#e9e4d9" : "#787268",
                  transition: "background 0.15s, color 0.15s"
                }}>
                <span style={{ fontSize: 13 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Utility Cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StreakBadge streak={{ ...streak, studiedToday }} isMobile={false} />

          {/* Quick Focus Drawer toggle */}
          <button
            onClick={() => setFocusTrayOpen(o => !o)}
            title="Focus Timer & Daily Target"
            style={{
              padding: "6px 10px", border: "1px solid #26242c", borderRadius: radius.sm,
              background: focusTrayOpen ? themeColor.accentSoft : "#18171d",
              color: focusTrayOpen ? themeColor.accent : "#8c8577",
              fontSize: 12, cursor: "pointer", fontFamily: font.body, display: "flex", alignItems: "center", gap: 5
            }}>
            <span>⏱ Focus</span>
          </button>

          {/* Global Search */}
          <button
            onClick={() => setSearchOpen(true)}
            title="Search (⌘K)"
            style={{
              padding: "6px 12px", border: "1px solid #26242c", borderRadius: radius.sm,
              background: "#18171d", color: "#8c8577", fontSize: 12, cursor: "pointer",
              fontFamily: font.body, display: "flex", alignItems: "center", gap: 6
            }}>
            <span>🔍</span>
            <span>Search</span>
            <kbd style={{ fontSize: 10, background: "#111014", padding: "1px 4px", borderRadius: 3, border: "1px solid #282630" }}>⌘K</kbd>
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowManage(true)}
            title="Preferences & Settings"
            style={{
              padding: "6px 10px", border: "1px solid #26242c", borderRadius: radius.sm,
              background: "#18171d", color: "#8c8577", fontSize: 12, cursor: "pointer",
              fontFamily: font.body
            }}>
            ⚙️
          </button>

          {user && (
            <button
              onClick={() => { if (window.confirm("Sign out?")) signOut(); }}
              title={`Signed in as ${user.email}`}
              style={{
                padding: "6px 8px", border: "none", background: "transparent",
                color: "#6e685f", fontSize: 11.5, cursor: "pointer", fontFamily: font.body
              }}>
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* Focus Tray (Collapsible drawer at top of workspace) */}
      {focusTrayOpen && (
        <div style={{
          background: "#141318", borderBottom: "1px solid #201e26", padding: "14px 24px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, zIndex: 30
        }}>
          <DailyGoalWidget goal={goal} todayCount={todayCount} pct={goalPct}
            goalMet={goalMet} goalStreak={goalStreak} onSetGoal={setGoal}
            color={rm?.color || themeColor.accent} />
          <StudyTimer color={rm?.color || themeColor.accent} _isMobile={false} />
        </div>
      )}

      {/* Main Workspace based on View */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* View: Curriculum */}
        {view === "curriculum" && rm && (
          <div style={{ display: "flex", width: "100%", height: "calc(100vh - 58px)" }}>
            {/* Sidebar */}
            <aside style={{
              width: 240, borderRight: "1px solid #201e26", background: "#100f13",
              display: "flex", flexDirection: "column", flexShrink: 0
            }}>
              {/* Progress Summary Card */}
              <div style={{ padding: "16px", borderBottom: "1px solid #201e26" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#8c8577", fontWeight: 500 }}>Overall Progress</span>
                  <span style={{ fontSize: 12, color: rm.accent || themeColor.accent, fontWeight: 600 }}>{stats.pct}%</span>
                </div>
                <div style={{ background: "#08080b", borderRadius: 4, height: 5, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color || themeColor.accent, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 11.5, color: "#6e685f" }}>
                  {stats.done} of {stats.total} topics completed
                </div>

                {stats.pct === 100 && (
                  <button onClick={() => setCertificate({ rm, stats })}
                    style={{
                      width: "100%", marginTop: 10, padding: "6px", background: (rm.color || themeColor.accent) + "20",
                      border: `1px solid ${(rm.color || themeColor.accent)}44`, borderRadius: radius.sm,
                      color: rm.accent || themeColor.accent, fontSize: 11.5, cursor: "pointer", fontWeight: 600
                    }}>
                    🎓 View Certificate
                  </button>
                )}
              </div>

              {/* Auxiliary Quick Links */}
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #201e26", display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={() => setView("nextup")}
                  style={{
                    width: "100%", padding: "7px 10px", background: "transparent", border: "none",
                    borderRadius: 4, color: "#948d80", fontSize: 12, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                  <span>🎯 Next Up in Sequence</span>
                  <span style={{ fontSize: 11, color: "#6e685f" }}>{nextUp.length}</span>
                </button>
                <button
                  onClick={() => setProjectBoardRm(rmKey)}
                  style={{
                    width: "100%", padding: "7px 10px", background: "transparent", border: "none",
                    borderRadius: 4, color: "#948d80", fontSize: 12, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                  <span>🔨 Capstone Projects</span>
                  <span style={{ fontSize: 11, color: "#6e685f" }}>{getProjectStats(rmKey).inprogress}</span>
                </button>
              </div>

              {/* Sections Navigation */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
                <div style={{ fontSize: 10.5, color: "#5c574e", textTransform: "uppercase", letterSpacing: 0.8, padding: "4px 16px 8px" }}>
                  Curriculum Sections
                </div>
                {sections.map(section => {
                  const ts     = rm.sections[section] || [];
                  const flat   = flatTopicNames(ts);
                  const done   = flat.filter(t => progress[`${rmKey}::${t}`]).length;
                  const isActive = curSec === section;
                  const isDone = done === flat.length && flat.length > 0;
                  return (
                    <button key={section} onClick={() => setActiveSection(section)}
                      style={{
                        width: "100%", padding: "9px 16px", background: isActive ? "#18171d" : "transparent",
                        border: "none", borderLeft: isActive ? `3px solid ${rm.color || themeColor.accent}` : "3px solid transparent",
                        cursor: "pointer", textAlign: "left", color: isActive ? "#e9e4d9" : isDone ? "#787268" : "#948d80",
                        fontSize: 12.5, fontFamily: font.body, display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "background 0.1s"
                      }}>
                      <span style={{ fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {section}
                      </span>
                      <span style={{ fontSize: 11, color: "#6e685f", marginLeft: 8 }}>
                        {done}/{flat.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main Content Pane */}
            <section style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
              <div style={{ maxWidth: 840, margin: "0 auto" }}>
                {curSec && (
                  <>
                    <div style={{
                      display: "flex", alignItems: "baseline", justifyContent: "space-between",
                      marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #201e26"
                    }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "#fff", fontFamily: font.display }}>
                          {curSec}
                        </h2>
                        <div style={{ fontSize: 12, color: "#787268", marginTop: 4 }}>
                          {flatTopicNames(rm.sections[curSec] || []).filter(t => progress[`${rmKey}::${t}`]).length} of {flatTopicNames(rm.sections[curSec] || []).length} completed
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setPracticeOpen(true)}
                          style={{
                            padding: "6px 12px", background: (rm.color || themeColor.accent) + "20",
                            border: `1px solid ${(rm.color || themeColor.accent)}44`,
                            borderRadius: radius.sm, color: rm.accent || themeColor.accent, fontSize: 12,
                            cursor: "pointer", fontWeight: 600
                          }}>
                          🤖 Practice This Section
                        </button>
                        <button
                          onClick={() => toggleAll(rmKey, curSec)}
                          style={{
                            fontSize: 12, padding: "6px 12px", background: "#16151a", border: "1px solid #26242c",
                            borderRadius: radius.sm, color: "#8c8577", cursor: "pointer", fontFamily: font.body
                          }}>
                          {flatTopicNames(rm.sections[curSec] || []).every(t => progress[`${rmKey}::${t}`]) ? "Uncheck all" : "Check all"}
                        </button>
                      </div>
                    </div>

                    {renderTopicList(curSec)}
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* View: Next Up in Sequence */}
        {view === "nextup" && rm && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "#fff", fontFamily: font.display }}>Next Up in Sequence</h2>
                  <p style={{ color: "#787268", fontSize: 12.5, margin: "4px 0 0" }}>Suggested step-by-step path based on roadmap ordering</p>
                </div>
                <button onClick={() => setView("curriculum")}
                  style={{
                    padding: "6px 12px", background: "#16151a", border: "1px solid #26242c",
                    borderRadius: radius.sm, color: "#8c8577", fontSize: 12, cursor: "pointer"
                  }}>
                  ← Back to Curriculum
                </button>
              </div>
              {renderNextUpList()}
            </div>
          </div>
        )}

        {/* View: Practice Studio */}
        {view === "practice" && rm && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
            <div style={{ maxWidth: 840, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "#fff", fontFamily: font.display }}>Practice Studio</h2>
                  <p style={{ color: "#787268", fontSize: 12.5, margin: "4px 0 0" }}>AI-assisted flashcards, section quizzes, and interview preparation</p>
                </div>
                <button onClick={() => setPracticeOpen(true)}
                  style={{
                    padding: "8px 16px", background: themeColor.accent, color: themeColor.onAccent,
                    border: "none", borderRadius: radius.sm, fontWeight: 600, fontSize: 13, cursor: "pointer"
                  }}>
                  Open Practice Drawer
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <DailyGoalWidget goal={goal} todayCount={todayCount} pct={goalPct}
                  goalMet={goalMet} goalStreak={goalStreak} onSetGoal={setGoal}
                  color={rm?.color || themeColor.accent} />
                <StudyTimer color={rm?.color || themeColor.accent} _isMobile={false} />
              </div>

              {/* Collapsible Quest Board */}
              <div style={{ background: "#141318", border: "1px solid #201e26", borderRadius: radius.md, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#e9e4d9" }}>Study Quests</span>
                    <span style={{ fontSize: 12, color: "#6e685f", marginLeft: 8 }}>Dynamic challenge generator</span>
                  </div>
                  <button onClick={() => setQuestBoardOpen(o => !o)}
                    style={{ background: "transparent", border: "none", color: "#8c8577", cursor: "pointer", fontSize: 12 }}>
                    {questBoardOpen ? "Hide" : "Show"} Quests
                  </button>
                </div>
                {questBoardOpen && (
                  <QuestBoard
                    roadmaps={roadmaps} quests={quests}
                    loadingRmIds={loadingQuestRmIds}
                    isOnCooldown={isOnCooldown} cooldownRemaining={cooldownRemaining}
                    isMobile={false}
                    onBegin={(rmId) => setActiveQuestRmId(rmId)}
                    onGenerate={generateQuest}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* View: Logbook */}
        {view === "logbook" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ maxWidth: 840, margin: "0 auto", height: "100%" }}>
              <LogbookScreen
                entries={logbookEntries} roadmaps={roadmaps}
                onAdd={addLogEntry} onUpdate={updateLogEntry} onDelete={deleteLogEntry}
                onCycleStatus={cycleLogStatus} getStats={getLogStats} emptyEntry={emptyLogEntry}
              />
            </div>
          </div>
        )}

        {/* View: Analytics Dashboard */}
        {view === "dashboard" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
              topicMeta={topicMeta} isMobile={false} quizResults={quizResults}
              onOpenRoadmap={(key) => { setActiveRoadmap(key); setView("curriculum"); setActiveSection(null); }}
              onOpenNote={(modal) => setNoteModal(modal)}
              clippings={clippings} onAddClipping={addClipping} onUpdateClipping={updateClipping} onDeleteClipping={deleteClipping} />
          </div>
        )}

      </main>

      <input ref={importRef} type="file" accept=".json" onChange={handleImportRoadmap} style={{ display: "none" }} />

      {/* Global Overlays & Modals */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}
        roadmaps={roadmaps} notes={notes} resources={resources}
        onNavigate={handleSearchNavigate} isMobile={isMobile} />

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

      {certificate && (
        <CompletionCertificate
          roadmap={certificate.rm}
          stats={certificate.stats}
          onClose={() => setCertificate(null)}
        />
      )}

      <InstallPrompt />
      {feedback && <Toast feedback={feedback} isMobile={isMobile} />}

      {noteModal && (
        <NoteModal noteModal={noteModal} roadmaps={roadmaps} notes={notes}
          resources={resources} topicMeta={topicMeta} onSave={saveNote} onClose={() => setNoteModal(null)} />
      )}

      {showManage && (
        <ManageModal roadmaps={roadmaps} defaultTab={manageTab} onClose={() => { setShowManage(false); setManageTab("roadmaps"); }}
          onImportRoadmap={handleImportRoadmap} onDelete={handleDeleteRoadmap}
          onExportBackup={handleExport} onImportBackup={handleImportBackup}
          onEdit={r => { setEditorModal({ existing: r }); setShowManage(false); }}
          onCreate={() => { setEditorModal({ existing: null }); setShowManage(false); }}
          user={user} onSignOut={signOut} onResetPassword={resetPassword} isGuest={isGuest} />
      )}

      {editorModal !== null && (
        <RoadmapEditorModal existing={editorModal.existing} onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />
      )}

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
    </div>
  );
}

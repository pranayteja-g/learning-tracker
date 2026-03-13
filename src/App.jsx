import { useState, useRef, useEffect } from "react";
import { useAppStorage }         from "./storage/hooks.js";
import { useIsMobile }           from "./hooks/useIsMobile.js";
import { validateRoadmap, downloadJSON, getRoadmapStats, getNextUp } from "./utils/roadmap.js";
import { flatTopicNames, allTopicNames, topicName, isExpanded } from "./utils/topics.js";
import { Toast }                 from "./components/ui/Toast.jsx";
import { TopicCard }             from "./components/ui/TopicCard.jsx";
import { RadialProgress }        from "./components/ui/RadialProgress.jsx";
import { NoteModal }             from "./components/modals/NoteModal.jsx";
import { ManageModal }           from "./components/modals/ManageModal.jsx";
import { RoadmapEditorModal }    from "./components/modals/RoadmapEditorModal.jsx";
import { WelcomeScreen }         from "./components/screens/WelcomeScreen.jsx";
import { Dashboard }             from "./components/screens/Dashboard.jsx";
import { AIPanel }               from "./components/ai/AIPanel.jsx";
import { InterviewPanel }        from "./components/interview/InterviewPanel.jsx";
import { SearchOverlay }         from "./components/ui/SearchOverlay.jsx";
import { StreakBadge }           from "./components/ui/StreakBadge.jsx";
import { InstallPrompt }        from "./components/ui/InstallPrompt.jsx";
import { useStreak }            from "./hooks/useStreak.js";
import { useQuizResults }       from "./hooks/useQuizResults.js";

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
  const [editorModal,    setEditorModal]    = useState(null);
  const [feedback,       setFeedback]       = useState(null);
  const [aiOpen,         setAiOpen]         = useState(false);
  const [interviewOpen,  setInterviewOpen]  = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const { streak, recordActivity, studiedToday } = useStreak();
  const { recordQuizResult, hasPassedTopic }  = useQuizResults();
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
    if (wasUndone) recordActivity();
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
    if (data.roadmaps)  setRoadmaps(prev  => ({ ...prev,  ...data.roadmaps }));
    if (data.progress)  setProgress(prev  => ({ ...prev,  ...data.progress }));
    if (data.notes)     setNotes(prev     => ({ ...prev,  ...data.notes }));
    if (data.resources) setResources(prev => ({ ...prev,  ...data.resources }));
    if (data.topicMeta) setTopicMeta(prev => ({ ...prev,  ...data.topicMeta }));
    const firstKey = data.roadmaps ? Object.keys(data.roadmaps)[0] : null;
    if (firstKey) { setActiveRoadmap(firstKey); if (isMobile) setMobileScreen("sections"); }
    showFeedback(true, "Backup restored!");
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
      { version: 2, exportedAt: new Date().toISOString(), roadmaps, progress, notes, resources, topicMeta },
      `learning-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
    );
  };

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

  // ── Welcome ────────────────────────────────────────────────────────────────
  if (rmKeys.length === 0) return (
    <>
      <style>{globalStyle}</style>
      <WelcomeScreen onImportBackup={handleImportBackup} onImportRoadmap={handleImportRoadmap}
        onCreate={() => setEditorModal({ existing: null })} />
      {feedback && <Toast feedback={feedback} isMobile={isMobile} />}
      {editorModal !== null && (
        <RoadmapEditorModal existing={editorModal.existing} onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />
      )}
    </>
  );

  // ── Shared: Topic list ─────────────────────────────────────────────────────
  const TopicList = ({ sectionKey }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rm.sections[sectionKey]?.map(topic => (
        <TopicCard key={topicName(topic)} topic={topic} rmKey={rmKey} rm={rm}
          progress={progress} notes={notes} resources={resources} topicMeta={topicMeta}
          hasPassedQuiz={hasPassedTopic} onToggle={toggle} onOpenNote={openNote}
          onToggleCollapse={(parentName, subName) => handleToggleCollapse(sectionKey, parentName, subName)} />
      ))}
    </div>
  );

  // ── Shared: Next-up list ───────────────────────────────────────────────────
  const NextUpList = () => (
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

  // ── Overlays ───────────────────────────────────────────────────────────────
  const Overlays = () => (
    <>
      <style>{globalStyle}</style>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)}
        roadmaps={roadmaps} notes={notes} resources={resources}
        onNavigate={handleSearchNavigate} isMobile={isMobile} />
      <InstallPrompt />
      {feedback    && <Toast feedback={feedback} isMobile={isMobile} />}
      {noteModal   && <NoteModal noteModal={noteModal} roadmaps={roadmaps} notes={notes}
                        resources={resources} topicMeta={topicMeta} onSave={saveNote} onClose={() => setNoteModal(null)} />}
      {showManage  && <ManageModal roadmaps={roadmaps} onClose={() => setShowManage(false)}
                        onImportRoadmap={handleImportRoadmap} onDelete={handleDeleteRoadmap}
                        onEdit={r => { setEditorModal({ existing: r }); setShowManage(false); }}
                        onCreate={() => { setEditorModal({ existing: null }); setShowManage(false); }} />}
      {editorModal !== null && <RoadmapEditorModal existing={editorModal.existing}
                        onSave={handleSaveRoadmap} onClose={() => setEditorModal(null)} />}
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} roadmap={rm} progress={progress}
        notes={notes} resources={resources} topicMeta={topicMeta} curSection={curSec} isMobile={isMobile}
        onSaveToNotes={appendToNote} onQuizComplete={recordQuizResult} />
      <InterviewPanel open={interviewOpen} onClose={() => setInterviewOpen(false)}
        roadmap={rm} progress={progress} isMobile={isMobile} roadmaps={roadmaps} />
      {/* Floating buttons */}
      {rmKeys.length > 0 && (
        <>
          {/* Interview Prep — left side */}
          <button onClick={() => { setInterviewOpen(o => !o); setAiOpen(false); }}
            style={{ position: "fixed", bottom: isMobile ? 72 : 24, left: 20, zIndex: 89,
              width: 52, height: 52, borderRadius: "50%",
              background: interviewOpen ? "#e07b39" : "linear-gradient(135deg, #e07b39, #ee9b00)",
              border: "none", boxShadow: "0 4px 20px rgba(224,123,57,0.5)",
              color: "#fff", fontSize: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s", transform: interviewOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
            {interviewOpen ? "×" : "🎯"}
          </button>
          {/* AI Assistant — right side */}
          <button onClick={() => { setAiOpen(o => !o); setInterviewOpen(false); }}
            style={{ position: "fixed", bottom: isMobile ? 72 : 24, right: 20, zIndex: 89,
              width: 52, height: 52, borderRadius: "50%",
              background: aiOpen ? "#7b5ea7" : "linear-gradient(135deg, #7b5ea7, #4361ee)",
              border: "none", boxShadow: "0 4px 20px rgba(123,94,167,0.5)",
              color: "#fff", fontSize: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s", transform: aiOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
            {aiOpen ? "×" : "🤖"}
          </button>
        </>
      )}
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE
  // ════════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const goToRoadmap = (key) => { setActiveRoadmap(key); setActiveSection(null); setMobileScreen("sections"); };
    const screenTitle = { roadmaps: "Learning Tracker", dashboard: "Dashboard", sections: rm?.label, topics: curSec, nextup: "🎯 Next Up" };

    return (
      <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0f13", color: "#e8e6e0" }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e24", display: "flex",
          alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0f0f13", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["sections","topics","nextup"].includes(mobileScreen) && (
              <button onClick={() => mobileScreen === "topics" ? setMobileScreen("sections") : setMobileScreen("roadmaps")}
                style={{ background: "transparent", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer", padding: "0 6px 0 0", lineHeight: 1 }}>←</button>
            )}
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{screenTitle[mobileScreen]}</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <StreakBadge streak={{ ...streak, studiedToday }} isMobile={true} />
            <button onClick={() => setSearchOpen(true)}
              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer", background: "#1e1e24", color: "#888", fontSize: 16 }}>🔍</button>
            <button onClick={() => setMobileScreen(s => s === "dashboard" ? "roadmaps" : "dashboard")}
              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16,
                background: mobileScreen === "dashboard" ? "#7b5ea7" : "#1e1e24",
                color: mobileScreen === "dashboard" ? "#fff" : "#888" }}>📊</button>
            <button onClick={() => setShowManage(true)}
              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 8, cursor: "pointer", background: "#1e1e24", color: "#888", fontSize: 16 }}>⚙️</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportRoadmap} style={{ display: "none" }} />
          </div>
        </div>

        {mobileScreen === "dashboard" && (
          <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
            topicMeta={topicMeta} isMobile={true} onOpenRoadmap={goToRoadmap} />
        )}

        {mobileScreen === "roadmaps" && (
          <div style={{ padding: "16px", paddingBottom: "96px" }}>
            {Object.values(roadmaps).map(val => {
              const s = getRoadmapStats(val, progress);
              return (
                <div key={val.id} onClick={() => goToRoadmap(val.id)}
                  style={{ background: "#16161b", border: `1px solid ${val.color}44`, borderRadius: 12,
                    padding: "16px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                    <RadialProgress pct={s.pct} color={val.color} size={56} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.pct}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{val.label}</div>
                    <div style={{ fontSize: 12, color: val.accent, marginBottom: 8 }}>{s.done} / {s.total} topics</div>
                    <div style={{ background: "#0f0f13", borderRadius: 4, height: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: val.color, borderRadius: 4 }} />
                    </div>
                  </div>
                  <span style={{ color: "#444", fontSize: 20 }}>›</span>
                </div>
              );
            })}
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

            <button onClick={() => setMobileScreen("nextup")}
              style={{ width: "100%", padding: "13px 16px", background: "#16161b", border: `1px solid ${rm.color}44`,
                borderRadius: 10, color: rm.accent, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🎯 Next Up</span><span style={{ color: "#555", fontSize: 18 }}>›</span>
            </button>

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
            <TopicList sectionKey={curSec} />
          </div>
        )}

        {mobileScreen === "nextup" && rm && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 14px" }}>Your next topics in order</p>
            <NextUpList />
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#13131a",
          borderTop: "1px solid #1e1e24", display: "flex", zIndex: 50 }}>
          {Object.values(roadmaps).slice(0, 3).map(val => {
            const s      = getRoadmapStats(val, progress);
            const active = val.id === rmKey && mobileScreen !== "dashboard";
            return (
              <button key={val.id} onClick={() => goToRoadmap(val.id)}
                style={{ flex: 1, padding: "8px 4px 16px", border: "none", background: "transparent",
                  color: active ? val.color : "#555", cursor: "pointer", fontFamily: "inherit",
                  borderTop: active ? `2px solid ${val.color}` : "2px solid transparent",
                  fontSize: 11, minHeight: 56 }}>
                <div style={{ fontWeight: active ? 700 : 400, fontSize: 12 }}>{val.label.split(" ")[0]}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{s.pct}%</div>
              </button>
            );
          })}
          {rmKeys.length > 3 && (
            <button onClick={() => setMobileScreen("roadmaps")}
              style={{ flex: 1, padding: "10px 4px 14px", border: "none", background: "transparent",
                color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, borderTop: "2px solid transparent" }}>
              <div>More</div><div style={{ fontSize: 10, marginTop: 1 }}>···</div>
            </button>
          )}
        </div>

        <Overlays />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0f13", color: "#e8e6e0" }}>
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
              style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>🔍 Search</button>
            <button onClick={handleExport} style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬇ Export</button>
            <button onClick={() => importRef.current?.click()} style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬆ Import</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportRoadmap} style={{ display: "none" }} />
            <button onClick={() => setShowManage(true)} style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⚙️ Manage</button>
            <button onClick={() => setView(v => v === "dashboard" ? "sections" : "dashboard")}
              style={{ padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                background: view === "dashboard" ? "#7b5ea7" : "#1e1e24", color: view === "dashboard" ? "#fff" : "#888" }}>📊 Dashboard</button>
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {view === "dashboard" && (
        <Dashboard roadmaps={roadmaps} progress={progress} notes={notes} resources={resources}
          topicMeta={topicMeta} isMobile={false}
          onOpenRoadmap={(key) => { setActiveRoadmap(key); setView("sections"); setActiveSection(null); }} />
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
            {view === "nextup" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#fff" }}>🎯 Next Up</h2>
                <p style={{ color: "#555", fontSize: 12, margin: "0 0 18px" }}>Your next topics in order</p>
                <NextUpList />
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
                <TopicList sectionKey={curSec} />
              </>
            )}
          </div>
        </div>
      )}

      <Overlays />
    </div>
  );
}

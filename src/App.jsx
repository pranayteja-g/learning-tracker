import { useState, useEffect, useRef } from "react";

const roadmaps = {
  java: {
    label: "Java",
    color: "#e76f51",
    accent: "#f4a261",
    sections: {
      "Core Basics": ["Basic Syntax", "Data Types", "Conditionals", "Arrays", "Loops", "Variables and Scopes", "Type Casting", "Strings and Methods", "Math Operations"],
      "Classes & OOP": ["Classes and Objects", "Attributes and Methods", "Access Specifiers", "Static Keyword", "Nested Classes", "Basics of OOP", "Method Chaining", "Enums", "Final Keyword", "Object Lifecycle"],
      "Advanced OOP": ["Inheritance", "Abstraction", "Method Overloading / Overriding", "Static vs Dynamic Binding", "Encapsulation", "Interfaces", "Record", "Packages", "Initializer Block", "Pass by Value / Pass by Reference", "Annotations", "Lambda Expressions", "Modules"],
      "Collections": ["Array vs ArrayList", "Set", "Map", "Queue", "Stack", "Dequeue", "Iterator", "Generic Collections", "Optionals"],
      "Concurrency & Functional": ["Threads", "Virtual Threads", "Java Memory Model", "volatile keyword", "Functional Composition", "High Order Functions", "Functional Interfaces", "Stream API"],
      "I/O & Networking": ["File Operations", "Cryptography", "Date and Time", "Regular Expressions", "Networking"],
      "Frameworks & DB": ["Spring Boot", "Play Framework", "Quarkus", "Maven", "Gradle", "Spring Data JPA", "Hibernate", "EBean", "JDBC"],
      "Testing & Logging": ["JUnit", "TestNG", "REST Assured", "JMeter", "Cucumber-JVM", "Mockito", "Logback", "Log4j2", "SLF4J", "TinyLog"],
    },
  },
  springboot: {
    label: "Spring Boot",
    color: "#2d6a4f",
    accent: "#52b788",
    sections: {
      "Core Spring": ["Spring IOC", "Dependency Injection", "Spring AOP", "Spring Bean Scope", "Annotations", "Architecture", "Why use Spring?"],
      "Spring MVC": ["Spring MVC Architecture", "Servlet", "JSP Files", "Spring MVC Components"],
      "Spring Boot Essentials": ["Spring Boot Starters", "Autoconfiguration", "Actuators", "Embedded Server"],
      "Spring Security": ["Authentication", "Authorization", "OAuth2", "JWT Authentication"],
      "Spring Data": ["Spring Data JPA", "Spring Data MongoDB", "Spring Data JDBC", "Hibernate", "Transactions", "Relationships", "Entity Lifecycle"],
      "Microservices": ["Spring Cloud Gateway", "Cloud Config", "Spring Cloud Circuit Breaker", "Spring Cloud Open Feign", "Micrometer", "Eureka"],
      "Testing": ["JPA Test", "Mock MVC", "@SpringBootTest Annotation", "@MockBean Annotation"],
    },
  },
  systemdesign: {
    label: "System Design",
    color: "#4361ee",
    accent: "#7b8cde",
    sections: {
      "Fundamentals": ["What is System Design?", "How to approach System Design?", "Performance vs Scalability", "Latency vs Throughput", "Availability vs Consistency", "CAP Theorem"],
      "Consistency & Availability": ["Weak Consistency", "Eventual Consistency", "Strong Consistency", "Fail-Over Active-Active", "Fail-Over Active-Passive", "Master-Slave Replication", "Master-Master Replication", "99.9% Availability", "99.99% Availability"],
      "Infrastructure": ["Domain Name System", "Push CDNs", "Pull CDNs", "Load Balancers", "LB vs Reverse Proxy", "Load Balancing Algorithms", "Layer 7 Load Balancing", "Layer 4 Load Balancing", "Horizontal Scaling"],
      "Databases": ["SQL vs NoSQL", "DB Replication", "Sharding", "Federation", "Denormalization", "SQL Tuning", "RDBMS", "Key-Value Store", "Document Store", "Wide Column Store", "Graph Databases"],
      "Caching": ["Cache Aside", "Write-through", "Write-behind", "Refresh Ahead", "Client Caching", "CDN Caching", "Web Server Caching", "Database Caching", "Application Caching"],
      "Async & Communication": ["Task Queues", "Message Queues", "Back Pressure", "HTTP", "TCP", "UDP", "REST", "RPC", "gRPC", "GraphQL", "Idempotent Operations"],
      "Cloud & Reliability Patterns": ["Circuit Breaker", "Bulkhead", "Retry", "Health Endpoint Monitoring", "Queue-Based Load Leveling", "CQRS", "Event Sourcing", "Strangler Fig", "Sidecar", "Ambassador"],
      "Monitoring": ["Health Monitoring", "Availability Monitoring", "Performance Monitoring", "Security Monitoring", "Usage Monitoring", "Instrumentation", "Visualization & Alerts"],
    },
  },
};

const STORAGE_KEY = "learning-tracker-progress-v1";
const NOTES_KEY   = "learning-tracker-notes-v1";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function RadialProgress({ pct, color, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e28" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

export default function LearningTracker() {
  const [progress, setProgress]           = useState({});
  const [notes, setNotes]                 = useState({});
  const [activeRoadmap, setActiveRoadmap] = useState("java");
  const [loaded, setLoaded]               = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [view, setView]                   = useState("sections");
  const [noteModal, setNoteModal]         = useState(null);
  const [noteDraft, setNoteDraft]         = useState("");
  const [importFeedback, setImportFeedback] = useState(null);
  const [mobileScreen, setMobileScreen]   = useState("roadmaps");
  const textareaRef = useRef(null);
  const importRef   = useRef(null);
  const isMobile    = useIsMobile();

  useEffect(() => {
    try {
      const p = localStorage.getItem(STORAGE_KEY);
      if (p) setProgress(JSON.parse(p));
      const n = localStorage.getItem(NOTES_KEY);
      if (n) setNotes(JSON.parse(n));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(NOTES_KEY,   JSON.stringify(notes)); },   [notes,    loaded]);
  useEffect(() => { if (noteModal && textareaRef.current) textareaRef.current.focus(); }, [noteModal]);

  const isDone  = (rm, t) => !!progress[`${rm}::${t}`];
  const getNote = (rm, t) => notes[`${rm}::${t}`] || "";
  const hasNote = (rm, t) => !!notes[`${rm}::${t}`]?.trim();
  const toggle  = (rm, t) => setProgress(p => ({ ...p, [`${rm}::${t}`]: !p[`${rm}::${t}`] }));

  const openNote = (e, roadmap, topic) => {
    e.stopPropagation();
    setNoteDraft(getNote(roadmap, topic));
    setNoteModal({ roadmap, topic });
  };

  const saveNote = () => {
    if (!noteModal) return;
    setNotes(n => ({ ...n, [`${noteModal.roadmap}::${noteModal.topic}`]: noteDraft }));
    setNoteModal(null);
  };

  const deleteNote = () => {
    if (!noteModal) return;
    setNotes(n => { const c = {...n}; delete c[`${noteModal.roadmap}::${noteModal.topic}`]; return c; });
    setNoteModal(null);
  };

  const getRoadmapStats = (key) => {
    let total = 0, done = 0;
    Object.values(roadmaps[key].sections).forEach(ts => ts.forEach(t => { total++; if (isDone(key, t)) done++; }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const getNextUp = (key, count = 5) => {
    const items = [];
    for (const [sec, ts] of Object.entries(roadmaps[key].sections))
      for (const t of ts) {
        if (!isDone(key, t)) items.push({ section: sec, topic: t });
        if (items.length >= count) return items;
      }
    return items;
  };

  const totalStats = () => {
    let total = 0, done = 0;
    Object.keys(roadmaps).forEach(k => { const s = getRoadmapStats(k); total += s.total; done += s.done; });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const handleExport = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), progress, notes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `learning-tracker-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.progress) throw new Error("Invalid");
        setProgress(data.progress || {});
        setNotes(data.notes || {});
        setImportFeedback({ ok: true, msg: "Imported successfully!" });
      } catch {
        setImportFeedback({ ok: false, msg: "Invalid file." });
      }
      setTimeout(() => setImportFeedback(null), 3500);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const rm             = roadmaps[activeRoadmap];
  const stats          = getRoadmapStats(activeRoadmap);
  const sections       = Object.keys(rm.sections);
  const currentSection = activeSection || sections[0];
  const nextUp         = getNextUp(activeRoadmap);
  const allNotes       = Object.entries(notes).filter(([, v]) => v?.trim());

  // ── Shared: Note Modal ────────────────────────────────────────────────────────
  const NoteModal = () => (
    <div onClick={() => setNoteModal(null)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 200, padding: "16px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 12,
          padding: "22px", width: "100%", maxWidth: 450, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: roadmaps[noteModal.roadmap]?.accent,
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
            {roadmaps[noteModal.roadmap]?.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{noteModal.topic}</div>
        </div>
        <textarea ref={textareaRef} value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
          placeholder="Add your notes, links, key concepts, or resources…"
          style={{ width: "100%", minHeight: 110, background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 7, padding: "9px 11px", color: "#e8e6e0", fontSize: 14, fontFamily: "inherit",
            resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
        <div style={{ display: "flex", gap: 7, marginTop: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setNoteModal(null)}
            style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2a2a35",
              borderRadius: 6, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          {getNote(noteModal.roadmap, noteModal.topic) && (
            <button onClick={deleteNote}
              style={{ padding: "8px 16px", background: "#1f1212", border: "1px solid #3a2020",
                borderRadius: 6, color: "#e05252", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
          )}
          <button onClick={saveNote}
            style={{ padding: "8px 16px", background: roadmaps[noteModal.roadmap]?.color,
              border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );

  // ── Shared: Topic List ────────────────────────────────────────────────────────
  const TopicList = ({ sectionKey }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rm.sections[sectionKey]?.map(topic => {
        const done = isDone(activeRoadmap, topic);
        const note = getNote(activeRoadmap, topic);
        return (
          <div key={topic} style={{ background: done ? rm.color + "12" : "#16161b", borderRadius: 8,
            border: `1px solid ${done ? rm.color + "40" : "#1e1e24"}`, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", cursor: "pointer" }}
              onClick={() => toggle(activeRoadmap, topic)}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${done ? rm.color : "#444"}`,
                background: done ? rm.color : "transparent", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 14, color: done ? rm.accent : "#ccc",
                textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>{topic}</span>
              {hasNote(activeRoadmap, topic) && (
                <span style={{ fontSize: 10, color: rm.accent, background: rm.color + "20",
                  padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>note</span>
              )}
              <button onClick={e => openNote(e, activeRoadmap, topic)}
                style={{ padding: "5px 9px", background: "transparent", border: "1px solid #2a2a35",
                  borderRadius: 4, color: "#555", fontSize: 13, cursor: "pointer", flexShrink: 0 }}>✏️</button>
            </div>
            {note.trim() && (
              <div style={{ padding: "6px 13px 10px 43px", fontSize: 12, color: "#666", fontStyle: "italic",
                borderTop: `1px solid ${rm.color}1a` }}>
                {note.length > 130 ? note.slice(0, 130) + "…" : note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Shared: Next Up List ──────────────────────────────────────────────────────
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
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggle(activeRoadmap, topic)}>
              <div style={{ fontSize: 14, color: "#e8e6e0" }}>{topic}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{section}</div>
            </div>
            {hasNote(activeRoadmap, topic) && (
              <span style={{ fontSize: 10, color: rm.accent, background: rm.color + "22",
                padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>note</span>
            )}
            <button onClick={e => openNote(e, activeRoadmap, topic)}
              style={{ padding: "5px 9px", background: "transparent", border: "1px solid #2a2a35",
                borderRadius: 4, color: "#666", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>✏️</button>
            <div onClick={() => toggle(activeRoadmap, topic)}
              style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${rm.color}`,
                background: isDone(activeRoadmap, topic) ? rm.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {isDone(activeRoadmap, topic) && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
            </div>
          </div>
        ))
      }
    </div>
  );

  // ── Shared: Dashboard ─────────────────────────────────────────────────────────
  const Dashboard = () => {
    const t = totalStats();
    return (
      <div style={{ padding: isMobile ? "16px" : "28px", overflowY: "auto",
        maxHeight: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 88px)", paddingBottom: isMobile ? "80px" : "28px" }}>
        <div style={{ background: "#16161b", border: "1px solid #2a2a3a", borderRadius: 12,
          padding: "20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <RadialProgress pct={t.pct} color="#7b5ea7" size={72} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.pct}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Overall Progress</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{t.done} <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>/ {t.total}</span></div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{Object.keys(roadmaps).length} roadmaps · {allNotes.length} notes</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))", gap: 12, marginBottom: 24 }}>
          {Object.entries(roadmaps).map(([key, val]) => {
            const s = getRoadmapStats(key);
            const next = getNextUp(key, 3);
            return (
              <div key={key} style={{ background: "#16161b", border: `1px solid ${val.color}33`, borderRadius: 12, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ position: "relative", width: 52, height: 52 }}>
                    <RadialProgress pct={s.pct} color={val.color} size={52} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.pct}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{val.label}</div>
                    <div style={{ fontSize: 12, color: val.accent }}>{s.done} / {s.total} topics</div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  {Object.entries(roadmaps[key].sections).map(([sec, ts]) => {
                    const d = ts.filter(t => isDone(key, t)).length;
                    return (
                      <div key={sec} style={{ marginBottom: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginBottom: 2 }}>
                          <span>{sec}</span><span>{d}/{ts.length}</span>
                        </div>
                        <div style={{ background: "#0f0f13", borderRadius: 3, height: 3 }}>
                          <div style={{ height: "100%", width: `${Math.round((d/ts.length)*100)}%`, background: val.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {next.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Up next</div>
                    {next.map(({ topic }) => (
                      <div key={topic} style={{ fontSize: 12, color: "#777", padding: "2px 0", display: "flex", gap: 5 }}>
                        <span style={{ color: val.accent }}>→</span> {topic}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => {
                  setActiveRoadmap(key);
                  if (isMobile) { setMobileScreen("sections"); }
                  else { setView("sections"); setActiveSection(null); }
                }} style={{ width: "100%", padding: "8px", background: val.color + "22",
                  border: `1px solid ${val.color}44`, borderRadius: 6, color: val.accent,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Open →</button>
              </div>
            );
          })}
        </div>

        {allNotes.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📝 Notes ({allNotes.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(250px, 1fr))", gap: 8 }}>
              {allNotes.map(([key, text]) => {
                const [rmKey, topic] = key.split("::");
                const val = roadmaps[rmKey];
                return (
                  <div key={key} onClick={() => { setActiveRoadmap(rmKey); setNoteDraft(text); setNoteModal({ roadmap: rmKey, topic }); }}
                    style={{ background: "#16161b", border: `1px solid ${val?.color}33`, borderRadius: 8, padding: "11px 13px", cursor: "pointer" }}>
                    <div style={{ fontSize: 10, color: val?.accent, marginBottom: 3 }}>{val?.label} · {topic}</div>
                    <div style={{ fontSize: 12, color: "#777", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ════════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0f13", color: "#e8e6e0" }}>
        {/* Sticky top bar */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e24", display: "flex",
          alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0,
          background: "#0f0f13", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["sections", "topics", "nextup"].includes(mobileScreen) && (
              <button onClick={() => {
                if (mobileScreen === "topics") setMobileScreen("sections");
                else setMobileScreen("roadmaps");
              }} style={{ background: "transparent", border: "none", color: "#aaa",
                fontSize: 22, cursor: "pointer", padding: "0 6px 0 0", lineHeight: 1 }}>←</button>
            )}
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {mobileScreen === "roadmaps" && "Learning Tracker"}
              {mobileScreen === "dashboard" && "Dashboard"}
              {mobileScreen === "sections" && rm.label}
              {mobileScreen === "topics" && currentSection}
              {mobileScreen === "nextup" && "🎯 Next Up"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={handleExport}
              style={{ padding: "6px 10px", border: "none", borderRadius: 5, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬇</button>
            <button onClick={() => importRef.current?.click()}
              style={{ padding: "6px 10px", border: "none", borderRadius: 5, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬆</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            <button onClick={() => setMobileScreen(s => s === "dashboard" ? "roadmaps" : "dashboard")}
              style={{ padding: "6px 10px", border: "none", borderRadius: 5, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12,
                background: mobileScreen === "dashboard" ? "#7b5ea7" : "#1e1e24",
                color: mobileScreen === "dashboard" ? "#fff" : "#888" }}>📊</button>
          </div>
        </div>

        {/* Screens */}
        {mobileScreen === "dashboard" && <Dashboard />}

        {mobileScreen === "roadmaps" && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            {Object.entries(roadmaps).map(([key, val]) => {
              const s = getRoadmapStats(key);
              return (
                <div key={key} onClick={() => { setActiveRoadmap(key); setMobileScreen("sections"); setActiveSection(null); }}
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

        {mobileScreen === "sections" && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <div style={{ background: "#16161b", borderRadius: 10, padding: "14px 16px", marginBottom: 12,
              border: `1px solid ${rm.color}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Progress</span>
                <span style={{ fontSize: 12, color: rm.accent }}>{stats.done} / {stats.total}</span>
              </div>
              <div style={{ background: "#0f0f13", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
            </div>

            <button onClick={() => setMobileScreen("nextup")}
              style={{ width: "100%", padding: "14px 16px", background: "#16161b",
                border: `1px solid ${rm.color}44`, borderRadius: 10, color: rm.accent, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🎯 Next Up</span><span style={{ color: "#555", fontSize: 18 }}>›</span>
            </button>

            {sections.map(section => {
              const ts = rm.sections[section];
              const done = ts.filter(t => isDone(activeRoadmap, t)).length;
              const allDone = done === ts.length;
              return (
                <div key={section} onClick={() => { setActiveSection(section); setMobileScreen("topics"); }}
                  style={{ background: "#16161b", borderRadius: 10, padding: "14px 16px", marginBottom: 8,
                    border: `1px solid ${allDone ? rm.color + "55" : "#1e1e24"}`, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, color: allDone ? rm.accent : "#ccc", fontWeight: 500 }}>{section}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{done}/{ts.length} completed</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {allDone && <span style={{ color: rm.accent }}>✓</span>}
                    <span style={{ color: "#444", fontSize: 20 }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mobileScreen === "topics" && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#555" }}>
                {rm.sections[currentSection]?.filter(t => isDone(activeRoadmap, t)).length} of {rm.sections[currentSection]?.length} completed
              </span>
              <button onClick={() => {
                const ts = rm.sections[currentSection];
                const allDone = ts.every(t => isDone(activeRoadmap, t));
                ts.forEach(t => setProgress(p => ({ ...p, [`${activeRoadmap}::${t}`]: !allDone })));
              }} style={{ fontSize: 12, padding: "5px 12px", background: "#1e1e24", border: "1px solid #2a2a35",
                borderRadius: 5, color: "#777", cursor: "pointer", fontFamily: "inherit" }}>
                {rm.sections[currentSection]?.every(t => isDone(activeRoadmap, t)) ? "Uncheck all" : "Check all"}
              </button>
            </div>
            <TopicList sectionKey={currentSection} />
          </div>
        )}

        {mobileScreen === "nextup" && (
          <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 14px" }}>Your next topics in order</p>
            <NextUpList />
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#13131a",
          borderTop: "1px solid #1e1e24", display: "flex", zIndex: 50 }}>
          {Object.entries(roadmaps).map(([key, val]) => {
            const s = getRoadmapStats(key);
            const active = key === activeRoadmap && mobileScreen !== "dashboard";
            return (
              <button key={key} onClick={() => { setActiveRoadmap(key); setMobileScreen("sections"); setActiveSection(null); }}
                style={{ flex: 1, padding: "10px 4px 14px", border: "none", background: "transparent",
                  color: active ? val.color : "#555", cursor: "pointer", fontFamily: "inherit",
                  borderTop: active ? `2px solid ${val.color}` : "2px solid transparent", fontSize: 11 }}>
                <div style={{ fontWeight: active ? 700 : 400 }}>{val.label.split(" ")[0]}</div>
                <div style={{ fontSize: 10, marginTop: 1, opacity: 0.8 }}>{s.pct}%</div>
              </button>
            );
          })}
        </div>

        {importFeedback && (
          <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
            background: importFeedback.ok ? "#1a2e1a" : "#2e1a1a",
            border: `1px solid ${importFeedback.ok ? "#2d6a4f" : "#6a2d2d"}`,
            color: importFeedback.ok ? "#52b788" : "#e05252",
            padding: "10px 18px", borderRadius: 8, fontSize: 13, zIndex: 300,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
            {importFeedback.ok ? "✓" : "✕"} {importFeedback.msg}
          </div>
        )}
        {noteModal && <NoteModal />}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0f13", color: "#e8e6e0" }}>
      <div style={{ padding: "22px 28px 0", borderBottom: "1px solid #1e1e24" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}>Learning Tracker</h1>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>roadmap.sh</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={handleExport}
              style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬇ Export</button>
            <button onClick={() => importRef.current?.click()}
              style={{ padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, background: "#1e1e24", color: "#888" }}>⬆ Import</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            <button onClick={() => setView(v => v === "dashboard" ? "sections" : "dashboard")}
              style={{ padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12,
                background: view === "dashboard" ? "#7b5ea7" : "#1e1e24",
                color: view === "dashboard" ? "#fff" : "#888" }}>📊 Dashboard</button>
          </div>
        </div>
        {view !== "dashboard" && (
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(roadmaps).map(([key, val]) => {
              const s = getRoadmapStats(key);
              const active = key === activeRoadmap;
              return (
                <button key={key} onClick={() => { setActiveRoadmap(key); setActiveSection(null); setView("sections"); }}
                  style={{ padding: "8px 16px", border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 400,
                    background: active ? val.color : "#1a1a1f", color: active ? "#fff" : "#888",
                    position: "relative", top: 1 }}>
                  {val.label} <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 4 }}>{s.pct}%</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {view === "dashboard" && <Dashboard />}

      {view !== "dashboard" && (
        <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
          <div style={{ width: 195, borderRight: "1px solid #1e1e24", overflowY: "auto", padding: "14px 0", flexShrink: 0 }}>
            <div style={{ padding: "0 14px 12px", borderBottom: "1px solid #1e1e24" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Progress</div>
              <div style={{ background: "#1e1e24", borderRadius: 4, height: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stats.pct}%`, background: rm.color, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 12, color: rm.accent, marginTop: 4 }}>{stats.done} / {stats.total}</div>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e1e24" }}>
              <button onClick={() => setView(v => v === "nextup" ? "sections" : "nextup")}
                style={{ width: "100%", padding: "6px 10px", background: view === "nextup" ? rm.color : "#1e1e24",
                  border: "none", borderRadius: 5, color: view === "nextup" ? "#fff" : rm.accent,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                🎯 Next Up
              </button>
            </div>
            {sections.map(section => {
              const ts = rm.sections[section];
              const done = ts.filter(t => isDone(activeRoadmap, t)).length;
              const active = currentSection === section && view === "sections";
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

          <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
            {view === "nextup" && (
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#fff" }}>🎯 Next Up</h2>
                <p style={{ color: "#555", fontSize: 12, margin: "0 0 18px" }}>Your next topics in order</p>
                <NextUpList />
              </div>
            )}
            {view === "sections" && (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 3px", fontSize: 16, color: "#fff" }}>{currentSection}</h2>
                    <span style={{ fontSize: 12, color: "#555" }}>
                      {rm.sections[currentSection]?.filter(t => isDone(activeRoadmap, t)).length} of {rm.sections[currentSection]?.length} completed
                    </span>
                  </div>
                  <button onClick={() => {
                    const ts = rm.sections[currentSection];
                    const allDone = ts.every(t => isDone(activeRoadmap, t));
                    ts.forEach(t => setProgress(p => ({ ...p, [`${activeRoadmap}::${t}`]: !allDone })));
                  }} style={{ fontSize: 11, padding: "4px 10px", background: "#1e1e24", border: "1px solid #2a2a35",
                    borderRadius: 5, color: "#777", cursor: "pointer", fontFamily: "inherit" }}>
                    {rm.sections[currentSection]?.every(t => isDone(activeRoadmap, t)) ? "Uncheck all" : "Check all"}
                  </button>
                </div>
                <TopicList sectionKey={currentSection} />
              </div>
            )}
          </div>
        </div>
      )}

      {importFeedback && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: importFeedback.ok ? "#1a2e1a" : "#2e1a1a",
          border: `1px solid ${importFeedback.ok ? "#2d6a4f" : "#6a2d2d"}`,
          color: importFeedback.ok ? "#52b788" : "#e05252",
          padding: "10px 20px", borderRadius: 8, fontSize: 13, zIndex: 200,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          {importFeedback.ok ? "✓" : "✕"} {importFeedback.msg}
        </div>
      )}
      {noteModal && <NoteModal />}
    </div>
  );
}

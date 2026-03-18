import { useState, useEffect } from "react";
import { callAI, loadAIConfig, saveAIConfig, PROVIDERS } from "../../ai/providers.js";
import { useUsage } from "../../ai/useUsage.js";
import { allTopicNames, flatTopicNames } from "../../utils/topics.js";
import { safeParseJSON } from "../../utils/jsonParse.js";
import { formatNumber } from "../../utils/format.js";
import { TIME_OPTIONS } from "../../constants/config.js";
import {
  SYSTEM_PROMPT, INTERVIEW_SYSTEM_PROMPT,
  buildQuizPrompt, buildQuestionnairePrompt, buildExplainPrompt, buildStudyPlanPrompt,
  buildInterviewQuestionsPrompt, buildFlashcardsPrompt, buildCheatSheetPrompt,
  buildCodeChallengePrompt,
} from "../../ai/prompts.js";
import { buildQuizContext, buildQuestionnaireContext, buildExplainContext, buildStudyPlanContext } from "../../ai/context.js";
import { QuizView }          from "../ai/QuizView.jsx";
import { CodeWriteView }     from "../ai/CodeWriteView.jsx";
import { QuestionnaireView } from "../ai/QuestionnaireView.jsx";
import { ExplainView }       from "../ai/ExplainView.jsx";
import { StudyPlanView }     from "../ai/StudyPlanView.jsx";
import { InterviewModeView } from "../interview/InterviewModeView.jsx";
import { FlashcardView }     from "../interview/FlashcardView.jsx";
import { CheatSheetView }    from "../interview/CheatSheetView.jsx";
import { TimedQuizView }     from "../interview/TimedQuizView.jsx";
import { APIKeySetup }       from "../ai/APIKeySetup.jsx";
import { StorageIndicator }  from "../ui/StorageIndicator.jsx";

const TABS = [
  { id: "study",     label: "Study",     icon: "📖" },
  { id: "interview", label: "Interview", icon: "🎯" },
  { id: "settings",  label: "Settings",  icon: "⚙️" },
];

const STUDY_MODES = [
  { id: "quiz",          label: "Quiz",       icon: "🧠", desc: "Multiple choice" },
  { id: "code",          label: "Code",       icon: "💻", desc: "Write & evaluate" },
  { id: "questionnaire", label: "Q&A",        icon: "💬", desc: "Open ended" },
  { id: "explain",       label: "Explain",    icon: "📖", desc: "Deep dive + chat" },
  { id: "studyplan",     label: "Study Plan", icon: "📅", desc: "5-day plan" },
];

const INTERVIEW_MODES = [
  { id: "interview",  label: "Interview",   icon: "🎯", desc: "Real Q&A + feedback" },
  { id: "flashcards", label: "Flashcards",  icon: "⚡", desc: "Quick revision" },
  { id: "cheatsheet", label: "Cheat Sheet", icon: "🗺️", desc: "Last-minute ref" },
  { id: "timed",      label: "Timed Quiz",  icon: "⏱️", desc: "Under pressure" },
];

const SCOPES   = ["section", "roadmap", "completed"];
const Q_COUNTS = [5, 10, 15];

export function PracticePanel({ open, onClose, roadmap, roadmaps, progress, notes, resources,
  topicMeta, curSection, isMobile, onSaveToNotes, onQuizComplete, quizResults = {} }) {

  const [tab,          setTab]          = useState("study");
  const [studyMode,    setStudyMode]    = useState("quiz");
  const [intMode,      setIntMode]      = useState("interview");
  const [scope,        setScope]        = useState("section");
  const [qCount,       setQCount]       = useState(5);
  const [difficulty,   setDifficulty]   = useState("mixed");
  const [explainTopic, setExplainTopic] = useState("");
  const [timeSecs,     setTimeSecs]     = useState(600);
  const [selRmKeys,    setSelRmKeys]    = useState([]);
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Reset to config screen whenever panel is opened
  useEffect(() => {
    if (open) { setResult(null); setError(""); setLoading(false); }
  }, [open]);
  const [aiConfig,     setAIConfig]     = useState(loadAIConfig);

  const { usage, limit, recordUsage, saveLimit, resetUsage, isOverLimit, pct } = useUsage();
  const rm      = roadmap;
  const hasKey  = !!aiConfig.keys?.[aiConfig.provider]?.trim();
  const barColor = pct >= 90 ? "#e05252" : pct >= 70 ? "#ee9b00" : "#52b788";

  const switchTab = (t) => { setTab(t); setResult(null); setError(""); };

  const generate = async () => {
    if (!rm || !hasKey) return;
    if (isOverLimit) { setError("Daily token limit reached."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const apiKey   = aiConfig.keys[aiConfig.provider];
      const provider = aiConfig.provider;
      let userPrompt = "";

      if (tab === "study") {
        if (studyMode === "quiz") {
          const ctx = buildQuizContext({ roadmap: rm, progress, scope, sectionKey: curSection });
          if (!ctx.topics.length) throw new Error("No topics for this scope.");
          userPrompt = buildQuizPrompt(ctx, qCount, difficulty);
        } else if (studyMode === "questionnaire") {
          const ctx = buildQuestionnaireContext({ roadmap: rm, progress, scope, sectionKey: curSection });
          if (!ctx.topics.length) throw new Error("No topics for this scope.");
          userPrompt = buildQuestionnairePrompt(ctx, qCount);
        } else if (studyMode === "explain") {
          if (!explainTopic) throw new Error("Please select a topic.");
          const sec = Object.entries(rm.sections).find(([,ts]) => allTopicNames(ts).includes(explainTopic))?.[0] || "";
          const ctx = buildExplainContext({ roadmap: rm, topic: explainTopic, sectionKey: sec,
            notes: notes[`${rm.id}::${explainTopic}`], resources: resources[`${rm.id}::${explainTopic}`] });
          userPrompt = buildExplainPrompt(ctx);
        } else if (studyMode === "studyplan") {
          const ctx = buildStudyPlanContext({ roadmap: rm, progress, quizResults });
          userPrompt = buildStudyPlanPrompt(ctx);
        } else if (studyMode === "code") {
          const ctx = buildQuizContext({ roadmap: rm, progress, scope, sectionKey: curSection });
          if (!ctx.topics.length) throw new Error("No topics for this scope.");
          userPrompt = buildCodeChallengePrompt(ctx, qCount, difficulty);
        }
      } else if (tab === "interview") {
        const scope_rms = selRmKeys.length > 0
          ? selRmKeys.map(k => roadmaps[k]).filter(Boolean) : [rm];
        const merged = {
          label: scope_rms.map(r => r.label).join(" + "),
          sections: Object.assign({}, ...scope_rms.map(r => r.sections)),
        };
        if (intMode === "interview")
          userPrompt = buildInterviewQuestionsPrompt({ roadmapName: merged.label, sections: merged.sections });
        else if (intMode === "flashcards")
          userPrompt = buildFlashcardsPrompt({ roadmapName: merged.label, sections: merged.sections });
        else if (intMode === "cheatsheet")
          userPrompt = buildCheatSheetPrompt({ roadmapName: merged.label, sections: merged.sections });
        else if (intMode === "timed") {
          const allT = Object.values(merged.sections).flatMap(ts => flatTopicNames(ts));
          userPrompt = buildQuizPrompt({
            roadmapName: merged.label,
            topics: allT.map(t => ({ topic: t, section: "" })),
          }, 20, "mixed");
        }
      }

      const sys = tab === "interview" ? INTERVIEW_SYSTEM_PROMPT : SYSTEM_PROMPT;
      // JSON modes need more tokens: 15 questions × ~200 tokens each = ~3000 minimum
      const jsonModes = ["quiz", "code", "questionnaire", "interview", "flashcards", "cheatsheet"];
      const isJsonMode = (tab === "study" && jsonModes.includes(studyMode)) || tab === "interview";
      const maxTokens = isJsonMode ? Math.max(8192, qCount * 400) : 2048;
      const { text, usage: u } = await callAI({ provider, apiKey, systemPrompt: sys, userPrompt, maxTokens });
      recordUsage(u);
      setResult({ tab, studyMode, intMode, data: safeParseJSON(text) });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const labelStyle = { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
  const modeBtn = (active, color, accent) => ({
    padding: "11px 8px", background: active ? color+"22" : "#0f0f13",
    border: `1px solid ${active ? color : "#2a2a35"}`,
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
  });
  const chipBtn = (active, color, accent) => ({
    flex: 1, padding: "7px 4px", fontSize: 10,
    background: active ? color+"22" : "#0f0f13",
    border: `1px solid ${active ? color : "#2a2a35"}`,
    borderRadius: 6, color: active ? accent : "#666",
    cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 400,
  });

  return (
    <>
      {/* Backdrop — covers full screen including nav, blocking all taps */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:90 }} />
      {/* Nav dim overlay — makes nav look intentionally inactive */}
      {isMobile && <div style={{ position:"fixed", bottom:0, left:0, right:0,
        height:"calc(56px + env(safe-area-inset-bottom))",
        background:"rgba(0,0,0,0.35)",
        backdropFilter:"blur(1px)", WebkitBackdropFilter:"blur(1px)",
        zIndex:92, pointerEvents:"none" }} />}
      <div style={isMobile ? {
        position: "fixed", left: 0, right: 0,
        top: "env(safe-area-inset-top, 0px)",
        bottom: "56px",
        background: "#13131a", borderTop: "1px solid #1e1e24",
        zIndex: 91, display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        borderRadius: "16px 16px 0 0",
      } : {
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "420px",
        background: "#13131a", borderLeft: "1px solid #1e1e24",
        zIndex: 91, display: "flex", flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
      }}>

        {/* Header */}
        <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #1e1e24", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🤖 Practice</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                {rm?.label} · {PROVIDERS[aiConfig.provider]?.name || aiConfig.provider}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {hasKey && limit.enabled && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 50, height: 3, background: "#1e1e24", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#444" }}>{formatNumber(usage.totalTokens||0)}</span>
                </div>
              )}
              <button onClick={onClose}
                style={{ background: "transparent", border: "none", color: "#555",
                  fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)}
                style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                  color: tab===t.id ? rm?.accent : "#555",
                  borderBottom: tab===t.id ? `2px solid ${rm?.color}` : "2px solid transparent",
                  marginBottom: -1, fontWeight: tab===t.id ? 700 : 400 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Settings */}
          {tab === "settings" && (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <StorageIndicator />
              <APIKeySetup config={aiConfig}
                onSave={cfg => { saveAIConfig(cfg); setAIConfig(cfg); switchTab("study"); }}
                usage={usage} limit={limit} pct={pct}
                onResetUsage={resetUsage}
                onSaveLimit={saveLimit} />
            </div>
          )}

          {/* No key */}
          {tab !== "settings" && !hasKey && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
              <div style={{ fontSize: 14, color: "#ccc", marginBottom: 8 }}>Add a free API key to start</div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>Groq and Google Gemini are both free.</div>
              <button onClick={() => switchTab("settings")}
                style={{ padding: "10px 24px", background: "#7b5ea7", border: "none",
                  borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 600 }}>
                Configure API Key
              </button>
            </div>
          )}

          {/* Study config */}
          {tab === "study" && hasKey && !result && (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {STUDY_MODES.map(m => (
                  <button key={m.id} onClick={() => setStudyMode(m.id)}
                    style={modeBtn(studyMode===m.id, rm?.color, rm?.accent)}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: studyMode===m.id ? rm?.accent : "#888" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: studyMode===m.id ? rm?.color : "#444", marginTop: 1 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {(studyMode === "quiz" || studyMode === "questionnaire") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={labelStyle}>Scope</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {SCOPES.map(s => (
                        <button key={s} onClick={() => setScope(s)} style={chipBtn(scope===s, rm?.color, rm?.accent)}>
                          {{ section:"Section", roadmap:"Roadmap", completed:"Done" }[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Questions</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {Q_COUNTS.map(n => (
                        <button key={n} onClick={() => setQCount(n)}
                          style={{ ...chipBtn(qCount===n, rm?.color, rm?.accent), fontSize: 13 }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {studyMode === "quiz" && (
                    <div>
                      <div style={labelStyle}>Difficulty</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[["mixed","🎲 Mix"],["easy","Easy"],["medium","Med"],["hard","Hard"]].map(([v,l]) => (
                          <button key={v} onClick={() => setDifficulty(v)} style={chipBtn(difficulty===v, rm?.color, rm?.accent)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {studyMode === "explain" && (
                <div>
                  <div style={labelStyle}>Topic</div>
                  <select value={explainTopic} onChange={e => setExplainTopic(e.target.value)}
                    style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35",
                      borderRadius: 7, padding: "9px 12px", color: explainTopic ? "#e8e6e0" : "#555",
                      fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Select a topic…</option>
                    {rm && Object.entries(rm.sections).map(([sec, ts]) => (
                      <optgroup key={sec} label={sec}>
                        {allTopicNames(ts).map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {studyMode === "studyplan" && (
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6,
                  background: "#0f0f13", padding: "12px", borderRadius: 8, border: "1px solid #1e1e24" }}>
                  Personalised 5-day plan based on your progress in <strong style={{ color: "#ccc" }}>{rm?.label}</strong>.
                </div>
              )}

              {error && <div style={{ fontSize: 12, color: "#e05252", background: "#2e1a1a",
                border: "1px solid #6a2d2d", borderRadius: 7, padding: "9px 12px" }}>{error}</div>}

              <button onClick={generate} disabled={loading}
                style={{ width: "100%", padding: "13px", background: loading ? "#1e1e24" : rm?.color,
                  border: "none", borderRadius: 9, color: loading ? "#555" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
                {loading ? "Generating…" : "Generate →"}
              </button>
            </div>
          )}

          {/* Interview config */}
          {tab === "interview" && hasKey && !result && (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {INTERVIEW_MODES.map(m => (
                  <button key={m.id} onClick={() => setIntMode(m.id)}
                    style={modeBtn(intMode===m.id, rm?.color, rm?.accent)}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: intMode===m.id ? rm?.accent : "#888" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: intMode===m.id ? rm?.color : "#444", marginTop: 1 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {Object.keys(roadmaps).length > 1 && (
                <div>
                  <div style={labelStyle}>Roadmaps to include</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {Object.values(roadmaps).map(r => {
                      const sel = selRmKeys.includes(r.id);
                      return (
                        <button key={r.id}
                          onClick={() => setSelRmKeys(k => sel ? k.filter(x=>x!==r.id) : [...k, r.id])}
                          style={{ padding: "5px 10px", fontSize: 11,
                            background: sel ? r.color+"22" : "#0f0f13",
                            border: `1px solid ${sel ? r.color : "#2a2a35"}`,
                            borderRadius: 20, color: sel ? r.accent : "#666",
                            cursor: "pointer", fontFamily: "inherit" }}>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
                    {selRmKeys.length === 0 ? `Using: ${rm?.label}` : `${selRmKeys.length} selected`}
                  </div>
                </div>
              )}

              {intMode === "timed" && (
                <div>
                  <div style={labelStyle}>Time limit</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {TIME_OPTIONS.map(t => (
                      <button key={t.secs} onClick={() => setTimeSecs(t.secs)}
                        style={{ ...chipBtn(timeSecs===t.secs, rm?.color, rm?.accent), fontSize: 12 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ fontSize: 12, color: "#e05252", background: "#2e1a1a",
                border: "1px solid #6a2d2d", borderRadius: 7, padding: "9px 12px" }}>{error}</div>}

              <button onClick={generate} disabled={loading}
                style={{ width: "100%", padding: "13px", background: loading ? "#1e1e24" : rm?.color,
                  border: "none", borderRadius: 9, color: loading ? "#555" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
                {loading ? "Generating…" : "Generate →"}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <div style={{ padding: "10px 18px", borderBottom: "1px solid #1e1e24",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#666" }}>
                  {result.tab === "study"
                    ? STUDY_MODES.find(m=>m.id===result.studyMode)?.icon + " " + STUDY_MODES.find(m=>m.id===result.studyMode)?.label
                    : INTERVIEW_MODES.find(m=>m.id===result.intMode)?.icon + " " + INTERVIEW_MODES.find(m=>m.id===result.intMode)?.label}
                </span>
                <button onClick={() => { setResult(null); setError(""); }}
                  style={{ fontSize: 11, padding: "4px 10px", background: "transparent",
                    border: "1px solid #2a2a35", borderRadius: 5, color: "#555",
                    cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              </div>
              {result.tab === "study" && result.studyMode === "quiz" &&
                <QuizView questions={result.data} rm={rm}
                  onQuizComplete={(score, total) => onQuizComplete?.(rm?.id, result.data.map(q=>q.topic).filter(Boolean), score, total, difficulty)} />}
              {result.tab === "study" && result.studyMode === "code" &&
                <CodeWriteView questions={result.data} rm={rm}
                  onComplete={(score) => onQuizComplete?.(rm?.id, result.data.map(q=>q.topic).filter(Boolean), score, 100, difficulty)} />}
              {result.tab === "study" && result.studyMode === "questionnaire" && <QuestionnaireView questions={result.data} rm={rm} />}
              {result.tab === "study" && result.studyMode === "explain" &&
                <ExplainView data={result.data} rm={rm} topic={explainTopic}
                  rmKey={rm?.id} sectionKey={curSection} onSaveToNotes={onSaveToNotes} />}
              {result.tab === "study" && result.studyMode === "studyplan" && <StudyPlanView data={result.data} rm={rm} />}
              {result.tab === "interview" && result.intMode === "interview" && <InterviewModeView questions={result.data} rm={rm} />}
              {result.tab === "interview" && result.intMode === "flashcards" && <FlashcardView cards={result.data} rm={rm} />}
              {result.tab === "interview" && result.intMode === "cheatsheet" && <CheatSheetView data={result.data} rm={rm} />}
              {result.tab === "interview" && result.intMode === "timed" && <TimedQuizView questions={result.data} rm={rm} timeLimitSeconds={timeSecs} onQuizComplete={(score, total) => onQuizComplete?.(rm?.id, result.data.map(q=>q.topic).filter(Boolean), score, total, "hard")} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

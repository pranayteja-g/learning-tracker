import { useState, useEffect } from "react";
import { callAI, loadAIConfig, saveAIConfig, PROVIDERS } from "../../ai/providers.js";
import { useUsage } from "../../ai/useUsage.js";
import { buildQuizContext, buildQuestionnaireContext, buildExplainContext, buildStudyPlanContext } from "../../ai/context.js";
import { flatTopicNames, allTopicNames, topicName } from "../../utils/topics.js";
import { SYSTEM_PROMPT, buildQuizPrompt, buildQuestionnairePrompt, buildExplainPrompt, buildStudyPlanPrompt } from "../../ai/prompts.js";
import { safeParseJSON } from "../../utils/jsonParse.js";
import { formatNumber } from "../../utils/format.js";
import { APIKeySetup }       from "./APIKeySetup.jsx";
import { QuizView }          from "./QuizView.jsx";
import { QuestionnaireView } from "./QuestionnaireView.jsx";
import { ExplainView }       from "./ExplainView.jsx";
import { StudyPlanView }     from "./StudyPlanView.jsx";

const MODES = [
  { id: "quiz",          label: "Quiz",      icon: "🧠", desc: "Multiple choice" },
  { id: "questionnaire", label: "Questions", icon: "💬", desc: "Open-ended" },
  { id: "explain",       label: "Explain",   icon: "📖", desc: "Deep dive" },
  { id: "studyplan",     label: "Study Plan",icon: "📅", desc: "5-day plan" },
];

const SCOPES   = ["section", "roadmap", "completed"];
const Q_COUNTS = [5, 10, 15];

export function AIPanel({ open, onClose, roadmap, progress, notes, resources, topicMeta, curSection, isMobile, onSaveToNotes, onQuizComplete }) {
  const [aiConfig,     setAIConfig]     = useState(loadAIConfig);
  const [mode,         setMode]         = useState("quiz");
  const [scope,        setScope]        = useState("section");
  const [qCount,       setQCount]       = useState(5);
  const [difficulty,   setDifficulty]   = useState("mixed");
  const [explainTopic, setExplainTopic] = useState("");
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showSetup,    setShowSetup]    = useState(false);
  const [lastUsed,     setLastUsed]     = useState(null); // token count from last call

  const { usage, limit, recordUsage, saveLimit, resetUsage, isOverLimit, pct } = useUsage();

  const rm      = roadmap;
  const hasKey  = !!aiConfig.keys?.[aiConfig.provider]?.trim();

  useEffect(() => { setResult(null); setError(""); }, [mode, scope, qCount, difficulty, explainTopic]);

  const handleSaveConfig = (cfg) => {
    saveAIConfig(cfg);
    setAIConfig(cfg);
    setShowSetup(false);
  };

  const handleGenerate = async () => {
    if (!rm || !hasKey) return;
    if (isOverLimit) {
      setError(`Daily token limit of ${formatNumber(limit.dailyTokenLimit)} reached. Resets at midnight UTC, or raise your limit in Settings.`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setLastUsed(null);

    try {
      const apiKey   = aiConfig.keys[aiConfig.provider];
      const provider = aiConfig.provider;
      let userPrompt = "";
      let ctx;

      if (mode === "quiz") {
        ctx = buildQuizContext({ roadmap: rm, progress, scope, sectionKey: curSection });
        if (ctx.topics.length === 0) throw new Error("No topics found for the selected scope.");
        userPrompt = buildQuizPrompt(ctx, qCount, difficulty);
      } else if (mode === "questionnaire") {
        ctx = buildQuestionnaireContext({ roadmap: rm, progress, scope, sectionKey: curSection });
        if (ctx.topics.length === 0) throw new Error("No topics found for the selected scope.");
        userPrompt = buildQuestionnairePrompt(ctx, qCount);
      } else if (mode === "explain") {
        if (!explainTopic) throw new Error("Please select a topic to explain.");
        const sec = Object.entries(rm.sections).find(([, ts]) => allTopicNames(ts).includes(explainTopic))?.[0] || "";
        ctx = buildExplainContext({
          roadmap: rm, topic: explainTopic, sectionKey: sec,
          notes: notes[`${rm.id}::${explainTopic}`],
          resources: resources[`${rm.id}::${explainTopic}`],
        });
        userPrompt = buildExplainPrompt(ctx);
      } else if (mode === "studyplan") {
        ctx = buildStudyPlanContext({ roadmap: rm, progress });
        userPrompt = buildStudyPlanPrompt(ctx);
      }

      const { text, usage: callUsage } = await callAI({ provider, apiKey, systemPrompt: SYSTEM_PROMPT, userPrompt });

      // Record exact token counts returned by the API
      recordUsage(callUsage);
      setLastUsed(callUsage);

      const parsed = safeParseJSON(text);
      setResult({ mode, data: parsed });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const panelWidth = isMobile ? "100vw" : "400px";
  const barColor   = pct >= 90 ? "#e05252" : pct >= 70 ? "#ee9b00" : "#52b788";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 90 }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: panelWidth,
        background: "#13131a", borderLeft: "1px solid #1e1e24",
        zIndex: 91, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.5)", overflowY: "auto",
        paddingTop: "env(safe-area-inset-top)",
      }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e24",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#13131a", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>🤖 AI Assistant</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              {rm?.label} · {PROVIDERS[aiConfig.provider]?.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowSetup(s => !s)}
              style={{ padding: "5px 10px", background: showSetup ? "#7b5ea722" : "#1e1e24",
                border: `1px solid ${showSetup ? "#7b5ea7" : "#2a2a35"}`,
                borderRadius: 6, color: showSetup ? "#c4b5fd" : "#666",
                fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              ⚙️ {hasKey ? "Settings" : "Setup"}
            </button>
            <button onClick={onClose}
              style={{ background: "transparent", border: "none", color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Mini usage bar in header — always visible when key is set */}
        {hasKey && !showSetup && limit.enabled && (
          <div style={{ padding: "6px 20px", borderBottom: "1px solid #1e1e24",
            display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, background: "#1e1e24", borderRadius: 3, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.4s" }} />
            </div>
            <div style={{ fontSize: 10, color: barColor, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatNumber(usage.totalTokens || 0)} / {formatNumber(limit.dailyTokenLimit)}
            </div>
          </div>
        )}

        {/* Setup panel */}
        {showSetup && (
          <div style={{ borderBottom: "1px solid #1e1e24" }}>
            <APIKeySetup
              config={aiConfig}
              onSave={handleSaveConfig}
              usage={usage}
              limit={limit}
              pct={pct}
              onResetUsage={resetUsage}
              onSaveLimit={saveLimit}
            />
          </div>
        )}

        {!hasKey && !showSetup ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, color: "#ccc", marginBottom: 8 }}>Set up your free API key to get started</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
              Works with Groq and Google Gemini — both are completely free, no credit card needed.
            </div>
            <button onClick={() => setShowSetup(true)}
              style={{ padding: "10px 24px", background: "#7b5ea7", border: "none",
                borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Configure API Key
            </button>
          </div>
        ) : !showSetup && (
          <>
            {/* Mode selector */}
            <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #1e1e24" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    style={{ padding: "10px 8px", background: mode === m.id ? rm?.color + "22" : "#0f0f13",
                      border: `1px solid ${mode === m.id ? rm?.color : "#2a2a35"}`,
                      borderRadius: 8, color: mode === m.id ? rm?.accent : "#666",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: mode === m.id ? 700 : 400 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: mode === m.id ? rm?.color : "#444", marginTop: 1 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e24" }}>

              {(mode === "quiz" || mode === "questionnaire") && (
                <>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Scope</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {SCOPES.map(s => {
                      const labels = { section: "This section", roadmap: "Full roadmap", completed: "Completed only" };
                      return (
                        <button key={s} onClick={() => setScope(s)}
                          style={{ flex: 1, padding: "7px 4px", fontSize: 11,
                            background: scope === s ? rm?.color + "22" : "#0f0f13",
                            border: `1px solid ${scope === s ? rm?.color : "#2a2a35"}`,
                            borderRadius: 6, color: scope === s ? rm?.accent : "#666",
                            cursor: "pointer", fontFamily: "inherit", fontWeight: scope === s ? 700 : 400 }}>
                          {labels[s]}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Questions</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    {Q_COUNTS.map(n => (
                      <button key={n} onClick={() => setQCount(n)}
                        style={{ flex: 1, padding: "7px", fontSize: 13, fontWeight: qCount === n ? 700 : 400,
                          background: qCount === n ? rm?.color + "22" : "#0f0f13",
                          border: `1px solid ${qCount === n ? rm?.color : "#2a2a35"}`,
                          borderRadius: 6, color: qCount === n ? rm?.accent : "#666",
                          cursor: "pointer", fontFamily: "inherit" }}>
                        {n}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 8px" }}>Difficulty</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["mixed","🎲 Mixed"],["easy","Easy"],["medium","Medium"],["hard","Hard"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => setDifficulty(val)}
                        style={{ flex: 1, padding: "7px 4px", fontSize: 11,
                          background: difficulty === val ? rm?.color + "22" : "#0f0f13",
                          border: `1px solid ${difficulty === val ? rm?.color : "#2a2a35"}`,
                          borderRadius: 6, color: difficulty === val ? rm?.accent : "#666",
                          cursor: "pointer", fontFamily: "inherit", fontWeight: difficulty === val ? 700 : 400 }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === "explain" && (
                <>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Topic to explain</div>
                  <select value={explainTopic} onChange={e => setExplainTopic(e.target.value)}
                    style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35",
                      borderRadius: 7, padding: "9px 12px", color: explainTopic ? "#e8e6e0" : "#555",
                      fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                    <option value="">Select a topic…</option>
                    {rm && Object.entries(rm.sections).map(([sec, topics]) => (
                      <optgroup key={sec} label={sec}>
                        {allTopicNames(topics).map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </>
              )}

              {mode === "studyplan" && (
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                  Generates a personalized 5-day plan based on your current progress in <strong style={{ color: "#ccc" }}>{rm?.label}</strong>.
                </div>
              )}

              {/* Over-limit warning */}
              {isOverLimit && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#2e1a1a",
                  border: "1px solid #6a2d2d", borderRadius: 8, fontSize: 12, color: "#e05252" }}>
                  ⛔ Daily token limit reached. Resets at midnight UTC.{" "}
                  <span onClick={() => setShowSetup(true)}
                    style={{ textDecoration: "underline", cursor: "pointer" }}>
                    Raise limit →
                  </span>
                </div>
              )}

              {/* Generate button */}
              <button onClick={handleGenerate}
                disabled={loading || (mode === "explain" && !explainTopic) || isOverLimit}
                style={{ width: "100%", marginTop: 14, padding: "11px",
                  background: loading || (mode === "explain" && !explainTopic) || isOverLimit
                    ? "#1e1e24" : rm?.color,
                  border: "none", borderRadius: 8,
                  color: loading || (mode === "explain" && !explainTopic) || isOverLimit ? "#444" : "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: loading || isOverLimit ? "default" : "pointer",
                  fontFamily: "inherit" }}>
                {loading ? "Generating…" : `Generate ${MODES.find(m => m.id === mode)?.label}`}
              </button>

              {/* Last call token count */}
              {lastUsed && !loading && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#444" }}>
                  Last call: {formatNumber(lastUsed.promptTokens)} in + {formatNumber(lastUsed.completionTokens)} out
                  {" "}= <strong style={{ color: "#555" }}>{formatNumber(lastUsed.promptTokens + lastUsed.completionTokens)} tokens</strong>
                  {" "}· via {PROVIDERS[aiConfig.provider]?.name}
                </div>
              )}
              {!lastUsed && !loading && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#333" }}>
                  via {PROVIDERS[aiConfig.provider]?.name} · {PROVIDERS[aiConfig.provider]?.model}
                </div>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10, animation: "spin 1s linear infinite" }}>⚙️</div>
                <div style={{ fontSize: 13, color: "#666" }}>Generating with AI…</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ margin: "14px 20px", padding: "12px", background: "#2e1a1a",
                border: "1px solid #6a2d2d", borderRadius: 8, fontSize: 13, color: "#e05252" }}>
                ✕ {error}
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div style={{ borderTop: "1px solid #1e1e24", paddingTop: 16 }}>
                <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {MODES.find(m => m.id === result.mode)?.icon}{" "}
                    {MODES.find(m => m.id === result.mode)?.label} ready
                  </div>
                  <button onClick={() => setResult(null)}
                    style={{ background: "transparent", border: "none", color: "#444", fontSize: 13, cursor: "pointer" }}>
                    Clear
                  </button>
                </div>

                {result.mode === "quiz"          && <QuizView          questions={result.data} rm={rm} onQuizComplete={(score, total) => { const topics = result.data.map(q => q.topic).filter(Boolean); onQuizComplete?.(rm?.id, topics, score, total); }} />}
                {result.mode === "questionnaire" && <QuestionnaireView questions={result.data} rm={rm} />}
                {result.mode === "explain"       && <ExplainView       data={result.data}      rm={rm} topic={explainTopic} rmKey={rm?.id} sectionKey={curSection} onSaveToNotes={onSaveToNotes} />}
                {result.mode === "studyplan"     && <StudyPlanView     data={result.data}      rm={rm} />}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

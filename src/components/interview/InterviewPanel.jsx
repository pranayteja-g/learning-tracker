import { useState } from "react";
import { callAI, loadAIConfig, PROVIDERS } from "../../ai/providers.js";
import { useUsage } from "../../ai/useUsage.js";
import { safeParseJSON } from "../../utils/jsonParse.js";
import { formatNumber } from "../../utils/format.js";
import { TIME_OPTIONS } from "../../constants/config.js";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewQuestionsPrompt,
  buildFlashcardsPrompt,
  buildCheatSheetPrompt,
} from "../../ai/prompts.js";
import { InterviewModeView } from "./InterviewModeView.jsx";
import { FlashcardView }     from "./FlashcardView.jsx";
import { CheatSheetView }    from "./CheatSheetView.jsx";
import { TimedQuizView }     from "./TimedQuizView.jsx";

const MODES = [
  { id: "interview",  label: "Interview",  icon: "🎯", desc: "Real Q&A + AI feedback"   },
  { id: "flashcards", label: "Flashcards", icon: "⚡", desc: "Quick revision cards"      },
  { id: "cheatsheet", label: "Cheat Sheet",icon: "🗺️", desc: "Last-minute summary"      },
  { id: "timed",      label: "Timed Quiz", icon: "⏱️", desc: "MCQ under time pressure"  },
];

export function InterviewPanel({ open, onClose, roadmap, progress, isMobile, roadmaps }) {
  const [mode,      setMode]      = useState("interview");
  const [timeSecs,       setTimeSecs]       = useState(600);
  const [selectedRmKeys, setSelectedRmKeys] = useState([]);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [lastUsed,  setLastUsed]  = useState(null);

  const { recordUsage, usage, isOverLimit, limit } = useUsage();
  const rm      = roadmap;
  const aiConfig = loadAIConfig();
  const hasKey  = !!aiConfig.keys?.[aiConfig.provider]?.trim();

  // Build context from selected roadmaps (or fall back to active roadmap)
  const allRmKeys = roadmaps ? Object.keys(roadmaps) : [];
  const activeKeys = selectedRmKeys.length > 0 ? selectedRmKeys : (rm ? [rm.id] : []);

  const ctx = activeKeys.length > 0 ? (() => {
    if (activeKeys.length === 1) {
      const r = roadmaps?.[activeKeys[0]] || rm;
      return r ? { roadmapName: r.label, sections: r.sections } : null;
    }
    // Multi-roadmap: merge sections, prefix section names with roadmap label
    const merged = {};
    const labels = [];
    activeKeys.forEach(k => {
      const r = roadmaps?.[k];
      if (!r) return;
      labels.push(r.label);
      Object.entries(r.sections).forEach(([sec, topics]) => {
        merged[`${r.label} — ${sec}`] = topics;
      });
    });
    return { roadmapName: labels.join(" + "), sections: merged };
  })() : null;

  const handleGenerate = async () => {
    if (!rm || !hasKey) return;
    if (isOverLimit) { setError(`Daily token limit reached. Raise limit in the 🤖 AI panel.`); return; }

    setLoading(true); setError(""); setResult(null); setLastUsed(null);

    try {
      const apiKey   = aiConfig.keys[aiConfig.provider];
      const provider = aiConfig.provider;
      let userPrompt = "";

      if (mode === "interview")  userPrompt = buildInterviewQuestionsPrompt(ctx);
      if (mode === "flashcards") userPrompt = buildFlashcardsPrompt(ctx);
      if (mode === "cheatsheet") userPrompt = buildCheatSheetPrompt(ctx);
      if (mode === "timed")      userPrompt = buildInterviewQuestionsPrompt(ctx); // reuses MCQ format via quiz prompts
      // For timed quiz we actually need MCQ — reuse quiz prompt
      if (mode === "timed") {
        const { buildQuizPrompt } = await import("../../ai/prompts.js");
        const quizCtx = {
          roadmapName: rm.label,
          topics: Object.entries(rm.sections).flatMap(([sec, ts]) => ts.map(t => ({ topic: t, section: sec }))),
        };
        userPrompt = buildQuizPrompt(quizCtx, 10);
      }

      const { text, usage: callUsage } = await callAI({
        provider, apiKey,
        systemPrompt: INTERVIEW_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.5,
      });

      recordUsage(callUsage);
      setLastUsed(callUsage);

      const parsed = safeParseJSON(text);
      setResult({ mode, data: parsed });
    } catch(e) {
      setError(e.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const panelWidth = isMobile ? "100vw" : "420px";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 90 }} />

      {/* Panel — slides in from LEFT */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: panelWidth,
        paddingTop: "env(safe-area-inset-top)",
        background: "#13131a", borderRight: "1px solid #1e1e24",
        zIndex: 91, display: "flex", flexDirection: "column",
        boxShadow: "8px 0 40px rgba(0,0,0,0.5)", overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e24",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#13131a", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>🎯 Interview Prep</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              {rm?.label} · {PROVIDERS[aiConfig.provider]?.name}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#555",
              fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {!hasKey ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, color: "#ccc", marginBottom: 8 }}>No AI key configured</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Open the 🤖 AI panel → Settings to add a free Groq or Gemini key.
            </div>
          </div>
        ) : (
          <>
            {/* Roadmap selector — only show if multiple roadmaps exist */}
            {allRmKeys.length > 1 && (
              <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #1e1e24" }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8 }}>Scope — select roadmaps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {allRmKeys.map(k => {
                    const r = roadmaps[k];
                    const active = activeKeys.includes(k);
                    return (
                      <button key={k}
                        onClick={() => setSelectedRmKeys(prev =>
                          prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
                        )}
                        style={{ padding: "8px 12px", textAlign: "left",
                          background: active ? r.color + "18" : "#0f0f13",
                          border: `1px solid ${active ? r.color + "66" : "#2a2a35"}`,
                          borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%",
                          background: active ? r.color : "#333", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: active ? r.accent : "#666",
                          fontWeight: active ? 600 : 400 }}>{r.label}</span>
                        {k === rm?.id && (
                          <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {activeKeys.length > 1 && (
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 12, padding: "6px 10px",
                    background: "#0f0f13", borderRadius: 6, border: "1px solid #1e1e24" }}>
                    ℹ AI will pick the most interview-critical topics across all {activeKeys.length} roadmaps.
                  </div>
                )}
              </div>
            )}

            {/* Mode grid */}
            <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #1e1e24" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setError(""); }}
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

              {/* Timed quiz — time selector */}
              {mode === "timed" && (
                <>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8 }}>Time limit</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {TIME_OPTIONS.map(t => (
                      <button key={t.secs} onClick={() => setTimeSecs(t.secs)}
                        style={{ flex: 1, padding: "8px 4px", fontSize: 12,
                          background: timeSecs === t.secs ? rm?.color + "22" : "#0f0f13",
                          border: `1px solid ${timeSecs === t.secs ? rm?.color : "#2a2a35"}`,
                          borderRadius: 6, color: timeSecs === t.secs ? rm?.accent : "#666",
                          cursor: "pointer", fontFamily: "inherit",
                          fontWeight: timeSecs === t.secs ? 700 : 400 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Description for other modes */}
              {mode === "interview" && (
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
                  AI picks the <strong style={{ color: "#ccc" }}>10 most interview-critical topics</strong> from{" "}
                  <strong style={{ color: "#ccc" }}>{rm?.label}</strong> and generates real interview questions.
                  Answer each one, then get AI feedback on your response.
                </div>
              )}
              {mode === "flashcards" && (
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
                  <strong style={{ color: "#ccc" }}>20 flip cards</strong> covering the most
                  interview-critical topics. Tap to flip, Space bar to flip, arrow keys to navigate.
                  Mark each card as known or needs review.
                </div>
              )}
              {mode === "cheatsheet" && (
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
                  A structured one-page summary grouped by interview likelihood — Must Know, Good to Know,
                  and Bonus Points. Downloadable as Markdown or printable as PDF.
                </div>
              )}

              {isOverLimit && (
                <div style={{ padding: "10px 12px", background: "#2e1a1a",
                  border: "1px solid #6a2d2d", borderRadius: 8, fontSize: 12,
                  color: "#e05252", marginBottom: 12 }}>
                  ⛔ Daily token limit reached. Resets at midnight UTC.
                </div>
              )}

              <button onClick={handleGenerate} disabled={loading || isOverLimit}
                style={{ width: "100%", padding: "11px",
                  background: loading || isOverLimit ? "#1e1e24" : rm?.color,
                  border: "none", borderRadius: 8,
                  color: loading || isOverLimit ? "#444" : "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: loading || isOverLimit ? "default" : "pointer",
                  fontFamily: "inherit" }}>
                {loading ? "⚙️ Generating…" : `Generate ${MODES.find(m => m.id === mode)?.label}`}
              </button>

              {lastUsed && !loading && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#444" }}>
                  {formatNumber(lastUsed.promptTokens)} in + {formatNumber(lastUsed.completionTokens)} out
                  = <strong style={{ color: "#555" }}>{formatNumber(lastUsed.promptTokens + lastUsed.completionTokens)} tokens</strong>
                </div>
              )}
            </div>

            {/* Error */}
            {error && !loading && (
              <div style={{ margin: "14px 20px", padding: "12px", background: "#2e1a1a",
                border: "1px solid #6a2d2d", borderRadius: 8, fontSize: 13, color: "#e05252" }}>
                ✕ {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10, animation: "spin 1s linear infinite" }}>⚙️</div>
                <div style={{ fontSize: 13, color: "#666" }}>Generating with AI…</div>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div style={{ borderTop: "1px solid #1e1e24", paddingTop: 16 }}>
                <div style={{ padding: "0 20px 10px", display: "flex",
                  justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {MODES.find(m => m.id === result.mode)?.icon}{" "}
                    {MODES.find(m => m.id === result.mode)?.label} ready
                  </div>
                  <button onClick={() => setResult(null)}
                    style={{ background: "transparent", border: "none",
                      color: "#444", fontSize: 13, cursor: "pointer" }}>Clear</button>
                </div>

                {result.mode === "interview"  && <InterviewModeView questions={result.data} rm={rm} />}
                {result.mode === "flashcards" && <FlashcardView     cards={result.data}     rm={rm} />}
                {result.mode === "cheatsheet" && <CheatSheetView    data={result.data}       rm={rm} />}
                {result.mode === "timed"      && (
                  <TimedQuizView questions={result.data} rm={rm} timeLimitSeconds={timeSecs} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

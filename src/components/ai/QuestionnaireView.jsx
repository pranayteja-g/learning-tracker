import { useState } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { SYSTEM_PROMPT, buildQuestionnaireSummaryPrompt } from "../../ai/prompts.js";
import { safeParseJSON } from "../../utils/jsonParse.js";

export function QuestionnaireView({ questions, rm }) {
  const [answers,    setAnswers]    = useState({});
  const [revealed,   setRevealed]   = useState({});
  const [current,    setCurrent]    = useState(0);
  const [summary,    setSummary]    = useState(null);
  const [loadingSum, setLoadingSum] = useState(false);
  const [sumError,   setSumError]   = useState("");
  const [view,       setView]       = useState("questions"); // "questions" | "summary"

  const q           = questions[current];
  const answeredAll = Object.keys(answers).filter(k => answers[k]?.trim()).length === questions.length;

  const handleGetFeedback = async () => {
    setLoadingSum(true);
    setSumError("");
    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) throw new Error("No API key configured.");
      const prompt = buildQuestionnaireSummaryPrompt(questions, Object.keys(questions).map((_, i) => answers[i] || ""));
      const { text } = await callAI({ provider: cfg.provider, apiKey, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt });
      setSummary(safeParseJSON(text));
      setView("summary");
    } catch (e) {
      setSumError(e.message || "Failed to get feedback.");
    } finally {
      setLoadingSum(false);
    }
  };

  const verdictColor = { Strong: "#52b788", Good: "#8bc4a8", Partial: "#ee9b00", Missed: "#e05252" };
  const scoreColor   = { Excellent: "#52b788", Good: "#8bc4a8", Developing: "#ee9b00", "Needs Practice": "#e05252" };

  if (view === "summary" && summary) {
    return (
      <div style={{ padding: "0 20px 20px" }}>
        {/* Overall score */}
        <div style={{ background: "#16161b", border: `1px solid ${rm.color}44`,
          borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor[summary.overallScore] || "#ccc" }}>
            {summary.overallScore}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6, lineHeight: 1.6 }}>{summary.summary}</div>
        </div>

        {/* Strong / Weak */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {summary.strongTopics?.length > 0 && (
            <div style={{ background: "#1a2e1a", border: "1px solid #52b78833",
              borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#52b788", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 6 }}>💪 Strong</div>
              {summary.strongTopics.map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: "#a0d4a0", marginBottom: 3 }}>• {t}</div>
              ))}
            </div>
          )}
          {summary.weakTopics?.length > 0 && (
            <div style={{ background: "#2e1a1a", border: "1px solid #e0525233",
              borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#e05252", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 6 }}>📚 Review</div>
              {summary.weakTopics.map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: "#d4a0a0", marginBottom: 3 }}>• {t}</div>
              ))}
            </div>
          )}
        </div>

        {/* Per-question verdicts */}
        {summary.perQuestion?.map(({ qIndex, verdict, feedback }) => (
          <div key={qIndex} style={{ background: "#16161b", borderRadius: 8, padding: "10px 13px",
            marginBottom: 8, border: `1px solid ${verdictColor[verdict] || "#2a2a35"}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#666" }}>Q{qIndex + 1}. {questions[qIndex]?.topic}</span>
              <span style={{ fontSize: 11, color: verdictColor[verdict] || "#888",
                background: (verdictColor[verdict] || "#888") + "20",
                padding: "2px 7px", borderRadius: 4 }}>{verdict}</span>
            </div>
            <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{feedback}</div>
          </div>
        ))}

        {/* Next steps */}
        {summary.nextSteps && (
          <div style={{ background: "#13131a", border: `1px solid ${rm.color}33`,
            borderRadius: 8, padding: "12px", marginTop: 6 }}>
            <div style={{ fontSize: 10, color: rm.accent, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 6 }}>🎯 Next Steps</div>
            <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{summary.nextSteps}</div>
          </div>
        )}

        <button onClick={() => { setView("questions"); setSummary(null); setAnswers({}); setRevealed({}); setCurrent(0); }}
          style={{ width: "100%", marginTop: 14, padding: "10px", background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#555" }}>Question {current + 1} of {questions.length}</div>
        <div style={{ display: "flex", gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: 20, height: 6, borderRadius: 3, cursor: "pointer",
                background: i === current ? rm.color : answers[i]?.trim() ? rm.color + "55" : "#1e1e24" }} />
          ))}
        </div>
      </div>

      {/* Topic badge */}
      <div style={{ display: "inline-block", fontSize: 10, color: rm.accent,
        background: rm.color + "20", padding: "3px 8px", borderRadius: 4, marginBottom: 10 }}>
        {q.topic}
      </div>

      {/* Question */}
      <div style={{ background: "#16161b", borderRadius: 10, padding: "16px",
        marginBottom: 14, border: `1px solid ${rm.color}33` }}>
        <div style={{ fontSize: 14, color: "#e8e6e0", lineHeight: 1.6 }}>{q.question}</div>
      </div>

      {/* Answer textarea */}
      <textarea
        value={answers[current] || ""}
        onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))}
        placeholder="Write your answer here…"
        style={{ width: "100%", minHeight: 100, background: "#0f0f13", border: "1px solid #2a2a35",
          borderRadius: 8, padding: "10px 12px", color: "#e8e6e0", fontSize: 13,
          fontFamily: "inherit", resize: "vertical", outline: "none",
          boxSizing: "border-box", lineHeight: 1.6, marginBottom: 10 }}
      />

      {/* Show/hide sample answer */}
      <button onClick={() => setRevealed(r => ({ ...r, [current]: !r[current] }))}
        style={{ width: "100%", padding: "8px", background: "transparent",
          border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
          fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
        {revealed[current] ? "Hide" : "Show"} sample answer
      </button>

      {revealed[current] && (
        <div style={{ background: "#1a2a1a", border: "1px solid #52b78844", borderRadius: 8,
          padding: "12px", marginBottom: 12, fontSize: 12, color: "#a0d4a0", lineHeight: 1.6 }}>
          <div style={{ fontSize: 10, color: "#52b788", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 6 }}>Sample Answer</div>
          {q.sampleAnswer}
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 7, color: current === 0 ? "#333" : "#888",
            fontSize: 13, cursor: current === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
          ← Prev
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 1, padding: "9px", background: rm.color + "22",
              border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Next →
          </button>
        ) : (
          <button onClick={handleGetFeedback} disabled={loadingSum || !answeredAll}
            style={{ flex: 2, padding: "9px",
              background: answeredAll ? rm.color : "#1e1e24",
              border: "none", borderRadius: 7,
              color: answeredAll ? "#fff" : "#444",
              fontSize: 13, fontWeight: 600,
              cursor: answeredAll && !loadingSum ? "pointer" : "default",
              fontFamily: "inherit" }}>
            {loadingSum ? "Analysing…" : "Get AI Feedback →"}
          </button>
        )}
      </div>

      {!answeredAll && current === questions.length - 1 && (
        <div style={{ fontSize: 11, color: "#555", textAlign: "center", marginTop: 8 }}>
          Answer all questions for AI feedback
        </div>
      )}
      {sumError && (
        <div style={{ fontSize: 12, color: "#e05252", marginTop: 8, textAlign: "center" }}>{sumError}</div>
      )}
    </div>
  );
}

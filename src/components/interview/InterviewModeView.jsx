import { useState } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { INTERVIEW_SYSTEM_PROMPT, buildInterviewFeedbackPrompt } from "../../ai/prompts.js";
import { useUsage } from "../../ai/useUsage.js";
import { safeParseJSON } from "../../utils/jsonParse.js";

const TYPE_STYLES = {
  conceptual:      { color: "#7b8cde", label: "Conceptual"      },
  practical:       { color: "#52b788", label: "Practical"        },
  "problem-solving":{ color: "#ee9b00", label: "Problem Solving" },
  behavioural:     { color: "#c4b5fd", label: "Behavioural"      },
};
const DIFF_COLORS = { easy: "#52b788", medium: "#ee9b00", hard: "#e05252" };
const SCORE_COLORS = [null, "#e05252", "#ee9b00", "#ee9b00", "#52b788", "#52b788"];

export function InterviewModeView({ questions, rm }) {
  const [idx,       setIdx]       = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [revealed,  setRevealed]  = useState({});
  const [error,     setError]     = useState("");

  const { recordUsage } = useUsage();
  const q = questions[idx];
  const typeStyle = TYPE_STYLES[q?.type] || TYPE_STYLES.conceptual;
  const answered  = Object.keys(answers).filter(k => answers[k]?.trim()).length;

  const getFeedback = async () => {
    if (!answers[idx]?.trim()) { setError("Write an answer first."); return; }
    const aiConfig = loadAIConfig();
    if (!aiConfig.keys?.[aiConfig.provider]?.trim()) {
      setError("No AI key set. Open the 🤖 AI panel → Settings."); return;
    }
    setLoading(true); setError("");
    try {
      const { text, usage } = await callAI({
        provider:     aiConfig.provider,
        apiKey:       aiConfig.keys[aiConfig.provider],
        systemPrompt: INTERVIEW_SYSTEM_PROMPT,
        userPrompt:   buildInterviewFeedbackPrompt(q.question, answers[idx], q.modelAnswer),
        temperature:  0.3,
      });
      recordUsage(usage);
      const fb = safeParseJSON(text);
      setFeedbacks(f => ({ ...f, [idx]: fb }));
    } catch(e) {
      setError(e.message || "Feedback failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fb = feedbacks[idx];

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#555" }}>Q {idx + 1} of {questions.length}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{answered} answered</div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {questions.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)}
            style={{ flex: 1, height: 5, borderRadius: 3, cursor: "pointer",
              background: feedbacks[i] ? "#52b788" : answers[i]?.trim() ? rm.color + "66" : i === idx ? rm.color : "#1e1e24" }} />
        ))}
      </div>

      {/* Question card */}
      <div style={{ background: "#16161b", borderRadius: 10, padding: "16px",
        border: `1px solid ${rm.color}33`, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: typeStyle.color + "22", color: typeStyle.color }}>
            {typeStyle.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: DIFF_COLORS[q.difficulty] + "22", color: DIFF_COLORS[q.difficulty] }}>
            {q.difficulty}
          </span>
          <span style={{ fontSize: 10, color: "#555", padding: "2px 8px" }}>{q.topic}</span>
        </div>
        <div style={{ fontSize: 14, color: "#e8e6e0", lineHeight: 1.6 }}>{q.question}</div>
      </div>

      {/* Answer textarea */}
      <textarea value={answers[idx] || ""}
        onChange={e => { setAnswers(a => ({ ...a, [idx]: e.target.value })); setError(""); }}
        placeholder="Type your answer as you would in a real interview…"
        rows={5}
        style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35",
          borderRadius: 8, padding: "10px 12px", color: "#e8e6e0", fontSize: 13,
          fontFamily: "inherit", resize: "vertical", outline: "none",
          boxSizing: "border-box", lineHeight: 1.7, marginBottom: 10 }} />

      {error && <div style={{ fontSize: 12, color: "#e05252", marginBottom: 8 }}>{error}</div>}

      {/* Get feedback button */}
      {!fb && (
        <button onClick={getFeedback} disabled={loading || !answers[idx]?.trim()}
          style={{ width: "100%", padding: "10px", marginBottom: 10,
            background: loading || !answers[idx]?.trim() ? "#1e1e24" : rm.color,
            border: "none", borderRadius: 7,
            color: loading || !answers[idx]?.trim() ? "#444" : "#fff",
            fontSize: 13, fontWeight: 600,
            cursor: loading || !answers[idx]?.trim() ? "default" : "pointer",
            fontFamily: "inherit" }}>
          {loading ? "⚙️ Getting feedback…" : "Get AI Feedback"}
        </button>
      )}

      {/* Feedback */}
      {fb && (
        <div style={{ background: "#16161b", borderRadius: 10, padding: "14px",
          border: `1px solid ${SCORE_COLORS[fb.score]}44`, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: SCORE_COLORS[fb.score] }}>
              {fb.verdict}
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(s => (
                <div key={s} style={{ width: 16, height: 16, borderRadius: 3,
                  background: s <= fb.score ? SCORE_COLORS[fb.score] : "#2a2a35" }} />
              ))}
            </div>
          </div>
          {fb.whatWorked && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#52b788", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>✓ What worked</div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{fb.whatWorked}</div>
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#ee9b00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>→ Improve</div>
            <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{fb.improve}</div>
          </div>
          <div style={{ background: "#0f0f13", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#7b8cde", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💡 Tip</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{fb.tip}</div>
          </div>
        </div>
      )}

      {/* Model answer reveal */}
      <button onClick={() => setRevealed(r => ({ ...r, [idx]: !r[idx] }))}
        style={{ width: "100%", padding: "8px", background: "transparent",
          border: `1px solid ${rm.color}33`, borderRadius: 7, color: "#555",
          fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
        {revealed[idx] ? "Hide" : "Show"} model answer
      </button>

      {revealed[idx] && (
        <div style={{ background: "#1a2a1a", border: "1px solid #52b78844",
          borderRadius: 8, padding: "12px", marginBottom: 10,
          fontSize: 12, color: "#a0d4a0", lineHeight: 1.7 }}>
          <div style={{ fontSize: 10, color: "#52b788", textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 6 }}>Model Answer</div>
          {q.modelAnswer}
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
          style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 7, color: idx === 0 ? "#333" : "#888",
            fontSize: 13, cursor: idx === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
          ← Prev
        </button>
        <button onClick={() => setIdx(i => Math.min(questions.length - 1, i + 1))} disabled={idx === questions.length - 1}
          style={{ flex: 1, padding: "9px", background: rm.color + "22",
            border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
            fontSize: 13, cursor: idx === questions.length - 1 ? "default" : "pointer",
            fontFamily: "inherit" }}>
          Next →
        </button>
      </div>
    </div>
  );
}

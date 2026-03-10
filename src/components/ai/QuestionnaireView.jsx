import { useState } from "react";

export function QuestionnaireView({ questions, rm }) {
  const [answers,  setAnswers]  = useState({});
  const [revealed, setRevealed] = useState({});
  const [current,  setCurrent]  = useState(0);

  const q = questions[current];

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress dots */}
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

      {/* Reveal sample answer */}
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
        {current < questions.length - 1 && (
          <button onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 1, padding: "9px", background: rm.color + "22",
              border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Next →
          </button>
        )}
      </div>

      {current === questions.length - 1 && (
        <div style={{ marginTop: 12, padding: "10px", background: "#16161b",
          border: `1px solid ${rm.color}33`, borderRadius: 8, textAlign: "center",
          fontSize: 12, color: "#666" }}>
          {Object.keys(answers).filter(k => answers[k]?.trim()).length}/{questions.length} answered
          {Object.keys(answers).filter(k => answers[k]?.trim()).length === questions.length && (
            <span style={{ color: "#52b788" }}> — Great work! 🎉</span>
          )}
        </div>
      )}
    </div>
  );
}

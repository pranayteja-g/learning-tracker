import { useState } from "react";

const DIFF_COLOR = { easy: "#52b788", medium: "#ee9b00", hard: "#e05252" };

export function QuizView({ questions, rm, onQuizComplete }) {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current,   setCurrent]   = useState(0);

  const q      = questions[current];
  const totalQ = questions.length;
  const score  = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  const selectAnswer = (idx, opt) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [idx]: opt }));
  };

  const optColors = (qi, opt) => {
    if (!submitted) {
      return answers[qi] === opt
        ? { bg: rm.color + "33", border: rm.color, color: rm.accent }
        : { bg: "#0f0f13", border: "#2a2a35", color: "#888" };
    }
    const correct = questions[qi].answer;
    if (opt === correct)     return { bg: "#1a2e1a", border: "#52b788", color: "#52b788" };
    if (opt === answers[qi]) return { bg: "#2e1a1a", border: "#e05252", color: "#e05252" };
    return { bg: "#0f0f13", border: "#1e1e24", color: "#555" };
  };

  if (submitted) {
    const pct = Math.round((score / totalQ) * 100);
    return (
      <div style={{ padding: "0 20px 20px" }}>
        {/* Score card */}
        <div style={{ background: "#16161b", border: `1px solid ${rm.color}44`, borderRadius: 10,
          padding: "16px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: score >= totalQ * 0.7 ? "#52b788" : "#ee9b00" }}>
            {score}/{totalQ}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{pct}% correct</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            {score === totalQ ? "Perfect! 🎉" : score >= totalQ * 0.7 ? "Great job! 👍" : "Keep studying! 📚"}
          </div>
        </div>

        {/* Review */}
        {questions.map((q, qi) => {
          const correct = answers[qi] === q.answer;
          return (
            <div key={qi} style={{ background: "#16161b", borderRadius: 10, padding: "14px",
              marginBottom: 10, border: `1px solid ${correct ? "#52b78844" : "#e0525244"}` }}>
              {/* Question meta */}
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                {q.topic && (
                  <span style={{ fontSize: 10, background: rm.color + "20", color: rm.accent,
                    padding: "2px 7px", borderRadius: 4 }}>{q.topic}</span>
                )}
                {q.difficulty && (
                  <span style={{ fontSize: 10, background: DIFF_COLOR[q.difficulty] + "20",
                    color: DIFF_COLOR[q.difficulty], padding: "2px 7px", borderRadius: 4 }}>
                    {q.difficulty}
                  </span>
                )}
                <span style={{ fontSize: 10, color: correct ? "#52b788" : "#e05252",
                  marginLeft: "auto" }}>{correct ? "✓ Correct" : "✗ Wrong"}</span>
              </div>
              <div style={{ fontSize: 13, color: "#ccc", marginBottom: 10, lineHeight: 1.5 }}>
                <span style={{ color: "#555", marginRight: 6 }}>Q{qi+1}.</span>{q.question}
              </div>
              {Object.entries(q.options).map(([opt, text]) => {
                const c = optColors(qi, opt);
                return (
                  <div key={opt} style={{ padding: "7px 10px", borderRadius: 6, marginBottom: 5,
                    background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 12 }}>
                    <strong>{opt}.</strong> {text}
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: "#52b788", marginTop: 8,
                background: "#1a2e1a", padding: "6px 10px", borderRadius: 5, lineHeight: 1.5 }}>
                💡 {q.explanation}
              </div>
            </div>
          );
        })}

        <button onClick={() => { setAnswers({}); setSubmitted(false); setCurrent(0); }}
          style={{ width: "100%", padding: "10px", marginTop: 4, background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#555" }}>Question {current + 1} of {totalQ}</div>
        <div style={{ display: "flex", gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: 20, height: 6, borderRadius: 3, cursor: "pointer",
                background: i === current ? rm.color : answers[i] ? rm.color + "55" : "#1e1e24" }} />
          ))}
        </div>
      </div>

      {/* Topic + difficulty badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {q.topic && (
          <span style={{ fontSize: 10, background: rm.color + "20", color: rm.accent,
            padding: "3px 8px", borderRadius: 4 }}>{q.topic}</span>
        )}
        {q.difficulty && (
          <span style={{ fontSize: 10, background: DIFF_COLOR[q.difficulty] + "20",
            color: DIFF_COLOR[q.difficulty], padding: "3px 8px", borderRadius: 4 }}>
            {q.difficulty}
          </span>
        )}
      </div>

      {/* Question */}
      <div style={{ background: "#16161b", borderRadius: 10, padding: "16px", marginBottom: 14,
        border: `1px solid ${rm.color}33` }}>
        <div style={{ fontSize: 14, color: "#e8e6e0", lineHeight: 1.6 }}>{q.question}</div>
      </div>

      {/* Options */}
      {Object.entries(q.options).map(([opt, text]) => {
        const selected = answers[current] === opt;
        return (
          <button key={opt} onClick={() => selectAnswer(current, opt)}
            style={{ width: "100%", padding: "11px 13px", marginBottom: 8, textAlign: "left",
              background: selected ? rm.color + "22" : "#0f0f13",
              border: `1px solid ${selected ? rm.color : "#2a2a35"}`,
              borderRadius: 8, color: selected ? rm.accent : "#888",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontWeight: 700, flexShrink: 0, color: selected ? rm.color : "#444" }}>{opt}.</span>
            <span>{text}</span>
          </button>
        );
      })}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 7, color: current === 0 ? "#333" : "#888",
            fontSize: 13, cursor: current === 0 ? "default" : "pointer", fontFamily: "inherit" }}>
          ← Prev
        </button>
        {current < totalQ - 1 && (
          <button onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 1, padding: "9px", background: rm.color + "22",
              border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Next →
          </button>
        )}
      </div>

      {/* Persistent submit — appears as soon as all answered */}
      {Object.keys(answers).length === totalQ ? (
        <button onClick={() => { const s = questions.filter((q,i) => answers[i] === q.answer).length; setSubmitted(true); onQuizComplete?.(s, totalQ); }}
          style={{ width: "100%", marginTop: 12, padding: "12px", background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Submit Quiz ✓
        </button>
      ) : (
        <div style={{ marginTop: 10, fontSize: 11, color: "#555", textAlign: "center" }}>
          {Object.keys(answers).length}/{totalQ} answered
        </div>
      )}
    </div>
  );
}

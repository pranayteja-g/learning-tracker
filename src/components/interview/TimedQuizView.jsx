import { useState, useEffect, useRef } from "react";

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function TimedQuizView({ questions, rm, timeLimitSeconds }) {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(timeLimitSeconds);
  const [started,   setStarted]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, submitted]);

  const score      = questions.filter((q, i) => answers[i] === q.answer).length;
  const totalQ     = questions.length;
  const pct        = Math.round((timeLeft / timeLimitSeconds) * 100);
  const timerColor = pct > 50 ? "#52b788" : pct > 20 ? "#ee9b00" : "#e05252";
  const timeUsed   = timeLimitSeconds - timeLeft;

  if (!started) return (
    <div style={{ padding: "20px 20px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⏱️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Timed Quiz</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
        {totalQ} questions · {fmt(timeLimitSeconds)} time limit
      </div>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 24, lineHeight: 1.6 }}>
        Timer starts when you click Begin. Unanswered questions count as wrong.
        Answer all questions before time runs out.
      </div>
      <button onClick={() => setStarted(true)}
        style={{ padding: "12px 32px", background: rm.color, border: "none",
          borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit" }}>
        Begin →
      </button>
    </div>
  );

  if (submitted) {
    const mins = Math.floor(timeUsed / 60);
    const secs = timeUsed % 60;
    return (
      <div style={{ padding: "0 20px 20px" }}>
        {/* Score card */}
        <div style={{ background: "#16161b", border: `1px solid ${rm.color}44`,
          borderRadius: 10, padding: "20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 700,
            color: score >= totalQ * 0.7 ? "#52b788" : "#ee9b00" }}>
            {score}/{totalQ}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            {timeLeft === 0 ? "⏰ Time's up!" : `Finished in ${mins > 0 ? `${mins}m ` : ""}${secs}s`}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {score === totalQ ? "Perfect! 🎉" : score >= totalQ * 0.7 ? "Great job! 👍" : "Keep practising! 📚"}
          </div>
        </div>

        {/* Review */}
        {questions.map((q, qi) => {
          const correct = answers[qi] === q.answer;
          return (
            <div key={qi} style={{ background: "#16161b", borderRadius: 10, padding: "12px",
              marginBottom: 10, border: `1px solid ${correct ? "#52b78844" : "#e0525244"}` }}>
              <div style={{ fontSize: 12, color: "#ccc", marginBottom: 8, lineHeight: 1.5 }}>
                <span style={{ color: "#555", marginRight: 6 }}>Q{qi+1}.</span>{q.question}
              </div>
              {Object.entries(q.options).map(([opt, text]) => {
                const isCorrect  = opt === q.answer;
                const isSelected = opt === answers[qi];
                const bg    = isCorrect ? "#1a2e1a" : isSelected ? "#2e1a1a" : "#0f0f13";
                const color = isCorrect ? "#52b788" : isSelected ? "#e05252" : "#555";
                const border= isCorrect ? "#52b78844" : isSelected ? "#e0525244" : "#1e1e24";
                return (
                  <div key={opt} style={{ padding: "6px 10px", borderRadius: 5, marginBottom: 4,
                    background: bg, border: `1px solid ${border}`, color, fontSize: 11 }}>
                    <strong>{opt}.</strong> {text}
                  </div>
                );
              })}
              {!answers[qi] && (
                <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontStyle: "italic" }}>Not answered</div>
              )}
              <div style={{ fontSize: 11, color: "#52b788", marginTop: 6, background: "#1a2e1a",
                padding: "5px 8px", borderRadius: 4 }}>💡 {q.explanation}</div>
            </div>
          );
        })}

        <button onClick={() => { setAnswers({}); setSubmitted(false); setCurrent(0);
          setTimeLeft(timeLimitSeconds); setStarted(false); }}
          style={{ width: "100%", padding: "10px", marginTop: 4, background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Try Again
        </button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Timer bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: "#555" }}>Q {current+1}/{totalQ}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: timerColor,
          fontVariantNumeric: "tabular-nums" }}>⏱ {fmt(timeLeft)}</div>
      </div>
      <div style={{ background: "#1e1e24", borderRadius: 4, height: 6, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: timerColor,
          borderRadius: 4, transition: "width 1s linear, background 0.5s" }} />
      </div>

      {/* Question */}
      <div style={{ background: "#16161b", borderRadius: 10, padding: "14px",
        border: `1px solid ${rm.color}33`, marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: "#e8e6e0", lineHeight: 1.6 }}>{q.question}</div>
      </div>

      {/* Options */}
      {Object.entries(q.options).map(([opt, text]) => {
        const selected = answers[current] === opt;
        return (
          <button key={opt} onClick={() => setAnswers(a => ({ ...a, [current]: opt }))}
            style={{ width: "100%", padding: "10px 13px", marginBottom: 7, textAlign: "left",
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
        {current < totalQ - 1
          ? <button onClick={() => setCurrent(c => c + 1)}
              style={{ flex: 1, padding: "9px", background: rm.color + "22",
                border: `1px solid ${rm.color}44`, borderRadius: 7, color: rm.accent,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Next →</button>
          : <button onClick={() => { clearInterval(timerRef.current); setSubmitted(true); }}
              style={{ flex: 1, padding: "9px", background: rm.color, border: "none",
                borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit" }}>Submit</button>
        }
      </div>

      {/* Question dots */}
      <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
        {questions.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)}
            style={{ width: 18, height: 6, borderRadius: 3, cursor: "pointer",
              background: i === current ? rm.color : answers[i] ? rm.color + "55" : "#1e1e24" }} />
        ))}
      </div>
    </div>
  );
}

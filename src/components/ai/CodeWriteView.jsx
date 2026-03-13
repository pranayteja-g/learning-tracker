import { useState, useRef, useEffect } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { MessageRenderer } from "./MessageRenderer.jsx";

export function CodeWriteView({ questions, rm }) {
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({});   // idx -> code string
  const [feedback,  setFeedback]  = useState({});   // idx -> {loading, result}
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef(null);

  const q      = questions[current];
  const totalQ = questions.length;

  useEffect(() => {
    textareaRef.current?.focus();
  }, [current]);

  const evaluate = async (idx) => {
    const code = answers[idx]?.trim();
    if (!code) return;
    setFeedback(f => ({ ...f, [idx]: { loading: true, result: null } }));

    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) throw new Error("No API key configured.");

      const q = questions[idx];
      const { text } = await callAI({
        provider:     cfg.provider,
        apiKey,
        systemPrompt: `You are a strict but fair code evaluator. Evaluate the student's code submission and respond ONLY with valid JSON.`,
        userPrompt: `Question: ${q.question}
Expected: ${q.expectedBehaviour}
Language: ${q.language}
Student's code:
\`\`\`${q.language}
${code}
\`\`\`

Respond ONLY with JSON:
{
  "correct": true | false,
  "score": 0-100,
  "verdict": "one sentence verdict",
  "feedback": "2-3 sentences: what they got right, what's wrong or missing, key improvement",
  "modelAnswer": "the ideal clean solution as a code string with \\n for newlines"
}`,
      });

      const clean  = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(clean);
      setFeedback(f => ({ ...f, [idx]: { loading: false, result } }));
    } catch (e) {
      setFeedback(f => ({ ...f, [idx]: { loading: false, error: e.message } }));
    }
  };

  const allEvaluated = questions.every((_, i) => feedback[i]?.result);
  const totalScore   = allEvaluated
    ? Math.round(questions.reduce((s, _, i) => s + (feedback[i]?.result?.score || 0), 0) / totalQ)
    : 0;

  if (submitted && allEvaluated) {
    return (
      <div style={{ padding: "16px 20px 32px" }}>
        {/* Score */}
        <div style={{ background: "#16161b", border: `2px solid ${totalScore >= 70 ? "#52b788" : "#ee9b00"}44`,
          borderRadius: 12, padding: "24px 16px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>{totalScore === 100 ? "🎉" : totalScore >= 70 ? "✅" : "📚"}</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: totalScore >= 70 ? "#52b788" : "#ee9b00", lineHeight: 1 }}>
            {totalScore}%
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>avg across {totalQ} coding {totalQ === 1 ? "challenge" : "challenges"}</div>
        </div>

        {/* Per-question review */}
        {questions.map((q, i) => {
          const fb = feedback[i]?.result;
          return (
            <div key={i} style={{ background: "#16161b", borderRadius: 10, padding: "14px",
              marginBottom: 12, border: `1px solid ${fb?.correct ? "#52b78844" : "#ee9b0044"}` }}>
              <div style={{ fontSize: 11, color: fb?.correct ? "#52b788" : "#ee9b00",
                marginBottom: 8, fontWeight: 700 }}>
                Q{i+1} · {fb?.score}% · {fb?.verdict}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{q.question}</div>

              {/* Student answer */}
              <div style={{ fontSize: 10, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Your code</div>
              <div style={{ background: "#0d1117", borderRadius: 6, border: "1px solid #1e1e24",
                overflowX: "auto", marginBottom: 10 }}>
                <pre style={{ margin: 0, padding: "10px 12px", fontSize: 11, color: "#c9d1d9",
                  lineHeight: 1.6, fontFamily: "'Fira Code','Consolas',monospace",
                  whiteSpace: "pre", minWidth: "max-content" }}>
                  {answers[i] || "(no answer)"}
                </pre>
              </div>

              {/* Feedback */}
              <div style={{ fontSize: 12, color: "#bbb", background: "#0f0f13", borderRadius: 6,
                padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                💬 {fb?.feedback}
              </div>

              {/* Model answer */}
              {!fb?.correct && fb?.modelAnswer && (
                <>
                  <div style={{ fontSize: 10, color: "#52b788", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Model answer</div>
                  <div style={{ background: "#0d1117", borderRadius: 6, border: "1px solid #52b78833",
                    overflowX: "auto" }}>
                    <pre style={{ margin: 0, padding: "10px 12px", fontSize: 11, color: "#c9d1d9",
                      lineHeight: 1.6, fontFamily: "'Fira Code','Consolas',monospace",
                      whiteSpace: "pre", minWidth: "max-content" }}>
                      {(fb.modelAnswer || "").replace(/\\n/g, "\n")}
                    </pre>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <button onClick={() => { setAnswers({}); setFeedback({}); setSubmitted(false); setCurrent(0); }}
          style={{ width: "100%", padding: "10px", marginTop: 4, background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Try Again
        </button>
      </div>
    );
  }

  const fb = feedback[current];

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#555" }}>Challenge {current + 1} of {totalQ}</div>
        <div style={{ display: "flex", gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: 20, height: 6, borderRadius: 3, cursor: "pointer",
                background: i === current ? rm.color
                  : feedback[i]?.result?.correct ? "#52b788"
                  : feedback[i]?.result ? "#ee9b00"
                  : answers[i] ? rm.color + "55" : "#1e1e24" }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ background: "#16161b", borderRadius: 10, padding: "14px",
        marginBottom: 12, border: `1px solid ${rm.color}33` }}>
        <div style={{ fontSize: 11, color: rm.accent, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8 }}>
          💻 {q.language} · {q.difficulty || "challenge"}
        </div>
        <MessageRenderer content={q.question} accentColor={rm.accent} />
        {q.hints && (
          <div style={{ fontSize: 11, color: "#555", marginTop: 8, fontStyle: "italic" }}>
            💡 Hint: {q.hints}
          </div>
        )}
      </div>

      {/* Code editor */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 6 }}>Your code ({q.language})</div>
        <textarea
          ref={textareaRef}
          value={answers[current] || ""}
          onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))}
          placeholder={`// Write your ${q.language} code here...\n`}
          spellCheck={false}
          style={{
            width: "100%", minHeight: 180, padding: "12px",
            background: "#0d1117", border: `1px solid ${fb?.result ? (fb.result.correct ? "#52b78888" : "#ee9b0088") : "#2a2a35"}`,
            borderRadius: 8, color: "#c9d1d9",
            fontFamily: "'Fira Code','Consolas',monospace", fontSize: 13,
            lineHeight: 1.7, resize: "vertical", outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Feedback */}
      {fb?.loading && (
        <div style={{ background: "#16161b", borderRadius: 8, padding: "12px",
          marginBottom: 10, fontSize: 13, color: "#555", textAlign: "center" }}>
          Evaluating your code…
        </div>
      )}
      {fb?.error && (
        <div style={{ background: "#2e1a1a", borderRadius: 8, padding: "10px 12px",
          marginBottom: 10, fontSize: 12, color: "#e05252" }}>
          {fb.error}
        </div>
      )}
      {fb?.result && (
        <div style={{ background: fb.result.correct ? "#1a2e1a" : "#2a1e0f", borderRadius: 8,
          padding: "12px", marginBottom: 10, border: `1px solid ${fb.result.correct ? "#52b78844" : "#ee9b0044"}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: fb.result.correct ? "#52b788" : "#ee9b00",
            marginBottom: 6 }}>
            {fb.result.correct ? "✓ Correct" : "✗ Needs work"} · {fb.result.score}%
          </div>
          <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6 }}>{fb.result.feedback}</div>
          {!fb.result.correct && fb.result.modelAnswer && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "#52b788", marginBottom: 4,
                textTransform: "uppercase", letterSpacing: 1 }}>Model answer</div>
              <div style={{ background: "#0d1117", borderRadius: 6, overflowX: "auto" }}>
                <pre style={{ margin: 0, padding: "10px", fontSize: 11, color: "#c9d1d9",
                  fontFamily: "'Fira Code','Consolas',monospace",
                  whiteSpace: "pre", minWidth: "max-content", lineHeight: 1.6 }}>
                  {(fb.result.modelAnswer || "").replace(/\\n/g, "\n")}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evaluate button */}
      {!fb?.result && (
        <button onClick={() => evaluate(current)}
          disabled={!answers[current]?.trim() || fb?.loading}
          style={{ width: "100%", padding: "10px", marginBottom: 8,
            background: answers[current]?.trim() ? rm.color + "22" : "#1e1e24",
            border: `1px solid ${answers[current]?.trim() ? rm.color + "44" : "#2a2a35"}`,
            borderRadius: 8, color: answers[current]?.trim() ? rm.accent : "#444",
            fontSize: 13, cursor: answers[current]?.trim() ? "pointer" : "default",
            fontFamily: "inherit", fontWeight: 600 }}>
          {fb?.loading ? "Evaluating…" : "Evaluate ↑"}
        </button>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8 }}>
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

      {/* Submit all */}
      {questions.every((_, i) => feedback[i]?.result) && (
        <button onClick={() => setSubmitted(true)}
          style={{ width: "100%", marginTop: 10, padding: "12px", background: rm.color,
            border: "none", borderRadius: 8, color: "#fff", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          See Results ✓
        </button>
      )}
    </div>
  );
}

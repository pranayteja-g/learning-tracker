import { useState, useEffect } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { buildQuizPrompt, buildCodeChallengePrompt } from "../../ai/prompts.js";
import { buildQuizContext } from "../../ai/context.js";
import { QuizView }      from "../ai/QuizView.jsx";
import { CodeWriteView } from "../ai/CodeWriteView.jsx";

const PHASE_NAMES = ["📖 Read", "🧠 MCQ", "💻 Code", "💬 Q&A"];

// ── Q&A Phase ────────────────────────────────────────────────────────────────
function QAPhase({ quest, rm, onComplete }) {
  const [questions, setQuestions] = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [generating, setGenerating] = useState(true);

  useEffect(() => { generateQuestions(); }, []);

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const cfg = loadAIConfig();
      const { text } = await callAI({
        provider: cfg.provider, apiKey: cfg.keys?.[cfg.provider],
        systemPrompt: "You are a technical interview examiner. Generate open-ended questions. Respond ONLY with valid JSON.",
        userPrompt: `Generate exactly ${quest.phases.qa.count} open-ended questions testing deep understanding of: ${quest.topics.join(", ")} from ${quest.roadmapLabel}.

${quest.phases.qa.instruction}

Respond ONLY with JSON array:
[{ "question": "...", "topic": "...", "whatToLookFor": "key points a good answer must cover" }]`,
        maxTokens: 1024,
      });
      const clean = text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
      setQuestions(JSON.parse(clean));
    } catch(e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const evaluateAnswer = async (idx) => {
    const q = questions[idx];
    const ans = answers[idx]?.trim();
    if (!ans) return;
    setLoading(true);
    try {
      const cfg = loadAIConfig();
      const { text } = await callAI({
        provider: cfg.provider, apiKey: cfg.keys?.[cfg.provider],
        systemPrompt: "You are a strict technical examiner. Evaluate answers objectively. Respond ONLY with valid JSON.",
        userPrompt: `Question: ${q.question}
What to look for: ${q.whatToLookFor}
Student answer: "${ans}"

Respond ONLY with JSON:
{ "passed": true|false, "score": 0-100, "feedback": "2-3 sentences: what was good, what was missing", "missingPoints": ["key point missed"] }`,
        maxTokens: 512,
      });
      const clean = text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
      setFeedbacks(f => ({ ...f, [idx]: JSON.parse(clean) }));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const allEvaluated = questions && questions.every((_, i) => feedbacks[i]);
  const avgScore = allEvaluated
    ? Math.round(questions.reduce((s, _, i) => s + (feedbacks[i]?.score || 0), 0) / questions.length)
    : 0;
  const passed = avgScore >= 70;

  if (generating) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
      Generating Q&A questions…
    </div>
  );

  if (error) return (
    <div style={{ padding: "20px", color: "#e05252" }}>{error}</div>
  );

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {questions?.map((q, i) => (
        <div key={i} style={{ background: "#16161b", borderRadius: 10, padding: "14px",
          marginBottom: 12, border: `1px solid ${feedbacks[i] ? (feedbacks[i].passed ? "#52b78844" : "#e0525244") : "#2a2a35"}` }}>
          <div style={{ fontSize: 13, color: "#e8e6e0", marginBottom: 10, lineHeight: 1.6, fontWeight: 600 }}>
            Q{i+1}. {q.question}
          </div>
          <textarea
            value={answers[i] || ""}
            onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
            disabled={!!feedbacks[i]}
            placeholder="Write your answer here…"
            style={{ width: "100%", minHeight: 100, padding: "10px", background: "#0f0f13",
              border: "1px solid #2a2a35", borderRadius: 6, color: "#ccc",
              fontSize: 13, fontFamily: "inherit", lineHeight: 1.5,
              resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
          {!feedbacks[i] ? (
            <button onClick={() => evaluateAnswer(i)}
              disabled={!answers[i]?.trim() || loading}
              style={{ marginTop: 8, padding: "7px 16px", background: "#7b5ea722",
                border: "1px solid #7b5ea744", borderRadius: 6, color: "#c4b5fd",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              {loading ? "Evaluating…" : "Submit Answer"}
            </button>
          ) : (
            <div style={{ marginTop: 8, padding: "10px", borderRadius: 6,
              background: feedbacks[i].passed ? "#1a2e1a" : "#2e1a1a",
              border: `1px solid ${feedbacks[i].passed ? "#52b78844" : "#e0525244"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: feedbacks[i].passed ? "#52b788" : "#e05252", marginBottom: 4 }}>
                {feedbacks[i].passed ? "✓ Pass" : "✗ Fail"} · {feedbacks[i].score}%
              </div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{feedbacks[i].feedback}</div>
            </div>
          )}
        </div>
      ))}

      {allEvaluated && (
        <button onClick={() => onComplete({ score: avgScore, passed })}
          style={{ width: "100%", padding: "12px", marginTop: 4,
            background: passed ? "#52b788" : "#e05252",
            border: "none", borderRadius: 8, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {passed ? `Submit — Passed (${avgScore}%) ✓` : `Submit — Failed (${avgScore}%)`}
        </button>
      )}
    </div>
  );
}

// ── Read Phase ────────────────────────────────────────────────────────────────
function ReadPhase({ quest, onComplete }) {
  const [checked, setChecked] = useState({});
  const allChecked = quest.topics.every((_, i) => checked[i]);

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ background: "#16161b", borderRadius: 10, padding: "14px",
        marginBottom: 14, border: "1px solid #7b5ea744" }}>
        <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, marginBottom: 8 }}>
          📖 Before you begin — review these topics
        </div>
        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, marginBottom: 12 }}>
          {quest.phases.read.instruction}
        </div>
        {quest.topics.map((t, i) => (
          <div key={i} onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: i < quest.topics.length - 1 ? "1px solid #1e1e24" : "none",
              cursor: "pointer" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${checked[i] ? "#7b5ea7" : "#333"}`,
              background: checked[i] ? "#7b5ea7" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {checked[i] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: checked[i] ? "#c4b5fd" : "#888",
              textDecoration: checked[i] ? "line-through" : "none" }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 12, fontStyle: "italic" }}>
        ✓ Check each topic once you've reviewed it. The test will be hard — come prepared.
      </div>
      <button onClick={onComplete} disabled={!allChecked}
        style={{ width: "100%", padding: "12px", background: allChecked ? "#7b5ea7" : "#1e1e24",
          border: "none", borderRadius: 8, color: allChecked ? "#fff" : "#444",
          fontSize: 14, fontWeight: 700, cursor: allChecked ? "pointer" : "default",
          fontFamily: "inherit" }}>
        {allChecked ? "Ready — Start Test →" : `Check all ${quest.topics.length} topics to proceed`}
      </button>
    </div>
  );
}

// ── Main QuestModal ───────────────────────────────────────────────────────────
export function QuestModal({ quest, roadmaps, progress, onAdvancePhase, onCompleteQuest, onClose }) {
  const [phaseData,    setPhaseData]    = useState(null);
  const [loadingPhase, setLoadingPhase] = useState(false);
  const [error,        setError]        = useState("");

  const rm = roadmaps?.[quest.roadmapId];
  if (!rm) return null; // roadmap deleted or not loaded yet

  useEffect(() => {
    if (quest.phase > 0 && !phaseData) generatePhaseContent();
  }, [quest.phase]);

  const generatePhaseContent = async () => {
    setLoadingPhase(true); setError("");
    try {
      const cfg = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) throw new Error("No API key configured.");

      const ctx = buildQuizContext({ roadmap: rm, progress, scope: "topics",
        topicOverride: quest.topics });

      let userPrompt, text;
      if (quest.phase === 1) {
        userPrompt = buildQuizPrompt(ctx, quest.phases.mcq.count, quest.phases.mcq.difficulty);
      } else if (quest.phase === 2) {
        userPrompt = buildCodeChallengePrompt(ctx, quest.phases.code.count, quest.phases.code.difficulty);
      }

      if (userPrompt) {
        const res = await callAI({ provider: cfg.provider, apiKey,
          systemPrompt: "You are a technical quiz generator. Respond ONLY with valid JSON.",
          userPrompt, maxTokens: 8192 });
        text = res.text;
        const firstBrace = text.indexOf("{"), firstBracket = text.indexOf("[");
        const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
        const match = isArray ? text.match(/\[[\s\S]*\]/) : text.match(/\{[\s\S]*\}/);
        setPhaseData(match ? JSON.parse(match[0]) : JSON.parse(text));
      }
    } catch(e) { setError(e.message); }
    finally { setLoadingPhase(false); }
  };

  const handlePhaseComplete = (result) => {
    const currentPhase = quest.phase;
    onAdvancePhase({ ...result, phase: currentPhase });
    setPhaseData(null);

    // After phase 3 (Q&A), evaluate overall pass/fail using all collected results
    if (currentPhase === 3) {
      // Collect all phase results including the current one
      const allResults = { ...quest.phaseResults, [currentPhase]: result };
      const mcqPassed  = (allResults[1]?.score || 0) >= 80;
      const codePassed = (allResults[2]?.score || 0) >= 70;
      const qaPassed   = result.passed;
      onCompleteQuest(mcqPassed && codePassed && qaPassed);
    }
  };

  const phase = quest.phase;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex",
      flexDirection: "column", background: "#0f0f13" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24",
        paddingTop: "calc(14px + env(safe-area-inset-top))",
        background: "#13131a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#555",
              fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🎯 {quest.title}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{quest.roadmapLabel}</div>
          </div>
          {/* Phase progress dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {PHASE_NAMES.map((_, i) => (
              <div key={i} style={{ width: i === phase ? 20 : 7, height: 7, borderRadius: 4,
                transition: "width 0.3s",
                background: i < phase ? "#52b788" : i === phase ? "#7b5ea7" : "#1e1e24" }} />
            ))}
          </div>
        </div>
        {/* Phase label */}
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {PHASE_NAMES.map((name, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center",
              fontSize: 10, color: i === phase ? "#c4b5fd" : i < phase ? "#52b788" : "#333",
              fontWeight: i === phase ? 700 : 400 }}>
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {error && (
          <div style={{ margin: "16px 20px", padding: "12px", background: "#2e1a1a",
            borderRadius: 8, color: "#e05252", fontSize: 13 }}>{error}</div>
        )}

        {loadingPhase && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
            Generating {PHASE_NAMES[phase]} questions…
          </div>
        )}

        {!loadingPhase && !error && (
          <>
            {phase === 0 && (
              <ReadPhase quest={quest} onComplete={() => handlePhaseComplete({ passed: true, score: 100 })} />
            )}
            {phase === 1 && phaseData && (
              <QuizView questions={phaseData} rm={rm}
                onQuizComplete={(score, total) => handlePhaseComplete({
                  score: Math.round((score/total)*100),
                  passed: Math.round((score/total)*100) >= 80,
                })} />
            )}
            {phase === 2 && phaseData && (
              <CodeWriteView questions={phaseData} rm={rm}
                onQuizComplete={(score) => handlePhaseComplete({ score, passed: score >= 70 })} />
            )}
            {phase === 3 && (
              <QAPhase quest={quest} rm={rm} onComplete={handlePhaseComplete} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

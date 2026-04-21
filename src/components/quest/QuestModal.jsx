import { useState, useEffect, useCallback } from "react";
import { callAI, loadAIConfig } from "../../ai/providers.js";
import { buildQuizPrompt, buildCodeChallengePrompt } from "../../ai/prompts.js";
import { buildQuizContext } from "../../ai/context.js";
import { safeParseJSON } from "../../utils/jsonParse.js";
import { QuizView }           from "../ai/QuizView.jsx";
import { CodeWriteView }      from "../ai/CodeWriteView.jsx";
import { QuestRewardScreen }  from "./QuestRewardScreen.jsx";

const ALL_PHASES = [
  { name: "📖 Read", key: "read",  pass: null, next: "MCQ Quiz"          },
  { name: "🧠 MCQ",  key: "mcq",   pass: 80,   next: "Code Challenges"   },
  { name: "💻 Code", key: "code",  pass: 70,   next: "Open Q&A"          },
  { name: "💬 Q&A",  key: "qa",    pass: 70,   next: null                },
];

function getActivePhases(quest) {
  return ALL_PHASES.filter(p => p.key === "read" || p.key === "mcq" || p.key === "qa" || quest.phases?.code != null);
}

// ── Phase Result Screen ───────────────────────────────────────────────────────
function PhaseResult({ phase, result, onContinue, onClose, color, accent, activePhases }) {
  const passed    = result.passed;
  const phaseInfo = activePhases[phase] || {};
  const threshold = phaseInfo.pass;
  const nextPhase = activePhases[phase + 1] ? phaseInfo.next : null;

  return (
    <div style={{ padding: "24px 20px" }}>
      {/* Score card */}
      <div style={{ background: "#16161b", borderRadius: 14,
        border: `2px solid ${passed ? "#52b78844" : "#e0525244"}`,
        padding: "28px 20px", textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {passed ? (phase === 3 ? "🏆" : "✅") : "❌"}
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1,
          color: passed ? "#52b788" : "#e05252" }}>
          {result.score}%
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
          {phaseInfo.name} · {passed ? "Passed" : "Failed"}
          {threshold && <span style={{ color: "#444" }}> (required {threshold}%)</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12,
          color: passed ? "#52b788" : "#e05252" }}>
          {passed
            ? phase === 3 ? "Quest Complete! All phases passed." : `Great work! Phase ${phase + 1} cleared.`
            : `You needed ${threshold}% to pass this phase.`}
        </div>
      </div>

      {passed && nextPhase && (
        <>
          {/* Next phase preview */}
          <div style={{ background: "#16161b", borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${color}33`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 8 }}>Next Phase</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {activePhases[phase + 1]?.name}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {phase === 1 && "Write and evaluate code solutions for the quest topics."}
              {phase === 2 && "Answer open-ended questions — AI will evaluate the depth of your understanding."}
            </div>
            {activePhases[phase + 1]?.pass && (
              <div style={{ fontSize: 11, color: accent, marginTop: 6 }}>
                Pass threshold: {activePhases[phase + 1]?.pass}%
              </div>
            )}
          </div>
          <button onClick={onContinue}
            style={{ width: "100%", padding: "13px", background: color,
              border: "none", borderRadius: 9, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Continue to {nextPhase} →
          </button>
        </>
      )}

      {passed && !nextPhase && (
        <button onClick={onClose}
          style={{ width: "100%", padding: "13px", background: "#52b788",
            border: "none", borderRadius: 9, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🏆 Close & Claim Reward
        </button>
      )}

      {!passed && (
        <>
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "14px 16px",
            border: "1px solid #2a2a35", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
              💡 The quest has been failed. Use the cooldown period to review the topics
              and strengthen your understanding before the next attempt.
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: "100%", padding: "13px", background: "#1e1e24",
              border: "1px solid #2a2a35", borderRadius: 9, color: "#888",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Close — Try Again in 4 Hours
          </button>
        </>
      )}
    </div>
  );
}

// ── Q&A Phase ────────────────────────────────────────────────────────────────
function QAPhase({ quest, onComplete }) {
  const [questions,  setQuestions]  = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [feedbacks,  setFeedbacks]  = useState({});
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [generating, setGenerating] = useState(true);

  const generateQuestions = useCallback(async () => {
    setGenerating(true);
    try {
      const cfg = loadAIConfig();
      const { text } = await callAI({
        provider: cfg.provider, apiKey: cfg.keys?.[cfg.provider],
        systemPrompt: "You are a technical interview examiner. Respond ONLY with valid JSON.",
        userPrompt: `Generate exactly ${quest.phases.qa.count} open-ended questions testing deep understanding of: ${quest.topics.join(", ")} from ${quest.roadmapLabel}.

${quest.phases.qa.instruction}

Respond ONLY with JSON array:
[{ "question": "...", "topic": "...", "whatToLookFor": "key points a good answer must cover" }]`,
        maxTokens: 1024,
      });
      const clean = text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      setQuestions(safeParseJSON(match ? match[0] : clean));
    } catch(e) { setError(e.message); }
    finally { setGenerating(false); }
  }, [quest.phases.qa.count, quest.phases.qa.instruction, quest.roadmapLabel, quest.topics]);

  useEffect(() => { generateQuestions(); }, [generateQuestions]);

  const evaluateAnswer = async (idx) => {
    const q = questions[idx];
    const ans = answers[idx]?.trim();
    if (!ans) return;
    setLoading(true);
    try {
      const cfg = loadAIConfig();
      const { text } = await callAI({
        provider: cfg.provider, apiKey: cfg.keys?.[cfg.provider],
        systemPrompt: "You are a strict technical examiner. Respond ONLY with valid JSON.",
        userPrompt: `Question: ${q.question}
What to look for: ${q.whatToLookFor}
Student answer: "${ans}"

Respond ONLY with JSON:
{ "passed": true|false, "score": 0-100, "feedback": "2-3 sentences: what was good, what was missing" }`,
        maxTokens: 512,
      });
      const clean = text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      setFeedbacks(f => ({ ...f, [idx]: safeParseJSON(match ? match[0] : clean) }));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const allEvaluated = questions && questions.every((_, i) => feedbacks[i]);
  const avgScore = allEvaluated
    ? Math.round(questions.reduce((s, _, i) => s + (feedbacks[i]?.score || 0), 0) / questions.length)
    : 0;

  if (generating) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
      Generating Q&A questions…
    </div>
  );
  if (error) return <div style={{ padding: "20px", color: "#e05252" }}>{error}</div>;

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
              <div style={{ fontSize: 12, fontWeight: 700,
                color: feedbacks[i].passed ? "#52b788" : "#e05252", marginBottom: 4 }}>
                {feedbacks[i].passed ? "✓ Pass" : "✗ Fail"} · {feedbacks[i].score}%
              </div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{feedbacks[i].feedback}</div>
            </div>
          )}
        </div>
      ))}

      {allEvaluated && (
        <button onClick={() => onComplete({ score: avgScore, passed: avgScore >= 70 })}
          style={{ width: "100%", padding: "12px", marginTop: 4,
            background: avgScore >= 70 ? "#52b788" : "#e05252",
            border: "none", borderRadius: 8, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {avgScore >= 70 ? `Submit — Passed (${avgScore}%) ✓` : `Submit — Failed (${avgScore}%)`}
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
export function QuestModal({ quest, rmId, roadmaps, progress, onAdvancePhase, onCompleteQuest, onClose }) {
  const [phaseData,    setPhaseData]    = useState(null);
  const [phaseResult,  setPhaseResult]  = useState(null);
  const [rewardData,   setRewardData]   = useState(null);  // show reward on full completion
  const [loadingPhase, setLoadingPhase] = useState(false);
  const [error,        setError]        = useState("");

  const rm = roadmaps?.[quest.roadmapId];
  const activePhases = getActivePhases(quest);

  const generatePhaseContent = useCallback(async () => {
    setLoadingPhase(true); setError("");
    try {
      const cfg    = loadAIConfig();
      const apiKey = cfg.keys?.[cfg.provider];
      if (!apiKey) throw new Error("No API key configured.");

      const ctx = buildQuizContext({ roadmap: rm, progress,
        scope: "topics", topicOverride: quest.topics });

      let userPrompt;
      const currentPhaseKey = activePhases[quest.phase]?.key;
      if (currentPhaseKey === "mcq")  userPrompt = buildQuizPrompt(ctx, quest.phases.mcq.count, quest.phases.mcq.difficulty);
      else if (currentPhaseKey === "code") userPrompt = buildCodeChallengePrompt(ctx, quest.phases.code.count, quest.phases.code.difficulty);

      if (userPrompt) {
        const res = await callAI({ provider: cfg.provider, apiKey,
          systemPrompt: "You are a technical quiz generator. Respond ONLY with valid JSON.",
          userPrompt, maxTokens: 8192 });
        const text = res.text.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
        const firstBrace = text.indexOf("{"), firstBracket = text.indexOf("[");
        const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
        const match = isArray ? text.match(/\[[\s\S]*\]/) : text.match(/\{[\s\S]*\}/);
        setPhaseData(match ? safeParseJSON(match[0]) : safeParseJSON(text));
      }
    } catch(e) { setError(e.message); }
    finally { setLoadingPhase(false); }
  }, [activePhases, progress, quest, rm]);

  useEffect(() => {
    if (!rm) return;
    if (quest.phase > 0 && !phaseData && !phaseResult) generatePhaseContent();
  }, [generatePhaseContent, phaseData, phaseResult, quest.phase, rm]);

  if (!rm) return null;

  const handlePhaseComplete = (result) => {
    const currentPhase = quest.phase;

    // Show phase result screen
    setPhaseResult({ phase: currentPhase, result });
    setPhaseData(null);

    // Always record the result
    onAdvancePhase(rmId, { ...result, phase: currentPhase });

    // If failed, complete the quest as failed immediately
    if (!result.passed && currentPhase > 0) {
      onCompleteQuest(rmId, false);
    }

    // If last phase passed, complete as passed and show reward
    if (currentPhase === activePhases.length - 1 && result.passed) {
      const allResults = { ...quest.phaseResults, [currentPhase]: result };
      const mcqIdx  = activePhases.findIndex(p => p.key === "mcq");
      const codeIdx = activePhases.findIndex(p => p.key === "code");
      const mcqPassed  = mcqIdx  >= 0 ? (allResults[mcqIdx]?.score  || 0) >= 80 : true;
      const codePassed = codeIdx >= 0 ? (allResults[codeIdx]?.score || 0) >= 70 : true;
      const passed = mcqPassed && codePassed && result.passed;
      const rewardInfo = onCompleteQuest(rmId, passed, allResults, activePhases);
      if (passed && rewardInfo) {
        const prevXP = rewardInfo.prevXP || 0;
        // awardXP is async (AI badge generation) — await it then show reward
        rewardInfo.awardXP?.().then(result => {
          setRewardData({
            phaseResults: allResults,
            activePhases,
            xpEarned:  result?.earned || 0,
            prevXP,
            newXP:     prevXP + (result?.earned || 0),
            newBadges: rewardInfo.xpData?.lastNewBadges || [],
            aiBadge:   result?.aiBadge || null,
          });
        });
      }
    }
  };

  const handleContinue = () => {
    setPhaseResult(null);
    // Phase was already advanced via onAdvancePhase — content will auto-generate
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
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {activePhases.map((_, i) => {
              const pr = quest.phaseResults?.[i];
              return (
                <div key={i} style={{ width: i === phase ? 20 : 7, height: 7, borderRadius: 4,
                  transition: "width 0.3s",
                  background: pr ? (pr.passed ? "#52b788" : "#e05252")
                    : i === phase ? "#7b5ea7" : "#1e1e24" }} />
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {activePhases.map((p, i) => {
            const pr = quest.phaseResults?.[i];
            return (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10,
                color: pr ? (pr.passed ? "#52b788" : "#e05252")
                  : i === phase ? "#c4b5fd" : "#333",
                fontWeight: i === phase ? 700 : 400 }}>
                {p.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>

        {/* Reward screen */}
        {rewardData && (
          <QuestRewardScreen
            quest={quest}
            phaseResults={rewardData.phaseResults}
            activePhases={rewardData.activePhases}
            xpEarned={rewardData.xpEarned}
            prevXP={rewardData.prevXP}
            newXP={rewardData.newXP}
            newBadges={rewardData.newBadges}
            aiBadge={rewardData.aiBadge}
            onClose={onClose}
          />
        )}

        {/* Phase result screen */}
        {!rewardData && phaseResult && (
          <PhaseResult
            phase={phaseResult.phase}
            result={phaseResult.result}
            color={rm.color} accent={rm.accent}
            activePhases={activePhases}
            onContinue={handleContinue}
            onClose={onClose}
          />
        )}

        {!phaseResult && (
          <>
            {error && (
              <div style={{ margin: "16px 20px", padding: "12px", background: "#2e1a1a",
                borderRadius: 8, color: "#e05252", fontSize: 13 }}>{error}</div>
            )}
            {loadingPhase && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
                Generating {activePhases[phase]?.name} questions…
              </div>
            )}
            {!loadingPhase && !error && (
              <>
                {activePhases[phase]?.key === "read" && (
                  <ReadPhase quest={quest}
                    onComplete={() => handlePhaseComplete({ passed: true, score: 100 })} />
                )}
                {activePhases[phase]?.key === "mcq" && phaseData && (
                  <QuizView questions={phaseData} rm={rm}
                    onQuizComplete={(score, total) => handlePhaseComplete({
                      score: Math.round((score/total)*100),
                      passed: Math.round((score/total)*100) >= 80,
                    })} />
                )}
                {activePhases[phase]?.key === "code" && phaseData && (
                  <CodeWriteView questions={phaseData} rm={rm}
                    onComplete={(score) => handlePhaseComplete({ score, passed: score >= 70 })} />
                )}
                {activePhases[phase]?.key === "qa" && (
                  <QAPhase quest={quest} onComplete={handlePhaseComplete} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

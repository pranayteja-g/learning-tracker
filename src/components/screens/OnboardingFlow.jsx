import { useState } from "react";
import { TEMPLATES } from "../../constants/templates.js";
import { loadAIConfig, saveAIConfig, PROVIDERS } from "../../ai/providers.js";

const STEPS = ["welcome", "roadmap", "apikey", "ready"];

export function OnboardingFlow({ onComplete, onCreate }) {
  const [step,       setStep]       = useState(0);
  const [aiConfig,   setAIConfig]   = useState(loadAIConfig);
  const [keySaved,   setKeySaved]   = useState(false);
  const [showKey,    setShowKey]    = useState(false);
  const [pickedTmpl, setPickedTmpl] = useState(null);

  const current = STEPS[step];
  const hasKey  = !!aiConfig.keys?.[aiConfig.provider]?.trim();

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const skip = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const handleKeyChange = (val) => {
    const updated = { ...aiConfig, keys: { ...aiConfig.keys, [aiConfig.provider]: val } };
    setAIConfig(updated);
    saveAIConfig(updated);
    setKeySaved(false);
  };

  const handleProviderChange = (p) => {
    const updated = { ...aiConfig, provider: p };
    setAIConfig(updated);
    saveAIConfig(updated);
  };

  const pickTemplate = (tmpl) => {
    setPickedTmpl(tmpl.id);
    onCreate(tmpl);
    next();
  };

  const dot = (i) => (
    <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3,
      background: i <= step ? "#7b5ea7" : "#1e1e24", transition: "all 0.3s" }} />
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0f0f13", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 20px", fontFamily: "'Georgia', serif" }}>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {STEPS.map((_, i) => dot(i))}
      </div>

      {/* ── Step 0: Welcome ── */}
      {current === "welcome" && (
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 700, color: "#fff" }}>
            Learning Tracker
          </h1>
          <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, margin: "0 0 32px" }}>
            Your personal learning companion. Track progress across any roadmap,
            practice with AI, complete quests, and earn XP as you grow.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#16161b", borderRadius: 10, padding: "12px 16px",
              border: "1px solid #1e1e24", display: "flex", gap: 12, alignItems: "center", textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>🗺️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Structured roadmaps</div>
                <div style={{ fontSize: 12, color: "#555" }}>Topics organised into sections you can tick off</div>
              </div>
            </div>
            <div style={{ background: "#16161b", borderRadius: 10, padding: "12px 16px",
              border: "1px solid #1e1e24", display: "flex", gap: 12, alignItems: "center", textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>🤖</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>AI-powered practice</div>
                <div style={{ fontSize: 12, color: "#555" }}>Quizzes, coding challenges, Q&A — all generated for you</div>
              </div>
            </div>
            <div style={{ background: "#16161b", borderRadius: 10, padding: "12px 16px",
              border: "1px solid #1e1e24", display: "flex", gap: 12, alignItems: "center", textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>🏆</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Quests & XP</div>
                <div style={{ fontSize: 12, color: "#555" }}>Complete quests, earn badges, level up as you learn</div>
              </div>
            </div>
          </div>
          <button onClick={next} style={{ width: "100%", marginTop: 24, padding: "14px",
            background: "#7b5ea7", border: "none", borderRadius: 10, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Get Started →
          </button>
        </div>
      )}

      {/* ── Step 1: Pick a roadmap ── */}
      {current === "roadmap" && (
        <div style={{ maxWidth: 500, width: "100%" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#fff", textAlign: "center" }}>
            Pick a roadmap to start
          </h2>
          <p style={{ color: "#555", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>
            You can add more later — this is just to get you going
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {Object.values(TEMPLATES).map(tmpl => (
              <button key={tmpl.id} onClick={() => pickTemplate(tmpl)}
                style={{ width: "100%", padding: "14px 16px", background: "#16161b",
                  border: `2px solid ${pickedTmpl === tmpl.id ? tmpl.color : "#1e1e24"}`,
                  borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  transition: "border-color 0.2s" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%",
                  background: tmpl.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{tmpl.label}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    {Object.keys(tmpl.sections).length} sections ·{" "}
                    {Object.values(tmpl.sections).flat().length} topics
                  </div>
                </div>
                {pickedTmpl === tmpl.id && <span style={{ color: "#52b788" }}>✓</span>}
              </button>
            ))}
          </div>
          <button onClick={next}
            style={{ width: "100%", padding: "12px", background: "transparent",
              border: "1px solid #2a2a35", borderRadius: 9, color: "#555",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Skip — I'll create my own
          </button>
        </div>
      )}

      {/* ── Step 2: API Key ── */}
      {current === "apikey" && (
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#fff" }}>
            Add a free AI key
          </h2>
          <p style={{ color: "#666", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>
            Groq and Gemini are both free — no credit card needed.
            The key is stored only on your device.
          </p>

          {/* Provider selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <button key={id} onClick={() => handleProviderChange(id)}
                style={{ flex: 1, padding: "9px", background: aiConfig.provider === id ? "#7b5ea722" : "#16161b",
                  border: `1px solid ${aiConfig.provider === id ? "#7b5ea7" : "#2a2a35"}`,
                  borderRadius: 8, color: aiConfig.provider === id ? "#c4b5fd" : "#555",
                  fontSize: 12, fontWeight: aiConfig.provider === id ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit" }}>
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ background: "#16161b", borderRadius: 10, padding: "14px",
            border: "1px solid #1e1e24", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 10, textAlign: "left" }}>
              Get a free key at{" "}
              <a href={aiConfig.provider === "groq" ? "https://console.groq.com" : "https://aistudio.google.com"}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#7b5ea7" }}>
                {aiConfig.provider === "groq" ? "console.groq.com" : "aistudio.google.com"}
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                value={aiConfig.keys?.[aiConfig.provider] || ""}
                onChange={e => handleKeyChange(e.target.value)}
                placeholder={`Paste your ${PROVIDERS[aiConfig.provider]?.name} key…`}
                style={{ width: "100%", padding: "10px 40px 10px 12px",
                  background: "#0f0f13", border: "1px solid #2a2a35",
                  borderRadius: 8, color: "#fff", fontSize: 13,
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
              <button onClick={() => setShowKey(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "#444",
                  fontSize: 14, cursor: "pointer" }}>
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button onClick={next}
            style={{ width: "100%", padding: "13px", background: hasKey ? "#7b5ea7" : "#1e1e24",
              border: `1px solid ${hasKey ? "transparent" : "#2a2a35"}`,
              borderRadius: 10, color: hasKey ? "#fff" : "#555",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", marginBottom: 10 }}>
            {hasKey ? "Continue →" : "Continue without AI"}
          </button>
          {!hasKey && (
            <div style={{ fontSize: 11, color: "#444" }}>
              You can add a key later in Settings → AI
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Ready ── */}
      {current === "ready" && (
        <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🚀</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 700, color: "#fff" }}>
            You're all set!
          </h2>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, margin: "0 0 28px" }}>
            {pickedTmpl
              ? `Your ${TEMPLATES[pickedTmpl]?.label || ""} roadmap is ready. Start ticking off topics as you learn.`
              : "Start by creating a roadmap or generating one with AI."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28,
            textAlign: "left" }}>
            {[
              "Tick topics as you complete them",
              "Use Practice to quiz yourself with AI",
              "Complete quests to earn XP and badges",
              "Review due topics with spaced repetition",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center",
                background: "#16161b", borderRadius: 8, padding: "10px 14px",
                border: "1px solid #1e1e24" }}>
                <span style={{ color: "#7b5ea7", fontSize: 14, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: "#888" }}>{tip}</span>
              </div>
            ))}
          </div>
          <button onClick={onComplete}
            style={{ width: "100%", padding: "14px", background: "#7b5ea7",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Start Learning 🎯
          </button>
        </div>
      )}
    </div>
  );
}

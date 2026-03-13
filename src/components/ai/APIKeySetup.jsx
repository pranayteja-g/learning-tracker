import { useState } from "react";
import { PROVIDERS } from "../../ai/providers.js";

const LIMIT_PRESETS = [25000, 50000, 100000, 200000];

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function UsageBar({ usage, limit, pct, onReset }) {
  const barColor = pct >= 90 ? "#e05252" : pct >= 70 ? "#ee9b00" : "#52b788";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{ background: "#0f0f13", borderRadius: 10, padding: "14px", border: "1px solid #1e1e24" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>Today's Usage</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{today} · resets at midnight UTC</div>
        </div>
        <button onClick={onReset}
          style={{ fontSize: 10, padding: "4px 8px", background: "transparent",
            border: "1px solid #2a2a35", borderRadius: 5, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
          Reset
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Requests",   value: usage.requests || 0,          unit: "" },
          { label: "In tokens",  value: usage.promptTokens || 0,      unit: "" },
          { label: "Out tokens", value: usage.completionTokens || 0,  unit: "" },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ background: "#16161b", borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e6e0" }}>{fmt(value)}{unit}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Total + bar */}
      {limit.enabled && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "#666" }}>
              Total: <strong style={{ color: barColor }}>{fmt(usage.totalTokens || 0)}</strong>
              <span style={{ color: "#444" }}> / {fmt(limit.dailyTokenLimit)}</span>
            </span>
            <span style={{ fontSize: 11, color: barColor, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ background: "#1e1e24", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor,
              borderRadius: 4, transition: "width 0.4s, background 0.4s" }} />
          </div>
          {pct >= 90 && (
            <div style={{ fontSize: 11, color: "#e05252", marginTop: 6 }}>
              ⚠️ {pct >= 100 ? "Daily limit reached — requests blocked." : "Almost at daily limit."}
            </div>
          )}
        </>
      )}
      {!limit.enabled && (
        <div style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 4 }}>
          Total: {fmt(usage.totalTokens || 0)} tokens used · no limit set
        </div>
      )}
    </div>
  );
}

export function APIKeySetup({ config, onSave, usage = {}, limit = {}, pct = 0, onResetUsage, onSaveLimit }) {
  const [provider,   setProvider]   = useState(config.provider || "groq");
  const [keys,       setKeys]       = useState(config.keys || {});
  const [visible,    setVisible]    = useState({});
  const [limitOn,    setLimitOn]    = useState(limit.enabled ?? false);
  const [limitVal,   setLimitVal]   = useState(limit.dailyTokenLimit ?? 100000);
  const [customVal,  setCustomVal]  = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const p = PROVIDERS[provider];
  const currentKey = keys[provider] || "";

  const handleSave = () => {
    if (!currentKey.trim()) return;
    onSave({ provider, keys: { ...keys, [provider]: currentKey.trim() } });
  };

  const handleLimitSave = () => {
    const val = showCustom ? parseInt(customVal, 10) : limitVal;
    if (!val || val < 1000) return;
    onSaveLimit({ enabled: limitOn, dailyTokenLimit: val });
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🤖 AI Setup</div>
        <div style={{ fontSize: 12, color: "#666" }}>Keys are stored only in your browser — never sent anywhere except the AI provider.</div>
      </div>

      {/* Usage bar — always visible */}
      <UsageBar usage={usage} limit={limit} pct={pct} onReset={onResetUsage} />

      {/* Daily limit controls */}
      <div style={{ background: "#0f0f13", borderRadius: 10, padding: "14px", border: "1px solid #1e1e24" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>Daily Token Limit</div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>Block requests once this limit is reached</div>
          </div>
          {/* Toggle */}
          <div onClick={() => setLimitOn(v => !v)}
            style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", position: "relative",
              background: limitOn ? "#7b5ea7" : "#2a2a35", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 3, left: limitOn ? 20 : 3, width: 16, height: 16,
              borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>

        {limitOn && (
          <>
            {/* Presets */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {LIMIT_PRESETS.map(v => (
                <button key={v} onClick={() => { setLimitVal(v); setShowCustom(false); setCustomVal(""); }}
                  style={{ padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                    borderRadius: 6, border: `1px solid ${!showCustom && limitVal === v ? "#7b5ea7" : "#2a2a35"}`,
                    background: !showCustom && limitVal === v ? "#7b5ea722" : "#16161b",
                    color: !showCustom && limitVal === v ? "#c4b5fd" : "#666" }}>
                  {fmt(v)}
                </button>
              ))}
              <button onClick={() => setShowCustom(v => !v)}
                style={{ padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                  borderRadius: 6, border: `1px solid ${showCustom ? "#7b5ea7" : "#2a2a35"}`,
                  background: showCustom ? "#7b5ea722" : "#16161b",
                  color: showCustom ? "#c4b5fd" : "#666" }}>
                Custom
              </button>
            </div>

            {showCustom && (
              <input type="number" value={customVal} onChange={e => setCustomVal(e.target.value)}
                placeholder="e.g. 75000" min="1000"
                style={{ width: "100%", background: "#16161b", border: "1px solid #2a2a35", borderRadius: 6,
                  padding: "8px 10px", color: "#e8e6e0", fontSize: 13, fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            )}

            <button onClick={handleLimitSave}
              style={{ width: "100%", padding: "8px", background: "#7b5ea722",
                border: "1px solid #7b5ea744", borderRadius: 6, color: "#c4b5fd",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Save limit ({fmt(showCustom ? parseInt(customVal || 0) : limitVal)} tokens/day)
            </button>
          </>
        )}

        {!limitOn && (
          <div style={{ fontSize: 11, color: "#444" }}>
            Enable to block requests once you've used a set number of tokens today.
          </div>
        )}
      </div>

      {/* Provider picker */}
      <div>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Provider</div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(PROVIDERS).map(([key, val]) => {
            const hasKey = !!keys[key]?.trim();
            const active = provider === key;
            return (
              <button key={key} onClick={() => setProvider(key)}
                style={{ flex: 1, padding: "10px 8px", border: `1px solid ${active ? "#7b5ea7" : "#2a2a35"}`,
                  borderRadius: 8, background: active ? "#7b5ea722" : "#0f0f13",
                  color: active ? "#c4b5fd" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                <div style={{ fontWeight: active ? 700 : 400 }}>{val.name}</div>
                {hasKey  && <div style={{ fontSize: 10, color: "#52b788", marginTop: 2 }}>✓ Key saved</div>}
                {!hasKey && <div style={{ fontSize: 10, color: "#555",    marginTop: 2 }}>No key</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key input */}
      <div>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {p.name} API Key
        </div>
        <div style={{ position: "relative" }}>
          <input
            type={visible[provider] ? "text" : "password"}
            value={currentKey}
            onChange={e => setKeys(k => ({ ...k, [provider]: e.target.value }))}
            placeholder={p.keyPlaceholder}
            style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a35", borderRadius: 7,
              padding: "9px 40px 9px 12px", color: "#e8e6e0", fontSize: 13, fontFamily: "monospace",
              outline: "none", boxSizing: "border-box" }}
          />
          <button onClick={() => setVisible(v => ({ ...v, [provider]: !v[provider] }))}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 14 }}>
            {visible[provider] ? "🙈" : "👁"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
          {p.keyHint} —{" "}
          <a href={p.keyUrl} target="_blank" rel="noreferrer"
            style={{ color: "#7b8cde", textDecoration: "none" }}>Get key →</a>
        </div>
      </div>

      {/* Save / Clear */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={!currentKey.trim()}
          style={{ flex: 1, padding: "10px", background: currentKey.trim() ? "#7b5ea7" : "#1e1e24",
            border: "none", borderRadius: 8, color: currentKey.trim() ? "#fff" : "#444",
            fontSize: 13, cursor: currentKey.trim() ? "pointer" : "default",
            fontFamily: "inherit", fontWeight: 600 }}>
          Save & Start Using AI
        </button>

        {keys[provider] && (
          <button onClick={() => {
              const updated = { ...keys, [provider]: "" };
              setKeys(updated);
              onSave({ provider, keys: updated });
            }}
            style={{ padding: "10px 14px", background: "#1f1212", border: "1px solid #3a2020",
              borderRadius: 8, color: "#e05252", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            title="Clear saved key">
            🗑 Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
        You can save keys for both providers and switch between them anytime.
      </div>
    </div>
  );
}

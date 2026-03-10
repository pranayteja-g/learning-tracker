import { useState } from "react";
import { PROVIDERS } from "../../ai/providers.js";

export function APIKeySetup({ config, onSave }) {
  const [provider, setProvider] = useState(config.provider || "gemini");
  const [keys, setKeys]         = useState(config.keys || {});
  const [visible, setVisible]   = useState({});

  const p = PROVIDERS[provider];
  const currentKey = keys[provider] || "";

  const handleSave = () => {
    if (!currentKey.trim()) return;
    onSave({ provider, keys: { ...keys, [provider]: currentKey.trim() } });
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🤖 AI Setup</div>
        <div style={{ fontSize: 12, color: "#666" }}>Choose a provider and paste your free API key. Keys are stored only in your browser.</div>
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
                {hasKey && <div style={{ fontSize: 10, color: "#52b788", marginTop: 2 }}>✓ Key saved</div>}
                {!hasKey && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>No key</div>}
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

      {/* Both keys note */}
      <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
        You can save keys for both providers and switch between them anytime.
      </div>
    </div>
  );
}

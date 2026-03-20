import { useState } from "react";

/**
 * Sync tab — manual cross-device sync via a base64 sync code.
 * No server required. Device 1 copies code, Device 2 pastes it.
 */

function compress(str) {
  // Base64 encode the JSON string
  return btoa(encodeURIComponent(str));
}

function decompress(str) {
  return decodeURIComponent(atob(str));
}

export function SyncTab({ onGetSnapshot, onApplySnapshot }) {
  const [mode,      setMode]      = useState(null); // "export" | "import"
  const [code,      setCode]      = useState("");
  const [pasted,    setPasted]    = useState("");
  const [copied,    setCopied]    = useState(false);
  const [applying,  setApplying]  = useState(false);
  const [applyMsg,  setApplyMsg]  = useState(null); // {ok, text}

  const generateCode = () => {
    try {
      const snapshot = onGetSnapshot();
      const json     = JSON.stringify(snapshot);
      const encoded  = compress(json);
      setCode(encoded);
      setMode("export");
      setCopied(false);
    } catch(e) {
      console.error("Sync code generation failed:", e);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback — select the textarea
      document.getElementById("sync-code-output")?.select();
    }
  };

  const applyCode = async () => {
    if (!pasted.trim()) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const json     = decompress(pasted.trim());
      const snapshot = JSON.parse(json);
      await onApplySnapshot(snapshot);
      setApplyMsg({ ok: true, text: "Sync applied! Your data has been updated." });
      setPasted("");
    } catch(e) {
      setApplyMsg({ ok: false, text: "Invalid sync code. Make sure you copied it completely." });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Explainer */}
      <div style={{ background: "#0f0f13", borderRadius: 8, padding: "12px 14px",
        border: "1px solid #1e1e24" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd", marginBottom: 6 }}>
          📱 How to sync between devices
        </div>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
          1. On Device 1 → tap <strong style={{color:"#888"}}>Generate Sync Code</strong><br/>
          2. Copy the code and send it to yourself (AirDrop, WhatsApp, email…)<br/>
          3. On Device 2 → tap <strong style={{color:"#888"}}>Apply Sync Code</strong> and paste it
        </div>
      </div>

      {/* Generate */}
      <button onClick={generateCode}
        style={{ width: "100%", padding: "12px", background: "#7b5ea722",
          border: "1px solid #7b5ea744", borderRadius: 8,
          color: "#c4b5fd", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit" }}>
        📤 Generate Sync Code (this device)
      </button>

      {mode === "export" && code && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            id="sync-code-output"
            readOnly
            value={code}
            style={{ width: "100%", height: 90, padding: "10px", background: "#0d1117",
              border: "1px solid #2a2a35", borderRadius: 8, color: "#888",
              fontFamily: "monospace", fontSize: 11, resize: "none",
              lineHeight: 1.4, boxSizing: "border-box", wordBreak: "break-all" }}
          />
          <button onClick={copyCode}
            style={{ width: "100%", padding: "10px", background: copied ? "#1a2e1a" : "#1e1e24",
              border: `1px solid ${copied ? "#52b78844" : "#2a2a35"}`,
              borderRadius: 8, color: copied ? "#52b788" : "#888",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "✓ Copied!" : "Copy Code"}
          </button>
          <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
            Code expires when you change your data — regenerate if needed
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "#1e1e24" }} />
        <span style={{ fontSize: 11, color: "#444" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#1e1e24" }} />
      </div>

      {/* Apply */}
      <div>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>
          Paste a sync code from another device:
        </div>
        <textarea
          value={pasted}
          onChange={e => { setPasted(e.target.value); setApplyMsg(null); }}
          placeholder="Paste sync code here…"
          style={{ width: "100%", height: 90, padding: "10px", background: "#0d1117",
            border: `1px solid ${applyMsg ? (applyMsg.ok ? "#52b78844" : "#e0525244") : "#2a2a35"}`,
            borderRadius: 8, color: "#ccc", fontFamily: "monospace",
            fontSize: 11, resize: "none", lineHeight: 1.4,
            boxSizing: "border-box", wordBreak: "break-all", outline: "none" }}
        />
        {applyMsg && (
          <div style={{ fontSize: 12, color: applyMsg.ok ? "#52b788" : "#e05252",
            marginTop: 6, lineHeight: 1.5 }}>
            {applyMsg.ok ? "✓" : "✗"} {applyMsg.text}
          </div>
        )}
        <button onClick={applyCode}
          disabled={!pasted.trim() || applying}
          style={{ width: "100%", marginTop: 8, padding: "12px",
            background: pasted.trim() ? "#1a2e1a" : "#1e1e24",
            border: `1px solid ${pasted.trim() ? "#52b78844" : "#2a2a35"}`,
            borderRadius: 8, color: pasted.trim() ? "#52b788" : "#444",
            fontSize: 13, fontWeight: 600,
            cursor: pasted.trim() ? "pointer" : "default",
            fontFamily: "inherit" }}>
          {applying ? "Applying…" : "📥 Apply Sync Code"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#333", padding: "8px 10px",
        background: "#0f0f13", borderRadius: 6, lineHeight: 1.6 }}>
        ⚠️ Applying a sync code will merge data from the other device — it won't delete existing data.
      </div>
    </div>
  );
}

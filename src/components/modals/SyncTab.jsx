import { useState, useEffect, useRef } from "react";

// ── Compression ───────────────────────────────────────────────────────────────
async function compress(str) {
  try {
    const stream  = new CompressionStream("gzip");
    const writer  = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(str));
    writer.close();
    const chunks = [];
    const reader = stream.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buf = new Uint8Array(chunks.reduce((n,c) => n+c.length, 0));
    let off = 0;
    for (const c of chunks) { buf.set(c, off); off += c.length; }
    return btoa(String.fromCharCode(...buf));
  } catch {
    // Fallback: plain base64
    return btoa(encodeURIComponent(str));
  }
}

async function decompress(b64) {
  try {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const stream = new DecompressionStream("gzip");
    const writer = stream.writable.getWriter();
    writer.write(buf);
    writer.close();
    const chunks = [];
    const reader = stream.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const out = new Uint8Array(chunks.reduce((n,c) => n+c.length, 0));
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return new TextDecoder().decode(out);
  } catch {
    // Fallback: plain base64
    return decodeURIComponent(atob(b64));
  }
}

// ── QR Code — pure JS, no external dependencies ──────────────────────────────
// Generates QR as SVG using the qrcodegen algorithm inline

// Minimal QR encoding using the browser's built-in canvas
function QRDisplay({ code }) {
  const canvasRef = useRef(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!code || !canvasRef.current) return;
    // Dynamically import qrcode-generator (tiny, no deps) from esm.sh
    import("https://esm.sh/qrcode-generator@1.4.4")
      .then(mod => {
        const qr = (mod.default || mod)("0", "M");
        qr.addData(code);
        qr.make();

        const canvas = canvasRef.current;
        const size   = qr.getModuleCount();
        const scale  = Math.floor(240 / size);
        const total  = size * scale;
        canvas.width  = total;
        canvas.height = total;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, total, total);
        ctx.fillStyle = "#000000";
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (qr.isDark(r, c)) {
              ctx.fillRect(c * scale, r * scale, scale, scale);
            }
          }
        }
        setErr(false);
      })
      .catch(() => setErr(true));
  }, [code]);

  if (err) return (
    <div style={{ padding: 16, textAlign: "center", color: "#e05252", fontSize: 12, lineHeight: 1.6 }}>
      Could not generate QR code.<br/>Use the Text Code option instead.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ padding: 14, background: "#fff", borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)", display: "inline-block" }}>
        <canvas ref={canvasRef} style={{ display: "block", borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, color: "#555", textAlign: "center" }}>
        Scan with Device 2's camera app
      </div>
    </div>
  );
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan, onCancel }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    } catch {
      setError("Camera access denied. Use the text code instead.");
    }
  };

  const scanFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    if (window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(canvas);
        if (codes.length > 0) {
          stopCamera();
          onScan(codes[0].rawValue);
          return;
        }
      } catch {}
    } else {
      setError("QR scanning not supported in this browser. Please use the text code.");
      stopCamera();
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  if (error) return (
    <div style={{ padding: 16, background: "#2e1a1a", borderRadius: 8,
      color: "#e05252", fontSize: 13, lineHeight: 1.6, textAlign: "center" }}>
      {error}
      <button onClick={onCancel} style={{ display: "block", margin: "10px auto 0",
        padding: "6px 14px", background: "#1e1e24", border: "1px solid #2a2a35",
        borderRadius: 6, color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
        Close
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "2px solid #7b5ea7" }}>
        <video ref={videoRef} muted playsInline style={{ width: 240, height: 240, objectFit: "cover", display: "block" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "20%", left: "20%", right: "20%", bottom: "20%",
            border: "2px solid #7b5ea7", borderRadius: 4,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#888" }}>Point camera at the QR code</div>
      <button onClick={onCancel} style={{ padding: "6px 16px", background: "transparent",
        border: "1px solid #2a2a35", borderRadius: 6, color: "#666",
        fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
        Cancel
      </button>
    </div>
  );
}

// ── Main SyncTab ──────────────────────────────────────────────────────────────
export function SyncTab({ onGetSnapshot, onApplySnapshot }) {
  const [mode,       setMode]       = useState(null);
  const [code,       setCode]       = useState("");
  const [generating, setGenerating] = useState(false);
  const [pasted,     setPasted]     = useState("");
  const [copied,     setCopied]     = useState(false);
  const [applying,   setApplying]   = useState(false);
  const [applyMsg,   setApplyMsg]   = useState(null);

  const generateCode = async (forQR = false) => {
    setGenerating(true);
    setCode("");
    try {
      const snapshot = onGetSnapshot();
      const encoded  = await compress(JSON.stringify(snapshot));
      setCode(encoded);
      setMode(forQR ? "export-qr" : "export-text");
      setCopied(false);
    } catch(e) {
      console.error("Sync failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      document.getElementById("sync-code-out")?.select();
    }
  };

  const applyCode = async (raw) => {
    const c = raw || pasted.trim();
    if (!c) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const json     = await decompress(c);
      const snapshot = JSON.parse(json);
      await onApplySnapshot(snapshot);
      setApplyMsg({ ok: true, text: "Sync applied! Your data has been updated." });
      setPasted(""); setMode(null);
    } catch {
      setApplyMsg({ ok: false, text: "Invalid sync code. Make sure you copied it completely." });
    } finally {
      setApplying(false);
    }
  };

  const reset = () => { setMode(null); setCode(""); setPasted(""); };

  const btnSend = (label, onClick) => (
    <button onClick={onClick} disabled={generating}
      style={{ flex: 1, padding: "11px 8px", background: "#7b5ea722",
        border: "1px solid #7b5ea744", borderRadius: 8, color: "#c4b5fd",
        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
      {generating ? "Generating…" : label}
    </button>
  );

  const btnReceive = (label, onClick) => (
    <button onClick={onClick}
      style={{ flex: 1, padding: "11px 8px", background: "#1e2e1e",
        border: "1px solid #52b78844", borderRadius: 8, color: "#52b788",
        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
      {label}
    </button>
  );

  const backBtn = () => (
    <button onClick={reset} style={{ width: "100%", padding: "9px",
      background: "transparent", border: "1px solid #2a2a35", borderRadius: 7,
      color: "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
      ← Back
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* QR Scanner */}
      {mode === "import-qr" && (
        <QRScanner onScan={val => { setMode(null); applyCode(val); }} onCancel={reset} />
      )}

      {/* QR Display */}
      {mode === "export-qr" && code && (
        <> <QRDisplay code={code} /> {backBtn()} </>
      )}

      {/* Text export */}
      {mode === "export-text" && code && (
        <>
          <textarea id="sync-code-out" readOnly value={code}
            style={{ width: "100%", height: 90, padding: 10, background: "#0d1117",
              border: "1px solid #2a2a35", borderRadius: 8, color: "#888",
              fontFamily: "monospace", fontSize: 11, resize: "none",
              lineHeight: 1.4, boxSizing: "border-box", wordBreak: "break-all" }} />
          <button onClick={copyCode}
            style={{ width: "100%", padding: 10,
              background: copied ? "#1a2e1a" : "#1e1e24",
              border: `1px solid ${copied ? "#52b78844" : "#2a2a35"}`, borderRadius: 8,
              color: copied ? "#52b788" : "#888", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "✓ Copied!" : "Copy Code"}
          </button>
          {backBtn()}
        </>
      )}

      {/* Text import */}
      {mode === "import-text" && (
        <>
          <textarea value={pasted} onChange={e => { setPasted(e.target.value); setApplyMsg(null); }}
            placeholder="Paste sync code here…"
            style={{ width: "100%", height: 90, padding: 10, background: "#0d1117",
              border: `1px solid ${applyMsg ? (applyMsg.ok ? "#52b78844" : "#e0525244") : "#2a2a35"}`,
              borderRadius: 8, color: "#ccc", fontFamily: "monospace", fontSize: 11,
              resize: "none", lineHeight: 1.4, boxSizing: "border-box",
              wordBreak: "break-all", outline: "none" }} />
          {applyMsg && (
            <div style={{ fontSize: 12, color: applyMsg.ok ? "#52b788" : "#e05252" }}>
              {applyMsg.ok ? "✓" : "✗"} {applyMsg.text}
            </div>
          )}
          <button onClick={() => applyCode()} disabled={!pasted.trim() || applying}
            style={{ width: "100%", padding: 12,
              background: pasted.trim() ? "#1a2e1a" : "#1e1e24",
              border: `1px solid ${pasted.trim() ? "#52b78844" : "#2a2a35"}`,
              borderRadius: 8, color: pasted.trim() ? "#52b788" : "#444",
              fontSize: 13, fontWeight: 600,
              cursor: pasted.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
            {applying ? "Applying…" : "📥 Apply Sync Code"}
          </button>
          {backBtn()}
        </>
      )}

      {/* Default menu */}
      {!mode && (
        <>
          <div style={{ background: "#0f0f13", borderRadius: 8, padding: "12px 14px",
            border: "1px solid #1e1e24", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
            <span style={{ fontWeight: 700, color: "#c4b5fd" }}>📱 How to sync</span><br/>
            Generate a code or QR on Device 1 → send to yourself → receive on Device 2.
          </div>

          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
            This device → send to other
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {btnSend("📋 Text Code", () => generateCode(false))}
            {btnSend("📷 QR Code",   () => generateCode(true))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e24" }} />
            <span style={{ fontSize: 11, color: "#444" }}>other device → this one</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e24" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {btnReceive("📋 Paste Code", () => setMode("import-text"))}
            {btnReceive("📷 Scan QR",    () => setMode("import-qr"))}
          </div>

          {applyMsg && (
            <div style={{ fontSize: 12, color: applyMsg.ok ? "#52b788" : "#e05252",
              padding: "8px 10px", background: "#0f0f13", borderRadius: 6 }}>
              {applyMsg.ok ? "✓" : "✗"} {applyMsg.text}
            </div>
          )}

          <div style={{ fontSize: 11, color: "#333", padding: "8px 10px",
            background: "#0f0f13", borderRadius: 6, lineHeight: 1.6 }}>
            ⚠️ Applying sync merges data — existing data is preserved.
          </div>
        </>
      )}
    </div>
  );
}

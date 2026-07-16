export function GuestMigrateModal({ onImport, onSkip }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 400, padding: 24 }}>
      <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 14,
        padding: "28px 24px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#fff" }}>Import your guest data?</h3>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 24px" }}>
          We found existing data on this device — roadmaps, progress, notes, and more.
          Import it into your new account?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onImport}
            style={{ padding: "13px", background: "#7b5ea7", border: "none",
              borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit" }}>
            ✓ Yes, import my data
          </button>
          <button onClick={onSkip}
            style={{ padding: "12px", background: "transparent", border: "1px solid #2a2a35",
              borderRadius: 10, color: "#555", fontSize: 13,
              cursor: "pointer", fontFamily: "inherit" }}>
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}

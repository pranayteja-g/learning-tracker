export function Toast({ feedback, isMobile }) {
  return (
    <div style={{
      position: "fixed", bottom: isMobile ? 70 : 24, left: "50%", transform: "translateX(-50%)",
      background: feedback.ok ? "#1a2e1a" : "#2e1a1a",
      border: `1px solid ${feedback.ok ? "#2d6a4f" : "#6a2d2d"}`,
      color: feedback.ok ? "#52b788" : "#e05252",
      padding: "10px 20px", borderRadius: 8, fontSize: 13, zIndex: 300,
      boxShadow: "0 8px 30px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
    }}>
      {feedback.ok ? "✓" : "✕"} {feedback.msg}
    </div>
  );
}

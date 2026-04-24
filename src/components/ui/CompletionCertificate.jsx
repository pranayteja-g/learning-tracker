import { useRef } from "react";

export function CompletionCertificate({ roadmap, stats, onClose }) {
  const canvasRef = useRef(null);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 900;
    const H = 600;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#0f0f13";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = roadmap.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = roadmap.color + "44";
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    const corners = [
      [40, 40],
      [W - 40, 40],
      [40, H - 40],
      [W - 40, H - 40],
    ];
    corners.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = roadmap.color;
      ctx.fill();
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#888";
    ctx.font = "600 18px Georgia, serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 100);

    ctx.fillStyle = roadmap.color;
    ctx.fillRect(W / 2 - 80, 115, 160, 2);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Georgia, serif";
    ctx.fillText(roadmap.label, W / 2, 185);

    ctx.fillStyle = "#888";
    ctx.font = "18px Georgia, serif";
    ctx.fillText("Successfully completed all topics and assessments", W / 2, 230);

    const statItems = [
      { label: "Topics", value: stats.total },
      { label: "Completed", value: stats.done },
      { label: "Progress", value: `${stats.pct}%` },
      {
        label: "Date",
        value: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      },
    ];

    const statW = (W - 100) / statItems.length;
    statItems.forEach((s, i) => {
      const x = 50 + statW * i + statW / 2;
      ctx.fillStyle = roadmap.color;
      ctx.font = "bold 28px Georgia, serif";
      ctx.fillText(s.value, x, 320);
      ctx.fillStyle = "#555";
      ctx.font = "14px Georgia, serif";
      ctx.fillText(s.label, x, 344);
    });

    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(50, 365, W - 100, 1);

    ctx.font = "60px serif";
    ctx.fillText("🏆", W / 2, 450);

    ctx.fillStyle = "#444";
    ctx.font = "13px Georgia, serif";
    ctx.fillText("Learning Tracker · roadmap.sh", W / 2, 520);

    const link = document.createElement("a");
    link.download = `${roadmap.label.replace(/\s+/g, "_")}_certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#16161b",
          borderRadius: 14,
          padding: "28px 24px",
          border: "1px solid #2a2a35",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "#0f0f13",
            borderRadius: 10,
            border: `2px solid ${roadmap.color}44`,
            padding: "24px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
            Certificate of Completion
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{roadmap.label}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
            {stats.done} of {stats.total} topics completed
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: roadmap.color }}>{stats.pct}%</div>
              <div style={{ fontSize: 10, color: "#444" }}>Progress</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#52b788" }}>{stats.done}</div>
              <div style={{ fontSize: 10, color: "#444" }}>Topics</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#c4b5fd" }}>
                {new Date().toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </div>
              <div style={{ fontSize: 10, color: "#444" }}>Completed</div>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button
          onClick={download}
          style={{
            width: "100%",
            padding: "12px",
            background: roadmap.color,
            border: "none",
            borderRadius: 9,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        >
          ⬇️ Download Certificate
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "1px solid #2a2a35",
            borderRadius: 9,
            color: "#666",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

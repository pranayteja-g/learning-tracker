import { useState, useEffect } from "react";

// Detects iOS — iOS doesn't support beforeinstallprompt, needs manual instructions
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid,    setShowAndroid]    = useState(false);
  const [showIOS,        setShowIOS]        = useState(false);
  const [dismissed,      setDismissed]      = useState(false);

  useEffect(() => {
    // Already installed — don't show anything
    if (isInStandaloneMode()) return;

    // Check if user has already dismissed
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) return;

    if (isIOS()) {
      // Show iOS manual instructions after a short delay
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome — listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowAndroid(false);
    setShowIOS(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
    setShowAndroid(false);
  };

  if (dismissed || (!showAndroid && !showIOS)) return null;

  const banner = {
    position: "fixed", bottom: 80, left: 12, right: 12, zIndex: 999,
    background: "#1e1e2e", border: "1px solid #7b5ea766",
    borderRadius: 14, padding: "14px 16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    display: "flex", gap: 12, alignItems: "flex-start",
    animation: "slideUp 0.3s ease",
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={banner}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>📚</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            Install Learning Tracker
          </div>

          {showAndroid && (
            <>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10, lineHeight: 1.5 }}>
                Add to your home screen for the full app experience — works offline too.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={installAndroid}
                  style={{ flex: 1, padding: "8px", background: "#7b5ea7", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit" }}>
                  Install
                </button>
                <button onClick={dismiss}
                  style={{ padding: "8px 12px", background: "transparent",
                    border: "1px solid #2a2a35", borderRadius: 8, color: "#666",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Not now
                </button>
              </div>
            </>
          )}

          {showIOS && (
            <>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
                Tap <strong style={{ color: "#7b8cde" }}>Share</strong>{" "}
                <span style={{ fontSize: 14 }}>⎋</span> in Safari, then{" "}
                <strong style={{ color: "#7b8cde" }}>"Add to Home Screen"</strong>{" "}
                <span style={{ fontSize: 14 }}>＋</span> to install.
              </div>
              <button onClick={dismiss}
                style={{ marginTop: 10, padding: "6px 12px", background: "transparent",
                  border: "1px solid #2a2a35", borderRadius: 7, color: "#666",
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Got it
              </button>
            </>
          )}
        </div>

        <button onClick={dismiss}
          style={{ background: "transparent", border: "none", color: "#444",
            fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
    </>
  );
}

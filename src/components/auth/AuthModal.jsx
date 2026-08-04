import { useState } from "react";

export function AuthModal({ onSignIn, onSignUp, onResetPassword, loading }) {
  const [mode,     setMode]     = useState("login");   // login | signup | reset
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);   // signup confirmation sent
  const [resetSent,setResetSent]= useState(false);   // reset email sent

  const switchMode = (m) => { setMode(m); setError(""); setDone(false); setResetSent(false); };

  const submit = async () => {
    setError("");
    if (mode === "reset") {
      if (!email.trim()) { setError("Enter your email address."); return; }
      setBusy(true);
      try {
        await onResetPassword(email.trim());
        setResetSent(true);
      } catch (e) {
        setError(e.message || "Could not send reset email.");
      } finally { setBusy(false); }
      return;
    }
    if (!email.trim() || !password.trim()) { setError("Enter your email and password."); return; }
    if (mode === "signup" && password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
        setDone(true);
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally { setBusy(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#0f0f13", display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 28 }}>📚</div>
    </div>
  );

  if (done) return (
    <div style={{ minHeight: "100dvh", background: "#0f0f13", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ color: "#fff", margin: "0 0 10px", fontSize: 22 }}>Check your email</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7 }}>
          We sent a confirmation link to <strong style={{ color: "#ccc" }}>{email}</strong>.
          Click it to activate your account, then come back and sign in.
        </p>
        <button onClick={() => switchMode("login")}
          style={{ marginTop: 20, padding: "11px 28px", background: "#7b5ea7",
            border: "none", borderRadius: 9, color: "#fff", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Back to Sign In
        </button>
      </div>
    </div>
  );

  if (resetSent) return (
    <div style={{ minHeight: "100dvh", background: "#0f0f13", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
        <h2 style={{ color: "#fff", margin: "0 0 10px", fontSize: 22 }}>Reset email sent</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7 }}>
          Check your inbox at <strong style={{ color: "#ccc" }}>{email}</strong> for a password reset link.
        </p>
        <button onClick={() => switchMode("login")}
          style={{ marginTop: 20, padding: "11px 28px", background: "#7b5ea7",
            border: "none", borderRadius: 9, color: "#fff", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Back to Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0f0f13", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>Learning Tracker</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#555" }}>Your personal learning companion</p>
        </div>

        {/* Mode toggle — only for login/signup */}
        {mode !== "reset" && (
          <div style={{ display: "flex", background: "#16161b", borderRadius: 10,
            padding: 4, marginBottom: 20, border: "1px solid #1e1e24" }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => switchMode(m)}
                style={{ flex: 1, padding: "9px", border: "none", borderRadius: 7,
                  background: mode === m ? "#7b5ea7" : "transparent",
                  color: mode === m ? "#fff" : "#555",
                  fontSize: 13, fontWeight: mode === m ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {mode === "reset" && (
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => switchMode("login")}
              style={{ background: "transparent", border: "none", color: "#666",
                fontSize: 20, cursor: "pointer", padding: 0 }}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Reset Password</div>
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" autoFocus
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ padding: "12px 14px", background: "#16161b", border: "1px solid #2a2a35",
              borderRadius: 9, color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          {mode !== "reset" && (
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ padding: "12px 14px", background: "#16161b", border: "1px solid #2a2a35",
                borderRadius: 9, color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          )}
          {mode === "signup" && (
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ padding: "12px 14px", background: "#16161b", border: "1px solid #2a2a35",
                borderRadius: 9, color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          )}
        </div>

        {/* Forgot password link */}
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 12 }}>
            <button onClick={() => switchMode("reset")}
              style={{ background: "transparent", border: "none", color: "#7b5ea7",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 14px", background: "#2e1a1a", border: "1px solid #e0525233",
            borderRadius: 8, color: "#e05252", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={busy}
          style={{ width: "100%", padding: "13px", background: busy ? "#2a2a35" : "#7b5ea7",
            border: "none", borderRadius: 10, color: busy ? "#555" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer",
            fontFamily: "inherit", marginBottom: mode === "reset" ? 0 : 12 }}>
          {busy ? "Please wait…"
            : mode === "login" ? "Sign In"
            : mode === "signup" ? "Create Account"
            : "Send Reset Email"}
        </button>

      </div>
    </div>
  );
}

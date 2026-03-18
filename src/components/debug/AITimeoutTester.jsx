/**
 * Debug component for testing AI timeout and retry logic
 * Simulates various failure scenarios to verify resilience
 * 
 * How to use:
 * 1. Import this component in your main app (within development mode check)
 * 2. Add to a debug/admin section
 * 3. Configure test scenarios and watch console output
 * 4. Monitor retry attempts, timing, and eventual success/failure
 */

import { useState, useRef, useEffect } from "react";
import { callAI, callAIWithSearch } from "../../ai/providers.js";
import { loadAIConfig } from "../../ai/providers.js";

export function AITimeoutTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [throttle, setThrottle] = useState("none");
  const logsRef = useRef([]);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = { timestamp, type, message };
    logsRef.current.push(log);
    setTestResults([...logsRef.current]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Test 1: Normal request (should succeed)
  const testNormalRequest = async () => {
    addLog("test", "Starting: Normal Request");
    try {
      const config = loadAIConfig();
      const result = await callAI({
        provider: config.provider,
        apiKey: config.keys[config.provider],
        systemPrompt: "You are a helpful assistant.",
        userPrompt: "Say 'Test successful' in one sentence.",
        maxTokens: 100,
      });
      addLog("success", `Response: ${result.text.slice(0, 50)}...`);
      addLog("success", `Tokens: prompt=${result.usage.promptTokens}, completion=${result.usage.completionTokens}`);
    } catch (error) {
      addLog("error", `Failed: ${error.message}`);
    }
  };

  // Test 2: Slow network (should timeout and retry)
  const testSlowNetwork = async () => {
    addLog("test", "Starting: Slow Network (simulated with throttling)");
    addLog("info", "DevTools Network tab: Use 'Slow 4G' throttle (not all browsers show '3G')");
    addLog("info", "Run normal request with throttling enabled to see retries");
  };

  // Test 3: Web search (with search fallback and retries)
  const testWebSearch = async () => {
    addLog("test", "Starting: Web Search with Retry");
    try {
      const config = loadAIConfig();
      if (config.provider === "gemini") {
        addLog("error", "Gemini web search requires project setup - skipping");
        return;
      }
      const result = await callAIWithSearch({
        provider: config.provider,
        apiKey: config.keys[config.provider],
        systemPrompt: "Find learning resources.",
        userPrompt: "Find 3 free online resources for learning JavaScript",
      });
      addLog("success", `Found resources: ${result.text.slice(0, 100)}...`);
    } catch (error) {
      addLog("error", `Web search failed: ${error.message}`);
    }
  };

  // Test 4: Multiple requests (stress test retries)
  const testMultipleRequests = async () => {
    addLog("test", "Starting: Multiple Sequential Requests");
    const config = loadAIConfig();
    
    for (let i = 1; i <= 3; i++) {
      try {
        addLog("info", `Request ${i}/3...`);
        const result = await callAI({
          provider: config.provider,
          apiKey: config.keys[config.provider],
          systemPrompt: "Be brief.",
          userPrompt: `Quick response ${i}`,
          maxTokens: 50,
        });
        addLog("success", `Request ${i} completed: ${result.text.slice(0, 40)}...`);
      } catch (error) {
        addLog("error", `Request ${i} failed: ${error.message}`);
      }
    }
  };

  // Test 5: Check console for retry logs
  const checkConsoleLogs = () => {
    addLog("info", "Open browser console (F12) to see [AI] retry logs");
    addLog("info", "Look for: '[AI] Attempt N failed: ... Retrying in Xms'");
    addLog("info", "Retry delays should be: 1s → 2s → 4s (exponential backoff)");
  };

  const clearLogs = () => {
    logsRef.current = [];
    setTestResults([]);
  };

  // Toggle button (floating)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Open AI Timeout Tester"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 998,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#7b5ea7",
          border: "2px solid #9b7eb7",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        🧪
      </button>
    );
  }

  // Full screen modal
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      padding: 20,
    }}>
      <div style={{
        background: "#0d1117",
        border: "1px solid #2a2a35",
        borderRadius: 12,
        width: "100%",
        maxWidth: 900,
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          background: "#16161b",
          borderBottom: "1px solid #2a2a35",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h3 style={{ color: "#e8e6e0", margin: 0, fontSize: 16 }}>🧪 AI Timeout & Retry Tester</h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Instructions */}
          <div style={{ padding: "12px 16px", background: "#13131a", borderBottom: "1px solid #1e1e24", fontSize: 11, color: "#888", lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>Setup: Make sure your API key is configured. Monitor: Check browser console (F12) for [AI] logs.</p>
            <p style={{ margin: "4px 0 0" }}>Throttling: DevTools Network tab → <strong>Slow 4G</strong> (or custom 350kb/s)</p>
          </div>

          {/* Controls */}
          <div style={{ padding: 12, background: "#16161b", borderBottom: "1px solid #1e1e24", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={testNormalRequest} style={buttonStyle}>✓ Normal Request</button>
            <button onClick={testSlowNetwork} style={buttonStyle}>🐌 Slow Network Info</button>
            <button onClick={testWebSearch} style={buttonStyle}>🔍 Web Search</button>
            <button onClick={testMultipleRequests} style={buttonStyle}>📊 Multiple Requests</button>
            <button onClick={checkConsoleLogs} style={buttonStyle}>📋 Console Help</button>
            <button onClick={clearLogs} style={{ ...buttonStyle, background: "#553333" }}>🗑️ Clear</button>
          </div>

          {/* Logs */}
          <div style={{
            flex: 1,
            padding: 12,
            overflowY: "auto",
            fontSize: 12,
          }}>
            {testResults.length === 0 ? (
              <div style={{ color: "#555" }}>Run a test to see logs here...</div>
            ) : (
              testResults.map((log, i) => (
                <div key={i} style={{
                  color: log.type === "error" ? "#e05252" : log.type === "success" ? "#52b788" : log.type === "test" ? "#7b8cde" : log.type === "info" ? "#ee9b00" : "#888",
                  marginBottom: 4,
                  borderLeft: `2px solid ${log.type === "error" ? "#e05252" : log.type === "success" ? "#52b788" : log.type === "test" ? "#7b8cde" : "#555"}`,
                  paddingLeft: 8,
                  lineHeight: 1.4,
                }}>
                  <span style={{ color: "#666", marginRight: 8 }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: 12,
            background: "#13131a",
            borderTop: "1px solid #1e1e24",
            fontSize: 11,
            color: "#555",
            lineHeight: 1.5,
          }}>
            <strong>What to look for:</strong> Success shows token count • Retries appear in console as [AI] messages • Delays increase (1s → 2s) • Timeout after 30s
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "6px 10px",
  background: "#7b5ea7",
  color: "#fff",
  border: "1px solid #9b7eb7",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "monospace",
  fontWeight: 500,
  transition: "all 0.2s",
};

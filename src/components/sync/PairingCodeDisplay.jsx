/**
 * PairingCodeDisplay - shows the current pairing code
 */

export function PairingCodeDisplay({ code, onClose }) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="sync-modal-overlay">
      <div className="sync-modal">
        <div className="modal-header">
          <h3>📲 Share This Code</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>Share this code with another device on your network:</p>

          <div className="code-display-large">
            <div className="code-numbers">
              {code.split("").map((digit, i) => (
                <div key={i} className="code-digit">
                  {digit}
                </div>
              ))}
            </div>
            <button className="btn-copy-large" onClick={handleCopyCode}>
              Copy Code
            </button>
          </div>

          <div className="code-instructions">
            <p>
              <strong>On the other device:</strong>
            </p>
            <ol>
              <li>Open Network Sync settings</li>
              <li>Click "Connect to Device"</li>
              <li>Enter this code: <code>{code}</code></li>
              <li>Enter the server URL</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

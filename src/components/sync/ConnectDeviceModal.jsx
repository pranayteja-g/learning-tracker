/**
 * ConnectDeviceModal - modal for connecting to a remote device
 */

import { useState } from "react";

export function ConnectDeviceModal({ onClose, useSync }) {
  const { connectToDevice } = useSync();
  const [serverUrl, setServerUrl] = useState("ws://192.168.1.");
  const [pairingCode, setPairingCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!serverUrl.trim()) {
        throw new Error("Server URL is required");
      }
      if (!pairingCode.trim()) {
        throw new Error("Pairing code is required");
      }

      // Ensure serverUrl has proper format
      let url = serverUrl.trim();
      if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
        url = "ws://" + url;
      }
      if (!url.includes(":")) {
        url += ":3001"; // default port
      }

      const name = deviceName.trim() || "Remote Device";
      const success = await connectToDevice(url, pairingCode, name);

      if (success) {
        onClose();
      } else {
        setError("Failed to connect to device");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sync-modal-overlay">
      <div className="sync-modal">
        <div className="modal-header">
          <h3>🔗 Connect to Device</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="serverUrl">
              Server URL (e.g., ws://192.168.1.100:3001)
            </label>
            <input
              id="serverUrl"
              type="text"
              placeholder="ws://192.168.1.100:3001"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              required
            />
            <p className="help-text">
              Enter the WebSocket address of the sync server
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="pairingCode">Pairing Code (6 digits)</label>
            <input
              id="pairingCode"
              type="text"
              placeholder="123456"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.slice(0, 6))}
              maxLength="6"
              required
            />
            <p className="help-text">Get this from the other device</p>
          </div>

          <div className="form-group">
            <label htmlFor="deviceName">Device Name (optional)</label>
            <input
              id="deviceName"
              type="text"
              placeholder="My Laptop"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="info-box">
            <p>
              <strong>Note:</strong> You need to run a sync server on your
              network. See the documentation for setup instructions.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Connecting..." : "Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

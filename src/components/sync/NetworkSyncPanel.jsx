/**
 * NetworkSyncPanel - UI for managing device connections and sync settings
 */

import { useState } from "react";
import "./NetworkSyncPanel.css";
import { ConnectDeviceModal } from "./ConnectDeviceModal";
import { PairingCodeDisplay } from "./PairingCodeDisplay";

export function NetworkSyncPanel({ onClose, useSync }) {
  const syncState = typeof useSync === 'function' ? useSync() : useSync;
  
  const {
    deviceId,
    isConnected,
    connectionError,
    pairedDevices,
    currentPairingCode,
    generateNewPairingCode,
    disconnect,
    unpairDevice,
    clearPairingCode,
    syncManager,
  } = syncState;

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPairingCode, setShowPairingCode] = useState(false);
  const [showServerConnect, setShowServerConnect] = useState(false);
  // Railway sync server (update after deployment)
  const [serverUrl, setServerUrl] = useState("wss://learning-tracker-production-70a8.up.railway.app");

  const handleConnectToServer = async (e) => {
    e.preventDefault();
    try {
      // Just connect to server, don't pair yet
      if (syncManager) {
        await syncManager.connect(serverUrl);
        setShowServerConnect(false);
      }
    } catch (e) {
      console.error("Failed to connect to server:", e);
    }
  };

  const handleGenerateCode = () => {
    if (!isConnected) {
      alert("Please connect to sync server first");
      setShowServerConnect(true);
      return;
    }
    generateNewPairingCode();
    setShowPairingCode(true);
  };

  return (
    <>
      {/* Device Info */}
      <section className="sync-section">
        <h3>This Device</h3>
        <div className="device-info">
          <div className="info-row">
            <span className="label">Device ID:</span>
            <span className="value mono">{deviceId?.slice(0, 12)}...</span>
            <button
              className="copy-btn"
              title="Copy device ID"
              onClick={() => navigator.clipboard.writeText(deviceId)}
            >
              📋
            </button>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <section className="sync-section">
        <h3>Connection Status</h3>
        <div className="status">
          <div className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "🟢 Connected to Server" : "⚪ Not connected to server"}
          </div>
          {connectionError && <div className="error">{connectionError}</div>}
          {!isConnected && (
            <>
              <p className="help-text">
                Enter the sync server URL from your main device to connect.
              </p>
              <button 
                className="btn-primary" 
                onClick={() => setShowServerConnect(!showServerConnect)}
              >
                {showServerConnect ? "Cancel" : "Connect to Sync Server"}
              </button>
              {showServerConnect && (
                <form onSubmit={handleConnectToServer} className="server-connect-form">
                  <input
                    type="text"
                    placeholder="ws://192.168.31.183:3001"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    required
                  />
                  <button type="submit">Connect</button>
                </form>
              )}
            </>
          )}
          {isConnected && (
            <button className="btn-secondary" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
      </section>

      {/* Pairing Code Display */}
      {showPairingCode && currentPairingCode && (
        <PairingCodeDisplay
          code={currentPairingCode}
          onClose={() => {
            setShowPairingCode(false);
            clearPairingCode();
          }}
        />
      )}

      {/* Connect to Device */}
      {isConnected && (
        <section className="sync-section">
          <h3>Connect to Another Device</h3>
          <p className="help-text">
            To sync with another device, enter its connection details below.
          </p>
          <button className="btn-primary" onClick={() => setShowConnectModal(true)}>
            + Connect to Device
          </button>
        </section>
      )}

      {/* Generate Pairing Code */}
      {isConnected && (
        <section className="sync-section">
          <h3>Share Pairing Code</h3>
          <p className="help-text">
            Generate a code to share with another device on the same network.
          </p>
          <button className="btn-primary" onClick={handleGenerateCode}>
            Generate Code
          </button>
        </section>
      )}

      {/* Paired Devices */}
      {pairedDevices && pairedDevices.length > 0 && (
        <section className="sync-section">
          <h3>Paired Devices ({pairedDevices.length})</h3>
          <div className="paired-devices-list">
            {pairedDevices.map((device, idx) => (
              <div key={idx} className="device-item">
                <div className="device-details">
                  <h4>{device.name}</h4>
                  <p className="device-url">{device.serverUrl}</p>
                  <p className="device-time">
                    Connected {new Date(device.connectedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  className="btn-remove"
                  onClick={() => unpairDevice(idx)}
                  title="Remove pairing"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info Box */}
      <section className="sync-section info-box">
        <h4>ℹ️ How it works</h4>
        <ul>
          <li>Generate a pairing code to share with another device</li>
          <li>Enter the server URL and code to connect</li>
          <li>Once connected, your progress syncs automatically</li>
          <li>Changes on either device appear on both within seconds</li>
        </ul>
      </section>

      {showConnectModal && (
        <ConnectDeviceModal
          onClose={() => setShowConnectModal(false)}
          useSync={() => syncState}
        />
      )}
    </>
  );
}

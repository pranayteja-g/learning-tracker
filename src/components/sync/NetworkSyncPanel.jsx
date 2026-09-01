/**
 * NetworkSyncPanel - UI for managing direct device-to-device sync.
 */

import { useState } from "react";
import "./NetworkSyncPanel.css";
import { ConnectDeviceModal } from "./ConnectDeviceModal";
import { PairingCodeDisplay } from "./PairingCodeDisplay";

export function NetworkSyncPanel({ useSync }) {
  const syncState = useSync;

  const {
    deviceId,
    deviceName,
    isConnected,
    connectionError,
    pairedDevices,
    currentPairingCode,
    currentSignalType,
    awaitingAnswer,
    peerDevice,
    lastSyncAt,
    createPairOffer,
    connectToDevice,
    finalizeConnection,
    disconnect,
    syncData,
    requestFullSync,
    unpairDevice,
    clearPairingCode,
  } = syncState;

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showPairingPayload, setShowPairingPayload] = useState(false);

  const handleCreateOffer = async () => {
    await createPairOffer();
    setShowPairingPayload(true);
  };

  const handleConnectWithOffer = async (offerPayload) => {
    await connectToDevice(offerPayload);
    setShowPairingPayload(true);
  };

  const handleFinishPairing = async (answerPayload) => {
    await finalizeConnection(answerPayload);
  };

  const handleSendSnapshot = () => {
    const sent = syncData("manual");
    if (!sent) {
      alert("The peer connection is not open yet.");
    }
  };

  const handleRequestSnapshot = () => {
    const sent = requestFullSync();
    if (!sent) {
      alert("The peer connection is not open yet.");
    }
  };

  return (
    <>
      <section className="sync-section">
        <h3>This Device</h3>
        <div className="device-info">
          <div className="info-row">
            <span className="label">Name</span>
            <span className="value">{deviceName || "This Device"}</span>
          </div>
          <div className="info-row">
            <span className="label">Device ID</span>
            <span className="value mono">{deviceId?.slice(0, 12)}...</span>
            <button
              className="copy-btn"
              title="Copy device ID"
              onClick={() => navigator.clipboard.writeText(deviceId)}
            >
              Copy
            </button>
          </div>
        </div>
      </section>

      <section className="sync-section">
        <h3>Connection Status</h3>
        <div className="status">
          <div className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "Connected directly to peer" : awaitingAnswer ? "Waiting for answer" : "Not connected"}
          </div>
          {peerDevice && (
            <div className="peer-summary">
              Paired with <strong>{peerDevice.deviceName || "Paired Device"}</strong>
            </div>
          )}
          {lastSyncAt && (
            <div className="help-text">Last sync: {new Date(lastSyncAt).toLocaleString()}</div>
          )}
          {connectionError && <div className="error">{connectionError}</div>}
          {isConnected ? (
            <div className="button-row">
              <button className="btn-primary" onClick={handleSendSnapshot}>Send My Data</button>
              <button className="btn-secondary" onClick={handleRequestSnapshot}>Request Peer Data</button>
              <button className="btn-secondary" onClick={disconnect}>Disconnect</button>
            </div>
          ) : (
            <>
              <p className="help-text">
                Pair two open app tabs directly. No sync server is required, but both devices need to keep the app open while syncing.
              </p>
              <div className="button-row">
                <button className="btn-primary" onClick={handleCreateOffer}>Start on This Device</button>
                <button className="btn-secondary" onClick={() => setShowConnectModal(true)}>Connect to an Offer</button>
                {awaitingAnswer && (
                  <button className="btn-secondary" onClick={() => setShowAnswerModal(true)}>Paste Answer</button>
                )}
              </div>
            </>
          )}
          {currentPairingCode && (
            <button className="link-btn" onClick={() => setShowPairingPayload(true)}>
              {currentSignalType === "answer" ? "Open answer payload" : "Open offer payload"}
            </button>
          )}
        </div>
      </section>

      {pairedDevices && pairedDevices.length > 0 && (
        <section className="sync-section">
          <h3>Known Devices ({pairedDevices.length})</h3>
          <div className="paired-devices-list">
            {pairedDevices.map((device, idx) => (
              <div key={`${device.deviceId || device.name}-${idx}`} className="device-item">
                <div className="device-details">
                  <h4>{device.deviceName || device.name || "Paired Device"}</h4>
                  <p className="device-url mono">{device.deviceId || "Unknown peer"}</p>
                  <p className="device-time">
                    Connected {new Date(device.connectedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  className="btn-remove"
                  onClick={() => unpairDevice(idx)}
                  title="Remove pairing"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sync-section info-box">
        <h4>How it works</h4>
        <ul>
          <li>Device A creates an offer.</li>
          <li>Device B pastes that offer and generates an answer.</li>
          <li>Device A pastes the answer back in.</li>
          <li>After the peer link is live, snapshots sync directly between the two browsers.</li>
        </ul>
      </section>

      {showPairingPayload && currentPairingCode && (
        <PairingCodeDisplay
          payload={currentPairingCode}
          mode={currentSignalType}
          onClose={() => {
            setShowPairingPayload(false);
            if (!awaitingAnswer && currentSignalType === "answer") {
              clearPairingCode();
            }
          }}
        />
      )}

      {showConnectModal && (
        <ConnectDeviceModal
          mode="offer"
          onClose={() => setShowConnectModal(false)}
          onSubmit={handleConnectWithOffer}
        />
      )}

      {showAnswerModal && (
        <ConnectDeviceModal
          mode="answer"
          onClose={() => setShowAnswerModal(false)}
          onSubmit={handleFinishPairing}
        />
      )}
    </>
  );
}

/**
 * ConnectDeviceModal - modal for pasting a WebRTC offer or answer payload.
 */

import { useState } from "react";

export function ConnectDeviceModal({ onClose, onSubmit, mode = "offer" }) {
  const [signalPayload, setSignalPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAnswer = mode === "answer";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmed = signalPayload.trim();
      if (!trimmed) {
        throw new Error(`${isAnswer ? "Answer" : "Offer"} payload is required`);
      }

      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to continue pairing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sync-modal-overlay">
      <div className="sync-modal sync-modal-wide">
        <div className="modal-header">
          <h3>{isAnswer ? "Complete Pairing" : "Connect to Device"}</h3>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="signalPayload">
              {isAnswer ? "Paste the answer from the second device" : "Paste the offer from the first device"}
            </label>
            <textarea
              id="signalPayload"
              className="signal-textarea"
              placeholder={isAnswer ? "Paste answer JSON here" : "Paste offer JSON here"}
              value={signalPayload}
              onChange={(e) => setSignalPayload(e.target.value)}
              required
            />
            <p className="help-text">
              {isAnswer
                ? "Open the pairing screen on the other device, copy its answer, and paste it here."
                : "Open the pairing screen on the other device, copy its offer, and paste it here."}
            </p>
          </div>

          {error && <div className="error-box">{error}</div>}

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
              {loading ? "Working..." : isAnswer ? "Finish Pairing" : "Generate Answer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

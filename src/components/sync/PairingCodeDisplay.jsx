/**
 * PairingCodeDisplay - shows an offer or answer payload with copy + QR.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function PairingCodeDisplay({ payload, mode = "offer", onClose }) {
  const canvasRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState("Copy Payload");
  const isAnswer = mode === "answer";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;

    QRCode.toCanvas(canvas, payload, {
      errorCorrectionLevel: "L",
      margin: 1,
      width: 220,
      color: {
        dark: "#111827",
        light: "#f8fafc",
      },
    }).catch((error) => {
      console.error("Failed to render QR code:", error);
    });
  }, [payload]);

  const handleCopyPayload = async () => {
    await navigator.clipboard.writeText(payload);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy Payload"), 1500);
  };

  return (
    <div className="sync-modal-overlay">
      <div className="sync-modal sync-modal-wide">
        <div className="modal-header">
          <h3>{isAnswer ? "Share This Answer" : "Share This Offer"}</h3>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </div>

        <div className="modal-body">
          <p className="help-text">
            {isAnswer
              ? "Send this answer back to the first device. After it is pasted there, the two devices can connect directly."
              : "Open this on the second device and paste the same payload there to generate an answer."}
          </p>

          <div className="signal-share-card">
            <canvas ref={canvasRef} className="signal-qr" />
            <button className="btn-copy-large" onClick={handleCopyPayload}>
              {copyLabel}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="pairingPayloadPreview">Pairing Payload</label>
            <textarea
              id="pairingPayloadPreview"
              className="signal-textarea"
              value={payload}
              readOnly
            />
          </div>

          <div className="code-instructions">
            <p><strong>How to use it</strong></p>
            <ol>
              <li>{isAnswer ? "Copy this answer or scan the QR from the first device." : "Copy this offer or scan the QR on the second device."}</li>
              <li>{isAnswer ? "Paste it into the first device's answer box." : "Paste it into the second device's offer box."}</li>
              <li>{isAnswer ? "Keep both tabs open until the connection status turns green." : "Wait for the second device to send back an answer."}</li>
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

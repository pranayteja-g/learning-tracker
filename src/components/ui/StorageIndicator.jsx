import { useState, useEffect } from "react";
import { estimateStorageUsage } from "../../storage/db.js";

export function StorageIndicator() {
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    estimateStorageUsage().then(setStorage);
  }, []);

  if (!storage) return null;

  const usedMB  = (storage.usage / 1024 / 1024).toFixed(1);
  const quotaMB = (storage.quota / 1024 / 1024).toFixed(0);
  const pct     = storage.pct;
  const color   = pct >= 80 ? "#e05252" : pct >= 60 ? "#ee9b00" : "#52b788";
  const warn    = pct >= 80;

  return (
    <div style={{ background: "#0f0f13", borderRadius: 9, padding: "12px 14px",
      border: `1px solid ${warn ? "#e0525244" : "#1e1e24"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#888" }}>💾 Storage (IndexedDB)</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{usedMB} MB / {quotaMB} MB</span>
      </div>
      <div style={{ height: 4, background: "#1e1e24", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color,
          borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      {warn && (
        <div style={{ fontSize: 11, color: "#e05252", marginTop: 8 }}>
          ⚠️ Storage getting full — export a backup from Settings → Data.
        </div>
      )}
    </div>
  );
}

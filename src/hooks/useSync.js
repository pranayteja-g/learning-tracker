/**
 * useSync Hook - manages direct peer synchronization over WebRTC.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { idbSet, idbGet } from "../storage/db.js";
import {
  SyncManager,
  StateSyncHelper,
  generateDeviceId,
} from "../sync/syncService.js";

const SYNC_CONFIG_KEY = "sync_config";

export function useSync(options = {}) {
  const { snapshot = null, onRemoteSnapshot = null, loaded = true } = options;

  const [syncConfig, setSyncConfig] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [currentSignalPayload, setCurrentSignalPayload] = useState(null);
  const [currentSignalType, setCurrentSignalType] = useState(null);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [peerDevice, setPeerDevice] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);

  const syncManagerRef = useRef(null);
  const stateSyncHelperRef = useRef(new StateSyncHelper());
  const snapshotRef = useRef(snapshot);
  const lastSentSnapshotRef = useRef(null);
  const lastReceivedSnapshotRef = useRef(null);
  const autoSyncTimerRef = useRef(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    const loadSyncConfig = async () => {
      try {
        const config = await idbGet(SYNC_CONFIG_KEY);
        if (config) {
          setSyncConfig(config);
          setPairedDevices(config.pairedDevices || []);
        } else {
          const newConfig = {
            deviceId: generateDeviceId(),
            deviceName: `Device ${Math.random().toString(36).slice(2, 7)}`,
            pairedDevices: [],
            createdAt: Date.now(),
          };
          await idbSet(SYNC_CONFIG_KEY, newConfig);
          setSyncConfig(newConfig);
        }
      } catch (error) {
        console.error("Failed to load sync config:", error);
      }
    };

    loadSyncConfig();
  }, []);

  const persistPairedDevices = useCallback(async (nextDevices) => {
    setPairedDevices(nextDevices);

    setSyncConfig((current) => {
      if (!current) return current;
      const updated = { ...current, pairedDevices: nextDevices };
      idbSet(SYNC_CONFIG_KEY, updated);
      return updated;
    });
  }, []);

  const sendFullSnapshot = useCallback((reason = "manual") => {
    if (!syncManagerRef.current || !snapshotRef.current) return false;

    const syncableData = stateSyncHelperRef.current.getSyncableData(snapshotRef.current);
    const snapshotString = JSON.stringify(syncableData);
    const sent = syncManagerRef.current.send("full_snapshot", {
      reason,
      data: syncableData,
    });

    if (sent) {
      lastSentSnapshotRef.current = snapshotString;
      setLastSyncAt(Date.now());
      setInitialSyncComplete(true);
    }

    return sent;
  }, []);

  useEffect(() => {
    if (!syncConfig || syncManagerRef.current) return undefined;

    const manager = new SyncManager({
      deviceId: syncConfig.deviceId,
      deviceName: syncConfig.deviceName,
    });
    syncManagerRef.current = manager;

    const unsubscribe = manager.subscribe((event) => {
      if (event.type === "connected") {
        setIsConnected(true);
        setConnectionError(null);
        if (event.peer) setPeerDevice(event.peer);
      } else if (event.type === "peer_ready") {
        setPeerDevice(event.peer || null);
        setIsConnected(true);
        setConnectionError(null);

        const peer = event.peer || null;
        if (peer) {
          const exists = pairedDevices.some((device) => device.deviceId === peer.deviceId);
          if (!exists) {
            persistPairedDevices([
              ...pairedDevices,
              {
                ...peer,
                connectedAt: Date.now(),
              },
            ]);
          }
        }

        if (event.isInitiator && !initialSyncComplete) {
          setTimeout(() => sendFullSnapshot("initial"), 300);
        }
      } else if (event.type === "disconnected") {
        setIsConnected(false);
        setAwaitingAnswer(false);
      } else if (event.type === "error") {
        setConnectionError(event.message);
      }
    });

    manager.on("full_snapshot", async (payload) => {
      const remoteData = payload?.data;
      if (!remoteData || typeof remoteData !== "object") return;

      const normalized = stateSyncHelperRef.current.getSyncableData(remoteData);
      const snapshotString = JSON.stringify(normalized);
      lastReceivedSnapshotRef.current = snapshotString;
      setLastSyncAt(Date.now());
      setInitialSyncComplete(true);

      if (typeof onRemoteSnapshot === "function") {
        await onRemoteSnapshot(normalized, payload?.reason || "peer");
      }
    });

    manager.on("snapshot_request", () => {
      sendFullSnapshot("request");
    });

    return () => {
      unsubscribe();
      manager.disconnect({ silent: true });
      syncManagerRef.current = null;
    };
  }, [initialSyncComplete, onRemoteSnapshot, pairedDevices, persistPairedDevices, sendFullSnapshot, syncConfig]);

  useEffect(() => {
    if (!syncManagerRef.current || !syncConfig) return;
    syncManagerRef.current.updateDeviceName(syncConfig.deviceName);
  }, [syncConfig]);

  useEffect(() => {
    if (!loaded || !isConnected || !initialSyncComplete || !snapshot) return undefined;

    const syncableData = stateSyncHelperRef.current.getSyncableData(snapshot);
    const snapshotString = JSON.stringify(syncableData);

    if (
      snapshotString === lastSentSnapshotRef.current ||
      snapshotString === lastReceivedSnapshotRef.current
    ) {
      return undefined;
    }

    clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      sendFullSnapshot("auto");
    }, 500);

    return () => clearTimeout(autoSyncTimerRef.current);
  }, [snapshot, loaded, isConnected, initialSyncComplete, sendFullSnapshot]);

  const createPairOffer = useCallback(async () => {
    if (!syncManagerRef.current) {
      throw new Error("Sync manager not initialized");
    }

    setConnectionError(null);
    setPeerDevice(null);
    setInitialSyncComplete(false);

    const offer = await syncManagerRef.current.createOffer();
    setCurrentSignalPayload(offer);
    setCurrentSignalType("offer");
    setAwaitingAnswer(true);
    return offer;
  }, []);

  const connectToDevice = useCallback(async (offerPayload) => {
    if (!syncManagerRef.current) {
      throw new Error("Sync manager not initialized");
    }

    setConnectionError(null);
    setInitialSyncComplete(false);

    const answer = await syncManagerRef.current.acceptOffer(offerPayload);
    setCurrentSignalPayload(answer);
    setCurrentSignalType("answer");
    setAwaitingAnswer(false);
    return answer;
  }, []);

  const finalizeConnection = useCallback(async (answerPayload) => {
    if (!syncManagerRef.current) {
      throw new Error("Sync manager not initialized");
    }

    setConnectionError(null);
    await syncManagerRef.current.acceptAnswer(answerPayload);
    setCurrentSignalPayload(null);
    setCurrentSignalType(null);
    setAwaitingAnswer(false);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.disconnect();
    }
    setCurrentSignalPayload(null);
    setCurrentSignalType(null);
    setAwaitingAnswer(false);
    setInitialSyncComplete(false);
  }, []);

  const requestFullSync = useCallback(() => {
    if (!syncManagerRef.current) return false;
    return syncManagerRef.current.requestStateSync();
  }, []);

  const unpairDevice = useCallback(async (deviceIndex) => {
    const nextDevices = pairedDevices.filter((_, index) => index !== deviceIndex);
    await persistPairedDevices(nextDevices);

    if (nextDevices.length === 0 && syncManagerRef.current && !syncManagerRef.current.isConnected) {
      setPeerDevice(null);
    }
  }, [pairedDevices, persistPairedDevices]);

  const clearPairingCode = useCallback(() => {
    setCurrentSignalPayload(null);
    setCurrentSignalType(null);
  }, []);

  return {
    deviceId: syncConfig?.deviceId,
    deviceName: syncConfig?.deviceName,
    isConnected,
    connectionError,
    pairedDevices,
    currentPairingCode: currentSignalPayload,
    currentSignalType,
    awaitingAnswer,
    peerDevice,
    lastSyncAt,
    syncConfig,
    createPairOffer,
    connectToDevice,
    finalizeConnection,
    disconnect,
    syncData: sendFullSnapshot,
    requestFullSync,
    unpairDevice,
    clearPairingCode,
  };
}

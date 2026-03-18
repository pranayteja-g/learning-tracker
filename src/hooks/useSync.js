/**
 * useSync Hook - manages network synchronization state and logic
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { idbSet, idbGet } from "../storage/db.js";
import {
  SyncManager,
  StateSyncHelper,
  generatePairingCode,
  generateDeviceId,
} from "../sync/syncService.js";

const SYNC_CONFIG_KEY = "sync_config";

export function useSync() {
  const [syncConfig, setSyncConfig] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [currentPairingCode, setCurrentPairingCode] = useState(null);

  const syncManagerRef = useRef(null);
  const stateSyncHelperRef = useRef(new StateSyncHelper());

  // Load sync config on mount
  useEffect(() => {
    const loadSyncConfig = async () => {
      try {
        const config = await idbGet(SYNC_CONFIG_KEY);
        if (config) {
          setSyncConfig(config);
          setPairedDevices(config.pairedDevices || []);
        } else {
          // Create new config
          const newConfig = {
            deviceId: generateDeviceId(),
            deviceName: `Device ${Math.random().toString(36).substr(2, 5)}`,
            pairedDevices: [],
            createdAt: Date.now(),
          };
          await idbSet(SYNC_CONFIG_KEY, newConfig);
          setSyncConfig(newConfig);
        }
      } catch (e) {
        console.error("Failed to load sync config:", e);
      }
    };

    loadSyncConfig();
  }, []);

  // Initialize sync manager
  useEffect(() => {
    if (syncConfig && !syncManagerRef.current) {
      syncManagerRef.current = new SyncManager({
        deviceId: syncConfig.deviceId,
      });

      // Subscribe to connection state changes
      syncManagerRef.current.subscribe((event) => {
        if (event.type === "connected") {
          setIsConnected(true);
          setConnectionError(null);
        } else if (event.type === "disconnected") {
          setIsConnected(false);
        } else if (event.type === "error") {
          setConnectionError(event.message);
          setIsConnected(false);
        }
      });
    }

    return () => {
      // Cleanup on unmount
      if (syncManagerRef.current) {
        syncManagerRef.current.disconnect();
      }
    };
  }, [syncConfig]);

  /**
   * Generate a new pairing code for this device
   */
  const generateNewPairingCode = useCallback(() => {
    const code = generatePairingCode();
    setCurrentPairingCode(code);
    return code;
  }, []);

  /**
   * Connect to a remote device via server URL and pairing code
   */
  const connectToDevice = useCallback(
    async (serverUrl, pairingCode, deviceName = "Remote Device") => {
      if (!syncManagerRef.current) {
        throw new Error("Sync manager not initialized");
      }

      try {
        setConnectionError(null);

        // Connect to sync server
        await syncManagerRef.current.connect(serverUrl);

        // Send pairing request
        syncManagerRef.current.send("pairing_request", {
          pairingCode,
          deviceName: syncConfig?.deviceName || "Unknown Device",
        });

        // Add to paired devices
        const newPairedDevice = {
          name: deviceName,
          serverUrl,
          connectedAt: Date.now(),
        };

        const updatedPaired = [...pairedDevices, newPairedDevice];
        setPairedDevices(updatedPaired);

        // Update stored config
        if (syncConfig) {
          const updated = { ...syncConfig, pairedDevices: updatedPaired };
          await idbSet(SYNC_CONFIG_KEY, updated);
          setSyncConfig(updated);
        }

        return true;
      } catch (e) {
        const errorMsg = `Connection failed: ${e.message}`;
        setConnectionError(errorMsg);
        console.error(errorMsg);
        return false;
      }
    },
    [syncConfig, pairedDevices]
  );

  /**
   * Disconnect from sync server
   */
  const disconnect = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  /**
   * Sync data with remote device
   */
  const syncData = useCallback((key, value) => {
    if (!syncManagerRef.current) return false;
    return syncManagerRef.current.syncData(key, value);
  }, []);

  /**
   * Request full state sync
   */
  const requestFullSync = useCallback((fromDeviceId) => {
    if (!syncManagerRef.current) return false;
    return syncManagerRef.current.requestStateSync(fromDeviceId);
  }, []);

  /**
   * Unpair a device
   */
  const unpairDevice = useCallback(
    async (deviceIndex) => {
      const updated = pairedDevices.filter((_, i) => i !== deviceIndex);
      setPairedDevices(updated);

      if (syncConfig) {
        const config = { ...syncConfig, pairedDevices: updated };
        await idbSet(SYNC_CONFIG_KEY, config);
        setSyncConfig(config);
      }

      // If currently connected to this device, disconnect
      if (updated.length === 0) {
        disconnect();
      }
    },
    [pairedDevices, syncConfig, disconnect]
  );

  /**
   * Clear pairing code display
   */
  const clearPairingCode = useCallback(() => {
    setCurrentPairingCode(null);
  }, []);

  return {
    // State
    deviceId: syncConfig?.deviceId,
    deviceName: syncConfig?.deviceName,
    isConnected,
    connectionError,
    pairedDevices,
    currentPairingCode,
    syncConfig,

    // Actions
    generateNewPairingCode,
    connectToDevice,
    disconnect,
    syncData,
    requestFullSync,
    unpairDevice,
    clearPairingCode,

    // Internal
    syncManager: syncManagerRef.current,
  };
}

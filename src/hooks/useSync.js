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

      // Auto-connect to local sync server
      const autoConnect = async () => {
        try {
          // Try to detect the server - first check if we're on localhost (dev)
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            console.log("📡 Attempting to connect to local sync server...");
            await syncManagerRef.current.connect("ws://localhost:3001");
          } else {
            // For other hosts, try to connect to same host on port 3001
            const serverUrl = `ws://${window.location.hostname}:3001`;
            console.log("📡 Attempting to connect to sync server at:", serverUrl);
            await syncManagerRef.current.connect(serverUrl);
          }
        } catch (e) {
          // Connection failed, but that's okay - user can manually connect
          console.log("ℹ️ Auto-connect failed (user can manually connect later):", e.message);
        }
      };

      // Try to auto-connect after a small delay
      const timeout = setTimeout(autoConnect, 1000);
      return () => clearTimeout(timeout);
    }

    return () => {
      // Cleanup on unmount
      if (syncManagerRef.current) {
        syncManagerRef.current.disconnect();
      }
    };
  }, [syncConfig]);

  /**
   * Generate a new pairing code for this device and advertise it to server
   */
  const generateNewPairingCode = useCallback(() => {
    const code = generatePairingCode();
    setCurrentPairingCode(code);
    
    // Tell server this device is waiting for this pairing code
    if (syncManagerRef.current && syncConfig) {
      const connected = syncManagerRef.current.send("advertise_pairing", {
        pairingCode: code,
        deviceName: syncConfig.deviceName || "Unknown Device",
      });
      if (connected) {
        console.log("📢 Advertising pairing code to server:", code);
      } else {
        console.warn("Not connected to server when advertising pairing code");
      }
    }
    
    return code;
  }, [syncConfig]);

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
        console.log("🔗 Connecting to server:", serverUrl);

        // Connect to sync server
        await syncManagerRef.current.connect(serverUrl);
        console.log("✓ WebSocket connected, sending pairing request...");

        // Set up pairing confirmation waiter
        const pairingPromise = syncManagerRef.current.waitForPairingConfirmation(10000);

        // Send pairing request
        const sentSuccessfully = syncManagerRef.current.send("pairing_request", {
          pairingCode,
          deviceName: syncConfig?.deviceName || "Unknown Device",
        });
        
        if (!sentSuccessfully) {
          throw new Error("Failed to send pairing request to server");
        }
        console.log("📤 Pairing request sent with code:", pairingCode);

        // Wait for server to confirm pairing (timeout after 10 seconds)
        await pairingPromise;
        console.log("✅ Connection successful!");

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
        console.error("❌ Sync error:", errorMsg, e);
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

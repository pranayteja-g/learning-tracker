/**
 * Network Sync Service
 * Manages device pairing and state synchronization over WebSocket
 */

// Generate a random 6-digit pairing code
export function generatePairingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a unique device ID
export function generateDeviceId() {
  return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sync Manager - handles WebSocket connections and state sync
 */
export class SyncManager {
  constructor(options = {}) {
    this.ws = null;
    this.deviceId = options.deviceId || generateDeviceId();
    this.serverUrl = options.serverUrl; // e.g., "ws://192.168.1.100:3001"
    this.messageHandlers = new Map();
    this.isConnected = false;
    this.isPaired = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.listeners = new Set();
    this.pairingPromise = null;
    this.pairingResolve = null;
    this.isAutoConnect = false;
  }

  // Register a callback to be notified of state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of state changes
  notifyListeners(event) {
    this.listeners.forEach(cb => cb(event));
  }

  /**
   * Connect to sync server
   */
  async connect(serverUrl, isAutoConnect = false) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("Already connected");
      return;
    }

    this.serverUrl = serverUrl;
    this.isAutoConnect = isAutoConnect;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log("✓ Sync connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send device info on connect
          this.send("device_connect", {
            deviceId: this.deviceId,
            timestamp: Date.now(),
          });

          this.notifyListeners({ type: "connected" });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this._handleMessage(message);
          } catch (e) {
            console.error("Failed to parse sync message:", e);
          }
        };

        this.ws.onerror = (error) => {
          console.error("Sync WebSocket error:", error);
          // Only notify listeners about errors if it's a manual connection attempt
          if (!this.isAutoConnect) {
            this.notifyListeners({ type: "error", message: "WebSocket connection failed" });
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("Sync disconnected (readyState:", this.ws?.readyState, ")");
          this.isConnected = false;
          this.notifyListeners({ type: "disconnected" });
          this._attemptReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Wait for pairing confirmation from server
   */
  waitForPairingConfirmation(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      this.pairingResolve = resolve;
      
      const timeout = setTimeout(() => {
        this.pairingResolve = null;
        console.warn("Pairing confirmation timeout - server may not have received pairing request");
        reject(new Error("Pairing confirmation timeout (10s)"));
      }, timeoutMs);

      // Store timeout ID for cleanup
      this._pairingTimeout = timeout;
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Send a message to the sync server
   */
  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("Not connected to sync server");
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type,
          deviceId: this.deviceId,
          payload,
          timestamp: Date.now(),
        })
      );
      return true;
    } catch (e) {
      console.error("Failed to send sync message:", e);
      return false;
    }
  }

  /**
   * Sync a specific data key with remote
   */
  syncData(key, value) {
    return this.send("data_update", { key, value });
  }

  /**
   * Request full state sync from another device
   */
  requestStateSync(fromDeviceId) {
    return this.send("request_state", { fromDeviceId });
  }

  /**
   * Handle incoming messages
   */
  _handleMessage(message) {
    const { type, deviceId, payload } = message;

    // Handle pairing confirmation
    if (type === "pairing_confirmed") {
      console.log("✅ Pairing confirmed by server with code:", payload.code);
      this.isPaired = true;
      if (this._pairingTimeout) {
        clearTimeout(this._pairingTimeout);
        this._pairingTimeout = null;
      }
      if (this.pairingResolve) {
        this.pairingResolve(payload);
        this.pairingResolve = null;
      } else {
        console.warn("Pairing confirmed but no resolver waiting");
      }
      return;
    }

    // Handle welcome from server
    if (type === "welcome") {
      console.log("👋 Welcome message from server, device connected");
      return;
    }

    // Call any registered handlers for this message type
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(payload, deviceId);
    }

    // Notify listeners
    this.notifyListeners({
      type: "message",
      messageType: type,
      deviceId,
      payload,
    });
  }

  /**
   * Register a handler for a specific message type
   */
  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Attempt to reconnect to the sync server
   */
  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(
        "Max reconnect attempts reached, giving up on auto-reconnect"
      );
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      if (this.serverUrl && !this.isConnected) {
        this.connect(this.serverUrl, true).catch((e) => {
          console.log("Reconnect attempt failed:", e);
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

/**
 * State Sync Helper
 * Manages which data should be synced
 */
export class StateSyncHelper {
  constructor() {
    this.syncKeys = [
      "roadmaps",
      "progress",
      "notes",
      "resources",
      "topicMeta",
      "quests",
      "quizResults",
      "streak",
    ];
  }

  // Get all data that should be synced
  getSyncableData(appState) {
    const syncData = {};
    this.syncKeys.forEach((key) => {
      if (key in appState) {
        syncData[key] = appState[key];
      }
    });
    return syncData;
  }

  // Merge remote state with local state (remote takes precedence for now)
  mergeState(localState, remoteState) {
    return {
      ...localState,
      ...remoteState,
    };
  }
}

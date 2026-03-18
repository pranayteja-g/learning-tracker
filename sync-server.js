#!/usr/bin/env node

/**
 * Learning Tracker Sync Server
 * Run this on your local network to enable device-to-device synchronization
 * 
 * Usage: node sync-server.js [--port 3001]
 */

import { WebSocketServer } from "ws";
import http from "http";
import os from "os";

const DEFAULT_PORT = 3001;
const port = parseInt(process.argv[2]) || DEFAULT_PORT;

// In-memory store of connected devices and their sync codes
const devices = new Map(); // deviceId -> { id, name, ws, syncCode, connectedAt }
const syncCodes = new Map(); // syncCode -> deviceId
const sharedState = new Map(); // key -> { value, updatedBy, timestamp }

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "running",
        port,
        connectedDevices: devices.size,
        devices: Array.from(devices.values()).map((d) => ({
          id: d.id,
          name: d.name,
          connectedAt: d.connectedAt,
        })),
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log(`[${new Date().toLocaleTimeString()}] New connection`);

  let deviceId = null;
  let syncCode = null;

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message, (id, code) => {
        deviceId = id;
        syncCode = code;
      });
    } catch (e) {
      console.error("Failed to parse message:", e.message);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    if (deviceId) {
      devices.delete(deviceId);
      if (syncCode) syncCodes.delete(syncCode);
      console.log(`[${new Date().toLocaleTimeString()}] ${deviceId} disconnected`);
      broadcastToAll({
        type: "device_disconnected",
        deviceId,
      });
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

/**
 * Handle incoming messages
 */
function handleMessage(ws, message, onDeviceConnected) {
  const { type, deviceId, payload, timestamp } = message;

  // Handle device connection
  if (type === "device_connect") {
    if (devices.has(deviceId)) {
      // Reconnect - close old connection
      const oldDevice = devices.get(deviceId);
      oldDevice.ws.close();
    }

    const device = {
      id: deviceId,
      name: payload.deviceName || "Unknown",
      ws,
      connectedAt: timestamp,
      syncCode: null,
    };
    devices.set(deviceId, device);
    console.log(`[${new Date().toLocaleTimeString()}] ✓ ${device.name} (${deviceId.slice(0, 12)}) connected`);

    ws.send(
      JSON.stringify({
        type: "welcome",
        deviceId,
        timestamp: Date.now(),
      })
    );

    broadcastToAll({
      type: "device_connected",
      deviceId,
      deviceName: device.name,
    });
  }

  // Handle pairing request
  else if (type === "pairing_request") {
    const pairingCode = payload.pairingCode;
    if (devices.has(deviceId)) {
      const device = devices.get(deviceId);
      device.syncCode = pairingCode;
      syncCodes.set(pairingCode, deviceId);

      console.log(`[${new Date().toLocaleTimeString()}] 🔗 Pairing code ${pairingCode} registered for ${device.name}`);

      // Send confirmation back to device
      const confirmMsg = JSON.stringify({
        type: "pairing_confirmed",
        code: pairingCode,
        timestamp: Date.now(),
      });
      
      console.log(`[${new Date().toLocaleTimeString()}] 📤 Sending confirmation to ${deviceId.slice(0, 12)}...`);
      ws.send(confirmMsg);
      console.log(`[${new Date().toLocaleTimeString()}] ✓ Pairing confirmed sent`);

      onDeviceConnected(deviceId, pairingCode);
    } else {
      console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Pairing request from unknown device: ${deviceId}`);
    }
  }

  // Handle data updates
  else if (type === "data_update") {
    return handleDataUpdate(deviceId, payload);
  }

  // Handle state sync requests
  else if (type === "request_state") {
    return handleStateSync(ws, deviceId, payload);
  }

  // Handle full state push
  else if (type === "sync_full_state") {
    return handleFullStateSync(deviceId, payload);
  }
}

/**
 * Handle data updates from a device
 */
function handleDataUpdate(fromDeviceId, payload) {
  const { key, value } = payload;

  // Store the update
  sharedState.set(key, {
    value,
    updatedBy: fromDeviceId,
    timestamp: Date.now(),
  });

  console.log(`[${new Date().toLocaleTimeString()}] 📤 Data update from ${fromDeviceId.slice(0, 12)}: ${key}`);

  // Broadcast to all other devices
  broadcastToAllExcept(fromDeviceId, {
    type: "data_update",
    key,
    value,
    updatedBy: fromDeviceId,
    timestamp: Date.now(),
  });
}

/**
 * Handle state sync requests
 */
function handleStateSync(ws, deviceId, payload) {
  const { fromDeviceId } = payload;

  // Send all current state
  const state = {};
  sharedState.forEach((data, key) => {
    state[key] = data.value;
  });

  ws.send(
    JSON.stringify({
      type: "state_sync",
      state,
      timestamp: Date.now(),
    })
  );

  console.log(`[${new Date().toLocaleTimeString()}] 🔄 State sync sent to ${deviceId.slice(0, 12)}`);
}

/**
 * Handle full state sync from a device
 */
function handleFullStateSync(fromDeviceId, payload) {
  const { state } = payload;

  // Update shared state with all entries
  if (state && typeof state === "object") {
    Object.entries(state).forEach(([key, value]) => {
      sharedState.set(key, {
        value,
        updatedBy: fromDeviceId,
        timestamp: Date.now(),
      });
    });

    console.log(`[${new Date().toLocaleTimeString()}] 📥 Full state sync from ${fromDeviceId.slice(0, 12)}: ${Object.keys(state).length} items`);
  }
}

/**
 * Broadcast a message to all connected devices
 */
function broadcastToAll(message) {
  devices.forEach((device) => {
    if (device.ws.readyState === 1) {
      device.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Broadcast a message to all devices except the sender
 */
function broadcastToAllExcept(exceptDeviceId, message) {
  devices.forEach((device, id) => {
    if (id !== exceptDeviceId && device.ws.readyState === 1) {
      device.ws.send(JSON.stringify(message));
    }
  });
}

// Start server
server.listen(port, () => {
  console.log(`\n🚀 Learning Tracker Sync Server running on ws://localhost:${port}`);
  console.log(`📡 Local network: ws://${getLocalIP()}:${port}\n`);
  console.log("Press Ctrl+C to stop\n");
});

/**
 * Get local IP address
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\nShutting down sync server...");
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log("Server stopped");
    process.exit(0);
  });
});

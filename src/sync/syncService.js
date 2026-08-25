/**
 * Peer Sync Service
 * Manages manual WebRTC offer/answer exchange and data-channel messaging.
 */

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const SIGNAL_VERSION = 1;
const CHUNK_SIZE = 12000;

export function generateDeviceId() {
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function serializeSignalPayload(payload) {
  return JSON.stringify({
    v: SIGNAL_VERSION,
    ...payload,
  });
}

export function parseSignalPayload(rawPayload) {
  let parsed = rawPayload;

  if (typeof rawPayload === "string") {
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      throw new Error("That pairing payload is not valid JSON.");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid pairing payload.");
  }

  if (parsed.v !== SIGNAL_VERSION) {
    throw new Error("Unsupported pairing payload version.");
  }

  if (!parsed.type || !parsed.sdp) {
    throw new Error("Pairing payload is missing required fields.");
  }

  return parsed;
}

function createChunkId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") return;

  await new Promise((resolve) => {
    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onStateChange);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", onStateChange);
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onStateChange);
      resolve();
    }, 4000);
  });
}

export class SyncManager {
  constructor(options = {}) {
    this.deviceId = options.deviceId || generateDeviceId();
    this.deviceName = options.deviceName || "This Device";
    this.pc = null;
    this.channel = null;
    this.messageHandlers = new Map();
    this.listeners = new Set();
    this.pendingChunks = new Map();
    this.isConnected = false;
    this.isInitiator = false;
    this.peer = null;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach((cb) => cb(event));
  }

  updateDeviceName(deviceName) {
    this.deviceName = deviceName || this.deviceName;
  }

  async createOffer() {
    this.disconnect({ preservePeer: true, silent: true });
    this.isInitiator = true;
    const pc = this._createPeerConnection();
    const channel = pc.createDataChannel("learning-tracker-sync", {
      ordered: true,
    });
    this._attachDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc);

    return serializeSignalPayload({
      type: "offer",
      sdp: pc.localDescription,
      from: {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      },
      createdAt: Date.now(),
    });
  }

  async acceptOffer(rawOffer) {
    const offerPayload = parseSignalPayload(rawOffer);
    if (offerPayload.type !== "offer") {
      throw new Error("Please paste an offer payload here.");
    }

    this.disconnect({ preservePeer: true, silent: true });
    this.isInitiator = false;
    this.peer = offerPayload.from || null;

    const pc = this._createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offerPayload.sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGatheringComplete(pc);

    return serializeSignalPayload({
      type: "answer",
      sdp: pc.localDescription,
      from: {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      },
      to: offerPayload.from || null,
      createdAt: Date.now(),
    });
  }

  async acceptAnswer(rawAnswer) {
    const answerPayload = parseSignalPayload(rawAnswer);
    if (answerPayload.type !== "answer") {
      throw new Error("Please paste an answer payload here.");
    }

    if (!this.pc) {
      throw new Error("Create an offer on this device first.");
    }

    await this.pc.setRemoteDescription(
      new RTCSessionDescription(answerPayload.sdp),
    );
    this.peer = answerPayload.from || this.peer;
  }

  disconnect(options = {}) {
    if (this.channel) {
      this.channel.onopen = null;
      this.channel.onclose = null;
      this.channel.onerror = null;
      this.channel.onmessage = null;
      try {
        this.channel.close();
      } catch {
        // Ignore close errors from stale channels.
      }
    }

    if (this.pc) {
      this.pc.ondatachannel = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      try {
        this.pc.close();
      } catch {
        // Ignore close errors from stale peer connections.
      }
    }

    this.channel = null;
    this.pc = null;
    this.isConnected = false;
    this.pendingChunks.clear();

    if (!options.preservePeer) {
      this.peer = null;
      this.isInitiator = false;
    }

    if (!options.silent) {
      this.notifyListeners({ type: "disconnected" });
    }
  }

  send(type, payload = {}) {
    if (!this.channel || this.channel.readyState !== "open") {
      console.warn("Not connected to peer");
      return false;
    }

    const envelope = JSON.stringify({
      type,
      deviceId: this.deviceId,
      payload,
      timestamp: Date.now(),
    });

    if (envelope.length <= CHUNK_SIZE) {
      this.channel.send(envelope);
      return true;
    }

    const chunkId = createChunkId();
    const total = Math.ceil(envelope.length / CHUNK_SIZE);

    for (let index = 0; index < total; index += 1) {
      const chunk = envelope.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
      this.channel.send(
        JSON.stringify({
          type: "__chunk__",
          chunkId,
          index,
          total,
          chunk,
        }),
      );
    }

    return true;
  }

  syncData(key, value) {
    return this.send("data_update", { key, value });
  }

  requestStateSync() {
    return this.send("snapshot_request");
  }

  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  _createPeerConnection() {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    pc.ondatachannel = (event) => {
      this._attachDataChannel(event.channel);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      if (state === "connected") {
        this.isConnected = true;
      }

      if (state === "failed" || state === "closed" || state === "disconnected") {
        this.isConnected = false;
        this.notifyListeners({ type: "disconnected" });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        this.notifyListeners({
          type: "error",
          message: "Peer connection failed on this network.",
        });
      }
    };

    return pc;
  }

  _attachDataChannel(channel) {
    this.channel = channel;

    channel.onopen = () => {
      this.isConnected = true;
      this.send("hello", {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        initiator: this.isInitiator,
      });
      this.notifyListeners({
        type: "connected",
        peer: this.peer,
        isInitiator: this.isInitiator,
      });
    };

    channel.onclose = () => {
      this.isConnected = false;
      this.notifyListeners({ type: "disconnected" });
    };

    channel.onerror = () => {
      this.notifyListeners({
        type: "error",
        message: "Data channel error while syncing.",
      });
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "__chunk__") {
          this._handleChunk(message);
          return;
        }
        this._handleMessage(message);
      } catch (error) {
        console.error("Failed to parse peer message:", error);
      }
    };
  }

  _handleChunk(message) {
    const { chunkId, index, total, chunk } = message;
    const entry = this.pendingChunks.get(chunkId) || {
      total,
      parts: new Array(total),
    };

    entry.parts[index] = chunk;
    this.pendingChunks.set(chunkId, entry);

    if (entry.parts.filter(Boolean).length === total) {
      this.pendingChunks.delete(chunkId);
      this._handleMessage(JSON.parse(entry.parts.join("")));
    }
  }

  _handleMessage(message) {
    const { type, deviceId, payload } = message;

    if (type === "hello") {
      this.peer = {
        deviceId: payload.deviceId || deviceId,
        deviceName: payload.deviceName || "Paired Device",
      };

      this.notifyListeners({
        type: "peer_ready",
        peer: this.peer,
        isInitiator: this.isInitiator,
      });
      return;
    }

    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(payload, deviceId);
    }

    this.notifyListeners({
      type: "message",
      messageType: type,
      deviceId,
      payload,
    });
  }
}

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

  getSyncableData(appState) {
    const syncData = {};
    this.syncKeys.forEach((key) => {
      if (key in appState) {
        syncData[key] = appState[key];
      }
    });
    return syncData;
  }

  mergeState(localState, remoteState) {
    return {
      ...localState,
      ...remoteState,
    };
  }
}

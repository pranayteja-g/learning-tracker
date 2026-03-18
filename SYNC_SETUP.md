# Network Sync Implementation Guide

## What's Been Implemented

You now have a complete cross-device sync system for Learning Tracker! Here's what was built:

### 1. **Sync Infrastructure** 
- WebSocket-based real-time communication
- Device pairing with 6-digit codes
- Automatic state synchronization
- Conflict resolution (latest timestamp wins)

### 2. **React Integration**
- `useSync()` hook - manages all sync state
- `NetworkSyncPanel` - UI for managing connections
- Modal components for pairing and connection setup
- Professional styling with dark theme support

### 3. **Sync Server**
- Standalone Node.js WebSocket server
- Runs on your local network
- Manages device connections and coordinates state updates
- Status API for monitoring

## Quick Start Guide

### Step 1: Start the Sync Server

On your main computer (the one that will stay on), start the server:

```bash
cd d:\react\project\learning-tracker
npm run sync-server
```

You'll see:
```
🚀 Learning Tracker Sync Server running on ws://localhost:3001
📡 Local network: ws://192.168.1.X:3001

Press Ctrl+C to stop
```

Note the **local network address** (e.g., `ws://192.168.1.100:3001`)

### Step 2: Connect First Device

1. Open Learning Tracker on Device A
2. Click **⚙️ Settings**
3. Click **🔗 Sync** tab
4. Click **"Generate Code"**
5. A modal appears with a 6-digit code
6. Share this code (or copy to clipboard)

### Step 3: Connect Second Device

1. Open Learning Tracker on Device B
2. Click **⚙️ Settings** → **🔗 Sync**
3. Click **"+ Connect to Device"**
4. Enter:
   - **Server URL**: `ws://192.168.1.100:3001` (from Step 1)
   - **Pairing Code**: The 6-digit code from Step 2
   - **Device Name** (optional): e.g., "My Laptop"
5. Click **Connect**

### Step 4: Verify Connection

Both devices should show:
- **Status**: 🟢 Connected
- **Paired Devices**: List of connected devices

### Step 5: Start Syncing!

Make changes on Device A:
- Create a new roadmap
- Mark a topic as complete
- Add notes
- Complete a quiz

Device B will automatically receive these changes within seconds!

## What Syncs

The following data syncs automatically across devices:

- ✅ **Roadmaps** - All roadmap structures and metadata
- ✅ **Progress** - Topic completion status
- ✅ **Notes** - All topic notes
- ✅ **Resources** - Links and attachments
- ✅ **Topic Meta** - Difficulty ratings, time estimates
- ✅ **Quests** - Quiz quests and state
- ✅ **Quiz Results** - Quiz completion and scores
- ✅ **Streaks** - Study streaks and activity

## Advanced: Running the Server Permanently

### Windows - Task Scheduler

1. Save sync server folder path
2. Open **Task Scheduler**
3. Create Basic Task → "Learning Tracker Sync"
4. Trigger: At startup
5. Action: Start a program
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\path\to\sync-server.js`

### Windows - As a Service (NSSM)

```powershell
# Install NSSM
choco install nssm

# In sync-server.js directory:
nssm install LearningTrackerSync "C:\Program Files\nodejs\node.exe" "sync-server.js"
nssm start LearningTrackerSync
```

### Mac/Linux - PM2

```bash
npm install -g pm2
pm2 start sync-server.js --name "tracker-sync"
pm2 startup
pm2 save
```

## Troubleshooting

### "Can't connect" error

1. **Is the server running?**
   ```bash
   curl http://localhost:3001/status
   ```
   Should return `{"status":"running",...}`

2. **Is the URL correct?**
   - Local: `ws://localhost:3001`
   - Network: `ws://192.168.1.XXX:3001`

3. **Are devices on same WiFi?**
   - Must be on same network

4. **Is port 3001 open?**
   - Check firewall settings
   - Try different port: `node sync-server.js 3002`

### "Pairing code rejected"

- Make sure both devices are connected to sync server first
- Code must match exactly (case-sensitive)
- Regen code and try again

### Changes not syncing

1. Verify connection shows 🟢 Connected
2. Check both devices in "Paired Devices" list
3. Restart the sync server
4. Refresh browser page

### Server crashes/unstable

- Check for errors in terminal
- Look for large data transfers
- Consider increasing Node.js memory:
  ```bash
  node --max-old-space-size=512 sync-server.js
  ```

## Architecture Details

### Message Flow

```
Device A → WebSocket → Sync Server → Device B
Device B → WebSocket → Sync Server → Device A
```

### Pairing Code Format

```
[0-9]{6}    // Six digits, e.g., 123456
```

### Device ID Format

```
device-{timestamp}-{random}    // e.g., "device-1710759600000-a9f3x2k"
```

### State Update Protocol

```js
// Device A makes change
{
  type: "data_update",
  deviceId: "device-xxx",
  key: "progress",
  value: { "roadmap::topic": true }
}

// Server broadcasts to others
// Device B receives and updates local state
```

## Next Steps

### To Add More Features

1. **Offline Sync**: Queue changes when offline, sync when reconnected
2. **Conflict Resolution**: Implement CRDT for true peer-to-peer sync
3. **Encryption**: Add end-to-end encryption for security
4. **Cloud Backup**: Add optional cloud storage
5. **Selective Sync**: Choose which data types to sync
6. **Bandwidth Optimization**: Delta sync instead of full state

### To Deploy Server

1. **Cloud Server**: AWS, Heroku, DigitalOcean
2. **Docker**: Containerize for easy deployment
3. **Custom Domain**: Point to your domain
4. **SSL/TLS**: Add encryption for internet access

## API Reference

### useSync() Hook

```js
import { useSync } from '@/hooks/useSync.js';

function MyComponent() {
  const {
    // State
    deviceId,
    deviceName,
    isConnected,
    connectionError,
    pairedDevices,
    currentPairingCode,
    
    // Actions
    generateNewPairingCode,
    connectToDevice(url, code, name),
    disconnect,
    syncData(key, value),
    requestFullSync(fromDeviceId),
    unpairDevice(index),
    clearPairingCode,
  } = useSync();
  
  // Use in component...
}
```

### SyncManager Class

```js
import { SyncManager } from '@/sync/syncService.js';

const manager = new SyncManager({ deviceId });

// Connect
await manager.connect('ws://localhost:3001');

// Send data
manager.send('data_update', { key, value });

// Listen for events
manager.subscribe(event => console.log(event));

// Disconnect
manager.disconnect();
```

## File Reference

| File | Purpose |
|------|---------|
| `src/sync/syncService.js` | Core sync logic, WebSocket management |
| `src/hooks/useSync.js` | React integration, state management |
| `src/components/sync/NetworkSyncPanel.jsx` | UI panel for sync settings |
| `src/components/sync/ConnectDeviceModal.jsx` | Modal for connecting devices |
| `src/components/sync/PairingCodeDisplay.jsx` | Modal for showing pairing code |
| `src/components/sync/NetworkSyncPanel.css` | Styling |
| `sync-server.js` | Local WebSocket server |
| `SYNC_SERVER.md` | Server documentation |

## Questions?

- Sync server logs show connection details
- Check browser console for sync errors
- Verify devices are on same LAN (ping test)
- Network disconnect? Server handles auto-reconnect

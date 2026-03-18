# Learning Tracker Sync Server

Enable device-to-device synchronization for Learning Tracker on your local network.

## Quick Start

### 1. Install Dependencies

```bash
npm install ws
```

### 2. Start the Server

```bash
node sync-server.js
```

Or with a custom port:

```bash
node sync-server.js 3002
```

The server will display its local network address:

```
🚀 Learning Tracker Sync Server running on ws://localhost:3001
📡 Local network: ws://192.168.1.100:3001
```

### 3. Connect Your Devices

On each Learning Tracker app:

1. Open **⚙️ Settings** → **🔗 Sync**
2. Click **"Generate Code"** to get a pairing code
3. On the other device, click **"Connect to Device"**
4. Enter:
   - **Server URL**: Use the local network address (e.g., `ws://192.168.1.100:3001`)
   - **Pairing Code**: The 6-digit code from step 2
5. Click **Connect**

Once connected, any changes to your learning roadmaps, progress, notes, or resources will automatically sync to the other device within seconds.

## How It Works

- **Device Discovery**: Each app generates a unique device ID
- **Pairing Codes**: 6-digit codes ensure secure pairing between devices
- **WebSocket Connection**: Real-time bidirectional communication
- **State Sync**: Changes propagate automatically to all paired devices
- **Conflict Resolution**: Latest timestamp wins (remote state overwrites local)

## Running Permanently

### On Linux/Mac:

Use `pm2` or `systemd` to keep the server running:

```bash
# Install pm2
npm install -g pm2

# Start server
pm2 start sync-server.js

# Auto-restart on reboot
pm2 startup
pm2 save
```

### On Windows:

Use **Task Scheduler** or **NSSM** (Non-Sucking Service Manager):

```bash
# Install NSSM
choco install nssm

# Install as service
nssm install LearningTrackerSync "C:\path\to\node.exe" "C:\path\to\sync-server.js"

# Start service
nssm start LearningTrackerSync
```

## API Endpoints

### Status Check

```bash
curl http://localhost:3001/status
```

Returns:
```json
{
  "status": "running",
  "port": 3001,
  "connectedDevices": 2,
  "devices": [
    {
      "id": "device-1710759600...",
      "name": "My Laptop",
      "connectedAt": 1710759600000
    }
  ]
}
```

## Message Protocol

### Client → Server

**Device Connection**
```json
{
  "type": "device_connect",
  "deviceId": "device-xxx",
  "payload": {
    "deviceName": "My Phone"
  }
}
```

**Pairing Request**
```json
{
  "type": "pairing_request",
  "deviceId": "device-xxx",
  "payload": {
    "pairingCode": "123456"
  }
}
```

**Data Update**
```json
{
  "type": "data_update",
  "deviceId": "device-xxx",
  "payload": {
    "key": "roadmaps",
    "value": { /* roadmap data */ }
  }
}
```

### Server → Client

**Data Update**
```json
{
  "type": "data_update",
  "key": "roadmaps",
  "value": { /* updated data */ },
  "updatedBy": "device-xxx",
  "timestamp": 1710759600000
}
```

## Troubleshooting

### Can't connect to the server

1. Make sure the server is running: `curl http://localhost:3001/status`
2. Verify devices are on the same WiFi network
3. Check firewall settings - port 3001 must be open
4. Try the local IP instead of hostname

### Connection disconnects randomly

- Check your WiFi connection stability
- Ensure the device isn't going to sleep
- Check server logs for errors

### State not syncing

1. Check that both devices are in the **Paired Devices** list
2. Verify connection status shows 🟢 Connected
3. Restart the sync server
4. Force a refresh or re-export/import data

## Advanced Configuration

### Custom Port

```bash
node sync-server.js 8080
```

### Environment Variables

```bash
SYNC_PORT=3001 node sync-server.js
```

### Using with Docker

```dockerfile
FROM node:20
WORKDIR /app
COPY sync-server.js .
RUN npm install ws
EXPOSE 3001
CMD ["node", "sync-server.js"]
```

```bash
docker run -p 3001:3001 learning-tracker-sync
```

## Security Notes

⚠️ **Important**: This sync server is designed for local network use only.

- ✅ Pairing codes provide basic authentication
- ✅ Only runs on your local network
- ✅ No external internet exposure
- ⚠️ No encryption by default (fine for local networks)
- ⚠️ Don't expose to the internet without HTTPS/SSL

For production internet-based sync, use a secure server with:
- SSL/TLS encryption
- API key authentication
- Data validation and sanitization
- Rate limiting

## License

Same as Learning Tracker main project

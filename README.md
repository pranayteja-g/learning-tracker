# Learning Tracker

A progressive web app (PWA) for managing learning roadmaps, tracking progress, and practicing with quizzes and interviews.

## Features

- **📚 Learning Roadmaps**: Create and manage structured learning paths
- **📊 Progress Tracking**: Track completion of topics and maintain streaks
- **✏️ Notes & Resources**: Attach notes and links to topics
- **📝 AI-Powered Learning**: Get AI explanations, code reviews, and practice problems
- **🎯 Quizzes & Challenges**: Test your knowledge with interactive quizzes
- **🔗 Network Sync**: Sync progress across devices on your local network
- **💾 Backup & Restore**: Export and import your entire learning data

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
```

## Network Sync (Multi-Device)

Sync your learning progress across multiple devices on the same network.

### Quick Setup

1. **Start the sync server** on your network:
   ```bash
   npm run sync-server
   ```
   
   Displays: `📡 Local network: ws://192.168.1.100:3001`

2. **On each device**, open Settings → Sync tab:
   - Generate a pairing code (6 digits)
   - Enter the server URL from step 1
   - Click Connect

3. **All changes sync automatically** to paired devices

📖 **[Full Documentation](./SYNC_SERVER.md)**

### How It Works

- Devices connect via WebSocket on your local network
- Pairing codes ensure only wanted devices can connect
- Changes (roadmaps, progress, notes, resources) sync in real-time
- Latest change wins for conflict resolution
- Works offline; syncs when devices reconnect

## Architecture

```
src/
├── components/          # React components
│   ├── ai/             # AI features (explain, code review, etc)
│   ├── sync/           # Network sync UI
│   ├── interview/      # Interview mode components
│   ├── modals/         # Modals for editing and settings
│   ├── practice/       # Practice mode
│   ├── screens/        # Main screens
│   └── ui/             # Shared UI components
├── hooks/              # Custom React hooks
│   ├── useSync.js      # Network sync state management
│   └── ...
├── storage/            # Data persistence (IndexedDB)
├── sync/               # Sync infrastructure
│   └── syncService.js  # WebSocket client and sync logic
├── ai/                 # AI provider integrations
├── utils/              # Utility functions
└── constants/          # Configuration and templates
```

## AI Features

Requires API keys from supported providers:

- **Claude (Anthropic)** - For detailed explanations and code analysis
- **GPT (OpenAI)** - Alternative AI provider
- **Gemini (Google)** - Another alternative

Get free API keys from:
- https://console.anthropic.com/
- https://platform.openai.com/
- https://aistudio.google.com/

## Data Storage

- **Local Storage**: IndexedDB (primary) with localStorage fallback
- **No cloud synchronization**: All data stays on your devices
- **Export/Backup**: Download your data as JSON anytime
- **Network Sync**: Optional local network sync via sync server

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Android)

## PWA Features

- Installable as app on mobile and desktop
- Works offline
- Background sync

## Development

- **Lint**: `npm run lint`
- **Preview**: `npm run preview`
- **Sync Server**: `npm run sync-server`

## Project Structure

See [Architecture](#architecture) above for detailed breakdown.

## License

MIT


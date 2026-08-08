# Learning Tracker

A progressive web app (PWA) for managing learning roadmaps, tracking progress, and practicing with quizzes and interviews.

## Features

- **📚 Learning Roadmaps**: Create and manage structured learning paths
- **📊 Progress Tracking**: Track completion of topics and maintain streaks
- **✏️ Notes & Resources**: Attach notes and links to topics
- **📝 AI-Powered Learning**: Get AI explanations, code reviews, and practice problems
- **🎯 Quizzes & Challenges**: Test your knowledge with interactive quizzes
- **☁️ Cloud Sync**: All data is synced live to Supabase — signed in on any device, it's there
- **📋 Manual Backup / Transfer**: Export your data as compressed text or a QR code (Settings → Sync) to move it to another device without the cloud, or as a full JSON backup file
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

### Supabase Configuration

The app talks directly to Supabase (`src/lib/supabase.js`) for auth and data storage — every signed-in user's roadmaps, progress, notes, resources, and other app state live in the `user_data` table, one row per user, synced on every change.

## Architecture

```
src/
├── components/          # React components
│   ├── ai/               # AI features (explain, code review, etc)
│   ├── interview/         # Interview mode components
│   ├── modals/            # Modals for editing and settings (incl. SyncTab — manual QR/text transfer)
│   ├── practice/          # Practice mode
│   ├── screens/           # Main screens
│   └── ui/                 # Shared UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Supabase client + cloudField (per-column cloud sync)
├── ai/                    # AI provider integrations
├── utils/                 # Utility functions
└── constants/             # Configuration and templates
```

## AI Features

Requires a free API key from one of the supported providers (Settings → AI):

- **Groq** — https://console.groq.com/keys
- **Google Gemini** — https://aistudio.google.com/app/apikey

Both are free with no credit card required. The key is stored only on your device (localStorage) and sent directly from your browser to the provider.

## Data Storage

- **Cloud (primary)**: Supabase — every field syncs independently and live as you use the app
- **AI keys**: localStorage only, never sent to Supabase
- **Export/Backup**: Download your data as a JSON file anytime, or use the in-app manual sync (Settings → Sync) to move data between devices via a compressed text code / QR

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Android)

## PWA Features

- Installable as app on mobile and desktop
- Works offline for the app shell; live data requires a connection to Supabase

## Development

- **Lint**: `npm run lint`
- **Preview**: `npm run preview`

## Project Structure

See [Architecture](#architecture) above for detailed breakdown.

## License

MIT

# Learning Tracker - Complete Project Guide for Beginners

## Table of Contents

1. [React Fundamentals](#react-fundamentals)
2. [Project Overview](#project-overview)
3. [Project Architecture](#project-architecture)
4. [Core Concepts](#core-concepts)
5. [Storage System](#storage-system)
6. [Component System](#component-system)
7. [Hooks & State Management](#hooks--state-management)
8. [Feature Deep Dives](#feature-deep-dives)
9. [File-by-File Breakdown](#file-by-file-breakdown)

---

# React Fundamentals

## What is React?

React is a **JavaScript library for building user interfaces**. Think of it like LEGO blocks:
- Each block is a **Component** (reusable piece of UI)
- You combine blocks to build larger structures
- When data changes, React updates the display automatically

### Key Concepts

#### 1. **JSX - JavaScript XML**

JSX lets you write HTML-like code inside JavaScript:

```jsx
// Regular HTML
<button class="btn">Click me</button>

// JSX (what we use in React)
<button className="btn">Click me</button>
```

Why JSX? It's more readable than creating DOM elements manually.

```jsx
// Without JSX (harder to read)
React.createElement('button', { className: 'btn' }, 'Click me')

// With JSX (easier to read)
<button className="btn">Click me</button>
```

#### 2. **Components - Building Blocks**

A component is a **reusable function that returns JSX**.

```jsx
// Simple component - just a function
function MyButton() {
  return <button>Click me</button>;
}

// Using the component
<MyButton />  // Shows: <button>Click me</button>
```

**Two types of components:**

**Functional Components** (what we use):
```jsx
function Greeting() {
  return <h1>Hello!</h1>;
}
```

**Class Components** (older style - we don't use these):
```jsx
class Greeting extends React.Component {
  render() {
    return <h1>Hello!</h1>;
  }
}
```

#### 3. **Props - Passing Data to Components**

Props are like **function parameters** for components - they let you pass data in.

```jsx
// Component definition - "name" is a prop
function Greeting({ name }) {
  return <h1>Hello {name}!</h1>;
}

// Using the component - pass "Alice" as the name prop
<Greeting name="Alice" />  // Shows: Hello Alice!
<Greeting name="Bob" />    // Shows: Hello Bob!
```

**Key point:** Props are **read-only** - you can't modify them inside the component.

#### 4. **State - Component Memory**

State is **data that can change**. When state changes, React automatically re-renders the component.

```jsx
import { useState } from 'react';

function Counter() {
  // useState returns [currentValue, functionToChangeIt]
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Flow:**
1. Component renders with count = 0
2. User clicks button
3. `setCount(1)` is called
4. React updates state
5. Component re-renders with count = 1
6. Display updates automatically

#### 5. **Hooks - Add Features to Functions**

Hooks are **functions that let you "hook into" React features**.

```jsx
// Hook: useState - adds state to function component
import { useState } from 'react';

function MyComponent() {
  const [value, setValue] = useState('initial');
  
  return <div>{value}</div>;
}
```

**Most Common Hooks:**

- `useState(initialValue)` - Add state
- `useEffect(function, dependencies)` - Run code after rendering
- `useRef(initialValue)` - Reference to DOM elements or persisted values
- `useContext(Context)` - Share data across components

#### 6. **useEffect - Side Effects**

`useEffect` runs code **after** the component renders (used for API calls, subscriptions, etc.).

```jsx
import { useEffect, useState } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  
  // Run this after component renders
  useEffect(() => {
    // Fetch data from API
    fetch('/api/data')
      .then(res => res.json())
      .then(json => setData(json));
  }, []); // Empty array = run once on mount
  
  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
```

**Dependency array** controls when useEffect runs:
```jsx
useEffect(() => { /* code */ }, [])              // Run once after mount
useEffect(() => { /* code */ }, [count])         // Run when count changes
useEffect(() => { /* code */ })                  // Run after every render
```

#### 7. **Conditional Rendering**

Show/hide elements based on conditions:

```jsx
function WelcomeMessage({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  } else {
    return <h1>Please log in</h1>;
  }
}

// Or using ternary operator
function WelcomeMessage({ isLoggedIn }) {
  return isLoggedIn ? <h1>Welcome!</h1> : <h1>Log in</h1>;
}

// Or using && operator
function WelcomeMessage({ isLoggedIn }) {
  return isLoggedIn && <h1>Welcome!</h1>;
}
```

#### 8. **Lists - Rendering Multiple Items**

Use `.map()` to render a list of items:

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo.text}</li>
      ))}
    </ul>
  );
}

// Usage
<TodoList todos={[
  { text: 'Learn React' },
  { text: 'Build an app' },
  { text: 'Deploy it' }
]} />
```

**Important:** Always use a unique `key` prop for list items. This helps React identify which items changed.

---

# Project Overview

## What is Learning Tracker?

Learning Tracker is a **progressive web app (PWA)** that helps you:
- 📚 Organize what you want to learn (roadmaps)
- 📊 Track your progress on topics
- ✏️ Take notes and save resources
- 🤖 Get AI help with explanations and code review
- 📝 Practice with quizzes and interviews
- 🔗 Sync across multiple devices

## Key Features

### 1. **Roadmaps** - Organize Learning
```
JavaScript Roadmap
├── Basics
│   ├── Variables & Types
│   ├── Functions
│   └── Objects
├── Advanced
│   ├── Classes
│   ├── Async/Await
│   └── Modules
└── Practice
    ├── Build a calculator
    └── Build a chat app
```

### 2. **Progress Tracking**
- Mark topics as complete
- See overall roadmap completion %
- Maintain study streaks
- Review quiz scores

### 3. **AI-Powered Features**
- Ask AI to explain a topic
- Get code reviews
- Generate practice questions
- Study plan recommendations

### 4. **Multi-Device Sync**
- Generate pairing code on Device A
- Connect Device B with code
- All changes sync automatically
- Works on local network

### 5. **Data Persistence**
- All data stored locally (IndexedDB)
- No cloud needed
- Export/import backups
- Offline access

---

# Project Architecture

## High-Level Structure

```
learning-tracker/
│
├── src/                          # Main source code
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   │
│   ├── storage/                  # Data persistence
│   │   ├── db.js                 # IndexedDB wrapper
│   │   ├── hooks.js              # useAppStorage hook
│   │   └── keys.js               # Storage key constants
│   │
│   ├── components/               # React components
│   │   ├── screens/              # Full-page views
│   │   ├── modals/               # Popup dialogs
│   │   ├── ui/                   # Reusable UI elements
│   │   ├── ai/                   # AI features
│   │   ├── interview/            # Interview mode
│   │   ├── practice/             # Practice mode
│   │   ├── sync/                 # Network sync UI
│   │   └── debug/                # Debug tools
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSync.js            # Network sync state
│   │   ├── useStreak.js          # Study streaks
│   │   ├── useQuest.js           # Daily quests
│   │   ├── useQuizResults.js     # Quiz tracking
│   │   └── useIsMobile.js        # Mobile detection
│   │
│   ├── ai/                       # AI integrations
│   │   ├── providers.js          # AI provider setup (Claude, GPT, etc)
│   │   ├── prompts.js            # AI prompts
│   │   └── context.js            # AI context injection
│   │
│   ├── sync/                     # Network sync
│   │   └── syncService.js        # WebSocket client
│   │
│   ├── utils/                    # Helper functions
│   │   ├── roadmap.js            # Roadmap algorithms
│   │   ├── topics.js             # Topic utilities
│   │   ├── jsonParse.js          # JSON parsing
│   │   ├── format.js             # Formatting numbers/dates
│   │   ├── validation.js         # Input validation
│   │   └── performance.js        # Performance tracking
│   │
│   └── constants/                # Configuration
│       ├── config.js             # App configuration
│       └── templates.js          # Built-in templates
│
├── sync-server.js                # WebSocket sync server
├── package.json                  # Dependencies
├── vite.config.js                # Build configuration
└── README.md                     # Project docs
```

## Data Flow - How Information Moves

### Example: User Marks a Topic Complete

```
User clicks checkbox on "Variables" topic
    ↓
App component's toggle() function called
    ↓
setProgress() hook updates state
    ↓
State stored in IndexedDB via useAppStorage
    ↓
React re-renders affected components
    ↓
UI updates to show topic as complete
    ↓
If synced: syncData() sends update to remote devices
    ↓
Remote devices receive update via WebSocket
    ↓
Their state updates automatically
    ↓
UI updates on all devices
```

### Example: User Clicks "Explain This"

```
User clicks "Explain" button on topic
    ↓
AIPanel component opens with topic
    ↓
User enters question or accepts default
    ↓
App calls callAI(provider, prompt)
    ↓
AI provider (Claude/GPT) called with API key
    ↓
Response streamed back to component
    ↓
MessageRenderer displays AI response
    ↓
User can append response to notes
    ↓
Data saved to IndexedDB
```

---

# Core Concepts

## 1. State Management Pattern

This app uses a **lifting state up** pattern:

```jsx
// App.jsx - Central state holder
function App() {
  const { roadmaps, setRoadmaps, progress, setProgress } = useAppStorage();
  
  // All children receive state + setters as props
  return (
    <>
      <Dashboard roadmaps={roadmaps} progress={progress} />
      <NoteModal onSave={(note) => setProgress(...)} />
    </>
  );
}

// Child components receive state from props
function Dashboard({ roadmaps, progress }) {
  return roadmaps.map(rm => (
    <RoadmapCard roadmap={rm} progress={progress[rm.id]} />
  ));
}
```

**Why?** Single source of truth - one place where state lives, all components read from it.

## 2. Custom Hooks for Logic

Custom hooks extract **reusable logic** from components:

```jsx
// Before: Logic scattered in components
function TopicCard({ topic }) {
  const [notes, setNotes] = useState("");
  const [meta, setMeta] = useState(null);
  
  const saveNote = () => { /* complex logic */ };
  const deleteTopic = () => { /* complex logic */ };
  
  return <div>...</div>;
}

// After: Logic extracted to hook
function useTopic(topic) {
  const [notes, setNotes] = useState("");
  const [meta, setMeta] = useState(null);
  
  const saveNote = () => { /* complex logic */ };
  const deleteTopic = () => { /* complex logic */ };
  
  return { notes, setNotes, saveNote, deleteTopic };
}

// Component is now cleaner
function TopicCard({ topic }) {
  const { notes, saveNote, deleteTopic } = useTopic(topic);
  
  return <div>...</div>;
}
```

## 3. Props Drilling - and Why We Avoid It

Passing props through many levels:

```jsx
// Level 1
<App>
  <Dashboard>
    <Section>
      <Card>
        <Button theme={theme} /> {/* theme passed 4 levels down */}
      </Button>
    </Card>
  </Section>
</Dashboard>
</App>
```

**Problem:** Middle components (`Dashboard`, `Section`, `Card`) don't need theme but have to pass it.

**Solutions:**
1. **Context API** - Share data across tree without passing props
2. **Custom Hooks** - Extract logic that manages data
3. **Keep components shallow** - Don't nest too deeply

---

# Storage System

## Data Persistence Architecture

```
┌─────────────────────────────────────┐
│         App Component               │
│  (manages all state)                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│      useAppStorage() Hook           │
│  (retrieves & updates storage)      │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│     IndexedDB or LocalStorage       │
│  (persistent data on device)        │
└─────────────────────────────────────┘
```

## How Storage Works

### 1. **db.js - Low Level Database**

```javascript
/**
 * db.js provides low-level IndexedDB operations
 * Think of it like SQL queries: GET, SET, DELETE
 */

// Get data by key
const roadmaps = await idbGet('roadmaps');
// Returns: { "rm-1": { label: "JS", sections: {...} }, ... }

// Set data
await idbSet('roadmaps', { "rm-1": { label: "JS", ... } });
// Saves data to IndexedDB

// Delete data
await idbDelete('roadmaps');
// Deletes the key-value pair
```

### 2. **keys.js - Storage Keys**

All storage keys defined in one place:

```javascript
// constants/keys.js
export const STORAGE_KEYS = {
  ROADMAPS: 'roadmaps',      // Stores: { rmId: roadmapData, ... }
  PROGRESS: 'progress',      // Stores: { "rmId::topic": true/false, ... }
  NOTES: 'notes',            // Stores: { "rmId::topic": "note text", ... }
  RESOURCES: 'resources',    // Stores: { "rmId::topic": [urls], ... }
  QUESTS: 'quests',
  QUIZ_RESULTS: 'quizResults',
  STREAK: 'streak',
};
```

**Why centralize?** No typos, single source of key names.

### 3. **hooks.js - useAppStorage**

A **custom hook** that manages all app data:

```javascript
export function useAppStorage() {
  const [roadmaps, setRoadmaps] = useState({});
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  // ... more state
  
  // On mount, load all data from IndexedDB
  useEffect(() => {
    const load = async () => {
      const rm = await idbGet(STORAGE_KEYS.ROADMAPS) || {};
      const prog = await idbGet(STORAGE_KEYS.PROGRESS) || {};
      // ...
      setRoadmaps(rm);
      setProgress(prog);
    };
    load();
  }, []);
  
  // When state changes, save to IndexedDB
  useEffect(() => {
    idbSet(STORAGE_KEYS.ROADMAPS, roadmaps);
  }, [roadmaps]);
  
  return {
    roadmaps, setRoadmaps,
    progress, setProgress,
    notes, setNotes,
    // ...
  };
}
```

### Flow: Save a Note

```
User types note in NoteModal
    ↓
User clicks "Save"
    ↓
Modal calls saveNote({ rmKey, topic, note, difficulty, links })
    ↓
App.jsx: setNotes(n => ({ ...n, [`${rmKey}::${topic}`]: note }))
    ↓
State updates
    ↓
useAppStorage detects change via useEffect
    ↓
idbSet('notes', newNotesData)
    ↓
Data persisted to IndexedDB
    ↓
Next time app loads, note is still there
```

### Why IndexedDB?

| Feature | LocalStorage | IndexedDB |
|---------|------------|-----------|
| Size | 5-10 MB | 50+ MB |
| Data Type | Strings only | Objects, arrays, etc |
| Speed | Slow | Fast |
| Good for | Preferences | App data |

We use IndexedDB for app data because:
- Stores objects directly (no JSON serialization needed)
- Faster for large data
- More storage space
- Async operations (doesn't block UI)

---

# Component System

## Component Hierarchy

```
App (root)
├── WelcomeScreen
├── Dashboard
│   ├── StreakBadge
│   ├── RadialProgress
│   ├── TopicCard (list)
│   │   └── SearchOverlay
│   └── QuestBoard
│       └── QuestCard (list)
├── ManageModal (settings)
│   └── NetworkSyncPanel (in Sync tab)
│       ├── PairingCodeDisplay
│       └── ConnectDeviceModal
├── NoteModal (edit notes)
├── RoadmapEditorModal (edit roadmap)
├── PracticePanel (practice mode)
├── AIPanel (AI features)
│   ├── APIKeySetup
│   ├── ExplainView
│   ├── CodeWriteView
│   ├── QuestionnaireView
│   ├── StudyPlanView
│   ├── QuizView
│   └── MessageRenderer
├── InterviewPanel (interview mode)
│   ├── InterviewModeView
│   ├── TimedQuizView
│   ├── FlashcardView
│   └── CheatSheetView
└── Toast (notifications)
```

## Component Design Patterns

### 1. **Container vs Presentational**

**Container Component** (handles logic):
```jsx
function NoteModal({ roadmapKey, topic, onClose, onSave }) {
  const [note, setNote] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  
  const handleSave = () => {
    onSave({ note, difficulty });
    onClose();
  };
  
  return <NoteModalUI note={note} onSave={handleSave} />;
}
```

**Presentational Component** (just displays):
```jsx
function NoteModalUI({ note, onSave }) {
  return (
    <div>
      <textarea value={note} />
      <button onClick=onSave}>Save</button>
    </div>
  );
}
```

**Why split?** Logic can be reused with different UIs.

### 2. **Controlled Components**

Form inputs whose value is controlled by state:

```jsx
function NoteForm() {
  const [text, setText] = useState("");
  
  return (
    <textarea
      value={text}  // Controlled by state
      onChange={(e) => setText(e.target.value)}  // Updates state
    />
  );
}
```

### 3. **Render Props Pattern**

Passing a function as a prop:

```jsx
function SearchOverlay({ isOpen, onClose, onSelect }) {
  return (
    isOpen && (
      <div>
        <input onChange={(e) => {
          const results = search(e.target.value);
          onSelect(results);  // Call function passed as prop
        }} />
      </div>
    )
  );
}
```

---

# Hooks & State Management

## Custom Hooks Deep Dive

### 1. **useStreak - Track Study Streaks**

```javascript
export function useStreak() {
  const [streak, setStreak] = useState(0);
  
  // recordActivity - increments streak if hasn't studied today
  const recordActivity = () => {
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (lastActivity !== today) {
      setStreak(prev => prev + 1);
      localStorage.setItem('lastActivity', today);
    }
  };
  
  // Check if already studied today
  const studiedToday = () => {
    const today = new Date().toDateString();
    return localStorage.getItem('lastActivity') === today;
  };
  
  return { streak, recordActivity, studiedToday };
}
```

**Usage:**
```jsx
const { streak, recordActivity } = useStreak();

const handleTopicComplete = () => {
  recordActivity();  // Increment streak
  // ... mark topic as done
};
```

### 2. **useQuest - Daily Challenge System**

```javascript
export function useQuest() {
  const [quests, setQuests] = useState([]);
  
  // Generate a new quest if available
  const startQuest = (roadmapId) => {
    // Check if on cooldown
    if (isOnCooldown(roadmapId)) {
      return; // Can't start yet
    }
    
    // Create new quest
    const newQuest = {
      id: Date.now(),
      roadmapId,
      topic: getRandomTopic(roadmapId),
      phase: 'question',
      createdAt: Date.now(),
    };
    
    setQuests(prev => [...prev, newQuest]);
  };
  
  // Advance to next phase
  const advancePhase = (questId) => {
    const phases = ['question', 'practice', 'quiz'];
    // Move to next phase...
  };
  
  return { quests, startQuest, advancePhase };
}
```

### 3. **useSync - Network Synchronization**

```javascript
export function useSync() {
  const [isConnected, setIsConnected] = useState(false);
  const syncManagerRef = useRef(null);
  
  // Initialize sync manager on first render
  useEffect(() => {
    syncManagerRef.current = new SyncManager();
    
    // Subscribe to connection events
    syncManagerRef.current.subscribe((event) => {
      if (event.type === 'connected') {
        setIsConnected(true);
      } else if (event.type === 'disconnected') {
        setIsConnected(false);
      }
    });
  }, []);
  
  // Connect to remote sync server
  const connectToDevice = async (serverUrl, pairingCode) => {
    await syncManagerRef.current.connect(serverUrl);
    syncManagerRef.current.send('pairing_request', { pairingCode });
    setIsConnected(true);
  };
  
  // Sync data to other devices
  const syncData = (key, value) => {
    syncManagerRef.current.syncData(key, value);
  };
  
  return { isConnected, connectToDevice, syncData };
}
```

---

# Feature Deep Dives

## Feature 1: AI-Powered Explanations

### How It Works

```
User opens ExplainView and asks about "Closures"
    ↓
Component prepares AI prompt with context
    ↓
callAI() sends request to Claude/GPT API
    ↓
AI generates response (streamed back)
    ↓
MessageRenderer displays response paragraph by paragraph
    ↓
User can copy, save to notes, or ask follow-up
```

### Key Files

**ai/providers.js** - Manages API providers
```javascript
export const PROVIDERS = {
  claude: {
    name: 'Claude',
    provider: 'anthropic',
    models: ['claude-3-sonnet'],
    keyUrl: 'https://console.anthropic.com/',
  },
  gpt: {
    name: 'GPT',
    provider: 'openai',
    models: ['gpt-4-turbo'],
    keyUrl: 'https://platform.openai.com/',
  },
};

export async function callAI(provider, prompt) {
  const config = loadAIConfig();
  const key = config.keys[provider];
  
  // Call appropriate provider API
  if (provider === 'claude') {
    return callClaude(key, prompt);
  } else if (provider === 'gpt') {
    return callOpenAI(key, prompt);
  }
}
```

**ai/prompts.js** - Pre-written prompts
```javascript
export function buildExplainPrompt(topic, context) {
  return `Explain "${topic}" in simple terms. Context: ${context}`;
}

export function buildCodeReviewPrompt(code) {
  return `Review this code and suggest improvements:\n\n${code}`;
}
```

**components/ai/ExplainView.jsx** - UI component
```jsx
function ExplainView({ topic, onClose }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleAsk = async () => {
    setLoading(true);
    const prompt = buildExplainPrompt(topic, "");
    const answer = await callAI('claude', prompt);
    setResponse(answer);
    setLoading(false);
  };
  
  return (
    <div>
      <h3>Explain: {topic}</h3>
      <button onClick={handleAsk}>Get Explanation</button>
      {response && <MessageRenderer content={response} />}
    </div>
  );
}
```

## Feature 2: Quiz System

### How Quizzes Work

```
Quiz Question
    ↓
User selects answer
    ↓
App records answer in state
    ↓
User sees if correct (feedback)
    ↓
User clicks "Next"
    ↓
Next question loads
    ↓
Repeat until quiz complete
    ↓
Results saved to quizResults storage
    ↓
Streak updated if passed (>= 70%)
```

### useQuizResults Hook

```javascript
export function useQuizResults() {
  const [results, setResults] = useState({});
  
  // Record a quiz result
  const recordQuizResult = (topicKey, score, passed) => {
    const key = topicKey;
    setResults(prev => ({
      ...prev,
      [key]: {
        score,
        passed,
        date: Date.now(),
        attempts: (prev[key]?.attempts || 0) + 1,
      }
    }));
  };
  
  // Get stars for a topic (1-3 stars based on score)
  const getStars = (topicKey) => {
    const result = results[topicKey];
    if (!result) return 0;
    if (result.score >= 90) return 3;
    if (result.score >= 75) return 2;
    return 1;
  };
  
  return { results, recordQuizResult, getStars, hasPassedTopic };
}
```

## Feature 3: Multi-Device Sync

### Sync Architecture

```
Device A                    Sync Server                 Device B
    │                           │                           │
    ├─ Generate Code 123456     │                           │
    │                           │                           │
    ├─ Connects with code        │                           │
    │            └──────────────>│                           │
    │                           │                           │
    │                           │                Device connects
    │                           │<──────────────────┤
    │                           │       with code   │
    │                           │                   │
    │ User marks topic done      │                   │
    ├─ Send: topic X = true      │                   │
    │            └──────────────>│                   │
    │                           ├─ Broadcast update ┤
    │                           │            ──────>│
    │                           │                   │
    │ <─ Receive update ─────────┤ Update from B   │
    │                           │<────────────────-┤

UI updates                      UI updates
on Device A                     on Device B
```

### Key Infrastructure

**syncService.js** - WebSocket client
```javascript
export class SyncManager {
  constructor(deviceId) {
    this.ws = null;
    this.deviceId = deviceId;
    this.listeners = new Set();
  }
  
  async connect(serverUrl) {
    this.ws = new WebSocket(serverUrl);
    
    this.ws.onopen = () => {
      this.send('device_connect', { deviceId: this.deviceId });
      this.notifyListeners({ type: 'connected' });
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifyListeners(message);
    };
  }
  
  send(type, payload) {
    this.ws.send(JSON.stringify({
      type,
      deviceId: this.deviceId,
      payload,
    }));
  }
  
  subscribe(callback) {
    this.listeners.add(callback);
  }
}
```

**sync-server.js** - Coordination server  
```javascript
// Handles connections from devices
wss.on('connection', (ws) => {
  let deviceId = null;
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'device_connect') {
      deviceId = message.deviceId;
      devices.set(deviceId, ws);
      // Tell all other devices a new device connected
      broadcastToAll({
        type: 'device_connected',
        deviceId,
      });
    }
    
    if (message.type === 'data_update') {
      // Broadcast to all other devices
      broadcastToAllExcept(deviceId, message);
    }
  });
});
```

---

# File-by-File Breakdown

## App.jsx - Root Component

**Purpose:** Main container holding all app state and routing between views.

**State managed:**
- `roadmaps` - All learning roadmaps
- `progress` - Which topics are completed
- `notes` - Notes attached to topics
- `view` - Current view (sections, cards, etc)
- Modal visibility states

**Key methods:**
- `toggle(key, topic)` - Mark topic complete/incomplete
- `appendToNote()` - Add AI explanation to notes
- `openNote()` - Open note editor
- `saveNote()` - Save edited note

**Data flow:**
```
App is source of truth
    ↓ Passes state + setters as props
    ↓
Child components (Dashboard, Modals) receive props
    ↓ When child changes data
    ↓
Calls props function (setSomething)
    ↓
App state updates
    ↓
Re-renders all children with new data
```

## Dashboard.jsx - Main View

**Purpose:** Display roadmaps and topics in card layout.

**Shows:**
- Roadmap progress bar
- Topic cards (organized by section)
- Search overlay
- Quest board
- Practice panel

**Interactive:**
- Click topic → open notes
- Mark complete → toggle()
- Ask AI → open AIPanel
- Search → SearchOverlay

## useAppStorage Hook

**Purpose:** Central data loading and persistence.

**One-time on mount:**
```javascript
useEffect(() => {
  const load = async () => {
    // Load each data category from IndexedDB
    const roadmaps = await idbGet('roadmaps');
    const progress = await idbGet('progress');
    // ... etc
    
    // Set all state
    setRoadmaps(roadmaps);
    setProgress(progress);
  };
  load();
}, []);
```

**On any state change:**
```javascript
useEffect(() => {
  idbSet('roadmaps', roadmaps);
}, [roadmaps]); // Saved whenever roadmaps changes
```

**Why separate hooks for each?** So each data type saves independently.

## Modals

Modals are **popup dialogs** that let users edit things. They work like:

```
1. Modal is hidden initially
2. Click button → setShowModal(true)
3. Modal appears
4. User makes changes
5. Click "Save" → onSave() callback called
6. Parent saves data
7. Modal closes
```

### NoteModal.jsx

- Text editor for notes
- Difficulty selector
- Time estimate
- Resource links manager
- On save: `props.onSave({ rmKey, topic, note, difficulty, links })`

### ManageModal.jsx

- Has tabs: Roadmaps, Data, Sync, AI
- Import/export backups
- Manage roadmaps
- Set AI keys
- Network sync settings

## AI Components

### ExplainView.jsx

User asks AI to explain a topic:

```jsx
export function ExplainView({ topic, onSave }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAsk = async () => {
    setLoading(true);
    const response = await callAI('claude', `Explain ${topic}`);
    setAnswer(response);
    setLoading(false);
  };
  
  const handleSaveToNotes = () => {
    onSave(answer);  // Add to topic notes
  };
  
  return (
    <div>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={handleAsk}>Ask AI</button>
      {answer && (
        <div>
          <MessageRenderer content={answer} />
          <button onClick={handleSaveToNotes}>Save to Notes</button>
        </div>
      )}
    </div>
  );
}
```

### CodeWriteView.jsx

User asks AI to write code:

```jsx
// Similar to ExplainView but for code generation
// Returns code snippet, can format with syntax highlighting
```

### QuizView.jsx

AI generates quiz questions:

```jsx
export function QuizView({ topic, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    // Generate quiz questions with AI
    const qs = await callAI('claude', buildQuizPrompt(topic));
    setQuestions(parseJSON(qs)); // Parse JSON from AI response
  }, []);
  
  const handleAnswer = (selectedAnswer) => {
    const isCorrect = selectedAnswer === questions[currentIndex].correct;
    if (isCorrect) setScore(prev => prev + 1);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(score, questions.length);
    }
  };
  
  return (
    <div>
      <Question 
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
```

## Interview Components

Interview mode combines:
1. **FlashcardView** - Quick definition review
2. **InterviewModeView** - AI asks follow-up questions
3. **TimedQuizView** - Timed practice quiz
4. **CheatSheetView** - Quick reference

Each component handles a different learning modality.

## Utilities

### roadmap.js

Helper functions for roadmap operations:

```javascript
// Get overall progress percentage
export function getRoadmapStats(roadmap, progress) {
  const total = countTopics(roadmap);
  const done = countCompleted(roadmap, progress);
  return { total, done, pct: (done / total * 100) };
}

// Find next uncompleted topic
export function getNextUp(roadmap, progress) {
  // Iterate through sections and find first incomplete topic
}

// Download roadmap as JSON file
export function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

### jsonParse.js

**Why?** AI responses sometimes have broken JSON. This recovers it.

```javascript
export function safeParseJSON(text) {
  // Try 1: Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {}
  
  // Try 2: Extract JSON from markdown
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  
  // Try 3: Extract first complete JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // Give up
  throw new Error('Could not parse JSON');
}
```

### format.js

Number/time formatting utilities:

```javascript
// 1000 → "1k"
export function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

// 3600000ms → "1h"
export function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
```

---

# Building Your Own App

## Step 1: Plan Data Structure

Before coding, map out your data:

```javascript
// Example: Todo App
{
  todos: {
    'todo-1': { id: 'todo-1', text: 'Learn React', done: false },
    'todo-2': { id: 'todo-2', text: 'Build app', done: true },
  }
}
```

## Step 2: Set Up Storage

```javascript
// hooks/useTodos.js
export function useTodos() {
  const [todos, setTodos] = useState({});
  
  useEffect(() => {
    // Load todos from IndexedDB on mount
    const load = async () => {
      const data = await idbGet('todos') || {};
      setTodos(data);
    };
    load();
  }, []);
  
  useEffect(() => {
    // Save todos whenever they change
    idbSet('todos', todos);
  }, [todos]);
  
  return { todos, setTodos };
}
```

## Step 3: Create Main Component

```javascript
// App.jsx
import { useTodos } from './hooks/useTodos';

function App() {
  const { todos, setTodos } = useTodos();
  
  const addTodo = (text) => {
    const id = 'todo-' + Date.now();
    setTodos(t => ({
      ...t,
      [id]: { id, text, done: false }
    }));
  };
  
  const toggleTodo = (id) => {
    setTodos(t => ({
      ...t,
      [id]: { ...t[id], done: !t[id].done }
    }));
  };
  
  return (
    <div>
      <TodoForm onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} />
    </div>
  );
}
```

## Step 4: Build Components

```javascript
// components/TodoList.jsx
function TodoList({ todos, onToggle }) {
  return (
    <div>
      {Object.values(todos).map(todo => (
        <div key={todo.id} onClick={() => onToggle(todo.id)}>
          <input type="checkbox" checked={todo.done} />
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Step 5: Add Features Incrementally

1. Basic CRUD (Create, Read, Update, Delete)
2. Local storage
3. Better UI/styling
4. Advanced features (filters, search)
5. Sync if needed

---

# Advanced Topics

## 1. Error Boundaries

Catch rendering errors:

```jsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong</h1>;
    }
    return this.props.children;
  }
}

// Use it
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## 2. Performance Optimization

**Memoization** - Skip re-renders if props didn't change:

```jsx
// Without memo - rerenders even if props same
function TodoItem({ todo, onToggle }) {
  return <div onClick={() => onToggle(todo.id)}>{todo.text}</div>;
}

// With memo - only rerenders if props changed
export const TodoItem = React.memo(function TodoItem({ todo, onToggle }) {
  return <div onClick={() => onToggle(todo.id)}>{todo.text}</div>;
});
```

## 3. Context API

Share data deep in component tree without prop drilling:

```jsx
// Create context
const ThemeContext = React.createContext();

// Provide value
function App() {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Dashboard />
    </ThemeContext.Provider>
  );
}

// Use anywhere in tree
function Button() {
  const { theme } = useContext(ThemeContext);
  return <button style={{ background: theme === 'light' ? 'white' : 'black' }}>

# Learning Tracker - Complete Deep Dive (Part 2)

## Table of Contents

1. [Component File Breakdown](#component-file-breakdown)
2. [Hook Implementation Details](#hook-implementation-details)
3. [Sync System Explained](#sync-system-explained)
4. [Common Patterns & Pitfalls](#common-patterns--pitfalls)
5. [From Concept to Code](#from-concept-to-code)
6. [Testing Your App](#testing-your-app)
7. [Deployment](#deployment)

---

# Component File Breakdown

## components/screens/Dashboard.jsx

**Purpose:** Main view showing all roadmaps and topics.

**What it displays:**
```
┌─────────────────────────────────────┐
│ Learning Tracker Dashboard          │
├─────────────────────────────────────┤
│ ★★ Streak: 12 days                  │
│ ⚙️ Settings                          │
├─────────────────────────────────────┤
│ JavaScript Roadmap      [75% ████░] │
│  ├─ Basics                          │
│  │   ├─☑ Variables                  │
│  │   ├─☐ Functions                  │
│  │   └─☐ Objects                    │
│  └─ Advanced                        │
└─────────────────────────────────────┘
```

**Component structure:**

```jsx
function Dashboard({ roadmaps, progress, onSelectTopic, onSearch }) {
  const [mobileScreen, setMobileScreen] = useState("roadmaps");
  
  return (
    <div className="dashboard">
      {/* Mobile: show one at a time */}
      {isMobile && (
        <TabButtons 
          active={mobileScreen}
          onChange={setMobileScreen}
        />
      )}
      
      {/* Roadmaps section */}
      {(mobileScreen === "roadmaps" || !isMobile) && (
        <RoadmapList roadmaps={roadmaps} />
      )}
      
      {/* Topics section */}
      {(mobileScreen === "topics" || !isMobile) && (
        <TopicGrid 
          topics={getTopics()}
          progress={progress}
          onToggle={onSelectTopic}
        />
      )}
    </div>
  );
}
```

**Data it receives from App.jsx:**
- `roadmaps` - All roadmaps
- `progress` - Completion status
- `onSelectTopic` - Callback when user marks topic done

**Key interactions:**
1. **Select roadmap** → shows topics in that roadmap
2. **Click topic checkbox** → calls `onSelectTopic()`
3. **Click topic card** → opens NoteModal
4. **Search** → filter topics

## components/ui/TopicCard.jsx

**Purpose:** Display single topic as a card.

**What card shows:**
```
┌──────────────────────────┐
│ 🟢 Variables & Types     │
│                          │
│ ⭐⭐⭐ (quiz score)       │
│                          │
│ 📝 Has notes             │
│ 🔗 1 resource linked     │
│                          │
│ [Complete] [Edit]        │
└──────────────────────────┘
```

**Simple implementation:**

```jsx
function TopicCard({ rmKey, topic, isComplete, difficulty, onToggle, onEdit, star }) {
  return (
    <div className="card">
      {/* Checkbox */}
      <input 
        type="checkbox"
        checked={isComplete}
        onChange={() => onToggle(rmKey, topic)}
      />
      
      {/* Topic name */}
      <h3>{topic}</h3>
      
      {/* Difficulty indicator */}
      {difficulty && (
        <span className={`difficulty ${difficulty}`}>
          {difficulty}
        </span>
      )}
      
      {/* Stars from quiz */}
      <div className="stars">
        {[...Array(star)].map((_, i) => '⭐')}
      </div>
      
      {/* Edit button */}
      <button onClick={() => onEdit(rmKey, topic)}>Edit</button>
    </div>
  );
}
```

**Data it needs:** Props passed from parent
- `rmKey` - Roadmap ID to uniquely identify
- `topic` - Topic name
- `isComplete` - Boolean from progress
- `onToggle` - Function to call when checked

## components/modals/NoteModal.jsx

**Purpose:** Edit notes, resources, and metadata for a topic.

**What can edit:**
```
┌────────────────────────────────────┐
│ Editing: Variables & Types         │
├────────────────────────────────────┤
│ Difficulty: [Easy] [Medium] [Hard] │
│ Time estimate: [30 min] [1h]       │
│                                    │
│ Notes:                             │
│ ┌──────────────────────────────┐   │
│ │ var x = 10;                  │   │
│ │ let y = 20;                  │   │
│ │ const z = 30;                │   │
│ └──────────────────────────────┘   │
│                                    │
│ Resources:                         │
│ □ https://mdn.org/...              │
│ □ https://example.com/...          │
│                                    │
│ [Save] [Append AI] [Cancel]        │
└────────────────────────────────────┘
```

**Detailed breakdown:**

```jsx
function NoteModal({ 
  roadmapKey, 
  topicName, 
  initialNote,
  onSave, 
  onClose,
  onAppendAI 
}) {
  // State for each editable field
  const [note, setNote] = useState(initialNote?.text || "");
  const [difficulty, setDifficulty] = useState(initialNote?.difficulty || "medium");
  const [timeEst, setTimeEst] = useState(initialNote?.timeEst || "30");
  const [resources, setResources] = useState(initialNote?.resources || []);
  const [newResource, setNewResource] = useState("");
  
  // Handle adding a resource link
  const handleAddResource = () => {
    if (newResource.trim()) {
      setResources(prev => [...prev, newResource]);
      setNewResource("");
    }
  };
  
  // Remove resource link
  const handleRemoveResource = (index) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  };
  
  // Save everything
  const handleSave = () => {
    onSave({
      rmKey: roadmapKey,
      topic: topicName,
      note,
      difficulty,
      timeEst: parseInt(timeEst),
      links: resources
    });
    onClose();
  };
  
  return (
    <Modal onClose={onClose}>
      <h2>Editing: {topicName}</h2>
      
      {/* Difficulty */}
      <label>
        Difficulty:
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      
      {/* Main notes textarea */}
      <label>
        Notes:
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add notes about this topic..."
        />
      </label>
      
      {/* Resource links */}
      <div className="resources">
        <h3>Resources</h3>
        {resources.map((link, i) => (
          <div key={i}>
            <a href={link}>{link}</a>
            <button onClick={() => handleRemoveResource(i)}>Remove</button>
          </div>
        ))}
        
        <input
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          placeholder="Paste link..."
        />
        <button onClick={handleAddResource}>Add Link</button>
      </div>
      
      {/* Buttons */}
      <div className="actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={() => onAppendAI(topicName)}>✨ Get AI Help</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
```

**Data flow when saving:**

```
User types in textarea → setNote() → state updates
    ↓
User clicks Save
    ↓
handleSave() packages all data
    ↓
Calls onSave() callback passed from App
    ↓
App.jsx receives callback and calls setNotes()
    ↓
App state updates
    ↓
useAppStorage hook detects change
    ↓
Saves to IndexedDB
    ↓
Modal closes
```

## components/ai/AIPanel.jsx

**Purpose:** Main AI feature hub (explain, code review, generate quiz, etc).

**Tabs it has:**

```
┌─────────────────────────────────────┐
│ [Explain] [Code Review] [Quiz]      │
├─────────────────────────────────────┤
│                                     │
│  ExplainView / CodeReviewView data  │
│                                     │
└─────────────────────────────────────┘
```

**Implementation pattern:**

```jsx
function AIPanel({ topic, onClose, onAppendToNote }) {
  const [activeTab, setActiveTab] = useState("explain");
  const { apiKey, provider } = loadAIConfig();
  
  // Check if API key is set
  if (!apiKey) {
    return <APIKeySetup />;
  }
  
  return (
    <div className="ai-panel">
      {/* Tab buttons */}
      <div className="tabs">
        <button 
          active={activeTab === "explain"}
          onClick={() => setActiveTab("explain")}
        >
          💡 Explain
        </button>
        <button 
          active={activeTab === "code"}
          onClick={() => setActiveTab("code")}
        >
          💻 Code
        </button>
        <button 
          active={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
        >
          📝 Quiz
        </button>
      </div>
      
      {/* Tab content */}
      {activeTab === "explain" && (
        <ExplainView 
          topic={topic}
          onSaveToNotes={onAppendToNote}
        />
      )}
      
      {activeTab === "code" && (
        <CodeWriteView 
          topic={topic}
          onSaveToNotes={onAppendToNote}
        />
      )}
      
      {activeTab === "quiz" && (
        <QuizView 
          topic={topic}
          onComplete={handleQuizComplete}
        />
      )}
      
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

**Why tabs?** Separates different AI features so each can have focused UI.

## components/ai/ExplainView.jsx - Detailed

**What user sees:**

```
┌──────────────────────────────────┐
│ 💡 Explain: Closures             │
├──────────────────────────────────┤
│                                  │
│ Question (optional):             │
│ ┌────────────────────────────┐   │
│ │ How do closures work?      │   │
│ └────────────────────────────┘   │
│                                  │
│ [Get Explanation]                │
│                                  │
│ ✨ AI Response:                  │
│ ┌────────────────────────────┐   │
│ │ A closure is a function    │   │
│ │ that remembers variables   │   │
│ │ from where it was created. │   │
│ │                            │   │
│ │ function outer() {         │   │
│ │   const x = 10;            │   │
│ │   function inner() {       │   │
│ │     return x;              │   │
│ │   }                        │   │
│ │   return inner;            │   │
│ │ }                          │   │
│ └────────────────────────────┘   │
│                                  │
│ [Save to Notes] [Copy] [New]     │
└──────────────────────────────────┘
```

**Code breakdown:**

```jsx
function ExplainView({ topic, onSaveToNotes }) {
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Handle the "Get Explanation" button
  const handleGetExplanation = async () => {
    try {
      setLoading(true);
      setExplanation(""); // Clear old response
      
      // Build prompt
      const userQ = question || `Explain ${topic} in simple terms`;
      const prompt = buildExplainPrompt(topic, userQ);
      
      // Call AI API
      const config = loadAIConfig();
      const response = await callAI(config.provider, prompt, config.keys);
      
      setExplanation(response);
    } catch (error) {
      setExplanation(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="explain-view">
      <h3>💡 Explain: {topic}</h3>
      
      {/* Optional question input */}
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a specific question (optional)"
      />
      
      {/* Main button */}
      <button 
        onClick={handleGetExplanation}
        disabled={loading}
      >
        {loading ? "Thinking..." : "Get Explanation"}
      </button>
      
      {/* Display response */}
      {explanation && (
        <div className="response">
          <MessageRenderer content={explanation} />
          <button onClick={() => onSaveToNotes(explanation)}>
            Save to Notes
          </button>
        </div>
      )}
    </div>
  );
}
```

**Key function: buildExplainPrompt**

```javascript
// ai/prompts.js
export function buildExplainPrompt(topic, userQuestion = "") {
  const q = userQuestion || `Explain ${topic} in a simple way`;
  
  return `
    You are a helpful teacher. 
    Topic: ${topic}
    
    ${q}
    
    Provide a clear, beginner-friendly explanation with examples.
    Use simple language and analogies.
  `;
}
```

---

# Hook Implementation Details

## useAppStorage - The Central Hub

**Why a custom hook?** Instead of scattered `useState` calls, all app data lives in one hook.

**How it works (step by step):**

```jsx
export function useAppStorage() {
  // 1. Initialize all state with empty values
  const [roadmaps, setRoadmaps] = useState({});
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  const [resources, setResources] = useState({});
  const [topicMeta, setTopicMeta] = useState({});
  const [quests, setQuests] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [loaded, setLoaded] = useState(false);
  
  // 2. Load all data from storage on mount (runs once)
  useEffect(() => {
    const loadAll = async () => {
      try {
        // Load each data type from IndexedDB
        const rm = await idbGet('roadmaps') || {};
        const prog = await idbGet('progress') || {};
        const notes = await idbGet('notes') || {};
        const res = await idbGet('resources') || {};
        const meta = await idbGet('topicMeta') || {};
        const q = await idbGet('quests') || {};
        const qr = await idbGet('quizResults') || {};
        
        // Set all states
        setRoadmaps(rm);
        setProgress(prog);
        setNotes(notes);
        setResources(res);
        setTopicMeta(meta);
        setQuests(q);
        setQuizResults(qr);
        
        setLoaded(true); // Signal that data is ready
      } catch (e) {
        console.error("Failed to load data:", e);
        setLoaded(true); // Even on error, mark as loaded
      }
    };
    
    loadAll();
  }, []); // Empty dependency array = run once on mount
  
  // 3. Save roadmaps whenever they change
  useEffect(() => {
    if (loaded) { // Don't save until fully loaded
      idbSet('roadmaps', roadmaps);
    }
  }, [roadmaps, loaded]);
  
  // 4. Save progress whenever it changes
  useEffect(() => {
    if (loaded) {
      idbSet('progress', progress);
    }
  }, [progress, loaded]);
  
  // 5. Repeat for all other data types...
  
  // 6. Return everything so App can use it
  return {
    // Getters
    roadmaps,
    progress,
    notes,
    resources,
    topicMeta,
    quests,
    quizResults,
    loaded,
    
    // Setters
    setRoadmaps,
    setProgress,
    setNotes,
    setResources,
    setTopicMeta,
    setQuests,
    setQuizResults,
  };
}
```

**In App.jsx:**

```jsx
function App() {
  // Get everything from the hook
  const { roadmaps, setRoadmaps, progress, setProgress, loaded } = useAppStorage();
  
  // Show loading state
  if (!loaded) {
    return <div>Loading your data...</div>;
  }
  
  // Once loaded, render normally
  return <Dashboard roadmaps={roadmaps} progress={progress} />;
}
```

## useStreak - Track Consecutive Days

**Goal:** Count how many consecutive days user studied.

**Data structure:**

```javascript
{
  streak: 5,  // Current streak count
  lastActivity: "2024-03-18", // Date of last study
  longestStreak: 12, // All time record
}
```

**Implementation:**

```jsx
export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);
  
  // On mount, load streak from storage
  useEffect(() => {
    const saved = localStorage.getItem('streak_data');
    if (saved) {
      const data = JSON.parse(saved);
      setStreak(data.streak);
      setLastActivity(data.lastActivity);
    }
  }, []);
  
  // When user does something (marks topic complete), increment streak
  const recordActivity = () => {
    const today = new Date().toDateString();
    
    // Only increment if first time today
    if (lastActivity !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLastActivity(today);
      
      // Save to storage
      localStorage.setItem('streak_data', JSON.stringify({
        streak: newStreak,
        lastActivity: today,
      }));
    }
  };
  
  // Check if already studied today
  const studiedToday = () => {
    const today = new Date().toDateString();
    return lastActivity === today;
  };
  
  return { streak, recordActivity, studiedToday };
}
```

**Usage in App:**

```jsx
function App() {
  const { streak, recordActivity } = useStreak();
  
  // When user marks topic complete
  const toggle = (key, topic) => {
    setProgress(p => ({ ...p, [`${key}::${topic}`]: !p[`${key}::${topic}`] }));
    recordActivity(); // Increment streak
  };
  
  return (
    <div>
      <div>Streak: {streak} days 🔥</div>
      <button onClick={() => toggle("rm-1", "topic-1")}>
        Mark Complete
      </button>
    </div>
  );
}
```

---

# Sync System Explained

## How Multi-Device Sync Works

### Architecture Layers

```
┌─────────────────────────────────────┐
│        React Components             │
│    (App, Dashboard, Modals)         │
└──────────────┬──────────────────────┘
               │ syncData(key, value)
               ↓
┌─────────────────────────────────────┐
│    useSync Hook                     │
│  (manages sync state)               │
└──────────────┬──────────────────────┘
               │ ws.send(JSON)
               ↓
┌─────────────────────────────────────┐
│    WebSocket Connection             │
│  (to sync-server.js)                │
└──────────────┬──────────────────────┘
               │ network
               ↓
┌─────────────────────────────────────┐
│     Sync Server (Node.js)           │
│  (broadcasts to other devices)      │
└──────────────┬──────────────────────┘
               │ network
               ↓
┌─────────────────────────────────────┐
│    WebSocket Connection             │
│  (on other device)                  │
└──────────────┬──────────────────────┘
               │ onmessage listener
               ↓
┌─────────────────────────────────────┐
│    useSync Hook (other device)      │
│  (receives and applies updates)     │
└──────────────┬──────────────────────┘
               │ setState
               ↓
┌─────────────────────────────────────┐
│    React Components Update          │
└─────────────────────────────────────┘
```

## syncService.js - WebSocket Client

**Class: SyncManager**

```javascript
export class SyncManager {
  constructor(options = {}) {
    this.ws = null;                    // WebSocket connection
    this.deviceId = options.deviceId;  // Unique device identifier
    this.serverUrl = options.serverUrl; // ws://192.168.1.100:3001
    this.listeners = new Set();        // Callbacks for events
  }
  
  // Connect to sync server
  async connect(serverUrl) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(serverUrl);
      
      // When connection opens
      this.ws.onopen = () => {
        console.log("✓ Connected to sync server");
        
        // Tell server who we are
        this.send('device_connect', {
          deviceId: this.deviceId,
        });
        
        // Notify listeners
        this.notifyListeners({ type: 'connected' });
        resolve();
      };
      
      // When we receive a message from server
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // If it's a data update from another device
        if (message.type === 'data_update') {
          console.log("📥 Update from other device:", message.key);
          // Notify listeners so React can update
          this.notifyListeners({
            type: 'remote_update',
            key: message.key,
            value: message.value,
          });
        }
      };
      
      // Error handling
      this.ws.onerror = (error) => {
        console.error("❌ Sync error:", error);
        this.notifyListeners({ type: 'error' });
        reject(error);
      };
    });
  }
  
  // Send data to other devices
  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    this.ws.send(JSON.stringify({
      type,
      deviceId: this.deviceId,
      payload,
    }));
    
    return true;
  }
  
  // Broadcast data update to all other devices
  syncData(key, value) {
    return this.send('data_update', { key, value });
  }
  
  // Listen for sync events
  subscribe(callback) {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }
  
  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(cb => cb(event));
  }
}
```

## useSync Hook - React Integration

**How it connects to components:**

```jsx
export function useSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const syncManagerRef = useRef(null);
  
  // Initialize on mount
  useEffect(() => {
    // Create sync manager
   syncManagerRef.current = new SyncManager({
      deviceId: getOrCreateDeviceId(),
    });
    
    // Subscribe to sync events
    syncManagerRef.current.subscribe((event) => {
      if (event.type === 'connected') {
        setIsConnected(true);
        setConnectionError(null);
      } else if (event.type === 'disconnected') {
        setIsConnected(false);
      } else if (event.type === 'error') {
        setConnectionError(event.message);
      }
    });
  }, []);
  
  // Connect to server
  const connectToDevice = async (serverUrl, pairingCode, name) => {
    try {
      await syncManagerRef.current.connect(serverUrl);
      syncManagerRef.current.send('pairing_request', {
        pairingCode,
        deviceName: name,
      });
      return true;
    } catch (e) {
      setConnectionError(e.message);
      return false;
    }
  };
  
  // Send data to sync
  const syncData = (key, value) => {
    return syncManagerRef.current.syncData(key, value);
  };
  
  const disconnect = () => {
    syncManagerRef.current.disconnect();
    setIsConnected(false);
  };
  
  return {
    isConnected,
    connectionError,
    connectToDevice,
    syncData,
    disconnect,
  };
}
```

## sync-server.js - Coordination Server

**Purpose:** Holds list of connected devices and broadcasts updates.

```javascript
// In-memory store
const devices = new Map(); // deviceId -> { ws, name, ... }

// When a device connects
wss.on('connection', (ws) => {
  let deviceId = null;
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    // Device announcing itself
    if (message.type === 'device_connect') {
      deviceId = message.deviceId;
      devices.set(deviceId, {
        id: deviceId,
        ws: ws,
        connectedAt: Date.now(),
      });
      console.log(`Device ${deviceId} connected`);
      
      // Notify all others
      broadcastToAllExcept(deviceId, {
        type: 'device_connected',
        deviceId,
      });
    }
    
    // Pairing request
    if (message.type === 'pairing_request') {
      console.log(`Device ${deviceId} provided pairing code`);
      // Could validate code here if wanted
    }
    
    // Data update from a device
    if (message.type === 'data_update') {
      console.log(`Update from ${deviceId}: ${message.payload.key}`);
      
      // Forward to all OTHER devices
      broadcastToAllExcept(deviceId, message);
    }
  });
  
  // When device disconnects
  ws.on('close', () => {
    if (deviceId) {
      devices.delete(deviceId);
      console.log(`Device ${deviceId} disconnected`);
      
      // Notify others
      broadcastToAll({
        type: 'device_disconnected',
        deviceId,
      });
    }
  });
});

// Helper: broadcast to all except sender
function broadcastToAllExcept(exceptId, message) {
  devices.forEach((device, id) => {
    if (id !== exceptId && device.ws.readyState === WebSocket.OPEN) {
      device.ws.send(JSON.stringify(message));
    }
  });
}
```

## Data Flow: User Marks Topic Complete

```
┌─ Device A ───────────────────────────────────────┐
│                                                   │
│ 1. User clicks checkbox               ✓           │
│    │                                               │
│    ↓                                               │
│ 2. App: toggle(key, topic)                        │
│    │ setProgress()                                 │
│    ↓                                               │
│ 3. State updates                                  │
│    │ dependency on progress triggers              │
│    ↓                                               │
│ 4. useAppStorage hook:                            │
│    │ idbSet('progress', newProgress)              │
│    ↓                                               │
│ 5. App also calls:                                │
│    │ syncData('progress', newProgress)            │
│    ↓                                               │
│ 6. useSync sends:                                 │
│    │ ws.send({                                    │
│    │   type: 'data_update',                       │
│    │   key: 'progress',                           │
│    │   value: { 'rm::topic': true }               │
│    │ })                                            │
│    ↓                                               │
└───────────────→ Network ←─────────────────────────┘
                    ↓
             Sync Server
             (broadcasts to all)
                    ↓
┌───────────────→ Network ←─────────────────────────┐
│                                                   │
│ ┌─ Device B ─────────────────────────────────────┤
│ │                                                 │
│ │ 7. Receive message: {                           │
│ │      type: 'data_update',                       │
│ │      key: 'progress',                           │
│ │      value: { 'rm::topic': true }               │
│ │    }                                             │
│ │    ↓                                             │
│ │ 8. useSync listener triggered                   │
│ │    ↓                                             │
│ │ 9. Update App state:                            │
│ │    setProgress(received.value)                  │
│ │    ↓                                             │
│ │ 10. React re-renders with new data              │
│ │    ↓                                             │
│ │ 11. UI shows checkbox as checked ✓              │
│ │                                                 │
│ │ 12. useAppStorage also saves to IndexedDB       │
│ │    (so it persists after refresh)               │
│ │                                                 │
│ └─────────────────────────────────────────────────┘
```

---

# Common Patterns & Pitfalls

## Pattern 1: The Container Component

Extract logic from UI:

```jsx
// Before: Logic mixed with UI
function TopicCard({ topic, progress, onToggle, onSave }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  
  const handleSave = () => {
    onSave(notes);
    setEditing(false);
  };
  
  if (editing) {
    return <EditNoteForm notes={notes} onSave={handleSave} />;
  }
  
  return <Card topic={topic} onEdit={() => setEditing(true)} />;
}

// After: Separated
export function TopicCardContainer({ topic, progress, onToggle }) {
  const [editing, setEditing] = useState(false);
  
  const handleEdit = (notes) => {
    onSave(notes);
    setEditing(false);
  };
  
  return (
    <TopicCard 
      topic={topic}
      editing={editing}
      onEdit={handleEdit}
    />
  );
}

function TopicCard({ ...props }) {
  return (
    props.editing 
      ? <EditForm /> 
      : <Display />
  );
}
```

## Pitfall 1: Infinite Loops

**Problem:**

```jsx
function Bad() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1); // Updates count
  }); // Missing dependency array!
  
  // This runs after every render,
  // which causes re-render because count changed,
  // which runs effect again...
  // INFINITE LOOP!
}
```

**Solution:**

```jsx
function Good() {
  const [count, setCount] = useState(0);
  
  // With dependency array, runs only once
  useEffect(() => {
    setCount(1);
  }, []); // Empty = run once
  
  // Or include count in dependencies
  useEffect(() => {
    console.log("Count is now:", count);
  }, [count]); // Run when count changes
}
```

## Pitfall 2: Stale Closures

**Problem:**

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Count:", count); // Always prints 0!
    }, 1000);
  }, []); // count not in dependencies
  
  // count captured when effect ran (=0)
  // Doesn't update when count changes
}
```

**Solution:**

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Count:", count); // Updates correctly
    }, 1000);
    
    return () => clearInterval(interval); // Cleanup
  }, [count]); // Add count as dependency
}
```

## Pitfall 3: Mutating State

**Problem:**

```jsx
function Bad() {
  const [items, setItems] = useState([1, 2, 3]);
  
  const addItem = () => {
    items.push(4); // ❌ Mutating state!
    setItems(items); // React might not detect change
  };
  
  const updateFirst = () => {
    items[0] = 99; // ❌ Mutating state!
    setItems(items); // Change might not work
  };
}
```

**Solution:**

```jsx
function Good() {
  const [items, setItems] = useState([1, 2, 3]);
  
  const addItem = () => {
    setItems([...items, 4]); // Create new array
  };
  
  const updateFirst = () => {
    setItems([99, ...items.slice(1)]); // Create new array
  };
  
  const remove = (index) => {
    setItems(items.filter((_, i) => i !== index)); // Filter creates new
  };
}
```

## Pattern 2: Controlled vs Uncontrolled Inputs

**Controlled** (recommended) - React manages value:

```jsx
function Form() {
  const [email, setEmail] = useState("");
  
  return (
    <input
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  );
}
```

**Uncontrolled** - DOM manages value:

```jsx
function Form() {
  const inputRef = useRef(null);
  
  const handleSubmit = () => {
    const value = inputRef.current.value;
    console.log(value);
  };
  
  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

---

# From Concept to Code

## Building a Feature: Topic Ratings

**Concept:** Users can rate topics (1-5 stars). This affects recommendations.

### Step 1: Data Structure

```javascript
{
  topicRatings: {
    "roadmapId::topicName": {
      rating: 4,  // 1-5
      ratedAt: 1710759600000,
    }
  }
}
```

### Step 2: Add to Storage

```javascript
// constants/keys.js
export const STORAGE_KEYS = {
  // ... existing keys
  TOPIC_RATINGS: 'topicRatings',
};

// storage/hooks.js - add to useAppStorage
const [topicRatings, setTopicRatings] = useState({});

useEffect(() => {
  const load = async () => {
    const ratings = await idbGet(STORAGE_KEYS.TOPIC_RATINGS) || {};
    setTopicRatings(ratings);
  };
  load();
}, []);

useEffect(() => {
  idbSet(STORAGE_KEYS.TOPIC_RATINGS, topicRatings);
}, [topicRatings]);

// Return from hook
return { topicRatings, setTopicRatings, ... };
```

### Step 3: Create Rating Component

```jsx
// components/ui/StarRating.jsx
export function StarRating({ value = 0, onChange, size = "md" }) {
  return (
    <div className={`star-rating ${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={star <= value ? 'filled' : 'empty'}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

### Step 4: Use in TopicCard

```jsx
function TopicCard({ rmKey, topic, onRating }) {
  const [rating, setRating] = useState(0);
  
  const handleRate = (newRating) => {
    setRating(newRating);
    onRating(rmKey, topic, newRating);
  };
  
  return (
    <div className="card">
      <h3>{topic}</h3>
      <StarRating value={rating} onChange={handleRate} />
    </div>
  );
}
```

### Step 5: Handle in App

```jsx
function App() {
  const { topicRatings, setTopicRatings } = useAppStorage();
  
  const handleRate = (rmKey, topic, newRating) => {
    const key = `${rmKey}::${topic}`;
    setTopicRatings(prev => ({
      ...prev,
      [key]: {
        rating: newRating,
        ratedAt: Date.now(),
      }
    }));
  };
  
  return (
    <Dashboard
      topic  syncing={topicRatings}
      onRate={handleRate}
    />
  );
}
```

---

# Testing Your App

## Unit Testing - Test Functions

```javascript
// utils/__tests__/format.test.js
import { formatNumber } from '../format';

describe('formatNumber', () => {
  it('should format thousands', () => {
    expect(formatNumber(1000)).toBe('1.0k');
    expect(formatNumber(5000)).toBe('5.0k');
  });
  
  it('should handle small nums', () => {
    expect(formatNumber(50)).toBe('50');
    expect(formatNumber(999)).toBe('999');
  });
});
```

## Component Testing - Test UI

```javascript
// components/__tests__/StarRating.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('should render 5 stars', () => {
    render(<StarRating value={0} onChange={jest.fn()} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });
  
  it('should fill stars up to value', () => {
    render(<StarRating value={3} onChange={jest.fn()} />);
    const stars = screen.getAllByRole('button');
    expect(stars[0]).toHaveClass('filled');
    expect(stars[2]).toHaveClass('filled');
    expect(stars[3]).not.toHaveClass('filled');
  });
  
  it('should call onChange when clicked', () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
```

---

# Deployment

## Build for Production

```bash
npm run build
```

Creates `dist/` folder with optimized files.

## Deploy to Vercel (Easiest)

```bash
npm install -g vercel
vercel
```

## Deploy to GitHub Pages

```bash
// vite.config.js
export default {
  base: '/learning-tracker/',
}

npm run build
git add dist/
git commit -m "Deploy"
git push
```

---

## Summary & Next Steps

**You now understand:**
- React fundamentals (components, hooks, state)
- How Learning Tracker is structured
- Storage system (IndexedDB)
- AI integration
- Multi-device sync architecture
- Common patterns and pitfalls

**Try building:**
1. Simple todo app (practice basics)
2. Add notes to todos
3. Filter/search todos
4. Export/import todos
5. Mobile responsive design
6. Add streak counter

**Advanced challenges:**
- Add user authentication
- Cloud sync instead of local
- Real-time collaboration
- Offline-first with service workers
- Custom notification system

**Resources:**
- React Docs: https://react.dev
- MDN Web Docs: https://developer.mozilla.org
- Learning Tracker Code: Study each file progressively
- Build small features first, then combine

Keep building! 🚀

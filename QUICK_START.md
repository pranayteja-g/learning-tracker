# Learning Tracker - Quick Navigation Guide

Welcome! This guide helps you find what you need to learn about this project.

## 📚 Documentation Structure

```
LEARNING_GUIDE.md (Part 1)
├── React Fundamentals
├── Project Overview
├── Project Architecture
├── Storage System
├── Component System
├── Hooks & State Management
└── Feature Deep Dives

LEARNING_GUIDE_PART2.md (Part 2)
├── Component File Breakdown
├── Hook Implementation Details
├── Sync System Explained
├── Common Patterns & Pitfalls
├── Building Your Own Feature
├── Testing
└── Deployment

SYNC_SETUP.md
└── Complete network sync guide

SYNC_SERVER.md
└── Sync server documentation

This file (QUICK_START.md)
└── Navigation & learning paths
```

---

## ❓ I Want To...

### **Learn React from Scratch**

**Start here:** [LEARNING_GUIDE.md](./LEARNING_GUIDE.md#react-fundamentals) - React Fundamentals section

**What you'll learn:**
- What React is and why it's useful
- JSX syntax (HTML-like code in JavaScript)
- Components (reusable UI building blocks)
- Props (passing data between components)
- State & Hooks (managing data that changes)
- useEffect (running code at specific times)

**Time:** 30-45 minutes

**Then:** Move to "Project Overview" section

---

### **Understand the Whole Project Structure**

**Read these sections in order:**

1. [Project Overview](./LEARNING_GUIDE.md#project-overview) - What Learning Tracker does
2. [Project Architecture](./LEARNING_GUIDE.md#project-architecture) - How files are organized
3. [Core Concepts](./LEARNING_GUIDE.md#core-concepts) - Design patterns used

**Time:** 20 minutes

---

### **Learn How Data Works (Storage)**

**Read:** [Storage System](./LEARNING_GUIDE.md#storage-system) - Complete section

Covers:
- How IndexedDB works
- The `useAppStorage` hook
- How data saves & loads
- Data flow examples

**Then read:** [LEARNING_GUIDE_PART2.md - useAppStorage Deep Dive](./LEARNING_GUIDE_PART2.md#useappstorage---the-central-hub)

**Time:** 25 minutes

---

### **Understand a Specific Component**

**Look in:** [LEARNING_GUIDE_PART2.md - Component File Breakdown](./LEARNING_GUIDE_PART2.md#component-file-breakdown)

It covers:
- `Dashboard.jsx` - Main view
- `TopicCard.jsx` - Individual topic display
- `NoteModal.jsx` - Edit notes window
- `AIPanel.jsx` - AI features hub
- `ExplainView.jsx` - Get explanations from AI

**Pick your component and read its section**

**Time:** 15 minutes per component

---

### **Learn How AI Features Work**

**Read:** [AI Explanations Feature](./LEARNING_GUIDE.md#feature-1-ai-powered-explanations)

Covers:
- How AI integration works
- The providers system (Claude, GPT, Gemini)
- Building prompts for AI
- Displaying AI responses

**Also read:** [LEARNING_GUIDE_PART2.md - ExplainView Details](./LEARNING_GUIDE_PART2.md#components-ai-explainviewjsx---detailed)

**Files to examine:**
- `src/ai/providers.js` - API setup
- `src/ai/prompts.js` - Pre-written prompts
- `src/components/ai/ExplainView.jsx` - UI

**Time:** 30 minutes

---

### **Understand Multi-Device Sync**

**Read:** [LEARNING_GUIDE.md - Feature 3: Multi-Device Sync](./LEARNING_GUIDE.md#feature-3-multi-device-sync)

**Then read:** [LEARNING_GUIDE_PART2.md - Sync System Explained](./LEARNING_GUIDE_PART2.md#sync-system-explained)

Covers:
- How devices communicate via WebSocket
- Sync server coordination
- React hook integration
- Real data flow example

**Setup guide:** [SYNC_SETUP.md](./SYNC_SETUP.md)

**Time:** 45 minutes

---

### **Build My Own Feature**

**Follow:** [From Concept to Code](./LEARNING_GUIDE_PART2.md#from-concept-to-code)

It walks through building a complete feature step-by-step:
1. Plan data structure
2. Add to storage
3. Create component
4. Use in app
5. Handle in main App

**Example:** Rating topics 1-5 stars

**Use as template:** Replace "topic ratings" with your feature

**Time:** 45 minutes

---

### **Set Up Network Sync**

**Read:** [SYNC_SETUP.md](./SYNC_SETUP.md) - Quick Start Guide

**Then:** [SYNC_SERVER.md](./SYNC_SERVER.md) - Complete server documentation

**Time:** 10 minutes setup + 5 minutes connect

---

### **Avoid Common Mistakes**

**Read:** [Common Patterns & Pitfalls](./LEARNING_GUIDE_PART2.md#common-patterns--pitfalls)

Covers:
- Infinite loops (how they happen & how to fix them)
- Stale closures
- Mutating state (why it breaks things)
- Controlled vs Uncontrolled inputs

**Time:** 20 minutes

---

### **Test My Code**

**Read:** [Testing Your App](./LEARNING_GUIDE_PART2.md#testing-your-app)

Covers:
- Unit testing (test functions)
- Component testing (test UI)
- Examples with real code

**Time:** 20 minutes

---

### **Deploy the App**

**Read:** [Deployment](./LEARNING_GUIDE_PART2.md#deployment)

Options:
- Vercel (easiest, 1 command)
- GitHub Pages
- Custom server

**Time:** 5 minutes

---

## 📖 Learning Paths

### **Path 1: I'm Completely New to React** (3-4 hours)

1. ✅ [React Fundamentals](./LEARNING_GUIDE.md#react-fundamentals) (45 min)
2. ✅ [Project Overview](./LEARNING_GUIDE.md#project-overview) (15 min)
3. ✅ [Project Architecture](./LEARNING_GUIDE.md#project-architecture) (15 min)
4. ✅ [Component System](./LEARNING_GUIDE.md#component-system) (30 min)
5. ✅ [Hooks & State Management](./LEARNING_GUIDE.md#hooks--state-management) (30 min)
6. ✅ [Storage System](./LEARNING_GUIDE.md#storage-system) (25 min)
7. ✅ [Build Simple Feature](./LEARNING_GUIDE_PART2.md#from-concept-to-code) (45 min)
8. ✅ Study 1-2 components from [Component Breakdown](./LEARNING_GUIDE_PART2.md#component-file-breakdown) (30 min)

**After this:** You can understand & modify basic features

---

### **Path 2: I Know React Already** (2 hours)

1. ✅ [Project Overview](./LEARNING_GUIDE.md#project-overview) (10 min)
2. ✅ [Project Architecture](./LEARNING_GUIDE.md#project-architecture) (15 min)
3. ✅ [Storage System](./LEARNING_GUIDE.md#storage-system) (20 min)
4. ✅ [Core Concepts](./LEARNING_GUIDE.md#core-concepts) (15 min)
5. ✅ Study specific features:
   - AI: [Feature 1](./LEARNING_GUIDE.md#feature-1-ai-powered-explanations) (25 min)
   - Sync: [Feature 3](./LEARNING_GUIDE.md#feature-3-multi-device-sync) (25 min)
6. ✅ [File Breakdown](./LEARNING_GUIDE_PART2.md#component-file-breakdown) for files you want to modify (30 min)

**After this:** You can contribute new features

---

### **Path 3: I Want to Build My Own App** (2.5 hours)

1. ✅ [React Fundamentals](./LEARNING_GUIDE.md#react-fundamentals) (45 min)
2. ✅ Skip project specifics, understand:
   - [State Management Pattern](./LEARNING_GUIDE.md#1-state-management-pattern) (10 min)
   - [Custom Hooks for Logic](./LEARNING_GUIDE.md#2-custom-hooks-for-logic) (10 min)
   - [Storage System](./LEARNING_GUIDE.md#storage-system) basics (15 min)
3. ✅ [From Concept to Code](./LEARNING_GUIDE_PART2.md#from-concept-to-code) (45 min)
4. ✅ [Common Pitfalls](./LEARNING_GUIDE_PART2.md#common-patterns--pitfalls) (20 min)
5. ✅ Start building your app following the patterns shown

**After this:** You can create your own React app

---

### **Path 4: I Want to Add Sync to My App** (1.5 hours)

1. ✅ [Sync System Explained](./LEARNING_GUIDE_PART2.md#sync-system-explained) (45 min)
2. ✅ Copy `src/sync/syncService.js` (WebSocket client)
3. ✅ Copy `src/hooks/useSync.js` (React hook)
4. ✅ Adapt `sync-server.js` for your use case
5. ✅ Read [SYNC_SETUP.md](./SYNC_SETUP.md) (10 min)
6. ✅ Update your components to call `syncData()` (varies)

**After this:** Your app syncs across devices

---

## 🎯 File-by-File Reference

### **To Understand...**

**Rendering UI:**
- `components/screens/Dashboard.jsx` - Main view
- `components/ui/TopicCard.jsx` - Card component
- `components/modals/NoteModal.jsx` - Edit modal

**State & Data:**
- `storage/hooks.js` - Central data hook (`useAppStorage`)
- `storage/db.js` - Low-level storage operations
- `App.jsx` - Main component with all state

**AI Features:**
- `components/ai/AIPanel.jsx` - AI feature hub
- `components/ai/ExplainView.jsx` - Get explanations
- `ai/providers.js` - AI API setup
- `ai/prompts.js` - Pre-written prompts

**Advanced Features:**
- `hooks/useStreak.js` - Study streak tracking
- `hooks/useQuest.js` - Daily quest system
- `components/interview/` - Interview mode
- `components/practice/` - Practice mode

**Sync (Multi-Device):**
- `sync/syncService.js` - WebSocket client
- `hooks/useSync.js` - React hook for sync
- `sync-server.js` - Server coordination
- `components/sync/` - Sync UI components

**Utilities:**
- `utils/roadmap.js` - Roadmap algorithms
- `utils/format.js` - Number/time formatting
- `utils/jsonParse.js` - Safe JSON parsing
- `constants/config.js` - App configuration

---

## 💡 Tips for Learning

### **1. "Show Me Don't Tell Me"**
Open the file mentioned + read the code + comments
It's more useful than explaining alone

### **2. Understand the Data Flow First**
Before reading component code:
- What data does it need?
- Where does that data come from?
- What changes when user interacts?

### **3. Start with Simple Components**
Learn from simpler files first:
- `TopicCard.jsx` before `Dashboard.jsx`
- `StarRating.jsx` before `AIPanel.jsx`

### **4. Read Function Purpose First**
Before diving into a function:
- Read its name
- Read the comment above it
- Look at what it returns
- *Then* read the code

### **5. Build as You Learn**
Don't just read - create:
- Add a feature
- Build a custom component
- Modify existing feature
This cements understanding

### **6. Keep a Notes File**
Document patterns you see:
```
Pattern: Managing form state
file: NoteModal.jsx
pattern: const [field, setField] = useState()
why: Allows React to auto-update UI
```

---

## ❓ Frequently Asked Questions

**Q: Where do I start if I'm brand new?**
A: [React Fundamentals](./LEARNING_GUIDE.md#react-fundamentals) then [Project Overview](./LEARNING_GUIDE.md#project-overview)

**Q: Why is data in useAppStorage instead of props?**
A: It's the "source of truth" - everything else reads from here. Makes syncing easier.

**Q: How do I add a new section to roadmap?**
A: See [FROM CONCEPT TO CODE](./LEARNING_GUIDE_PART2.md#from-concept-to-code) which uses exact same pattern

**Q: Why does sync use WebSocket instead of HTTP?**
A: WebSocket = real-time, bi-directional. HTTP = request-response only. Needed for instant sync.

**Q: Can I see the sync in action?**
A: Yes! Run `npm run sync-server` then open app on 2 devices. Toggle a topic on one, watch other update.

**Q: How do I test my changes?**
A: See [Testing Your App](./LEARNING_GUIDE_PART2.md#testing-your-app)

**Q: Can I deploy this myself?**
A: Yes! See [Deployment](./LEARNING_GUIDE_PART2.md#deployment). Vercel takes 1 command.

---

## 🚀 Next Steps

1. **Pick a learning path** above based on your background
2. **Read in order** - each builds on previous
3. **Code along** - open files mentioned
4. **Build something small** - add 1 feature
5. **Deploy it** - share with others

---

## 📞 Getting Help

**"This code confuses me"**
→ Look for comments in the file → Check the file-by-file breakdown docs

**"I don't understand why it's structured this way"**
→ Read the "Core Concepts" or "Why?" in that section

**"I want to add a feature"**
→ Follow [From Concept to Code](./LEARNING_GUIDE_PART2.md#from-concept-to-code) template

**"It's not working"**
→ Check [Common Pitfalls](./LEARNING_GUIDE_PART2.md#common-patterns--pitfalls)

---

## 📊 Learning Progress Tracker

Copy this and check off as you go:

```markdown
### Fundamentals
- [ ] What React is
- [ ] JSX syntax
- [ ] Components & Props
- [ ] State & Hooks
- [ ] useEffect

### Project Structure
- [ ] Overall architecture
- [ ] Folder organization  
- [ ] Data flow

### Core Systems
- [ ] Storage (IndexedDB)
- [ ] State management (useAppStorage)
- [ ] Component hierarchy

### Features
- [ ] Dashboard & views
- [ ] AI integration
- [ ] Multi-device sync

### Implementation
- [ ] Read 3 component files
- [ ] Understand 2 custom hooks
- [ ] Build 1 new feature
- [ ] Deploy the app

### Advanced
- [ ] Modify existing feature
- [ ] Add tests
- [ ] Optimize performance
```

---

**Ready to start? Go to [LEARNING_GUIDE.md](./LEARNING_GUIDE.md)! 🎓**

# Learning Tracker Project Context

## Project Overview
- **Location**: `d:\react\project\learning-tracker`
- **Type**: React + Vite learning management application with AI integration
- **Status**: In active development on `development` branch
- **Key Features**:
  - Structured learning roadmaps with topics organized in sections
  - AI-powered practice (quizzes, coding challenges, Q&A via Groq/Gemini APIs)
  - Quest system with XP rewards and badges
  - Spaced repetition for reviewing topics
  - Streak tracking and daily goals
  - Project tracking and milestone management
  - Code editor component for coding challenges
  - Mobile-responsive UI
  - PWA support with service worker
  - Network sync between devices
  - Storage via IndexedDB (with localStorage migration)

## Recent Fix: "Start Learning" Button Not Working

### Problem
The "Start Learning 🎯" button on the final onboarding screen (step 3 "ready") wasn't doing anything when clicked.

### Root Cause
The `onComplete` callback was set to empty: `onComplete={() => {}}`

### Solution Implemented
Modified `d:\react\project\learning-tracker\src\App.jsx` and `src/storage/keys.js`:

1. **Added to keys.js**:
   ```js
   export const ONBOARDING_COMPLETED_KEY = "learning-tracker-onboarding-completed-v1";
   ```

2. **Updated App.jsx**:
   - Imported `ONBOARDING_COMPLETED_KEY` from `./storage/keys.js`
   - Added useEffect to load onboarding status on mount
   - Changed onboarding condition from `if (rmKeys.length === 0)` to `if (rmKeys.length === 0 && !onboardingCompleted)`
   - Implemented `onComplete` handler to:
     - Set localStorage flag
     - Create an empty roadmap with default properties
     - Call `handleSaveRoadmap()` to trigger proper re-render and exit onboarding

### Result
✅ Fixed - Users now successfully exit onboarding and see the main dashboard

## Project Structure

```
src/
├── App.jsx                 # Main app component with routing logic
├── index.css              # Global styles
├── main.jsx               # Entry point
├── ai/                    # AI integration
│   ├── context.js         # AI context setup
│   ├── prompts.js         # AI prompt templates
│   ├── providers.js       # Groq/Gemini provider config
│   └── useUsage.js        # AI usage tracking hook
├── components/
│   ├── screens/           # Full-page screens
│   │   ├── Dashboard.jsx
│   │   ├── OnboardingFlow.jsx  # Onboarding 4-step flow
│   │   ├── WelcomeScreen.jsx
│   │   └── ProjectBoard.jsx
│   ├── ui/                # UI components
│   │   ├── Toast.jsx
│   │   ├── TopicCard.jsx
│   │   ├── SearchOverlay.jsx
│   │   ├── CodeEditor.jsx
│   │   └── others...
│   ├── modals/            # Modal dialogs
│   ├── practice/          # Practice/quiz components
│   ├── quest/             # Quest system components
│   ├── interview/         # Interview mode components
│   └── sync/              # Device sync components
├── constants/
│   ├── config.js
│   └── templates.js       # Roadmap templates (Java, Spring Boot, etc.)
├── hooks/                 # Custom hooks
│   ├── useQuest.js        # Quest management
│   ├── useXP.js           # XP/leveling system
│   ├── useStreak.js       # Streak tracking
│   ├── useSpacedRepetition.js  # Spaced repetition algorithm
│   └── others...
├── storage/
│   ├── db.js              # IndexedDB wrapper
│   ├── hooks.js           # useAppStorage hook
│   └── keys.js            # Storage key constants
├── sync/
│   └── syncService.js     # Device sync logic
└── utils/
    ├── roadmap.js         # Roadmap utilities
    ├── topics.js          # Topic utilities
    ├── format.js
    └── validation.js
```

## Key Data Structures

### Roadmap Object
```js
{
  id: "java",
  label: "Java",
  color: "#FF6B6B",
  accent: "#FFB3B3",
  sections: {
    "Basics": [
      { name: "Variables & Types", collapsed: false },
      { name: "Loops", children: [{ name: "For Loop" }, ...] }
    ],
    // ...
  }
}
```

### Progress Tracking
```js
// Format: "roadmapId::topicName" -> boolean
{
  "java::Variables & Types": true,
  "java::Loops": false
}
```

## Important Patterns & Conventions

1. **Storage**: Uses IndexedDB via `useAppStorage()` hook; respects STORAGE_KEY constants
2. **UI State**: Mobile-responsive; separate logic paths for `isMobile` vs desktop
3. **Templates**: Pre-built roadmap templates in `constants/templates.js`
4. **Feedback**: Toast notifications via `showFeedback(ok, msg)` function
5. **AI Config**: Stored locally; providers configurable (Groq/Gemini)
6. **Progress Key Format**: Always `"${roadmapId}::${topicName}"`

## Development Commands
```bash
npm run dev      # Start dev server at http://localhost:5173/
npm run build    # Production build
npm run preview  # Preview production build
```

## Files Modified in Latest Session
- `d:\react\project\learning-tracker\src\storage\keys.js` - Added ONBOARDING_COMPLETED_KEY
- `d:\react\project\learning-tracker\src\App.jsx` - Fixed onComplete handler and conditional logic

## Git Branch
Currently on: `development` branch

## Next Potential Work
- Test onboarding flow with different template selections
- Verify empty roadmap creation works smoothly
- Test mobile vs desktop onboarding experience
- Consider adding onboarding tutorial/first-time user tips

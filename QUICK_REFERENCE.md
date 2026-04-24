# Learning Tracker - Quick Reference

## Current Session Summary (April 24, 2026)
**Task Completed**: Fixed "Start Learning" button in onboarding flow not working

## Bug Fix Summary
- **Files Changed**: `src/storage/keys.js`, `src/App.jsx`
- **What Was Wrong**: Button had empty callback `() => {}`
- **What Was Fixed**: Now creates empty roadmap and exits onboarding properly
- **Status**: ✅ Tested and verified working

## Key Files for Quick Navigation
| File | Purpose |
|------|---------|
| `src/App.jsx` | Main component - routing, state, conditional rendering |
| `src/components/screens/OnboardingFlow.jsx` | 4-step onboarding (welcome → roadmap → apikey → ready) |
| `src/storage/keys.js` | Storage key constants |
| `src/storage/hooks.js` | useAppStorage hook - IndexedDB persistence |
| `src/hooks/useQuest.js` | Quest system logic |
| `src/constants/templates.js` | Roadmap templates |

## Common Tasks
### Adding a new feature
1. Create component in appropriate folder under `src/components/`
2. Import in `App.jsx` if it's a major feature
3. Use storage hooks for persistence: `useAppStorage()`, `useIDBState()`
4. Follow mobile/desktop pattern if UI varies

### Fixing UI issues
- Check `OnboardingFlow.jsx` for onboarding screens (steps 0-3)
- Check `Dashboard.jsx` for main app interface
- Mobile vs desktop: Search for `isMobile` in App.jsx for different code paths

### Adding AI functionality
- Use `callAI()` from `src/ai/providers.js`
- Configure in `src/ai/context.js` or `src/ai/prompts.js`
- API keys stored in `aiConfig` (localStorage)

## Onboarding Flow Steps
0. **Welcome**: Intro screen → "Get Started" button
1. **Roadmap**: Pick template or skip
2. **API Key**: Optional Groq/Gemini setup
3. **Ready**: "Start Learning 🎯" button → Creates empty roadmap and exits

## Storage Keys (from keys.js)
```js
STORAGE_KEY = "learning-tracker-progress-v1"
NOTES_KEY = "learning-tracker-notes-v1"
ROADMAPS_KEY = "learning-tracker-roadmaps-v1"
ONBOARDING_COMPLETED_KEY = "learning-tracker-onboarding-completed-v1"
// etc.
```

## Testing Notes
- Dev server: `npm run dev` → http://localhost:5173/
- Clear localStorage to reset onboarding state
- Check browser console for errors
- Use mobile viewport in DevTools to test responsive UI

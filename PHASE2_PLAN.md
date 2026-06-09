# Phase 2 - Frontend Completion & Game Systems

## Overview
Complete the frontend UI with all game mechanics, build notification system, and ensure real-time gameplay.

---

## Phase 2A: UI Component Refactor (Days 1-2)

### Components to Create
1. **NotificationPanel.jsx** - Unified Den Den Mushi messaging
2. **CrewRoster.jsx** - Crew management and recruitment
3. **CombatUI.jsx** - Turn-based combat interface
4. **TerritoryGovernance.jsx** - Territory management panel
5. **BountyLeaderboard.jsx** - Bounty tracking
6. **DavyBackFight.jsx** - Crew gambling mechanics
7. **VivreCardTracker.jsx** - Health/information tracking
8. **NavigationControls.jsx** - Ship movement interface
9. **ShipSelectionPanel.jsx** - Enhanced ship management

### Layout Structure
```
GameApp (Main Container)
├── Header (Top) - Player info, Bounty, Title
├── Main Content Area
│   ├── Left Panel (Sidebar)
│   │   ├── Ship Selection
│   │   ├── Quick Actions
│   │   └── Territory Info
│   ├── Center Panel (Map)
│   │   └── Leaflet Map
│   └── Right Panel (Info)
│       ├── Player Stats
│       ├── Crew Roster (collapsible)
│       └── Current Territory
└── Bottom Panel - Notifications/Den Den Mushi
└── Modal Overlays (Combat, Davy Back, Recruitment)
```

---

## Phase 2B: Game System Integration (Days 3-4)

### 1. Navigation System
- Display available routes from current node
- Calculate navigation requirements (Navigator stat, Log Pose, etc.)
- Implement forced-forward vs liberated navigation modes
- Show congestion warnings

### 2. Combat System
- Initiate combat with other ships
- Turn-based Haki selection UI
- Stamina/health tracking
- Combat log
- Victory/defeat handling

### 3. Crew Management
- List available crew members by region
- Recruitment UI with loyalty check animations
- Crew stat bonuses display
- Crew autonomy status (loyalty, morale)
- Abandonment/betrayal alerts

### 4. Territory System
- Governance tier selection (Protection Flag / Tyranny / Shadow Puppet)
- Territory defense mechanics
- Revenue generation display
- Rebellion meter (if Tyranny)

### 5. Notification System
- Den Den Mushi message queue
- Black Snail interception alerts
- Invasion countdown timers
- Crew member events
- Alliance notifications
- Bounty updates

---

## Phase 2C: Real-Time Features (Days 5-6)

### WebSocket Integration
- Real-time ship position updates
- Live combat actions
- Crew loyalty changes
- Territory conflicts
- Alliance events
- Invasion alerts

### Local State Management
- Selected ship tracking
- Modal visibility states
- Active notifications
- Current combat session
- Territory claimed/defended state

---

## Implementation Priority

### CRITICAL (Must complete Phase 2)
1. ✅ NotificationPanel - Den Den Mushi system
2. ✅ NavigationControls - Ship movement
3. ✅ CrewRoster - Crew management
4. ✅ CombatUI - Combat interface
5. ✅ ShipSelectionPanel - Ship management

### HIGH (Should complete Phase 2)
1. 🔄 TerritoryGovernance - Territory management
2. 🔄 BountyLeaderboard - Bounty tracking
3. 🔄 Real-time notifications
4. 🔄 Modal system for complex actions

### MEDIUM (Phase 2 Extensions)
1. 🔄 DavyBackFight UI
2. 🔄 VivreCardTracker
3. 🔄 Advanced animations
4. 🔄 Sound effects

---

## Current App Structure Issues
- ❌ All in one component (App.jsx is 500+ lines)
- ❌ No proper state management (UI state scattered)
- ❌ No modals for complex actions
- ❌ No real notification system
- ❌ UI elements don't reflect game state properly
- ❌ No error handling/feedback
- ❌ Hardcoded UI states

---

## Phase 2 Success Criteria
✅ All UI components are modular and reusable
✅ Game screen shows all player information
✅ Navigation works with route display
✅ Combat can be initiated and fought
✅ Crew can be recruited and managed
✅ Territories can be claimed and defended
✅ Notifications display in real-time
✅ WebSocket updates map/state live
✅ No console errors
✅ Responsive design on desktop


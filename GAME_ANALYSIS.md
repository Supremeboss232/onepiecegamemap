# One Piece Interactive Map Game - Missing Features & Issues

## Executive Summary
Your One Piece game has **solid backend architecture** but is **incomplete on frontend and missing critical game mechanics**. The database schema is comprehensive, but many planned features aren't fully integrated into the server API or UI.

---

## 🔴 CRITICAL MISSING PIECES

### 1. **NO MAP DATA (Nodes/Islands)**
- **Problem**: The map is empty - no nodes or edges exist in the database
- **Expected**: Islands like Grand Line, East Blue, Paradise, New World, etc. with coordinates (x, y)
- **Impact**: Players cannot navigate - no game playable
- **Solution Needed**: Seed the `nodes` and `node_edges` tables with One Piece world data

### 2. **NO STARTER SHIPS**
- **Problem**: Players don't get a ship upon registration
- **Expected**: Each player should start with a starter ship at a starting island
- **Impact**: Players can't move or claim territory
- **Current Code**: `handleRegister` in `src/server.js` creates players but NO ship creation
- **Solution Needed**: Create a ship for each new player

### 3. **INCOMPLETE GAMELOGIC.JS**
- **Problem**: Many methods referenced but not fully implemented
- **Missing Methods**:
  - `recruitCrewMember()` - referenced in server but not defined
  - `processCombatAction()` - referenced in server but not defined
  - `applyBountyModifier()` - referenced in server but not defined
  - `discoverPoneglyph()` - referenced in server but not defined
  - `moveShip()` references `hull_integrity` field that doesn't exist in ships table (should be `hull`)

### 4. **DATABASE SCHEMA MISMATCHES**
- **Inconsistencies**:
  - Server code uses `hull_integrity`, but schema has `hull`
  - Server expects `is_static` field on ships - doesn't exist in schema
  - `global_characters` table exists but `crew_members` table also exists (confusion)
  - Missing `den_den_mushi_channels` table (server tries to use it)
  - Missing table: `haki_pools` (started in schema but incomplete)

### 5. **INCOMPLETE UI/GAME SCREEN**
- **What Works**: Auth screen (register/login), map display, player stats panel
- **What's Broken/Missing**:
  - No interactive ship movement controls
  - "Move Ship" button just shows alert - doesn't actually work
  - No combat UI
  - No crew recruitment UI (code exists but no button)
  - No bounty/leaderboard display
  - No Den Den Mushi messaging UI
  - No poneglyph discovery UI
  - No alliance/diplomacy system UI
  - No Shichibukai/Yonko system UI

### 6. **WEBSOCKET NOT IMPLEMENTED**
- **Problem**: Server registers `/ws/{playerId}` endpoint but handler is missing
- **Expected**: Real-time game updates via WebSocket
- **Impact**: Frontend tries to connect but server doesn't handle it

### 7. **MISSING ENDPOINTS**
- **Not Implemented in Server**:
  - `/ws/{playerId}` - WebSocket handler
  - `/api/game/ship/create` - Create new ships
  - `/api/game/poneglyph/*` - Poneglyph discovery mechanics
  - `/api/game/combat/turn` - Combat turn mechanics
  - `/api/den-den-mushi/*` - Den Den Mushi messaging
  - `/api/alliance/*` - Alliance management
  - `/api/shichibukai/*` - Shichibukai seat management
  - `/api/yonko/*` - Yonko system

---

## ⚠️ PARTIALLY IMPLEMENTED FEATURES

### 1. **Crew Management (30% Done)**
- ✅ Database schema exists (`global_characters` table)
- ✅ Server endpoint `/api/game/recruit-crew` defined
- ✅ Frontend action `recruitCrew()` defined
- ❌ Missing: `GameEngine.recruitCrewMember()` implementation
- ❌ Missing: UI button to recruit crew
- ❌ Missing: Character discovery mechanics

### 2. **Territory Claiming (60% Done)**
- ✅ Database schema exists
- ✅ Server endpoint works
- ✅ GameEngine method implemented
- ❌ Missing: Governance tier selection UI
- ❌ Missing: Territory attack/defense mechanics
- ❌ Missing: Revenue generation from territories

### 3. **Combat System (20% Done)**
- ✅ Database schema for `combat_sessions` and `haki_pools` exists
- ✅ Server endpoint `/api/game/combat/initiate` defined
- ✅ Server endpoint `/api/game/combat/action` defined
- ❌ Missing: `GameEngine.processCombatAction()` implementation
- ❌ Missing: Haki system mechanics
- ❌ Missing: Combat UI with turn-based interface

### 4. **Bounty System (40% Done)**
- ✅ Database schema exists
- ✅ Bounty fields in players table
- ✅ `/api/bounty/leaderboard` endpoint works
- ✅ `/api/bounty/apply-modifier` endpoint defined
- ❌ Missing: `GameEngine.applyBountyModifier()` implementation
- ❌ Missing: Bounty leaderboard UI
- ❌ Missing: Navy Blue aggression mechanics
- ❌ Missing: Hidden threat value mechanics

### 5. **Poneglyph System (10% Done)**
- ✅ Database schema exists
- ✅ Server endpoints defined
- ❌ Missing: `GameEngine.discoverPoneglyph()` implementation
- ❌ Missing: Laugh Tale path logic
- ❌ Missing: Discovery UI

---

## 🟡 INFRASTRUCTURE ISSUES

### 1. **Environment Configuration**
- ✅ `.env.example` exists with proper variables
- ❌ No `.env` file in workspace (needed to run)
- ❌ Missing Supabase admin key

### 2. **Frontend Build Configuration**
- ✅ `vite.config.js` exists
- ❌ No environment variables for frontend (should use `.env` with `VITE_` prefix)
- ❌ Frontend expects `REACT_APP_API_BASE` but React app uses Vite (should be `VITE_API_BASE`)

### 3. **Maintenance Scripts**
- All 7 scripts exist but untested:
  - `scripts/check_congestion.js` - Checks node congestion
  - `scripts/faction_aggression.js` - Navy Blues aggression
  - `scripts/release_inactive.js` - Removes inactive players
  - `scripts/seed_database.js` - Populates initial data
  - `scripts/maintenance_runner.js` - Runs periodic maintenance
  - `scripts/run_migration.js` - Runs database migrations
  - `scripts/faction_aggression.js` - Navy aggression mechanics

---

## 🟢 WHAT WORKS

✅ **Authentication**: Register/Login system functional
✅ **Database Schema**: Comprehensive (though needs data seeding)
✅ **Backend Server**: Fastify server starts and serves health check
✅ **Map Display**: Leaflet map renders (empty but works)
✅ **Player State**: Basic player data retrieval works
✅ **Auth Screen**: UI renders login/register forms

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Core Playability (URGENT)
1. Seed map data (nodes and edges) to `nodes` and `node_edges` tables
2. Create starter ships for new players in registration flow
3. Fix database schema inconsistencies (rename fields)
4. Implement missing GameEngine methods
5. Implement WebSocket handler for real-time updates

### Phase 2: Navigation & Exploration
1. Complete ship movement mechanics
2. Add route validation and congestion damage
3. Create territory claiming UI
4. Implement node congestion system

### Phase 3: Crew & Combat
1. Implement crew recruitment with discovery
2. Build combat system with Haki mechanics
3. Create combat UI

### Phase 4: Advanced Features
1. Implement bounty system and navy mechanics
2. Add poneglyph discovery and Laugh Tale quest
3. Implement alliances and diplomacy
4. Add Shichibukai and Yonko systems

---

## 🛠️ QUICK FIXES NEEDED

```javascript
// In src/server.js - REGISTRATION:
// ADD after creating player:
const { data: ship } = await supabaseAdmin
  .from('ships')
  .insert([{ 
    player_id: player[0].id, 
    node_id: START_NODE_ID, 
    hull: 1000 
  }])
  .select();

// Fix field name: hull_integrity → hull (in gameLogic.js)
// Implement missing methods in GameEngine
// Add WebSocket handler
// Create missing endpoints
```

---

## 📊 Feature Completion Status

| Feature | Status | Completeness |
|---------|--------|--------------|
| Authentication | ✅ Works | 90% |
| Map Display | ⚠️ Empty | 40% |
| Ship Movement | ❌ Broken | 30% |
| Territory Claims | ⚠️ Partial | 60% |
| Crew System | ❌ Broken | 30% |
| Combat | ❌ Not Working | 20% |
| Bounty System | ⚠️ Partial | 40% |
| Poneglyphs | ❌ Not Working | 10% |
| WebSocket | ❌ Missing | 0% |
| UI/Frontend | ⚠️ Minimal | 30% |


# Phase 3: Backend Integration & API Completion

## 📋 Overview
Phase 3 connects the 5 React components created in Phase 2 to the Fastify backend, verifies all data flows, and ensures real-time WebSocket updates work correctly.

## ✅ Backend Endpoints Status

### Already Implemented ✅
1. **POST /api/auth/register** - ✅ Creates player + starter ship
2. **POST /api/auth/login** - ✅ Authenticates player
3. **GET /api/health** - ✅ Health check
4. **GET /api/map/state** - ✅ Returns all nodes/ships/territories
5. **GET /api/map/node/:id/routes** - ✅ Returns available routes
6. **GET /api/player/:id** - ✅ Returns player state
7. **POST /api/game/move** - ✅ Move ship to node
8. **POST /api/game/claim-territory** - ✅ Claim territory
9. **POST /api/game/recruit-crew** - ✅ Recruit crew member
10. **GET /api/game/available-crew** - ✅ List available crew
11. **POST /api/game/combat/initiate** - ✅ Start combat
12. **POST /api/game/combat/action** - ✅ Combat action
13. **GET /api/bounty/leaderboard** - ✅ Get leaderboard
14. **POST /api/bounty/apply-modifier** - ✅ Apply bounty change
15. **POST /api/game/poneglyph/discover** - ✅ Discover poneglyph
16. **GET /api/game/poneglyphs** - ✅ Get poneglyphs
17. **POST /api/den-den-mushi/send** - ✅ Send message
18. **GET /api/game/territories** - ✅ Get territories
19. **POST /api/game/alliance/form** - ✅ Form alliance
20. **GET /api/game/events** - ✅ Get game events
21. **GET /ws/:playerId** - ✅ WebSocket connection

---

## 🔌 Component-to-Endpoint Mapping

### NotificationPanel Component
**Current Calls:**
- WebSocket: `message` event listener
- POST `/api/den-den-mushi/send` - Send message
- GET cached messages from state

**Status:** Ready for integration
**Action:** Verify WebSocket message format, test send endpoint

### NavigationControls Component
**Current Calls:**
- GET `/api/map/node/:id/routes` - Get available routes from current node
- POST `/api/game/move` - Move ship to target node
- GET `/api/player/:id` - Get current player state

**Status:** Partially ready
**Action:** Add error handling, verify response format, add loading states

### CrewRoster Component
**Current Calls:**
- GET `/api/game/available-crew` - List available crew
- POST `/api/game/recruit-crew` - Recruit specific character
- GET `/api/player/:id` - Get player crew list

**Status:** Partially ready
**Action:** Verify crew filtering logic, add recruitment error handling

### CombatUI Component
**Current Calls:**
- POST `/api/game/combat/initiate` - Start combat session
- POST `/api/game/combat/action` - Execute combat action (haki type, stamina cost)
- WebSocket: Combat updates

**Status:** Partially ready
**Action:** Verify combat session format, test Haki effectiveness system

### TerritoryGovernance Component
**Current Calls:**
- POST `/api/game/claim-territory` - Claim territory with governance mode
- GET `/api/game/territories` - List player territories
- GET `/api/player/:id` - Get player stats

**Status:** Partially ready
**Action:** Verify governance mode options, test stat requirements

---

## 🎯 Phase 3 Checklist

### Stage 1: Backend Review & Validation (Day 1)
- [ ] Read full server.js implementation for all endpoints
- [ ] Verify all endpoints handle errors correctly
- [ ] Check database queries match schema
- [ ] Validate JWT authentication middleware
- [ ] Test each endpoint with curl commands
- [ ] Verify WebSocket handler for real-time updates

### Stage 2: Frontend Integration (Day 2-3)
- [ ] Update NotificationPanel with real API calls
- [ ] Update NavigationControls with error handling
- [ ] Update CrewRoster with loading/error states
- [ ] Update CombatUI with combat session handling
- [ ] Update TerritoryGovernance with requirement checking
- [ ] Add loading spinners and error messages

### Stage 3: WebSocket Integration (Day 3)
- [ ] Test WebSocket connection on login
- [ ] Verify message broadcasting (Den Den Mushi)
- [ ] Test combat real-time updates
- [ ] Test invasion alerts
- [ ] Test crew events
- [ ] Test territory updates

### Stage 4: End-to-End Testing (Day 4)
- [ ] Register new player
- [ ] Move ship between nodes
- [ ] Recruit crew members
- [ ] Initiate and complete combat
- [ ] Claim territory
- [ ] Send messages (Den Den Mushi)
- [ ] Verify leaderboard updates
- [ ] Test error scenarios

---

## 🚀 Phase 3 Implementation Steps

### Step 1: Backend Verification
1. Read full server.js to understand endpoint implementations
2. Identify any incomplete or stubbed endpoints
3. Fix any missing database calls
4. Add error handling where missing
5. Document expected request/response formats

### Step 2: API Client Configuration
1. Create shared API client utility
2. Handle authentication headers (JWT)
3. Implement retry logic for failed requests
4. Add request/response interceptors
5. Error handling and logging

### Step 3: Component Integration
1. Replace mock functions with actual API calls
2. Add loading states for async operations
3. Add error boundaries and error messages
4. Implement proper state management
5. Handle edge cases (network errors, timeouts)

### Step 4: Real-Time Updates
1. Establish WebSocket connection on login
2. Subscribe to relevant events (combat, messages, territory)
3. Update component state on WebSocket events
4. Handle reconnection logic
5. Test with multiple concurrent players

### Step 5: Testing & Validation
1. Manual testing of each feature
2. Test error scenarios (API down, network timeout)
3. Test concurrent operations
4. Performance profiling
5. Database transaction verification

---

## 📊 Expected Response Formats

### Ship Movement Response
```json
{
  "success": true,
  "ship_id": "uuid",
  "current_node": 2,
  "hull": 950,
  "travel_time_hours": 24,
  "message": "Ship is en route to..."
}
```

### Crew Recruitment Response
```json
{
  "success": true,
  "character_id": "uuid",
  "character_name": "Roronoa Zoro",
  "loyalty": 50,
  "role": "Swordsman",
  "bounty": 120000000
}
```

### Combat Action Response
```json
{
  "success": true,
  "combat_id": "uuid",
  "attacker_health": 850,
  "defender_health": 920,
  "damage": 80,
  "haki_effectiveness": "super-effective",
  "combat_log": "Attacker used Armament Haki attack..."
}
```

### Territory Claim Response
```json
{
  "success": true,
  "territory_id": "uuid",
  "territory_name": "Shells Town",
  "governance_mode": "Protection Flag",
  "monthly_revenue": 5000000,
  "owner_id": "player_id"
}
```

---

## 🔄 WebSocket Events Format

### Message Received
```json
{
  "type": "message",
  "sender": "player_name",
  "content": "Let's form an alliance!",
  "timestamp": "2026-06-09T12:00:00Z",
  "is_intercepted": false
}
```

### Combat Started
```json
{
  "type": "combat_started",
  "combat_id": "uuid",
  "attacker": "player_name",
  "defender": "opponent_name",
  "location": "Shells Town"
}
```

### Invasion Alert
```json
{
  "type": "invasion_alert",
  "attacker": "player_name",
  "territory": "Shells Town",
  "defense_power": 5000,
  "time_to_defend": 3600
}
```

---

## 🛠️ Tools & Technologies

- **Frontend:** React, Vite, Leaflet.js
- **Backend:** Fastify, Node.js
- **Database:** Supabase (PostgreSQL)
- **Real-Time:** WebSocket
- **Auth:** JWT (localStorage)
- **HTTP Client:** Fetch API

---

## 📝 Success Criteria

- ✅ All API endpoints return expected data
- ✅ Components render without console errors
- ✅ User can complete full game flow (register → move → combat → territory)
- ✅ WebSocket updates work in real-time
- ✅ Error handling for all failure scenarios
- ✅ No unhandled promise rejections
- ✅ Database transactions complete successfully
- ✅ JWT authentication working on all protected routes

---

## ⏰ Estimated Timeline

- **Stage 1 (Backend Review):** 1 hour
- **Stage 2 (Frontend Integration):** 3-4 hours
- **Stage 3 (WebSocket Integration):** 2-3 hours
- **Stage 4 (Testing):** 2-3 hours

**Total: 8-11 hours of implementation**

---

## 📍 Current Status

**Starting Phase 3 ✅**
- Backend endpoints: 21/21 defined
- Components: 5/5 created and styled
- Ready for integration: ✅

**Next:** Start Stage 1 - Backend Review & Validation

# 🎮 One Piece Game - Quick Start Checklist

## Step 1: Environment Setup ✅
- [ ] Create `.env` file in project root
- [ ] Copy Supabase URL and Service Role Key from Supabase dashboard
- [ ] Create `.env` with these credentials:
```
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=any_secret_key_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Step 2: Database Setup ✅
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Create new query and paste contents of: `db/migrations/003_missing_tables.sql`
- [ ] Click "Run" button
- [ ] Wait for migration to complete (should add islands, routes, den den mushi table)

## Step 3: Backend Setup ✅
- [ ] Run `npm install` in project root
- [ ] Run `npm run dev` to start backend server
- [ ] You should see: "🏴‍☠️ One Piece Game Server running on http://0.0.0.0:3000"
- [ ] Test health check: `curl http://localhost:3000/api/health`

## Step 4: Frontend Setup ✅
- [ ] Open new terminal window
- [ ] Navigate to `src/frontend`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] You should see: "VITE v4.x.x ready in xxx ms"
- [ ] Frontend will be at `http://localhost:5173`

## Step 5: Test the Game ✅
- [ ] Open browser to `http://localhost:5173`
- [ ] Register a new player (any username)
- [ ] Verify you see:
  - ✅ "Player created successfully" message
  - ✅ Maps loads with islands
  - ✅ Your ship appears on the map
- [ ] Try to move your ship
- [ ] Try to claim a territory

## Troubleshooting

### Backend won't start
```
Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined
```
**Fix:** Make sure `.env` file has correct Supabase credentials

### Frontend shows blank page
**Fix:** Check browser console for errors, make sure backend is running

### No islands on map
**Fix:** Run migration (Step 2) to populate nodes/islands data

### Cannot move ships
**Fix:** Make sure map data is seeded (Step 2) and backend is running

### WebSocket connection refused
**Fix:** Backend must be running on same port (3000). Check with `curl http://localhost:3000/api/health`

## Advanced: Seed More Data (Optional)

To populate with more NPCs and creatures:
```bash
node scripts/seed_database.js
```

This adds:
- More islands with different regions
- NPCs and enemies
- Initial crew members
- Random encounters

## Manual Test Commands

### Check if server is running
```bash
curl http://localhost:3000/api/health
```

### Register a player
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"TestPlayer123"}'
```

Response should include: `player_id`, `token`, AND `ship_id` ✅

### Get map data
```bash
curl http://localhost:3000/api/map/state
```

Should return islands and routes

### Get territories
```bash
curl http://localhost:3000/api/game/territories
```

## Ports to Remember
- Backend: `3000`
- Frontend: `5173`
- Supabase: Via dashboard (no local port needed)

## 🚀 When Everything is Running

You should see:
1. ✅ Backend running on port 3000
2. ✅ Frontend running on port 5173
3. ✅ Leaflet map with islands showing
4. ✅ Your player and ship displayed
5. ✅ Ability to move between islands

If you see all of these, **Phase 1 is complete!** 🎉

---

## Next Phase (Phase 2) Coming Soon:
- Complete UI for all game mechanics
- Crew recruitment interface
- Combat turn-based system
- Territory governance UI
- Bounty leaderboard
- Alliance system
- Character generation


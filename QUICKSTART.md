# Quick Start Guide - One Piece Game (Phase 3)

**Get the game running in 5 minutes!**

---

## 📋 Prerequisites

- Node.js 16+ (`node --version`)
- npm 8+ (`npm --version`)
- Git (`git --version`)
- Supabase account (free tier works)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone & Install (1 min)

```bash
cd c:\Users\Aweh\Downloads\supreme\Onepieceworldmap

# Install backend dependencies
npm install

# Install frontend dependencies
cd src/frontend
npm install
cd ../..
```

### Step 2: Setup Database (1 min)

1. Go to https://app.supabase.com
2. Create new project (or use existing)
3. Go to SQL Editor
4. Copy-paste from `DATABASE_SETUP.md` Step 1 (Create Tables SQL)
5. Run the query
6. Repeat for Step 2 & 3 (Seed data)

**Or manually verify:**
```sql
SELECT COUNT(*) FROM nodes;  -- Should be >= 30
SELECT COUNT(*) FROM edges;  -- Should be >= 15
```

### Step 3: Configure Environment (1 min)

Create `.env` file in project root:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# API
REACT_APP_API_BASE=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
```

**Get keys from Supabase:**
- Settings → API
- Copy `URL` and `anon public key`
- Copy `Service Role Secret` (in same section)

### Step 4: Start Backend (1 min)

```bash
# Terminal 1
npm run dev

# You should see:
# Server running at http://localhost:3000
# WebSocket handler at /ws/:playerId
```

### Step 5: Start Frontend (1 min)

```bash
# Terminal 2
cd src/frontend
npm run dev

# You should see:
# Local: http://localhost:5173
# Network: available
```

### Step 6: Play! (Immediate)

1. Open **http://localhost:5173** in browser
2. Enter username → Click **Register**
3. ✅ You're in the game!

---

## 🎮 First Steps in Game

### Create Your Player
```
1. Username: "MyPirate" (any name)
2. Click Register
   → Auto-creates player + starter ship
   → Stores in Supabase
   → Redirects to game screen
```

### Explore the World
```
1. Left panel: See your player stats & ships
2. Center: Interactive Leaflet map with islands
3. Right panel: Navigation & Territory controls
4. Bottom: Messages & Crew roster
```

### Complete a Mission
```
1. Click a ship in left panel (highlights blue)
2. Right panel shows available routes
3. Click a route to move ship
4. Watch map marker move
5. Hull takes damage on hazardous routes
```

### Claim a Territory
```
1. Right panel: "Territory Governance"
2. Select governance mode:
   - 🏴 Protection Flag (neutral)
   - 👑 Tyranny (more revenue, rebellion risk)
   - 👤 Shadow Puppet (hidden)
3. Click "Claim Territory"
4. Territory appears on map + bounty increases
```

### Recruit Crew
```
1. Bottom panel: "Crew Roster"
2. Available crew list appears
3. Click recruit button
4. Crew member added
5. Your stats increase with crew bonuses!
```

### Fight Combat
```
1. On map, enemy ships appear as orange circles
2. Click combat button (if near enemy)
3. Combat modal appears
4. Select Haki type (Observation/Armament/Conqueror)
5. Click Attack/Defend/Flee
6. Combat log shows your moves
```

### Send Messages
```
1. Bottom left: "Notifications"
2. Click "Send Message"
3. Enter recipient player name
4. Type message
5. Send immediately
6. Other players see in real-time!
```

---

## 🧪 Automated Testing

```bash
# Test all API endpoints
node test-endpoints.js

# Or with custom server
node test-endpoints.js http://localhost:3000 myplayer
```

**Expected Output:**
```
✅ Server is running
✅ Register endpoint
✅ Login endpoint
✅ Map state endpoint
✅ Player state endpoint
✅ Move endpoint
✅ Territory claim endpoint
✅ Combat endpoint
✅ Crew recruitment endpoint
✅ Den Den Mushi endpoint
✅ WebSocket connection
```

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot GET /api/map/state"
```bash
# Fix: Backend not running
npm run dev  # Start backend on port 3000
```

### Issue: "Cannot connect to Supabase"
```bash
# Fix: Wrong URL/keys
1. Check VITE_SUPABASE_URL in .env
2. Copy URL from Supabase → Settings → API
3. Restart frontend (npm run dev)
```

### Issue: "Ship not created on register"
```bash
# Fix: Database migrations not run
1. Go to Supabase SQL Editor
2. Paste SQL from DATABASE_SETUP.md
3. Run create tables query
```

### Issue: "WebSocket connection failed"
```bash
# Fix: Wrong WS URL
# Check REACT_APP_WS_URL in .env
# Should be http://localhost:3000 → ws://localhost:3000
```

### Issue: Port already in use
```bash
# Kill process on port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

---

## 🎯 Features Quick Reference

| Feature | How to Access | Status |
|---------|--------------|--------|
| Register | Login screen | ✅ Working |
| Navigation | Right sidebar | ✅ Working |
| Combat | Map interaction | ✅ Working |
| Crew | Bottom panel | ✅ Working |
| Territory | Right sidebar | ✅ Working |
| Messages | Bottom panel | ✅ Working |
| Map | Center panel | ✅ Working |
| WebSocket | Auto-connected | ✅ Working |

---

## 📊 What to Test

### Authentication ✅
- [ ] Register new player
- [ ] Starter ship auto-created
- [ ] Token stored in localStorage
- [ ] Can login again with same username
- [ ] Logout clears session

### Map & Navigation ✅
- [ ] Map loads with nodes visible
- [ ] Can select ship
- [ ] Routes show available moves
- [ ] Can move to adjacent node
- [ ] Hull damage applied on hazardous routes

### Combat ✅
- [ ] Combat modal appears
- [ ] Can select Haki type
- [ ] Can Attack/Defend/Flee
- [ ] Combat log updates
- [ ] Combat resolves properly

### Crew Management ✅
- [ ] Crew roster shows available members
- [ ] Can recruit crew
- [ ] Player stats increase
- [ ] Crew loyalty displays

### Territory Control ✅
- [ ] Can claim territory
- [ ] Governance modes selectable
- [ ] Revenue tracked
- [ ] Multiple territories manageable
- [ ] Bounty updates

### Real-time ✅
- [ ] Open 2 browser windows
- [ ] Player A moves ship
- [ ] Player B sees update (no refresh)
- [ ] Messages appear in real-time

---

## 📈 Performance Tips

### For Smoother Gameplay
```bash
# 1. Close other apps using CPU/memory
# 2. Use modern browser (Chrome/Firefox)
# 3. Clear browser cache: Ctrl+Shift+Del
# 4. Check internet connection
# 5. Use wired connection if possible
```

### If Slow
```bash
# Backend optimization
npm run dev  # Has dev mode optimization

# Frontend optimization
# Check Network tab in DevTools (F12)
# Look for slow API calls
```

---

## 📱 Browser Support

| Browser | Status | Note |
|---------|--------|------|
| Chrome 90+ | ✅ Excellent | Recommended |
| Firefox 88+ | ✅ Excellent | Recommended |
| Safari 14+ | ✅ Good | Some WebSocket issues |
| Edge 90+ | ✅ Excellent | Based on Chrome |
| Mobile | ❌ Not supported | Phase 5 work |

---

## 🎮 Game Objectives

### Short Term (1-2 hours)
- [ ] Register and explore map
- [ ] Move ship to 5 different islands
- [ ] Claim your first territory
- [ ] Recruit 3 crew members
- [ ] Fight 1 combat battle

### Medium Term (1 week)
- [ ] Control 5 territories
- [ ] Reach bounty of 50M berries
- [ ] Recruit 10 crew members
- [ ] Win 10 combat battles
- [ ] Exchange 10 messages with other players

### Long Term (1 month)
- [ ] Control all regions
- [ ] Reach 1B bounty
- [ ] Full crew roster
- [ ] Discover Laugh Tale
- [ ] Become Pirate King!

---

## 💾 Saving Progress

Your progress is **automatically saved** in Supabase database:
- Player stats updated after each action
- Ship positions saved
- Territories persisted
- Messages stored
- Crew roster synced

**No manual save needed!**

---

## 🆘 Need Help?

### Check Documentation
- `DATABASE_SETUP.md` - Database configuration
- `PHASE3_INTEGRATION.md` - Integration guide
- `PROJECT_STATUS.md` - Project overview

### Debug Mode
```javascript
// In App.jsx, set DEBUG = true
// Check browser console (F12) for detailed logs
```

### Check Logs
```bash
# Backend logs (Terminal 1)
npm run dev  # Shows all requests

# Browser console (F12)
# Network tab shows API calls
# Console shows errors
```

---

## 🚀 Next Steps After Testing

1. **Report Issues**
   - Create GitHub issue
   - Include error message
   - Include steps to reproduce

2. **Suggest Features**
   - Check Phase 4 roadmap
   - Suggest improvements
   - Prioritize features

3. **Deploy**
   - Build frontend: `npm run build`
   - Deploy to Vercel
   - Deploy backend to Railway
   - Set up production database

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Clone & Install | 2 min |
| Database Setup | 2 min |
| Configure .env | 1 min |
| Start Backend | 1 min |
| Start Frontend | 1 min |
| **Total** | **~7 min** |

**Then Ready to Play!** 🎮

---

## 🎉 Congratulations!

You're now running the One Piece Game locally with:
- ✅ Full backend API
- ✅ Real-time WebSocket
- ✅ Professional UI
- ✅ Database persistence
- ✅ All core game systems

**Time to conquer the seas!** 🏴‍☠️

---

**Questions?** Check `PHASE3_INTEGRATION.md` troubleshooting section.

**Ready to code?** Start Phase 4 development!

**Want to help?** Fork the repo and submit PRs!


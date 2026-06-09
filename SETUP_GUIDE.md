# One Piece Game - Setup & Deployment Guide

## Phase 1: Database Setup

### Step 1: Environment Configuration

Create `.env` file in project root with your Supabase credentials:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Game Configuration
JWT_SECRET=your_jwt_secret_key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Game Constants
INACTIVITY_LIMIT_DAYS=14
CONGESTION_STATIC_HOURS=48
CONGESTION_SHIP_THRESHOLD=3
CONGESTION_SHIP_DAMAGE=200
BLUES_BOUNTY_THRESHOLD=100000000
BLUES_STATIC_MINUTES=60
BLUES_AGGRESSION_MULTIPLIER=5
```

### Step 2: Run Database Migrations

Supabase uses SQL migrations. Run the migration files in this order:

```bash
# 1. Base schema (already run or included in Supabase setup)
# supabase/migrations/001_schema.sql

# 2. Extended schema (Poneglyphs, Combat, etc.)
# supabase/migrations/002_extended_schema.sql

# 3. Missing tables and seed data
# supabase/migrations/003_missing_tables.sql
```

**To run migrations in Supabase:**
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste contents of `db/migrations/003_missing_tables.sql`
4. Click "Run" button

**OR** use Supabase CLI:
```bash
npm install -g supabase
supabase db push
```

### Step 3: Seed Initial Game Data (Optional but Recommended)

```bash
node scripts/seed_database.js
```

This populates:
- Islands/Nodes (East Blue, Grand Line, New World)
- Routes between islands
- Initial territories
- NPC characters

---

## Phase 2: Backend Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Backend Server

```bash
# Development mode (with nodemon)
npm run dev

# OR production mode
node src/server.js
```

Server will start on `http://localhost:3000`

---

## Phase 3: Frontend Setup

### Step 1: Configure Frontend Environment

Create `src/frontend/.env` file:

```bash
VITE_API_BASE=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Step 2: Start Frontend Development Server

```bash
cd src/frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## Quick Start Script

```bash
#!/bin/bash

# 1. Install dependencies
npm install
cd src/frontend && npm install && cd ../..

# 2. Set up environment
cp .env.example .env
# EDIT .env with your Supabase credentials

# 3. Run database migrations (via Supabase dashboard)
echo "Please run db/migrations/003_missing_tables.sql in Supabase dashboard"

# 4. Seed database (optional)
node scripts/seed_database.js

# 5. Start backend in background
npm run dev &

# 6. Start frontend
cd src/frontend && npm run dev
```

---

## Troubleshooting

### Issue: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined"
**Solution:** Check `.env` file has correct Supabase credentials

### Issue: "Cannot connect to database"
**Solution:** Verify Supabase project is running and migrations are applied

### Issue: "WebSocket connection failed"
**Solution:** Ensure backend server is running on correct port (3000)

### Issue: "Ships not appearing on map"
**Solution:** Run seed script to populate nodes and edges: `node scripts/seed_database.js`

### Issue: "Player created but no starter ship"
**Solution:** Fixed in latest server.js - new registrations now create starter ship automatically

---

## Testing Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Register Player
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer"}'
```

### Get Map State
```bash
curl http://localhost:3000/api/map/state
```

### Move Ship
```bash
curl -X POST http://localhost:3000/api/game/move \
  -H "Content-Type: application/json" \
  -d '{"playerId":"UUID","shipId":"UUID","targetNodeId":2}'
```

---

## Next Steps (Phase 2 Implementation)

1. ✅ Fix ship creation on registration
2. ✅ Fix database field names
3. ✅ Create missing tables migration
4. ⏳ **Migrate to PostgreSQL** (optional but recommended for production)
5. ⏳ Implement character generation system
6. ⏳ Complete frontend UI components
7. ⏳ Add combat mechanics UI
8. ⏳ Implement crew autonomy system
9. ⏳ Add territory governance UI
10. ⏳ Implement bounty leaderboard


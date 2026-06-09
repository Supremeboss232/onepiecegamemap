# Database Setup & Verification for Phase 3

## 📋 Prerequisites

Before running Phase 3 tests, ensure your database is properly configured and seeded.

---

## 🗄️ Database Architecture

### Current Setup
- **Primary:** Supabase (PostgreSQL)
- **Client:** supabaseClient.js (public/unauthenticated access)
- **Admin:** supabaseAdmin.js (service role - unrestricted access)

### Schema Overview

**Players Table**
```sql
- id (UUID, PK)
- username (VARCHAR)
- strength, intelligence, willpower (INT, default 100)
- stamina (INT, default 500)
- total_bounty (BIGINT, default 0)
- title (VARCHAR, default 'Pirate')
- created_at, updated_at (TIMESTAMP)
```

**Ships Table**
```sql
- id (UUID, PK)
- player_id (UUID, FK)
- node_id (INT, FK)
- hull (INT, default 1000) -- IMPORTANT: not hull_integrity
- crew_count (INT, default 0)
- coordinates_x, coordinates_y (INT)
- created_at, updated_at (TIMESTAMP)
```

**Nodes Table**
```sql
- id (INT, PK)
- name (VARCHAR)
- x, y (INT) -- Pixel coordinates
- region (VARCHAR)
- type (VARCHAR) -- 'village', 'city', 'island', etc.
- created_at (TIMESTAMP)
```

**Edges Table (Routes)**
```sql
- id (INT, PK)
- from_node_id (INT, FK)
- to_node_id (INT, FK)
- distance (INT) -- days
- hazard_level (INT) -- 1-9
- log_pose_requirement (INT)
- created_at (TIMESTAMP)
```

**Territories Table**
```sql
- id (UUID, PK)
- owner_id (UUID, FK)
- node_id (INT, FK)
- governance_tier (VARCHAR) -- 'Protection_Flag', 'Tyranny', 'Shadow_Puppet'
- revenue (INT, default 5000)
- rebellion_meter (INT, default 0)
- claimed_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

**Global Characters Table**
```sql
- id (UUID, PK)
- name (VARCHAR)
- tier (INT) -- 1-3
- base_strength, base_intelligence, base_willpower (INT)
- bounty_multiplier (FLOAT)
- has_devil_fruit (BOOLEAN)
- devil_fruit_name (VARCHAR)
- has_haki (BOOLEAN)
- haki_type (VARCHAR) -- 'Observation', 'Armament', 'Conqueror'
- created_at (TIMESTAMP)
```

**Den Den Mushi Messages Table**
```sql
- id (UUID, PK)
- sender_id (UUID, FK)
- recipient_id (UUID, FK)
- message (TEXT)
- is_intercepted (BOOLEAN, default false)
- created_at (TIMESTAMP)
```

---

## 🚀 Setup Steps

### Step 1: Create Tables (If Using Raw SQL)

Run this in your Supabase SQL editor:

```sql
-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR NOT NULL UNIQUE,
  strength INT DEFAULT 100,
  intelligence INT DEFAULT 100,
  willpower INT DEFAULT 100,
  stamina INT DEFAULT 500,
  total_bounty BIGINT DEFAULT 0,
  title VARCHAR DEFAULT 'Pirate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nodes
CREATE TABLE nodes (
  id INT PRIMARY KEY,
  name VARCHAR NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  region VARCHAR,
  type VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edges
CREATE TABLE edges (
  id INT PRIMARY KEY,
  from_node_id INT NOT NULL REFERENCES nodes(id),
  to_node_id INT NOT NULL REFERENCES nodes(id),
  distance INT,
  hazard_level INT DEFAULT 0,
  log_pose_requirement INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ships
CREATE TABLE ships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  node_id INT NOT NULL REFERENCES nodes(id),
  hull INT DEFAULT 1000,
  crew_count INT DEFAULT 0,
  coordinates_x INT,
  coordinates_y INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Territories
CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  node_id INT NOT NULL REFERENCES nodes(id),
  governance_tier VARCHAR DEFAULT 'Protection_Flag',
  revenue INT DEFAULT 5000,
  rebellion_meter INT DEFAULT 0,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global Characters
CREATE TABLE global_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  tier INT DEFAULT 1,
  base_strength INT DEFAULT 100,
  base_intelligence INT DEFAULT 100,
  base_willpower INT DEFAULT 100,
  bounty_multiplier FLOAT DEFAULT 1.0,
  has_devil_fruit BOOLEAN DEFAULT FALSE,
  devil_fruit_name VARCHAR,
  has_haki BOOLEAN DEFAULT FALSE,
  haki_type VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Den Den Mushi Messages
CREATE TABLE den_den_mushi_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES players(id),
  recipient_id UUID REFERENCES players(id),
  message TEXT,
  is_intercepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ships_player_id ON ships(player_id);
CREATE INDEX idx_ships_node_id ON ships(node_id);
CREATE INDEX idx_territories_owner_id ON territories(owner_id);
CREATE INDEX idx_territories_node_id ON territories(node_id);
CREATE INDEX idx_den_den_mushi_sender ON den_den_mushi_channels(sender_id);
CREATE INDEX idx_den_den_mushi_recipient ON den_den_mushi_channels(recipient_id);
```

### Step 2: Seed Nodes (Island Data)

```sql
-- One Piece World Islands (30+)
INSERT INTO nodes (id, name, x, y, region, type) VALUES
-- East Blue
(1, 'Shells Town', 100, 100, 'East Blue', 'town'),
(2, 'Syrup Village', 150, 120, 'East Blue', 'village'),
(3, 'Baratie', 200, 100, 'East Blue', 'special'),
(4, 'Koshiro''s Village', 180, 80, 'East Blue', 'village'),
(5, 'Sea Restaurant Ship', 220, 110, 'East Blue', 'ship'),

-- Paradise
(10, 'Jaya', 400, 300, 'Paradise', 'island'),
(11, 'Alabasta', 450, 350, 'Paradise', 'kingdom'),
(12, 'Whiskey Peak', 420, 320, 'Paradise', 'town'),
(13, 'Little Garden', 480, 340, 'Paradise', 'island'),
(14, 'Drum Island', 500, 380, 'Paradise', 'island'),
(15, 'Rogue Town', 550, 300, 'Paradise', 'town'),

-- Grand Line
(20, 'Sabaody Archipelago', 600, 450, 'Grand Line', 'archipelago'),
(21, 'Amazon Lily', 650, 400, 'Grand Line', 'island'),
(22, 'Impel Down', 700, 480, 'Grand Line', 'fortress'),
(23, 'Marineford', 750, 500, 'Grand Line', 'navy_base'),

-- New World
(30, 'Wano', 800, 600, 'New World', 'kingdom'),
(31, 'Punk Hazard', 850, 620, 'New World', 'island'),
(32, 'Dressrosa', 900, 580, 'New World', 'kingdom'),
(33, 'Zou', 800, 700, 'New World', 'island'),
(34, 'Whole Cake Island', 950, 650, 'New World', 'island'),

-- Unknown/Hidden
(99, 'Laugh Tale', 2000, 2000, 'New World', 'hidden');
```

### Step 3: Seed Edges (Routes)

```sql
-- East Blue Routes
INSERT INTO edges (id, from_node_id, to_node_id, distance, hazard_level, log_pose_requirement) VALUES
(1, 1, 2, 1, 1, 0),
(2, 2, 3, 3, 2, 0),
(3, 3, 4, 2, 1, 0),
(4, 4, 5, 4, 2, 0),

-- To Paradise
(10, 5, 10, 10, 5, 0),
(11, 10, 11, 7, 4, 0),
(12, 11, 12, 3, 2, 0),
(13, 12, 13, 8, 5, 0),
(14, 13, 14, 6, 3, 0),
(15, 14, 15, 9, 6, 1),

-- To Grand Line
(20, 15, 20, 15, 7, 1),
(21, 20, 21, 5, 3, 1),
(22, 21, 22, 8, 6, 1),
(23, 22, 23, 7, 7, 2),

-- New World
(30, 23, 30, 20, 9, 2),
(31, 30, 31, 5, 8, 2),
(32, 31, 32, 6, 8, 2),
(33, 32, 33, 12, 8, 2),
(34, 33, 34, 8, 7, 2),

-- To Laugh Tale (final destination)
(99, 34, 99, 50, 9, 3);
```

### Step 4: Seed Global Characters

```sql
-- Tier 1 (Weak) Characters
INSERT INTO global_characters (name, tier, base_strength, base_intelligence, base_willpower, bounty_multiplier, has_devil_fruit, has_haki) VALUES
('Coby', 1, 80, 85, 90, 0.5, FALSE, FALSE),
('Helmeppo', 1, 75, 70, 60, 0.4, FALSE, FALSE),
('Kuro', 1, 120, 100, 95, 1.0, FALSE, FALSE),

-- Tier 2 (Strong) Characters with Devil Fruits
('Monkey D. Luffy', 2, 180, 120, 200, 10.0, TRUE, 'Gomu Gomu no Mi'),
('Roronoa Zoro', 2, 220, 100, 150, 8.0, FALSE, TRUE),
('Nami', 2, 100, 180, 130, 6.0, FALSE, FALSE),
('Usopp', 2, 110, 150, 140, 5.0, FALSE, FALSE),
('Sanji', 2, 200, 130, 120, 7.0, FALSE, FALSE),

-- Tier 3 (Legendary) Characters with Conqueror Haki
('Shanks', 3, 250, 180, 250, 50.0, FALSE, 'Conqueror'),
('Mihawk', 3, 280, 150, 200, 40.0, FALSE, FALSE),
('Big Mom', 3, 300, 200, 220, 60.0, TRUE, 'Conqueror'),
('Kaido', 3, 320, 180, 250, 70.0, FALSE, 'Conqueror');
```

---

## ✅ Verification Checklist

### In Supabase Dashboard

- [ ] Go to `SQL Editor`
- [ ] Run: `SELECT COUNT(*) FROM players;` → Should be ≥ 0
- [ ] Run: `SELECT COUNT(*) FROM nodes;` → Should be ≥ 30
- [ ] Run: `SELECT COUNT(*) FROM edges;` → Should be ≥ 15
- [ ] Run: `SELECT COUNT(*) FROM global_characters;` → Should be ≥ 10

### Schema Verification

```sql
-- Check table structure
\d players
\d ships
\d nodes
\d territories

-- Check sample data
SELECT name FROM nodes LIMIT 5;
SELECT * FROM edges WHERE from_node_id = 1;
SELECT name, tier FROM global_characters;
```

### During Phase 3 Testing

After running tests, verify:

```bash
# 1. Check if player was created
SELECT username, strength FROM players WHERE username = 'test_*';

# 2. Check if ship was created
SELECT hull, node_id FROM ships WHERE player_id = (SELECT id FROM players LIMIT 1);

# 3. Check if territory was claimed
SELECT governance_tier FROM territories WHERE owner_id = (SELECT id FROM players LIMIT 1);

# 4. Check if messages sent
SELECT COUNT(*) FROM den_den_mushi_channels;
```

---

## 🔧 Common Issues

### Issue 1: "column 'hull_integrity' does not exist"
**Cause:** Schema uses `hull_integrity` instead of `hull`
**Fix:** Migrate column name:
```sql
ALTER TABLE ships RENAME COLUMN hull_integrity TO hull;
```

### Issue 2: "player not found"
**Cause:** Player table empty or not seeded
**Fix:** Insert test player:
```sql
INSERT INTO players (username) VALUES ('test_player');
```

### Issue 3: "node does not exist"
**Cause:** Nodes table empty
**Fix:** Run seed SQL from Step 2 above

### Issue 4: "relation 'ships' does not exist"
**Cause:** Tables not created
**Fix:** Run full setup SQL from Step 1

---

## 📊 Final Schema Diagram

```
┌─────────────┐
│  players    │
├─────────────┤
│ id (PK)     │
│ username    │
│ strength    │
│ stamina     │
│ bounty      │
└──────┬──────┘
       │
       │ has many
       ↓
┌─────────────┐         ┌──────────────┐
│   ships     │◄────────┤   nodes      │
├─────────────┤         ├──────────────┤
│ id (PK)     │         │ id (PK)      │
│ player_id ──┼─────────► id           │
│ node_id ────┼─────────► name         │
│ hull        │         │ x, y coords  │
│ crew_count  │         │ region       │
└─────────────┘         └──────────────┘
       
       │ routes via edges
       ↓
┌──────────────┐
│    edges     │
├──────────────┤
│ from_node_id │
│ to_node_id   │
│ distance     │
│ hazard_level │
└──────────────┘

┌──────────────────┐
│  territories     │
├──────────────────┤
│ owner_id ────────┼───► players
│ node_id ─────────┼───► nodes
│ governance_tier  │
│ revenue          │
└──────────────────┘
```

---

## 🚀 Migration from Development to Production

### Backup Current Database

```sql
-- In Supabase Dashboard → SQL
-- Export tables as SQL:
SELECT * FROM players;
SELECT * FROM nodes;
SELECT * FROM territories;
```

### Production Setup

1. Create new Supabase project
2. Run all SQL from Steps 1-3 above
3. Update `.env` with new project URL and anon key
4. Test with `test-endpoints.js`
5. Deploy backend to production
6. Deploy frontend to production

---

## 📝 Environment Variables

Ensure these are set in your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Admin access (backend only)
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# API Configuration
REACT_APP_API_BASE=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000

# Production
PROD_API_BASE=https://api.yourdomain.com
PROD_WS_URL=wss://api.yourdomain.com
```

---

## ✨ Ready for Phase 3!

Once all steps are complete:

1. ✅ Run backend: `npm run dev`
2. ✅ Run frontend: `cd src/frontend && npm run dev`
3. ✅ Run tests: `node test-endpoints.js`
4. ✅ Check console for errors
5. ✅ Play the game!


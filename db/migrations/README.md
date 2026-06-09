# Database Migrations - One Piece World Map Game

## ⚠️ IMPORTANT: Use Only `000_complete_unified_schema.sql`

**Do NOT run the individual migration files:**
- ❌ `001_schema.sql` 
- ❌ `002_extended_schema.sql`
- ❌ `004_week34_systems.sql`
- ❌ `005_davy_back_fight.sql`

**Instead, run only:**
- ✅ `000_complete_unified_schema.sql`

This consolidated file contains all tables, indexes, constraints, and seed data from all four previous migrations combined into one complete schema.

---

## Setup Instructions

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click **SQL Editor** tab
3. Click **New Query**
4. Copy the entire contents of `000_complete_unified_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** button
7. Wait for success confirmation

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: PostgreSQL Client
```bash
psql -h <your-host> -U <your-user> -d <your-database> < db/migrations/000_complete_unified_schema.sql
```

---

## What's Included

| Component | Tables | Notes |
|-----------|--------|-------|
| **Core World** | players, nodes, node_edges, node_congestion, ships, crew_members, events, territories | Game map, navigation, territory control |
| **Characters** | global_characters | Unique NPCs with Devil Fruits, Haki, alignment |
| **Alliances** | alliances, alliance_members, alliance_wars | Political structures, cooperative play |
| **Poneglyphs** | poneglyphs, player_poneglyphs, laugh_tale_paths | Ancient knowledge discovery system |
| **Vivre Cards** | vivre_cards | Player tracking mechanic |
| **Leaderboards** | player_rankings | Bounty, territories, crew tracking |
| **Combat** | combat_sessions, haki_pools | Battle system and Haki progression |
| **Communication** | den_den_mushi_channels, global_broadcasts | Message system |
| **Tournament** | tournament_results | Davy Back Fight results |
| **Inventory** | ship_inventory | Resource storage |

**Total:**
- 27 tables
- 20+ indexes for performance
- Foreign key constraints with CASCADE/SET NULL rules
- Seed data for 9 Poneglyphs (adjust node_ids as needed)

---

## Migration History (Reference Only)

| File | Status | Notes |
|------|--------|-------|
| 001_schema.sql | ⚠️ DEPRECATED | Core world tables - merged into 000 |
| 002_extended_schema.sql | ⚠️ DEPRECATED | Characters, alliances, bounties - merged into 000 |
| 004_week34_systems.sql | ⚠️ DEPRECATED | Poneglyphs, Vivre cards, rankings - merged into 000 |
| 005_davy_back_fight.sql | ⚠️ DEPRECATED | Tournament results - merged into 000 |
| **000_complete_unified_schema.sql** | ✅ **ACTIVE** | **USE THIS ONE - Contains all tables** |

---

## Key Features

✅ **Standardized Schema:** All tables use UUID primary keys (except legacy fields)
✅ **Complete Relationships:** All foreign keys with proper CASCADE rules
✅ **Performance:** 20+ indexes on frequently-queried columns
✅ **Seed Data:** 9 Poneglyphs pre-populated (node IDs auto-detected)
✅ **No Duplicates:** Running once creates all tables without conflicts

---

## Post-Setup Verification

After running the migration, verify the schema:

```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check poneglyphs seeded
SELECT COUNT(*) FROM poneglyphs;  -- Should show 9

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

---

## Troubleshooting

**Error: "Table already exists"**
- This means the schema was already deployed. You only need to run this once.
- Safe to ignore if all tables are present.

**Error: "Foreign key violation on seed data"**
- The Poneglyph seed data tries to find nodes by name. If your nodes table is empty or uses different names, comment out the seed data section and populate it manually later.

**Missing indexes**
- All indexes will be created automatically. If some are missing, re-run the migration.

---

## To Add New Migrations Going Forward

If you need to add new features or tables:

1. Create a new file: `003_feature_name.sql` (or next available number)
2. Add only the NEW tables/columns/indexes needed
3. **Do NOT re-run 000_complete_unified_schema.sql** (it uses `IF NOT EXISTS`)
4. New migrations should NOT duplicate existing tables from 000

Example:
```sql
-- 003_new_feature.sql
CREATE TABLE IF NOT EXISTS new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ...
);

CREATE INDEX IF NOT EXISTS idx_new_feature_player ON new_feature_table(player_id);
```

---

**Last Updated:** 2026-06-09
**Schema Version:** 1.0 (Complete - All 4 phases)

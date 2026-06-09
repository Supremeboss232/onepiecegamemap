-- Extended schema for complete One Piece Interactive Web-Map Game
-- Builds on 001_schema.sql with global character registry, bounty engine, territories, alliances, combat

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CORE PLAYER & CREW MANAGEMENT
-- ============================================================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES players(id);
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_bounty BIGINT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS hidden_threat_value BIGINT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS willpower INT DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS intelligence INT DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS strength INT DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS stamina INT DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Pirate'; -- 'Shichibukai', 'Yonko', etc.
ALTER TABLE players ADD COLUMN IF NOT EXISTS underworld_trust INT DEFAULT 100;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_frozen_bounty BOOLEAN DEFAULT false;

-- ============================================================================
-- GLOBAL CHARACTER REGISTRY (Singleton Pattern)
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  character_class TEXT, -- 'Navigator', 'Shipwright', 'Doctor', 'Warrior', 'Scholar'
  current_owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  current_status TEXT DEFAULT 'Free_Agent', -- 'Free_Agent', 'Active_Crew', 'Captured_Marines', 'Dead'
  current_node_id UUID REFERENCES nodes(id),
  origin_node_id UUID REFERENCES nodes(id),
  loyalty_score INT DEFAULT 100 CHECK (loyalty_score BETWEEN 0 AND 100),
  alignment TEXT DEFAULT 'Neutral', -- 'Justice', 'Chaotic', 'Neutral'
  base_str INT DEFAULT 50,
  base_int INT DEFAULT 50,
  base_will INT DEFAULT 50,
  can_read_ancient_script BOOLEAN DEFAULT false,
  has_devil_fruit BOOLEAN DEFAULT false,
  devil_fruit_type TEXT, -- 'Paramecia', 'Zoan', 'Logia'
  devil_fruit_name TEXT,
  is_captured_marines BOOLEAN DEFAULT false,
  captured_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_global_characters_owner ON global_characters(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_global_characters_status ON global_characters(current_status);

-- ============================================================================
-- TERRITORIES & GOVERNANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  node_id UUID NOT NULL UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
  governance_tier TEXT DEFAULT 'Protection_Flag', -- 'Protection_Flag', 'Direct_Tyranny', 'Shadow_Puppet'
  control_strength INT DEFAULT 1,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revenue_generated BIGINT DEFAULT 0,
  rebellion_meter INT DEFAULT 0,
  info_cost_per_cycle INT DEFAULT 0,
  is_under_siege BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_territories_owner ON territories(owner_id);
CREATE INDEX IF NOT EXISTS idx_territories_node ON territories(node_id);

-- ============================================================================
-- ALLIANCES & POLITICAL STRUCTURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  crew_2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  alliance_type TEXT DEFAULT 'Cooperative', -- 'Cooperative', 'Hierarchical', 'Sworn_Brothers'
  betrayal_executed_by UUID REFERENCES players(id),
  betrayal_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(crew_1_id, crew_2_id)
);

CREATE TABLE IF NOT EXISTS shichibukai_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE REFERENCES players(id) ON DELETE SET NULL,
  seat_position INT UNIQUE CHECK (seat_position BETWEEN 1 AND 7),
  tribute_percentage INT DEFAULT 25,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS yonko_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE REFERENCES players(id) ON DELETE SET NULL,
  grand_fleet_size INT DEFAULT 0,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- PONEGLYPHS & ANCIENT KNOWLEDGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS poneglyphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID UNIQUE NOT NULL REFERENCES nodes(id),
  ancient_text TEXT NOT NULL,
  discovered_by UUID REFERENCES players(id),
  discovered_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS player_poneglyph_rubbings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  poneglyph_id UUID NOT NULL REFERENCES poneglyphs(id),
  rubbing_data TEXT,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, poneglyph_id)
);

CREATE TABLE IF NOT EXISTS laugh_tale_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  required_poneglyphs_count INT DEFAULT 4,
  discovered_poneglyphs_count INT DEFAULT 0,
  path_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- COMBAT & HAKI SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS combat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  defender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attacker_haki_type TEXT, -- 'Observation', 'Armament', 'Conqueror'
  defender_haki_type TEXT,
  combat_turn INT DEFAULT 0,
  attacker_stamina INT DEFAULT 100,
  defender_stamina INT DEFAULT 100,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  winner_id UUID REFERENCES players(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS haki_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  observation_haki_level INT DEFAULT 0,
  armament_haki_level INT DEFAULT 0,
  conqueror_haki_level INT DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- BOUNTY ENGINE & THREAT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS bounty_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  modifier_type TEXT NOT NULL, -- 'Political_Target', 'Taboo_Action', 'Collateral_Harm'
  modifier_value INT NOT NULL,
  reason TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- DEN DEN MUSHI COMMUNICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS den_den_mushi_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  message TEXT,
  is_intercepted BOOLEAN DEFAULT false,
  intercepted_by UUID REFERENCES players(id),
  channel_encryption_level INT DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_type TEXT NOT NULL, -- 'Buster_Call', 'News', 'Alert'
  content TEXT,
  origin_node_id UUID REFERENCES nodes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- INVENTORY & RESOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ship_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id UUID UNIQUE REFERENCES ships(id) ON DELETE CASCADE,
  berries BIGINT DEFAULT 0,
  raw_materials INT DEFAULT 0,
  upgrade_components INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS devil_fruits_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  fruit_type TEXT NOT NULL, -- 'Paramecia', 'Zoan', 'Logia'
  ability_description TEXT,
  current_owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  current_status TEXT DEFAULT 'Unclaimed', -- 'Unclaimed', 'Owned', 'Digested'
  location_node_id UUID REFERENCES nodes(id)
);

-- ============================================================================
-- INVASION & THREAT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS invasion_countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_node_id UUID UNIQUE REFERENCES nodes(id),
  attacking_force_type TEXT, -- 'Admiral_Fleet', 'Buster_Call', 'Emperor_Fleet'
  defender_player_id UUID REFERENCES players(id),
  countdown_ends_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'resolved'
  player_choice TEXT, -- 'Stand_Fight', 'Cut_Run', 'Scatter_Abandon'
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_players_bounty ON players(total_bounty DESC);
CREATE INDEX IF NOT EXISTS idx_players_title ON players(title);
CREATE INDEX IF NOT EXISTS idx_territories_owner_node ON territories(owner_id, node_id);
CREATE INDEX IF NOT EXISTS idx_shichibukai_position ON shichibukai_seats(seat_position);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_active ON combat_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bounty_modifiers_player ON bounty_modifiers(player_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_type ON global_broadcasts(broadcast_type);

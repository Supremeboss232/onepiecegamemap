-- ============================================================================
-- COMPLETE UNIFIED DATABASE SCHEMA
-- One Piece Interactive World Map Game - All Systems Combined
-- Run this ONCE instead of running 001, 002, 004, 005 separately
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CORE GAME WORLD TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  bounty BIGINT DEFAULT 0,
  total_bounty BIGINT DEFAULT 0,
  crew_id UUID REFERENCES players(id),
  hidden_threat_value BIGINT DEFAULT 0,
  willpower INT DEFAULT 100,
  intelligence INT DEFAULT 100,
  strength INT DEFAULT 100,
  stamina INT DEFAULT 100,
  title TEXT DEFAULT 'Pirate',
  underworld_trust INT DEFAULT 100,
  is_frozen_bounty BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  last_action TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  region TEXT,
  type TEXT DEFAULT 'sea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS node_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  distance INT DEFAULT 1,
  requires_log_pose BOOLEAN DEFAULT true,
  hazard_level INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_node_id, to_node_id)
);

CREATE TABLE IF NOT EXISTS node_congestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ship_count INT DEFAULT 0,
  static_ship_count INT DEFAULT 0,
  congestion_level INT GENERATED ALWAYS AS (
    LEAST(100, GREATEST(0, ship_count * 10 + static_ship_count * 20))
  ) STORED,
  anomaly_active BOOLEAN DEFAULT false,
  anomaly_type TEXT,
  anomaly_started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  node_id UUID REFERENCES nodes(id),
  last_moved_at TIMESTAMP WITH TIME ZONE,
  hull INTEGER DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  is_unique BOOLEAN DEFAULT false,
  origin_island_id UUID REFERENCES nodes(id),
  status TEXT DEFAULT 'owned',
  loyalty INTEGER DEFAULT 100,
  released_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- GLOBAL CHARACTER REGISTRY (Singleton Pattern)
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  character_class TEXT,
  current_owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  current_status TEXT DEFAULT 'Free_Agent',
  current_node_id UUID REFERENCES nodes(id),
  origin_node_id UUID REFERENCES nodes(id),
  loyalty_score INT DEFAULT 100 CHECK (loyalty_score BETWEEN 0 AND 100),
  alignment TEXT DEFAULT 'Neutral',
  base_str INT DEFAULT 50,
  base_int INT DEFAULT 50,
  base_will INT DEFAULT 50,
  can_read_ancient_script BOOLEAN DEFAULT false,
  has_devil_fruit BOOLEAN DEFAULT false,
  devil_fruit_type TEXT,
  devil_fruit_name TEXT,
  is_captured_marines BOOLEAN DEFAULT false,
  captured_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TERRITORIES & GOVERNANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  node_id UUID NOT NULL UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
  governance_tier TEXT DEFAULT 'Protection_Flag',
  control_strength INT DEFAULT 1,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revenue_generated BIGINT DEFAULT 0,
  rebellion_meter INT DEFAULT 0,
  info_cost_per_cycle INT DEFAULT 0,
  is_under_siege BOOLEAN DEFAULT false
);

-- ============================================================================
-- ALLIANCES & POLITICAL STRUCTURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  leader_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  treasury INT DEFAULT 0,
  member_count INT DEFAULT 1,
  total_bounty BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS alliance_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'Member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alliance_id, player_id)
);

CREATE TABLE IF NOT EXISTS alliance_wars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_1_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  alliance_2_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  alliance_1_victories INT DEFAULT 0,
  alliance_2_victories INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ongoing'
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
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  node_id UUID NOT NULL REFERENCES nodes(id),
  ancient_text TEXT,
  lore TEXT,
  discovered_count INT DEFAULT 0,
  discovered_by UUID REFERENCES players(id),
  discovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_poneglyphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  poneglyph_id UUID NOT NULL REFERENCES poneglyphs(id) ON DELETE CASCADE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_discovery_attempt TIMESTAMP WITH TIME ZONE,
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
-- VIVRE CARDS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS vivre_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  condition INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, target_player_id)
);

-- ============================================================================
-- LEADERBOARD & RANKING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  rank INT,
  total_bounty BIGINT DEFAULT 0,
  territories_owned INT DEFAULT 0,
  crew_size INT DEFAULT 0,
  alliance_id UUID REFERENCES alliances(id),
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  poneglyphs_found INT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMBAT & HAKI SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS combat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  defender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attacker_haki_type TEXT,
  defender_haki_type TEXT,
  combat_turn INT DEFAULT 0,
  attacker_stamina INT DEFAULT 100,
  defender_stamina INT DEFAULT 100,
  status TEXT DEFAULT 'active',
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
  modifier_type TEXT NOT NULL,
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
  channel_encryption_level INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_type TEXT NOT NULL,
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
  supplies INT DEFAULT 100,
  weapons INT DEFAULT 50,
  treasure JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- DAVY BACK FIGHT TOURNAMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  games_completed INT DEFAULT 0,
  total_bounty INT DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Player Indexes
CREATE INDEX IF NOT EXISTS idx_players_last_action ON players(last_action);
CREATE INDEX IF NOT EXISTS idx_players_bounty ON players(total_bounty DESC);

-- Ship Indexes
CREATE INDEX IF NOT EXISTS idx_ships_node ON ships(node_id);
CREATE INDEX IF NOT EXISTS idx_ships_player ON ships(player_id);

-- Character Indexes
CREATE INDEX IF NOT EXISTS idx_global_characters_owner ON global_characters(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_global_characters_status ON global_characters(current_status);
CREATE INDEX IF NOT EXISTS idx_global_characters_node ON global_characters(current_node_id);

-- Territory Indexes
CREATE INDEX IF NOT EXISTS idx_territories_owner ON territories(owner_id);
CREATE INDEX IF NOT EXISTS idx_territories_node ON territories(node_id);

-- Alliance Indexes
CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance ON alliance_members(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_player ON alliance_members(player_id);
CREATE INDEX IF NOT EXISTS idx_alliance_wars_status ON alliance_wars(status);
CREATE INDEX IF NOT EXISTS idx_alliances_leader ON alliances(leader_id);

-- Poneglyph Indexes
CREATE INDEX IF NOT EXISTS idx_poneglyphs_node ON poneglyphs(node_id);
CREATE INDEX IF NOT EXISTS idx_player_poneglyphs_player ON player_poneglyphs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_poneglyphs_poneglyph ON player_poneglyphs(poneglyph_id);

-- Vivre Card Indexes
CREATE INDEX IF NOT EXISTS idx_vivre_cards_owner ON vivre_cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_vivre_cards_target ON vivre_cards(target_player_id);

-- Ranking Indexes
CREATE INDEX IF NOT EXISTS idx_player_rankings_bounty ON player_rankings(total_bounty DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_alliance ON player_rankings(alliance_id);

-- Tournament Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_results_player ON tournament_results(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_date ON tournament_results(completed_at DESC);

-- Communication Indexes
CREATE INDEX IF NOT EXISTS idx_den_den_sender ON den_den_mushi_channels(sender_id);
CREATE INDEX IF NOT EXISTS idx_den_den_receiver ON den_den_mushi_channels(receiver_id);

-- ============================================================================
-- SEED DATA: PONEGLYPHS
-- ============================================================================

-- Note: Node IDs must exist in your nodes table. Adjust node_id values as needed.
-- These are placeholder IDs - update them based on your actual node structure.

INSERT INTO poneglyphs (name, location, node_id, description, lore) VALUES
  ('Alabasta Poneglyph', 'Tomb in Alabasta', (SELECT id FROM nodes WHERE name = 'Alabasta' LIMIT 1), 'Ancient history stone', 'Holds secrets of the Void Century'),
  ('Jaya Poneglyph', 'Shandora Sky Island', (SELECT id FROM nodes WHERE name = 'Jaya' LIMIT 1), 'Sky island relic', 'Records of lost civilization'),
  ('Water 7 Poneglyph', 'Underground Ruins', (SELECT id FROM nodes WHERE name = 'Water 7' LIMIT 1), 'City beneath the city', 'Warning of ancient weapons'),
  ('Sabaody Poneglyph', 'Sabaody Archipelago', (SELECT id FROM nodes WHERE name = 'Sabaody' LIMIT 1), 'Mangrove forest artifact', 'Dangerous knowledge'),
  ('Amazon Lily Poneglyph', 'Amazon Lily', (SELECT id FROM nodes WHERE name = 'Amazon Lily' LIMIT 1), 'Isle of women', 'Ancient warrior records'),
  ('Impel Down Poneglyph', 'Impel Down Prison', (SELECT id FROM nodes WHERE name = 'Impel Down' LIMIT 1), 'Lowest security level', 'Government secrets'),
  ('Marineford Poneglyph', 'Marineford Base', (SELECT id FROM nodes WHERE name = 'Marineford' LIMIT 1), 'Marine headquarters', 'Hidden in plain sight'),
  ('Wano Poneglyph', 'Wano Country', (SELECT id FROM nodes WHERE name = 'Wano' LIMIT 1), 'Samurai homeland', 'Weapons of the world'),
  ('Laugh Tale Poneglyph', 'Laugh Tale', (SELECT id FROM nodes WHERE name = 'Laugh Tale' LIMIT 1), 'Final island', 'True history revealed')
ON CONFLICT (name) DO NOTHING;

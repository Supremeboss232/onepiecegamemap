-- Basic schema for game world safeguards
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  bounty BIGINT DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  is_unique BOOLEAN DEFAULT false,
  origin_island_id UUID REFERENCES nodes(id),
  status TEXT DEFAULT 'owned', -- 'owned','Free_Agent'
  loyalty INTEGER DEFAULT 100,
  released_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  node_id UUID REFERENCES nodes(id),
  last_moved_at TIMESTAMP WITH TIME ZONE,
  hull INTEGER DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  node_id UUID REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_last_action ON players(last_action);
CREATE INDEX IF NOT EXISTS idx_ships_node ON ships(node_id);

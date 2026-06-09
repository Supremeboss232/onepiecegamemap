-- Migration: Add Poneglyph Discovery System
-- Enables players to discover poneglyphs across the world
-- 9 poneglyphs total, 5+ needed to unlock Laugh Tale

CREATE TABLE IF NOT EXISTS poneglyphs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  node_id BIGINT NOT NULL,
  lore TEXT,
  discovered_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS player_poneglyphs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL,
  poneglyph_id BIGINT NOT NULL,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_discovery_attempt TIMESTAMP WITH TIME ZONE,
  UNIQUE(player_id, poneglyph_id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (poneglyph_id) REFERENCES poneglyphs(id)
);

-- Seed poneglyphs (9 total across One Piece world)
INSERT INTO poneglyphs (name, location, node_id, description, lore) VALUES
  ('Alabasta Poneglyph', 'Tomb in Alabasta', 5, 'Ancient history stone', 'Holds secrets of the Void Century'),
  ('Jaya Poneglyph', 'Shandora Sky Island', 7, 'Sky island relic', 'Records of lost civilization'),
  ('Water 7 Poneglyph', 'Underground Ruins', 8, 'City beneath the city', 'Warning of ancient weapons'),
  ('Sabaody Poneglyph', 'Sabaody Archipelago', 9, 'Mangrove forest artifact', 'Dangerous knowledge'),
  ('Amazon Lily Poneglyph', 'Amazon Lily', 11, 'Isle of women', 'Ancient warrior records'),
  ('Impel Down Poneglyph', 'Impel Down Prison', 13, 'Lowest security level', 'Government secrets'),
  ('Marineford Poneglyph', 'Marineford Base', 15, 'Marine headquarters', 'Hidden in plain sight'),
  ('Wano Poneglyph', 'Wano Country', 17, 'Samurai homeland', 'Weapons of the world'),
  ('Laugh Tale Poneglyph', 'Laugh Tale', 30, 'Final island', 'True history revealed')
ON CONFLICT (name) DO NOTHING;

-- Vivre Card System
CREATE TABLE IF NOT EXISTS vivre_cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_id BIGINT NOT NULL,
  target_player_id BIGINT NOT NULL,
  condition INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, target_player_id),
  FOREIGN KEY (owner_id) REFERENCES players(id),
  FOREIGN KEY (target_player_id) REFERENCES players(id)
);

-- Alliance System
CREATE TABLE IF NOT EXISTS alliances (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE,
  leader_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  treasury INT DEFAULT 0,
  member_count INT DEFAULT 1,
  total_bounty BIGINT DEFAULT 0,
  FOREIGN KEY (leader_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS alliance_members (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  alliance_id BIGINT NOT NULL,
  player_id BIGINT NOT NULL,
  role VARCHAR(50) DEFAULT 'Member', -- Leader, Vice-Commander, Commander, Member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alliance_id, player_id),
  FOREIGN KEY (alliance_id) REFERENCES alliances(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS alliance_wars (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  alliance_1_id BIGINT NOT NULL,
  alliance_2_id BIGINT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  alliance_1_victories INT DEFAULT 0,
  alliance_2_victories INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ongoing', -- ongoing, won, lost
  FOREIGN KEY (alliance_1_id) REFERENCES alliances(id),
  FOREIGN KEY (alliance_2_id) REFERENCES alliances(id)
);

-- Leaderboard/Ranking System
CREATE TABLE IF NOT EXISTS player_rankings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL UNIQUE,
  rank INT,
  total_bounty BIGINT DEFAULT 0,
  territories_owned INT DEFAULT 0,
  crew_size INT DEFAULT 0,
  alliance_id BIGINT,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  poneglyphs_found INT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (alliance_id) REFERENCES alliances(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poneglyphs_node ON poneglyphs(node_id);
CREATE INDEX IF NOT EXISTS idx_player_poneglyphs_player ON player_poneglyphs(player_id);
CREATE INDEX IF NOT EXISTS idx_vivre_cards_owner ON vivre_cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance ON alliance_members(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_player ON alliance_members(player_id);
CREATE INDEX IF NOT EXISTS idx_alliance_wars_status ON alliance_wars(status);
CREATE INDEX IF NOT EXISTS idx_player_rankings_bounty ON player_rankings(total_bounty DESC);

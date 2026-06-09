-- Missing tables and schema fixes for One Piece Interactive Map Game

-- ============================================================================
-- FIX: Add missing columns to ships table
-- ============================================================================
ALTER TABLE ships ADD COLUMN IF NOT EXISTS coordinates_x INTEGER DEFAULT 0;
ALTER TABLE ships ADD COLUMN IF NOT EXISTS coordinates_y INTEGER DEFAULT 0;

-- ============================================================================
-- CREATE: den_den_mushi_channels table (for messaging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS den_den_mushi_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_intercepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_den_den_sender ON den_den_mushi_channels(sender_id);
CREATE INDEX IF NOT EXISTS idx_den_den_receiver ON den_den_mushi_channels(receiver_id);

-- ============================================================================
-- CREATE: Seed initial islands/nodes (One Piece World Geography)
-- ============================================================================
INSERT INTO nodes (name, region, type, x_pos, y_pos) VALUES
-- East Blue Starting Islands
('Shells Town', 'East Blue', 'town', 100, 100),
('Orange Town', 'East Blue', 'town', 150, 120),
('Syrup Village', 'East Blue', 'village', 200, 140),
('Shells Town Naval Base', 'East Blue', 'marine_base', 120, 110),
('Gosa Village', 'East Blue', 'village', 180, 160),
('Shimotsuki Village', 'East Blue', 'village', 250, 180),
('Nami\'s Tangerine Grove', 'East Blue', 'island', 300, 200),
('Baratie (Floating Restaurant)', 'East Blue', 'island', 350, 220),
('Koshiro\'s Dojo', 'East Blue', 'dojo', 320, 190),
('Arlong Territory (Cocoyashi)', 'East Blue', 'island', 280, 250),

-- Grand Line Paradise (1st Half)
('Reverse Mountain', 'Grand Line', 'gateway', 500, 300),
('Whiskey Peak', 'Grand Line', 'town', 550, 350),
('Little Garden', 'Grand Line', 'island', 600, 400),
('Drum Island', 'Grand Line', 'island', 650, 420),
('Alabasta (Alubarna)', 'Grand Line', 'kingdom', 700, 500),
('Jaya Island', 'Grand Line', 'island', 750, 480),
('Skypea', 'Grand Line', 'island', 800, 520),
('Mock Town', 'Grand Line', 'town', 760, 500),
('Sabaody Archipelago', 'Grand Line', 'archipelago', 850, 550),
('Amazon Lily', 'Grand Line', 'island', 900, 580),
('Impel Down', 'Grand Line', 'prison', 920, 600),

-- New World (2nd Half)
('Marineford', 'New World', 'marine_base', 950, 700),
('Dressrosa', 'Grand Line', 'kingdom', 1000, 650),
('Zou', 'New World', 'island', 1100, 750),
('Wano Country', 'New World', 'kingdom', 1200, 800),
('Egghead Island', 'New World', 'research_island', 1250, 850),
('Elbaf', 'New World', 'giant_island', 1300, 900),
('Laugh Tale (Raftel)', 'New World', 'legend', 1500, 1000)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CREATE: Initial node edges (routes between islands)
-- ============================================================================
INSERT INTO node_edges (from_node_id, to_node_id, distance, requires_log_pose, hazard_level, description) VALUES
-- East Blue connections
(1, 2, 1, FALSE, 0, 'Shells Town to Orange Town'),
(2, 3, 1, FALSE, 0, 'Orange Town to Syrup Village'),
(3, 5, 2, FALSE, 1, 'Syrup Village to Gosa Village'),
(5, 6, 1, FALSE, 0, 'Gosa Village to Shimotsuki Village'),
(6, 7, 2, FALSE, 0, 'Shimotsuki to Nami\'s Grove'),
(7, 8, 2, FALSE, 1, 'Nami\'s Grove to Baratie'),
(8, 10, 3, FALSE, 2, 'Baratie to Arlong Territory'),
(8, 11, 5, TRUE, 3, 'Baratie to Reverse Mountain - Gateway to Grand Line'),

-- Grand Line Paradise routes
(11, 12, 2, TRUE, 2, 'Reverse Mountain to Whiskey Peak'),
(12, 13, 3, TRUE, 3, 'Whiskey Peak to Little Garden'),
(13, 14, 3, TRUE, 3, 'Little Garden to Drum Island'),
(14, 15, 4, TRUE, 4, 'Drum Island to Alabasta'),
(15, 16, 4, TRUE, 3, 'Alabasta to Jaya Island'),
(16, 17, 5, TRUE, 4, 'Jaya Island to Skypea'),
(17, 18, 2, TRUE, 2, 'Skypea to Mock Town'),
(18, 19, 5, TRUE, 5, 'Mock Town to Sabaody Archipelago'),
(19, 20, 6, TRUE, 4, 'Sabaody to Amazon Lily'),
(20, 21, 3, TRUE, 5, 'Amazon Lily to Impel Down'),
(19, 22, 8, TRUE, 6, 'Sabaody to Marineford - Major Military Installation'),

-- New World connections
(22, 23, 6, TRUE, 5, 'Marineford to Dressrosa'),
(23, 24, 8, TRUE, 6, 'Dressrosa to Zou'),
(24, 25, 10, TRUE, 7, 'Zou to Wano Country'),
(25, 26, 8, TRUE, 6, 'Wano to Egghead Island'),
(26, 27, 12, TRUE, 8, 'Egghead to Elbaf'),
(27, 28, 20, TRUE, 9, 'Elbaf to Laugh Tale - The Final Destination')
ON CONFLICT (from_node_id, to_node_id) DO NOTHING;

-- ============================================================================
-- CREATE: Global character seed (NPC pirates and allies)
-- ============================================================================
-- Note: These are sample unique characters. In production, procedural generation will create most characters.
-- Canon characters like Mihawk, Kuma, etc. can be added here

-- ============================================================================
-- CREATE: Initial Devil Fruit registry
-- ============================================================================
-- Canon Devil Fruits will be seeded here
-- Speculative fruits are generated on-demand by the game engine

-- ============================================================================
-- INDEXES: Add performance indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nodes(region);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_ships_player_node ON ships(player_id, node_id);

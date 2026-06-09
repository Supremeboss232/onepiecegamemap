-- Migration: Add Davy Back Fight Tournament Results
-- Tracks tournament results and player performance

CREATE TABLE IF NOT EXISTS tournament_results (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL,
  games_completed INT DEFAULT 0,
  total_bounty INT DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tournament_results_player ON tournament_results(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_date ON tournament_results(completed_at DESC);

-- Run this if you're getting errors when placing bets
-- This ensures the bets table exists with the correct structure

CREATE TABLE IF NOT EXISTS bets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL,
  selected_team TEXT,
  amount REAL NOT NULL,
  odds REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  outcome TEXT,
  potential_win REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_create_bets" ON bets;
DROP POLICY IF EXISTS "allow_read_own_bets" ON bets;

-- Users can create their own bets
CREATE POLICY "allow_create_bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own bets
CREATE POLICY "allow_read_own_bets" ON bets
  FOR SELECT USING (auth.uid() = user_id);

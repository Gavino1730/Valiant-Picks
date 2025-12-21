DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS prop_bets CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL DEFAULT 1000,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  record_wins INT DEFAULT 0,
  record_losses INT DEFAULT 0,
  ranking INT,
  coach_name TEXT,
  coach_email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  number INT,
  name TEXT NOT NULL,
  position TEXT,
  height TEXT,
  weight INT,
  grade TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_stats (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id BIGINT,
  points INT DEFAULT 0,
  rebounds INT DEFAULT 0,
  assists INT DEFAULT 0,
  steals INT DEFAULT 0,
  blocks INT DEFAULT 0,
  field_goals_made INT DEFAULT 0,
  field_goals_attempted INT DEFAULT 0,
  three_pointers_made INT DEFAULT 0,
  three_pointers_attempted INT DEFAULT 0,
  free_throws_made INT DEFAULT 0,
  free_throws_attempted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT,
  game_date TEXT NOT NULL,
  game_time TEXT,
  location TEXT,
  status TEXT DEFAULT 'upcoming',
  result TEXT,
  home_score INT,
  away_score INT,
  type TEXT,
  winning_odds REAL,
  losing_odds REAL,
  spread REAL,
  spread_odds REAL,
  over_under REAL,
  over_odds REAL,
  under_odds REAL,
  notes TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prop_bets (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  team_type TEXT DEFAULT 'General',
  yes_odds REAL NOT NULL,
  no_odds REAL NOT NULL,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  outcome TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) for security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "allow_registration" ON users;
DROP POLICY IF EXISTS "allow_read_own_user" ON users;
DROP POLICY IF EXISTS "allow_read_teams" ON teams;
DROP POLICY IF EXISTS "allow_insert_teams" ON teams;
DROP POLICY IF EXISTS "allow_read_players" ON players;
DROP POLICY IF EXISTS "allow_insert_players" ON players;
DROP POLICY IF EXISTS "allow_read_player_stats" ON player_stats;
DROP POLICY IF EXISTS "allow_insert_player_stats" ON player_stats;
DROP POLICY IF EXISTS "allow_read_games" ON games;
DROP POLICY IF EXISTS "allow_insert_games" ON games;
DROP POLICY IF EXISTS "allow_create_bets" ON bets;
DROP POLICY IF EXISTS "allow_read_own_bets" ON bets;
DROP POLICY IF EXISTS "allow_read_own_transactions" ON transactions;
DROP POLICY IF EXISTS "allow_read_prop_bets" ON prop_bets;
DROP POLICY IF EXISTS "allow_insert_prop_bets" ON prop_bets;

-- Simple policies without recursion
-- Users table: Allow anyone to insert (register), users can read own data
CREATE POLICY "allow_registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_read_own_user" ON users
  FOR SELECT USING (auth.uid() = id);

-- Teams table: Public read, anyone can insert
CREATE POLICY "allow_read_teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_teams" ON teams
  FOR INSERT WITH CHECK (true);

-- Players table: Public read, anyone can insert
CREATE POLICY "allow_read_players" ON players
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_players" ON players
  FOR INSERT WITH CHECK (true);

-- Player stats table: Public read, anyone can insert
CREATE POLICY "allow_read_player_stats" ON player_stats
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_player_stats" ON player_stats
  FOR INSERT WITH CHECK (true);

-- Games table: Public read, anyone can insert
CREATE POLICY "allow_read_games" ON games
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_games" ON games
  FOR INSERT WITH CHECK (true);

-- Bets table: Users can create/read own
CREATE POLICY "allow_create_bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_read_own_bets" ON bets
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions table: Users can read own
CREATE POLICY "allow_read_own_transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Prop bets table: Public read, anyone can insert
CREATE POLICY "allow_read_prop_bets" ON prop_bets
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_prop_bets" ON prop_bets
  FOR INSERT WITH CHECK (true);
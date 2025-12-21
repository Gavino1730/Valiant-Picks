-- ============================================
-- COMPLETE FRESH START - Run this to set up everything from scratch
-- ============================================

-- Drop all existing tables (if any)
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS prop_bets CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE ALL TABLES
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL DEFAULT 1000,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  record_wins INT DEFAULT 0,
  record_losses INT DEFAULT 0,
  league_record TEXT,
  ranking INT,
  coach_name TEXT,
  coach_email TEXT,
  coach_bio TEXT,
  schedule JSON,
  players JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE players (
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

CREATE TABLE player_stats (
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

CREATE TABLE games (
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

CREATE TABLE bets (
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

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prop_bets (
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

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES (Backend handles auth)
-- ============================================

-- Users: Allow registration and reading all (for leaderboard)
CREATE POLICY "allow_registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_read_all_users" ON users
  FOR SELECT USING (true);

-- Teams: Allow all operations (backend validates)
CREATE POLICY "allow_all_teams" ON teams
  FOR ALL USING (true) WITH CHECK (true);

-- Players: Allow all operations
CREATE POLICY "allow_all_players" ON players
  FOR ALL USING (true) WITH CHECK (true);

-- Player stats: Allow all operations
CREATE POLICY "allow_all_player_stats" ON player_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Games: Allow all operations (backend validates)
CREATE POLICY "allow_all_games" ON games
  FOR ALL USING (true) WITH CHECK (true);

-- Bets: Allow all operations (backend validates)
CREATE POLICY "allow_all_bets" ON bets
  FOR ALL USING (true) WITH CHECK (true);

-- Transactions: Allow all operations (backend validates)
CREATE POLICY "allow_all_transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Admin logs: Allow all operations
CREATE POLICY "allow_all_admin_logs" ON admin_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Prop bets: Allow all operations
CREATE POLICY "allow_all_prop_bets" ON prop_bets
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Step 1: Register on website with username 'admin' and password 'Boyaca1730!'
-- Step 2: Run this SQL:

-- UPDATE users 
-- SET is_admin = true, balance = 10000
-- WHERE username = 'admin';

-- ============================================
-- DONE! Database is ready to use.
-- ============================================

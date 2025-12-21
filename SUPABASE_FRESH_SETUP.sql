-- ============================================
-- COMPLETE SUPABASE SETUP FROM SCRATCH
-- Run this in Supabase SQL Editor (blank database)
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 1000.00,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Boys' or 'Girls'
  description TEXT,
  record_wins INTEGER DEFAULT 0,
  record_losses INTEGER DEFAULT 0,
  league_record TEXT,
  ranking TEXT,
  coach_name TEXT,
  coach_email TEXT,
  coach_bio TEXT,
  schedule JSONB, -- JSON array of games
  players JSONB, -- JSON array of player objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  team_type TEXT NOT NULL, -- 'Boys' or 'Girls'
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date DATE NOT NULL,
  game_time TIME,
  location TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  result TEXT, -- 'win', 'loss', or NULL
  home_score INTEGER,
  away_score INTEGER,
  type TEXT DEFAULT 'game',
  winning_odds DECIMAL(4, 2) DEFAULT 1.00,
  losing_odds DECIMAL(4, 2) DEFAULT 1.00,
  spread DECIMAL(4, 1),
  spread_odds DECIMAL(4, 2),
  over_under DECIMAL(4, 1),
  over_odds DECIMAL(4, 2),
  under_odds DECIMAL(4, 2),
  notes TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL, -- 'low', 'medium', 'high'
  selected_team TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  odds DECIMAL(4, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
  outcome TEXT, -- 'won', 'lost', or NULL
  potential_win DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prop Bets table
CREATE TABLE IF NOT EXISTS prop_bets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  team_type TEXT, -- 'Boys', 'Girls', or NULL for general
  yes_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  no_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  expires_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'resolved'
  outcome TEXT, -- 'yes', 'no', or NULL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'bet', 'win', 'adjustment'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bet_placed', 'bet_won', 'bet_lost'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_games_visible ON games(is_visible);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES (Allow All - Backend Validates)
-- ============================================

-- Users policies
CREATE POLICY "allow_read_all_users" ON users
  FOR SELECT USING (true);

CREATE POLICY "allow_registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_users" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

-- Teams policies
CREATE POLICY "allow_all_teams" ON teams
  FOR ALL USING (true) WITH CHECK (true);

-- Games policies
CREATE POLICY "allow_all_games" ON games
  FOR ALL USING (true) WITH CHECK (true);

-- Bets policies
CREATE POLICY "allow_all_bets" ON bets
  FOR ALL USING (true) WITH CHECK (true);

-- Prop Bets policies
CREATE POLICY "allow_all_prop_bets" ON prop_bets
  FOR ALL USING (true) WITH CHECK (true);

-- Transactions policies
CREATE POLICY "allow_all_transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Notifications policies
CREATE POLICY "allow_all_notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. SEED TEAMS DATA
-- ============================================

-- Insert Boys Team
INSERT INTO teams (name, type, description, record_wins, record_losses, league_record, ranking, coach_name, coach_email, coach_bio, schedule, players)
VALUES (
  'Valiant Boys Basketball',
  'Boys',
  'Competitive boys basketball team representing Valiant Academy',
  0, 0,
  '0-0',
  'Unranked',
  'Coach Smith',
  'coach.smith@valiantacademy.org',
  'Experienced basketball coach with 10+ years of coaching at the high school level.',
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert Girls Team
INSERT INTO teams (name, type, description, record_wins, record_losses, league_record, ranking, coach_name, coach_email, coach_bio, schedule, players)
VALUES (
  'Valiant Girls Basketball',
  'Girls',
  'Competitive girls basketball team representing Valiant Academy',
  0, 0,
  '0-0',
  'Unranked',
  'Coach Johnson',
  'coach.johnson@valiantacademy.org',
  'Dedicated coach focused on developing player skills and team chemistry.',
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================

-- Next Steps:
-- 1. Register your admin account through the website
-- 2. Run this query to make that user an admin:
--    UPDATE users SET is_admin = true WHERE username = 'your_username';
-- 3. Log in and start adding games!

SELECT 'Database setup complete! ✅' AS status;

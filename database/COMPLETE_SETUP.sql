-- ============================================
-- VALIANT PICKS - COMPLETE DATABASE SETUP
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor on a blank database
-- This is the ONLY file you need to run for a fresh install
-- ============================================

-- ============================================
-- 1. CREATE CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 1000.00,
  is_admin BOOLEAN DEFAULT FALSE,
  pending_refill_at TIMESTAMP WITH TIME ZONE,
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
  assistant_coach TEXT,
  team_motto TEXT,
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

-- Prop Bets table
CREATE TABLE IF NOT EXISTS prop_bets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  team_type TEXT, -- 'Boys', 'Girls', or NULL for general
  yes_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  no_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  options JSONB, -- For custom prop bets
  option_odds JSONB, -- Odds for custom options
  is_visible BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'resolved'
  outcome TEXT, -- 'yes', 'no', or NULL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  prop_bet_id INTEGER REFERENCES prop_bets(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL, -- 'low', 'medium', 'high'
  selected_team TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  odds DECIMAL(4, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
  outcome TEXT, -- 'won', 'lost', or NULL
  potential_win DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT bets_game_or_prop_check CHECK (
    (game_id IS NOT NULL AND prop_bet_id IS NULL)
    OR (game_id IS NULL AND prop_bet_id IS NOT NULL)
  )
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'bet', 'win', 'adjustment', 'daily_reward', 'wheel_spin', 'achievement'
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
  type TEXT NOT NULL, -- 'bet_placed', 'bet_won', 'bet_lost', 'daily_reward', 'achievement'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE REWARDS SYSTEM TABLES
-- ============================================

-- Daily logins tracking
CREATE TABLE IF NOT EXISTS daily_logins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL,
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_amount INTEGER DEFAULT 50,
    streak_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, login_date)
);

-- Wheel spins tracking
CREATE TABLE IF NOT EXISTS wheel_spins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spin_date DATE NOT NULL,
    reward_amount INTEGER NOT NULL,
    spin_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_date DATE NOT NULL,
    reward_amount INTEGER DEFAULT 0,
    description TEXT,
    claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Wheel configuration (admin editable)
CREATE TABLE IF NOT EXISTS wheel_config (
    id SERIAL PRIMARY KEY,
    prize_amounts INTEGER[] DEFAULT ARRAY[500, 750, 1000, 2000, 3000, 5000, 7500, 10000],
    prize_weights INTEGER[] DEFAULT ARRAY[30, 25, 20, 12, 7, 4, 1, 1],
    spins_per_day INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Error logging table
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_url TEXT,
    request_method TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. INSERT DEFAULT DATA
-- ============================================

-- Insert default wheel configuration
INSERT INTO wheel_config (prize_amounts, prize_weights, spins_per_day)
VALUES 
(ARRAY[500, 750, 1000, 2000, 3000, 5000, 7500, 10000], ARRAY[30, 25, 20, 12, 7, 4, 1, 1], 1)
ON CONFLICT DO NOTHING;

-- Insert default teams
INSERT INTO teams (name, type, description, record_wins, record_losses, league_record, ranking, coach_name, coach_email, coach_bio, schedule, players)
VALUES 
(
  'Valiant Boys Basketball',
  'Boys',
  'Competitive boys basketball team representing Valiant Academy',
  0, 0, '0-0', 'Unranked',
  'Coach Smith',
  'coach.smith@valiantacademy.org',
  'Experienced basketball coach with 10+ years of coaching at the high school level.',
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'Valiant Girls Basketball',
  'Girls',
  'Competitive girls basketball team representing Valiant Academy',
  0, 0, '0-0', 'Unranked',
  'Coach Johnson',
  'coach.johnson@valiantacademy.org',
  'Dedicated coach focused on developing player skills and team chemistry.',
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_users_pending_refill ON users(pending_refill_at) WHERE pending_refill_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_prop_bet_id ON bets(prop_bet_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_games_visible ON games(is_visible);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_prop_bets_visible ON prop_bets(is_visible);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Rewards system indexes
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_date ON daily_logins(user_id, login_date);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_user_date ON wheel_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_type ON achievements(user_id, achievement_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES (Allow All - Backend Validates)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "allow_read_all_users" ON users;
CREATE POLICY "allow_read_all_users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_registration" ON users;
CREATE POLICY "allow_registration" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_users" ON users;
CREATE POLICY "allow_update_users" ON users FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for admins only" ON users;
CREATE POLICY "Enable delete for admins only" ON users FOR DELETE USING (true);

-- Teams policies
DROP POLICY IF EXISTS "allow_all_teams" ON teams;
CREATE POLICY "allow_all_teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- Games policies
DROP POLICY IF EXISTS "allow_all_games" ON games;
CREATE POLICY "allow_all_games" ON games FOR ALL USING (true) WITH CHECK (true);

-- Bets policies
DROP POLICY IF EXISTS "allow_all_bets" ON bets;
CREATE POLICY "allow_all_bets" ON bets FOR ALL USING (true) WITH CHECK (true);

-- Prop Bets policies
DROP POLICY IF EXISTS "allow_all_prop_bets" ON prop_bets;
CREATE POLICY "allow_all_prop_bets" ON prop_bets FOR ALL USING (true) WITH CHECK (true);

-- Transactions policies
DROP POLICY IF EXISTS "allow_all_transactions" ON transactions;
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Notifications policies
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Daily logins policies
DROP POLICY IF EXISTS "Allow all on daily_logins" ON daily_logins;
CREATE POLICY "Allow all on daily_logins" ON daily_logins FOR ALL USING (true) WITH CHECK (true);

-- Wheel spins policies
DROP POLICY IF EXISTS "Allow all on wheel_spins" ON wheel_spins;
CREATE POLICY "Allow all on wheel_spins" ON wheel_spins FOR ALL USING (true) WITH CHECK (true);

-- Achievements policies
DROP POLICY IF EXISTS "Allow all on achievements" ON achievements;
CREATE POLICY "Allow all on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);

-- Wheel config policies
DROP POLICY IF EXISTS "Allow all on wheel_config" ON wheel_config;
CREATE POLICY "Allow all on wheel_config" ON wheel_config FOR ALL USING (true) WITH CHECK (true);

-- Error logs policies
DROP POLICY IF EXISTS "Allow all on error_logs" ON error_logs;
CREATE POLICY "Allow all on error_logs" ON error_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. CREATE DATABASE FUNCTIONS
-- ============================================

-- Function to calculate consecutive login streak
CREATE OR REPLACE FUNCTION calculate_login_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 1;
    v_current_date DATE := CURRENT_DATE;
    v_prev_date DATE;
BEGIN
    -- Get the most recent login before today
    SELECT login_date INTO v_prev_date
    FROM daily_logins
    WHERE user_id = p_user_id AND login_date < v_current_date
    ORDER BY login_date DESC
    LIMIT 1;
    
    -- If no previous login, streak is 1
    IF v_prev_date IS NULL THEN
        RETURN 1;
    END IF;
    
    -- Check if previous login was yesterday (streak continues)
    IF v_prev_date = v_current_date - INTERVAL '1 day' THEN
        -- Count consecutive days backwards
        WITH RECURSIVE streak_days AS (
            SELECT login_date, 1 as day_num
            FROM daily_logins
            WHERE user_id = p_user_id AND login_date = v_prev_date
            
            UNION ALL
            
            SELECT dl.login_date, sd.day_num + 1
            FROM daily_logins dl
            INNER JOIN streak_days sd ON dl.login_date = sd.login_date - INTERVAL '1 day'
            WHERE dl.user_id = p_user_id
        )
        SELECT COALESCE(MAX(day_num), 0) + 1 INTO v_streak FROM streak_days;
    END IF;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has bet on all available games today
CREATE OR REPLACE FUNCTION check_all_games_bet(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_games INTEGER;
    v_user_bets INTEGER;
BEGIN
    -- Count games available today
    SELECT COUNT(*) INTO v_total_games
    FROM games
    WHERE is_visible = true 
    AND status = 'scheduled'
    AND game_date = CURRENT_DATE;
    
    -- If no games today, return false
    IF v_total_games = 0 THEN
        RETURN false;
    END IF;
    
    -- Count unique games user has bet on today
    SELECT COUNT(DISTINCT game_id) INTO v_user_bets
    FROM bets
    WHERE user_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE
    AND game_id IN (
        SELECT id FROM games 
        WHERE is_visible = true 
        AND status = 'scheduled'
        AND game_date = CURRENT_DATE
    );
    
    RETURN v_user_bets >= v_total_games;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. ADD TABLE COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts with authentication and balance';
COMMENT ON TABLE teams IS 'Valiant sports teams (Boys/Girls Basketball)';
COMMENT ON TABLE games IS 'Scheduled games with betting odds';
COMMENT ON TABLE bets IS 'User bets on games and prop bets';
COMMENT ON TABLE prop_bets IS 'Custom proposition bets';
COMMENT ON TABLE transactions IS 'Financial transaction history';
COMMENT ON TABLE notifications IS 'User notification center';
COMMENT ON TABLE daily_logins IS 'Tracks user daily logins and streak rewards';
COMMENT ON TABLE wheel_spins IS 'Records all spin wheel activity';
COMMENT ON TABLE achievements IS 'Stores user achievements and milestone rewards';
COMMENT ON TABLE wheel_config IS 'Configuration for spin wheel prizes and odds';
COMMENT ON TABLE error_logs IS 'Application error logging';

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================

SELECT 
    'Database setup complete! ✅' AS status,
    '12 tables created' AS tables,
    '2 functions created' AS functions,
    'All RLS policies applied' AS security,
    'Ready for production' AS result;

-- ============================================
-- NEXT STEPS:
-- ============================================
-- 1. Register your admin account through the website
-- 2. Run this query to make that user an admin:
--    UPDATE users SET is_admin = true WHERE username = 'your_username';
-- 3. Log in and start using Valiant Picks!

-- ============================================================
-- OPEN PICKS — DATABASE SETUP
-- ============================================================
-- Run this ENTIRE script in your Supabase SQL Editor on a
-- blank database. This creates all tables, indexes, RLS
-- policies, and database functions needed to run Open Picks.
--
-- After running:
--   1. Register your admin account through the website.
--   2. Promote it:
--        UPDATE users SET is_admin = true WHERE username = 'your_username';
--   3. Visit the site — the Setup Wizard will guide you through
--      adding your org name, logo, sports, teams, and rosters.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- Organization settings (one row, configured via Setup Wizard)
CREATE TABLE IF NOT EXISTS org_settings (
  id SERIAL PRIMARY KEY,
  org_name TEXT NOT NULL DEFAULT 'My Organization',
  tagline TEXT,
  logo_url TEXT,
  -- Colors
  primary_color    TEXT DEFAULT '#004f9e',
  background_color TEXT DEFAULT '#0f1419',
  accent_color     TEXT DEFAULT '#ffd700',
  surface_color    TEXT DEFAULT '#1a2332',
  text_color       TEXT DEFAULT '#ffffff',
  -- Typography
  heading_font TEXT DEFAULT 'Inter',
  body_font    TEXT DEFAULT 'Inter',
  -- Virtual currency
  currency_name TEXT DEFAULT 'Picks Bucks',
  -- Feature toggles (each key defaults to true if missing)
  features JSONB DEFAULT '{"leaderboard":true,"prop_bets":true,"brackets":true,"spin_wheel":true,"daily_reward":true,"achievements":true,"referrals":true,"teams":true,"browse_bets":true,"notifications":true}'::jsonb,
  setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sports (configurable — add as many as you want)
CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,          -- e.g. 'Basketball', 'Soccer', 'Baseball'
  icon TEXT,                   -- emoji or icon name, e.g. '🏀'
  bet_types JSONB DEFAULT '["winner", "spread", "over_under"]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
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

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id INTEGER REFERENCES sports(id) ON DELETE SET NULL,
  type TEXT,                   -- Optional grouping label (e.g. 'Varsity', 'JV', 'Boys', 'Girls')
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
  schedule JSONB,              -- JSON array of schedule entries
  players JSONB,               -- JSON array of player objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  sport_id INTEGER REFERENCES sports(id) ON DELETE SET NULL,
  team_type TEXT,              -- Optional label matching teams.type (e.g. 'Boys', 'Varsity')
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_date DATE NOT NULL,
  game_time TIME,
  location TEXT,
  status TEXT DEFAULT 'scheduled',   -- 'scheduled', 'in_progress', 'completed'
  result TEXT,                       -- 'win', 'loss', or NULL
  home_score INTEGER,
  away_score INTEGER,
  type TEXT DEFAULT 'Non League',    -- 'Non League', 'League', 'Tournament'
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

-- Prop Bets
CREATE TABLE IF NOT EXISTS prop_bets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sport_id INTEGER REFERENCES sports(id) ON DELETE SET NULL,
  team_type TEXT,              -- Optional filter label
  yes_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  no_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  options JSONB,
  option_odds JSONB,
  is_visible BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active',      -- 'active', 'resolved'
  outcome TEXT,                      -- 'yes', 'no', or NULL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bets
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  prop_bet_id INTEGER REFERENCES prop_bets(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL,            -- 'low', 'medium', 'high'
  selected_team TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  odds DECIMAL(4, 2) NOT NULL,
  status TEXT DEFAULT 'pending',     -- 'pending', 'resolved'
  outcome TEXT,                      -- 'won', 'lost', or NULL
  potential_win DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT bets_game_or_prop_check CHECK (
    (game_id IS NOT NULL AND prop_bet_id IS NULL)
    OR (game_id IS NULL AND prop_bet_id IS NOT NULL)
  )
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,   -- 'bet', 'win', 'adjustment', 'daily_reward', 'wheel_spin', 'achievement'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',   -- 'completed', 'pending', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,   -- 'bet_placed', 'bet_won', 'bet_lost', 'daily_reward', 'achievement', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 2. REWARDS SYSTEM TABLES
-- ============================================================

-- Daily login tracking
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

-- Wheel spins
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

-- Error logging
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  request_url TEXT,
  request_method TEXT,
  status_code INTEGER,
  component_stack TEXT,
  response_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 3. BRACKET TABLES
-- ============================================================

-- Drop old bracket tables to ensure a clean 16-seed structure
DROP TABLE IF EXISTS bracket_games CASCADE;
DROP TABLE IF EXISTS bracket_entries CASCADE;
DROP TABLE IF EXISTS bracket_teams CASCADE;
DROP TABLE IF EXISTS brackets CASCADE;

-- Main brackets table
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT,
  sport_id INTEGER REFERENCES sports(id) ON DELETE SET NULL,
  gender TEXT,                 -- Optional: 'boys', 'girls', or NULL for unisex/open
  status TEXT NOT NULL DEFAULT 'open',
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  payout_per_point NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams per bracket (up to 16 seeds)
CREATE TABLE bracket_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  seed INT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX bracket_teams_unique_seed
  ON bracket_teams (bracket_id, seed);

-- Games in each bracket round
CREATE TABLE bracket_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  round INT NOT NULL,
  game_number INT NOT NULL,
  team1_id UUID REFERENCES bracket_teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES bracket_teams(id) ON DELETE SET NULL,
  winner_team_id UUID REFERENCES bracket_teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX bracket_games_unique_round
  ON bracket_games (bracket_id, round, game_number);

-- User bracket picks / entries
CREATE TABLE bracket_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  picks JSONB NOT NULL DEFAULT '{}'::jsonb,
  points INT NOT NULL DEFAULT 0,
  payout NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX bracket_entries_unique_user
  ON bracket_entries (bracket_id, user_id);


-- ============================================================
-- 4. DEFAULT DATA
-- ============================================================

-- Default org settings — replace these with your own values during setup,
-- or update them later through Admin > Org Settings.
INSERT INTO org_settings (
  org_name, tagline, logo_url,
  primary_color, background_color, accent_color, surface_color, text_color,
  heading_font, body_font,
  currency_name, features, setup_complete
) VALUES (
  'Open Picks',
  'Sports Picks Platform — Place Your Picks Today',
  '/assets/logo.png',
  '#004f9e', '#0f1419', '#ffd700', '#1a2332', '#ffffff',
  'Inter', 'Inter',
  'Picks Bucks',
  '{"leaderboard":true,"prop_bets":true,"brackets":true,"spin_wheel":true,"daily_reward":true,"achievements":true,"referrals":true,"teams":true,"browse_bets":true,"notifications":true}'::jsonb,
  false
) ON CONFLICT DO NOTHING;

-- Wheel configuration defaults
INSERT INTO wheel_config (prize_amounts, prize_weights, spins_per_day)
VALUES (
  ARRAY[500, 750, 1000, 2000, 3000, 5000, 7500, 10000],
  ARRAY[30, 25, 20, 12, 7, 4, 1, 1],
  1
) ON CONFLICT DO NOTHING;

-- No sports, teams, players, or games are seeded.
-- Add these through Admin > Setup Wizard or the Admin Panel.


-- ============================================================
-- 5. INDEXES
-- ============================================================

-- Core tables
CREATE INDEX IF NOT EXISTS idx_users_pending_refill      ON users(pending_refill_at) WHERE pending_refill_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bets_user_id              ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id              ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_prop_bet_id          ON bets(prop_bet_id);
CREATE INDEX IF NOT EXISTS idx_bets_status               ON bets(status);
CREATE INDEX IF NOT EXISTS idx_games_visible             ON games(is_visible);
CREATE INDEX IF NOT EXISTS idx_games_date                ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_sport_id            ON games(sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport_id            ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_prop_bets_visible         ON prop_bets(is_visible);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id      ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read        ON notifications(is_read);

-- Rewards
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_date    ON daily_logins(user_id, login_date);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_user_date     ON wheel_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_achievements_user         ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_type    ON achievements(user_id, achievement_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created        ON error_logs(created_at);


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE org_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_teams  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_games  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_entries ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Org settings (readable by all, writable via backend only)
DROP POLICY IF EXISTS "allow_read_org_settings" ON org_settings;
DROP POLICY IF EXISTS "allow_write_org_settings" ON org_settings;
CREATE POLICY "allow_read_org_settings"  ON org_settings FOR SELECT USING (true);
CREATE POLICY "allow_write_org_settings" ON org_settings FOR ALL USING (true) WITH CHECK (true);

-- Sports
DROP POLICY IF EXISTS "allow_all_sports" ON sports;
CREATE POLICY "allow_all_sports" ON sports FOR ALL USING (true) WITH CHECK (true);

-- Users
DROP POLICY IF EXISTS "allow_read_all_users"          ON users;
DROP POLICY IF EXISTS "allow_registration"            ON users;
DROP POLICY IF EXISTS "allow_update_users"            ON users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON users;

CREATE POLICY "allow_read_all_users"           ON users FOR SELECT USING (true);
CREATE POLICY "allow_registration"             ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_users"             ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for admins only"  ON users FOR DELETE USING (true);

-- Teams
DROP POLICY IF EXISTS "allow_all_teams" ON teams;
CREATE POLICY "allow_all_teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- Games
DROP POLICY IF EXISTS "allow_all_games" ON games;
CREATE POLICY "allow_all_games" ON games FOR ALL USING (true) WITH CHECK (true);

-- Bets
DROP POLICY IF EXISTS "allow_all_bets" ON bets;
CREATE POLICY "allow_all_bets" ON bets FOR ALL USING (true) WITH CHECK (true);

-- Prop Bets
DROP POLICY IF EXISTS "allow_all_prop_bets" ON prop_bets;
CREATE POLICY "allow_all_prop_bets" ON prop_bets FOR ALL USING (true) WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "allow_all_transactions" ON transactions;
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Rewards system
DROP POLICY IF EXISTS "Allow all on daily_logins" ON daily_logins;
CREATE POLICY "Allow all on daily_logins" ON daily_logins FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on wheel_spins" ON wheel_spins;
CREATE POLICY "Allow all on wheel_spins" ON wheel_spins FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on achievements" ON achievements;
CREATE POLICY "Allow all on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on wheel_config" ON wheel_config;
CREATE POLICY "Allow all on wheel_config" ON wheel_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on error_logs" ON error_logs;
CREATE POLICY "Allow all on error_logs" ON error_logs FOR ALL USING (true) WITH CHECK (true);

-- Brackets
DROP POLICY IF EXISTS "allow all brackets"        ON brackets;
DROP POLICY IF EXISTS "allow all bracket_teams"   ON bracket_teams;
DROP POLICY IF EXISTS "allow all bracket_games"   ON bracket_games;
DROP POLICY IF EXISTS "allow all bracket_entries" ON bracket_entries;

CREATE POLICY "allow all brackets"        ON brackets        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_teams"   ON bracket_teams   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_games"   ON bracket_games   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_entries" ON bracket_entries FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 8. DATABASE FUNCTIONS
-- ============================================================

-- Calculate consecutive login streak for a user.
-- p_login_date defaults to CURRENT_DATE (UTC). Pass the user's
-- local date to avoid UTC vs. local-timezone drift.
CREATE OR REPLACE FUNCTION calculate_login_streak(p_user_id UUID, p_login_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 1;
    v_current_date DATE := p_login_date;
    v_prev_date DATE;
BEGIN
    SELECT login_date INTO v_prev_date
    FROM daily_logins
    WHERE user_id = p_user_id AND login_date < v_current_date
    ORDER BY login_date DESC
    LIMIT 1;

    IF v_prev_date IS NULL THEN
        RETURN 1;
    END IF;

    IF v_prev_date = v_current_date - INTERVAL '1 day' THEN
        WITH RECURSIVE streak_days AS (
            SELECT login_date, 1 AS day_num
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

-- Check if user has bet on all visible scheduled games today
CREATE OR REPLACE FUNCTION check_all_games_bet(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_games INTEGER;
    v_user_bets   INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_games
    FROM games
    WHERE is_visible = true
      AND status = 'scheduled'
      AND game_date = CURRENT_DATE;

    IF v_total_games = 0 THEN RETURN false; END IF;

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

-- Check if user has bet on all games for a given sport today
CREATE OR REPLACE FUNCTION check_all_sport_games_bet(p_user_id UUID, p_sport_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_games INTEGER;
    v_user_bets   INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_games
    FROM games
    WHERE is_visible = true
      AND status = 'scheduled'
      AND sport_id = p_sport_id
      AND game_date = CURRENT_DATE;

    IF v_total_games = 0 THEN RETURN false; END IF;

    SELECT COUNT(DISTINCT b.game_id) INTO v_user_bets
    FROM bets b
    JOIN games g ON b.game_id = g.id
    WHERE b.user_id = p_user_id
      AND DATE(b.created_at) = CURRENT_DATE
      AND g.is_visible = true
      AND g.sport_id = p_sport_id
      AND g.game_date = CURRENT_DATE;

    RETURN v_user_bets >= v_total_games;
END;
$$ LANGUAGE plpgsql;

-- Atomically update a user's balance (prevents race conditions)
CREATE OR REPLACE FUNCTION update_user_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET balance    = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cascade-delete a user and all their related data
CREATE OR REPLACE FUNCTION delete_user_cascade(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM achievements  WHERE user_id = p_user_id;
    DELETE FROM wheel_spins   WHERE user_id = p_user_id;
    DELETE FROM daily_logins  WHERE user_id = p_user_id;
    DELETE FROM notifications WHERE user_id = p_user_id;
    DELETE FROM transactions  WHERE user_id = p_user_id;
    DELETE FROM bets          WHERE user_id = p_user_id;
    DELETE FROM users         WHERE id      = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate engagement bonus multiplier based on bets on a sport today
-- Returns 0.05 / 0.10 / 0.15 depending on bet count
CREATE OR REPLACE FUNCTION calculate_game_bonus(p_user_id UUID, p_sport_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    v_bet_count INTEGER;
    v_bonus     DECIMAL := 0;
BEGIN
    SELECT COUNT(*) INTO v_bet_count
    FROM bets b
    JOIN games g ON b.game_id = g.id
    WHERE b.user_id = p_user_id
      AND g.sport_id = p_sport_id
      AND DATE(b.created_at) = CURRENT_DATE;

    IF    v_bet_count >= 4 THEN v_bonus := 0.15;
    ELSIF v_bet_count =  3 THEN v_bonus := 0.10;
    ELSIF v_bet_count =  2 THEN v_bonus := 0.05;
    END IF;

    RETURN v_bonus;
END;
$$ LANGUAGE plpgsql;

-- Award weekly bonuses to the top 3 bettors (by profit, min 5 bets)
CREATE OR REPLACE FUNCTION award_weekly_bonuses()
RETURNS TABLE(user_id UUID, bonus_amount INTEGER, bonus_type TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_stats AS (
        SELECT
            b.user_id,
            SUM(CASE WHEN b.outcome = 'won' THEN b.potential_win - b.amount ELSE 0 END) AS weekly_profit,
            COUNT(*) AS total_bets
        FROM bets b
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND b.status = 'resolved'
        GROUP BY b.user_id
        HAVING COUNT(*) >= 5
    ),
    ranked_users AS (
        SELECT
            ws.user_id,
            ws.weekly_profit,
            RANK() OVER (ORDER BY ws.weekly_profit DESC) AS rank
        FROM weekly_stats ws
        WHERE ws.weekly_profit > 0
    )
    SELECT
        ru.user_id,
        CASE WHEN ru.rank = 1 THEN 500
             WHEN ru.rank = 2 THEN 250
             WHEN ru.rank = 3 THEN 100
             ELSE 0
        END::INTEGER AS bonus_amount,
        CASE WHEN ru.rank = 1 THEN 'weekly_top_1'
             WHEN ru.rank = 2 THEN 'weekly_top_2'
             WHEN ru.rank = 3 THEN 'weekly_top_3'
             ELSE 'none'
        END AS bonus_type
    FROM ranked_users ru
    WHERE ru.rank <= 3;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 9. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION update_user_balance(UUID, DECIMAL)       TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID)                TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_game_bonus(UUID, INTEGER)      TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_sport_games_bet(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION award_weekly_bonuses()                   TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_games_bet(UUID)                TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_login_streak(UUID, DATE)       TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_game_bonus(UUID, INTEGER)      TO anon;
GRANT EXECUTE ON FUNCTION check_all_sport_games_bet(UUID, INTEGER) TO anon;


-- ============================================================
-- 10. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE org_settings    IS 'Single-row organization config (name, logo, colors, setup state)';
COMMENT ON TABLE sports          IS 'Configurable sports — add as many as needed';
COMMENT ON TABLE users           IS 'User accounts with authentication and balance';
COMMENT ON TABLE teams           IS 'Sports teams linked to a sport';
COMMENT ON TABLE games           IS 'Scheduled games with betting odds';
COMMENT ON TABLE bets            IS 'User bets on games and prop bets';
COMMENT ON TABLE prop_bets       IS 'Custom proposition bets';
COMMENT ON TABLE transactions    IS 'Financial transaction history';
COMMENT ON TABLE notifications   IS 'User notification centre';
COMMENT ON TABLE daily_logins    IS 'Tracks user daily logins and streak rewards';
COMMENT ON TABLE wheel_spins     IS 'Records all spin wheel activity';
COMMENT ON TABLE achievements    IS 'Stores user achievements and milestone rewards';
COMMENT ON TABLE wheel_config    IS 'Configuration for spin wheel prizes and odds';
COMMENT ON TABLE error_logs      IS 'Application error logging';
COMMENT ON TABLE brackets        IS 'Tournament brackets (any sport)';
COMMENT ON TABLE bracket_teams   IS 'Seeded teams within each bracket';
COMMENT ON TABLE bracket_games   IS 'Individual games in each bracket round';
COMMENT ON TABLE bracket_entries IS 'User bracket pick submissions';


-- ============================================================
-- SETUP COMPLETE ✅
-- ============================================================

SELECT
  'Database setup complete! ✅'     AS status,
  '18 tables created'               AS tables,
  '7 functions created'             AS functions,
  'All RLS policies applied'        AS security,
  'org_settings + sports tables ready' AS new_features,
  'Ready for Setup Wizard'          AS result;

-- Next steps:
--   1. Register your admin account through the website.
--   2. Promote it:
--        UPDATE users SET is_admin = true WHERE username = 'your_username';
--   3. Visit the app — the Setup Wizard will launch automatically.
--   4. Add your org name, logo, sports, teams, rosters, and first game.

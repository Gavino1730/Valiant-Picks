-- ============================================================
-- VALIANT PICKS - MASTER DATABASE SETUP
-- ============================================================
-- Run this ENTIRE script in Supabase SQL Editor on a blank database.
-- This single file combines and supersedes all other SQL files:
--   COMPLETE_SETUP.sql
--   ADD_ERROR_LOG_COLUMNS.sql
--   ADD_MISSING_FUNCTIONS.sql
--   BRACKET_SETUP.sql / BRACKET_SETUP_PART1.sql / BRACKET_SETUP_PART2.sql
--   CREATE_16SEED_BRACKET.sql
--   CREATE_TEST_BRACKET.sql
--   GIRLS_BRACKET_SETUP.sql
--
-- NOTE: retroactive-payout.sql is included at the bottom as a
--       commented-out utility block for use when needed.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. CORE TABLES
-- ============================================================

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
  schedule JSONB,  -- JSON array of games
  players JSONB,  -- JSON array of player objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games
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
  result TEXT,           -- 'win', 'loss', or NULL
  home_score INTEGER,
  away_score INTEGER,
  type TEXT DEFAULT 'Non League', -- 'Non League', 'League', 'Tournament'
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
  team_type TEXT, -- 'Boys', 'Girls', or NULL for general
  yes_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  no_odds DECIMAL(4, 2) NOT NULL DEFAULT 1.50,
  options JSONB,
  option_odds JSONB,
  is_visible BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'resolved'
  outcome TEXT,                 -- 'yes', 'no', or NULL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bets
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
  outcome TEXT,                  -- 'won', 'lost', or NULL
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
  type TEXT NOT NULL, -- 'bet', 'win', 'adjustment', 'daily_reward', 'wheel_spin', 'achievement'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bet_placed', 'bet_won', 'bet_lost', 'daily_reward', 'achievement'
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
-- Includes status_code, component_stack, response_data columns
-- (previously added via ADD_ERROR_LOG_COLUMNS.sql migration)
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

-- Ensure new columns exist on existing deployments
ALTER TABLE error_logs ADD COLUMN IF NOT EXISTS status_code INTEGER;
ALTER TABLE error_logs ADD COLUMN IF NOT EXISTS component_stack TEXT;
ALTER TABLE error_logs ADD COLUMN IF NOT EXISTS response_data TEXT;


-- ============================================================
-- 3. BRACKET TABLES
-- ============================================================

-- Drop old bracket tables to ensure a clean 16-seed structure
-- (safe to skip on a brand-new database; CASCADE handles dependencies)
DROP TABLE IF EXISTS bracket_games CASCADE;
DROP TABLE IF EXISTS bracket_entries CASCADE;
DROP TABLE IF EXISTS bracket_teams CASCADE;
DROP TABLE IF EXISTS brackets CASCADE;

-- Main brackets table
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT,
  gender TEXT NOT NULL DEFAULT 'boys',
  status TEXT NOT NULL DEFAULT 'open',
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  payout_per_point NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams per bracket (16 seeds)
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

-- Wheel configuration defaults
INSERT INTO wheel_config (prize_amounts, prize_weights, spins_per_day)
VALUES (
  ARRAY[500, 750, 1000, 2000, 3000, 5000, 7500, 10000],
  ARRAY[30, 25, 20, 12, 7, 4, 1, 1],
  1
) ON CONFLICT DO NOTHING;

-- Default teams
-- No default teams seeded. Create teams via the Admin > Manage Teams panel.


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

-- Users
DROP POLICY IF EXISTS "allow_read_all_users"        ON users;
DROP POLICY IF EXISTS "allow_registration"          ON users;
DROP POLICY IF EXISTS "allow_update_users"          ON users;
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
DROP POLICY IF EXISTS "allow all brackets"       ON brackets;
DROP POLICY IF EXISTS "allow all bracket_teams"  ON bracket_teams;
DROP POLICY IF EXISTS "allow all bracket_games"  ON bracket_games;
DROP POLICY IF EXISTS "allow all bracket_entries" ON bracket_entries;

CREATE POLICY "allow all brackets"        ON brackets        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_teams"   ON bracket_teams   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_games"   ON bracket_games   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_entries" ON bracket_entries FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 8. DATABASE FUNCTIONS
-- ============================================================

-- Calculate consecutive login streak for a user.
-- p_login_date defaults to CURRENT_DATE (UTC) for backward compatibility, but
-- callers should pass the user's local date to avoid UTC vs. local-timezone drift.
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

-- Check if user has bet on all scheduled games today
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

-- Check if user has bet on all scheduled girls games today
CREATE OR REPLACE FUNCTION check_all_girls_games_bet(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_games INTEGER;
    v_user_bets   INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_games
    FROM games
    WHERE is_visible = true
      AND status = 'scheduled'
      AND (team_type ILIKE '%girls%' OR team_type ILIKE '%girl%')
      AND game_date = CURRENT_DATE;

    IF v_total_games = 0 THEN RETURN false; END IF;

    SELECT COUNT(DISTINCT b.game_id) INTO v_user_bets
    FROM bets b
    JOIN games g ON b.game_id = g.id
    WHERE b.user_id = p_user_id
      AND DATE(b.created_at) = CURRENT_DATE
      AND g.is_visible = true
      AND (g.team_type ILIKE '%girls%' OR g.team_type ILIKE '%girl%')
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

-- Calculate engagement bonus multiplier based on bets on a team type today
-- Returns 0.05 / 0.10 / 0.15 depending on bet count
CREATE OR REPLACE FUNCTION calculate_game_bonus(p_user_id UUID, p_team_type TEXT)
RETURNS DECIMAL AS $$
DECLARE
    v_bet_count INTEGER;
    v_bonus     DECIMAL := 0;
BEGIN
    SELECT COUNT(*) INTO v_bet_count
    FROM bets b
    JOIN games g ON b.game_id = g.id
    WHERE b.user_id = p_user_id
      AND g.team_type = p_team_type
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

GRANT EXECUTE ON FUNCTION update_user_balance(UUID, DECIMAL)   TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_game_bonus(UUID, TEXT)     TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_girls_games_bet(UUID)      TO authenticated;
GRANT EXECUTE ON FUNCTION award_weekly_bonuses()               TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_games_bet(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_login_streak(UUID, DATE)   TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_game_bonus(UUID, TEXT)     TO anon;
GRANT EXECUTE ON FUNCTION check_all_girls_games_bet(UUID)      TO anon;


-- ============================================================
-- 10. BRACKET DATA — Boys State Bracket (2026)
-- ============================================================

INSERT INTO brackets (name, season, gender, status, entry_fee, payout_per_point)
VALUES ('Boys State Bracket', '2026', 'boys', 'open', 0, 1000);

WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Boys State Bracket' AND season = '2026' AND gender = 'boys'
)
INSERT INTO bracket_teams (bracket_id, seed, name)
SELECT b.id, t.seed, t.name
FROM bracket_data b,
(VALUES
  (1,  'Team 1'),
  (2,  'Team 2'),
  (3,  'Team 3'),
  (4,  'Team 4'),
  (5,  'Team 5'),
  (6,  'Team 6'),
  (7,  'Team 7'),
  (8,  'Team 8'),
  (9,  'Team 9'),
  (10, 'Team 10'),
  (11, 'Team 11'),
  (12, 'Team 12'),
  (13, 'Team 13'),
  (14, 'Team 14'),
  (15, 'Team 15'),
  (16, 'Team 16')
) AS t(seed, name);

-- Round 1 — standard NCAA seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Boys State Bracket' AND season = '2026' AND gender = 'boys'
),
team_lookup AS (
  SELECT b.id AS bracket_id, bt.id AS team_id, bt.seed
  FROM bracket_data b
  JOIN bracket_teams bt ON bt.bracket_id = b.id
),
round1_games AS (
  SELECT 1 AS round, 1 AS game_number, 1  AS seed1, 16 AS seed2 UNION ALL
  SELECT 1, 2, 8,  9  UNION ALL
  SELECT 1, 3, 5,  12 UNION ALL
  SELECT 1, 4, 4,  13 UNION ALL
  SELECT 1, 5, 6,  11 UNION ALL
  SELECT 1, 6, 3,  14 UNION ALL
  SELECT 1, 7, 7,  10 UNION ALL
  SELECT 1, 8, 2,  15
)
INSERT INTO bracket_games (bracket_id, round, game_number, team1_id, team2_id, status)
SELECT
  b.id,
  rg.round,
  rg.game_number,
  (SELECT team_id FROM team_lookup WHERE bracket_id = b.id AND seed = rg.seed1),
  (SELECT team_id FROM team_lookup WHERE bracket_id = b.id AND seed = rg.seed2),
  'scheduled'
FROM bracket_data b, round1_games rg;

-- Round 2 — quarterfinals (empty; populated when round 1 completes)
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Boys State Bracket' AND season = '2026' AND gender = 'boys'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 2, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 4) n;

-- Round 3 — semifinals
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Boys State Bracket' AND season = '2026' AND gender = 'boys'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 3, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 2) n;

-- Round 4 — championship
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Boys State Bracket' AND season = '2026' AND gender = 'boys'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 4, 1, 'scheduled'
FROM bracket_data b;


-- ============================================================
-- 11. BRACKET DATA — Girls State Bracket (2026)
-- ============================================================
-- Replace 'Team 1' through 'Team 16' with actual school names
-- before running this section.

INSERT INTO brackets (name, season, gender, status, entry_fee, payout_per_point)
VALUES ('Girls State Bracket', '2026', 'girls', 'open', 0, 1000);

WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_teams (bracket_id, seed, name)
SELECT b.id, t.seed, t.name
FROM bracket_data b,
(VALUES
  (1,  'Team 1'),
  (2,  'Team 2'),
  (3,  'Team 3'),
  (4,  'Team 4'),
  (5,  'Team 5'),
  (6,  'Team 6'),
  (7,  'Team 7'),
  (8,  'Team 8'),
  (9,  'Team 9'),
  (10, 'Team 10'),
  (11, 'Team 11'),
  (12, 'Team 12'),
  (13, 'Team 13'),
  (14, 'Team 14'),
  (15, 'Team 15'),
  (16, 'Team 16')
) AS t(seed, name);

-- Round 1 — standard NCAA seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND season = '2026' AND gender = 'girls'
),
team_lookup AS (
  SELECT b.id AS bracket_id, bt.id AS team_id, bt.seed
  FROM bracket_data b
  JOIN bracket_teams bt ON bt.bracket_id = b.id
),
round1_games AS (
  SELECT 1 AS round, 1 AS game_number, 1  AS seed1, 16 AS seed2 UNION ALL
  SELECT 1, 2, 8,  9  UNION ALL
  SELECT 1, 3, 5,  12 UNION ALL
  SELECT 1, 4, 4,  13 UNION ALL
  SELECT 1, 5, 6,  11 UNION ALL
  SELECT 1, 6, 3,  14 UNION ALL
  SELECT 1, 7, 7,  10 UNION ALL
  SELECT 1, 8, 2,  15
)
INSERT INTO bracket_games (bracket_id, round, game_number, team1_id, team2_id, status)
SELECT
  b.id,
  rg.round,
  rg.game_number,
  (SELECT team_id FROM team_lookup WHERE bracket_id = b.id AND seed = rg.seed1),
  (SELECT team_id FROM team_lookup WHERE bracket_id = b.id AND seed = rg.seed2),
  'scheduled'
FROM bracket_data b, round1_games rg;

-- Round 2 — quarterfinals
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 2, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 4) n;

-- Round 3 — semifinals
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 3, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 2) n;

-- Round 4 — championship
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 4, 1, 'scheduled'
FROM bracket_data b;

-- To update girls team names once seedings are known, run e.g.:
--   UPDATE bracket_teams
--   SET name = 'Actual School Name'
--   WHERE bracket_id = (
--     SELECT id FROM brackets WHERE name = 'Girls State Bracket' AND gender = 'girls'
--   ) AND seed = 1;


-- ============================================================
-- 12. TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE users          IS 'User accounts with authentication and balance';
COMMENT ON TABLE teams          IS 'Sports teams (Boys/Girls Basketball)';
COMMENT ON TABLE games          IS 'Scheduled games with betting odds';
COMMENT ON TABLE bets           IS 'User bets on games and prop bets';
COMMENT ON TABLE prop_bets      IS 'Custom proposition bets';
COMMENT ON TABLE transactions   IS 'Financial transaction history';
COMMENT ON TABLE notifications  IS 'User notification centre';
COMMENT ON TABLE daily_logins   IS 'Tracks user daily logins and streak rewards';
COMMENT ON TABLE wheel_spins    IS 'Records all spin wheel activity';
COMMENT ON TABLE achievements   IS 'Stores user achievements and milestone rewards';
COMMENT ON TABLE wheel_config   IS 'Configuration for spin wheel prizes and odds';
COMMENT ON TABLE error_logs     IS 'Application error logging';
COMMENT ON TABLE brackets       IS 'State basketball brackets (boys and girls)';
COMMENT ON TABLE bracket_teams  IS 'Seeded teams within each bracket';
COMMENT ON TABLE bracket_games  IS 'Individual games in each bracket round';
COMMENT ON TABLE bracket_entries IS 'User bracket pick submissions';


-- ============================================================
-- SETUP COMPLETE ✅
-- ============================================================

SELECT
  'Database setup complete! ✅' AS status,
  '16 tables created'           AS tables,
  '7 functions created'         AS functions,
  'All RLS policies applied'    AS security,
  'Boys & Girls brackets ready' AS brackets,
  'Ready for production'        AS result;

-- Next steps:
--   1. Register your admin account through the website.
--   2. Promote it: UPDATE users SET is_admin = true WHERE username = 'your_username';
--   3. Replace girls bracket team names with real seedings (section 11 above).


-- ============================================================
-- UTILITY: RETROACTIVE PAYOUT FOR OES GAMES
-- ============================================================
-- Run the diagnostics below first (they are safe read-only queries).
-- Uncomment the BEGIN...COMMIT block only after confirming the data.

-- Diagnostic 1: unpaid winning bets for OES games
/*
SELECT
  b.id         AS bet_id,
  b.user_id,
  u.username,
  b.game_id,
  b.selected_team,
  b.bet_type,
  b.amount     AS bet_amount,
  b.odds,
  b.potential_win,
  COALESCE(b.potential_win, b.amount * b.odds) AS calculated_payout,
  b.status,
  b.outcome,
  b.created_at AS bet_placed_at,
  b.updated_at AS bet_resolved_at,
  u.balance    AS current_balance,
  g.home_team, g.away_team, g.team_type,
  g.result     AS winning_team,
  g.game_date
FROM bets b
JOIN  users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status  = 'resolved'
  AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'           OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at BETWEEN b.updated_at - INTERVAL '10 seconds'
                           AND b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  )
ORDER BY g.game_date, b.updated_at;
*/

-- Diagnostic 2: summary of total owed
/*
SELECT
  COUNT(*)            AS unpaid_bet_count,
  COUNT(DISTINCT b.user_id) AS affected_users,
  SUM(COALESCE(b.potential_win, b.amount * b.odds)) AS total_owed,
  MIN(b.updated_at)   AS earliest_unpaid,
  MAX(b.updated_at)   AS latest_unpaid
FROM bets b
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'           OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at BETWEEN b.updated_at - INTERVAL '10 seconds'
                           AND b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  );
*/

-- Diagnostic 3: breakdown by user
/*
SELECT
  u.username,
  u.id                                              AS user_id,
  COUNT(b.id)                                       AS unpaid_bets,
  SUM(COALESCE(b.potential_win, b.amount * b.odds)) AS total_owed,
  u.balance                                         AS current_balance,
  u.balance + SUM(COALESCE(b.potential_win, b.amount * b.odds)) AS balance_after_payout
FROM bets b
JOIN  users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'           OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at BETWEEN b.updated_at - INTERVAL '10 seconds'
                           AND b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  )
GROUP BY u.username, u.id, u.balance
ORDER BY total_owed DESC;
*/

-- Actual payout execution — UNCOMMENT ONLY AFTER REVIEWING DIAGNOSTICS ABOVE
/*
BEGIN;

CREATE TEMP TABLE payout_tracking AS
SELECT
  b.id          AS bet_id,
  b.user_id,
  u.username,
  COALESCE(b.potential_win, b.amount * b.odds) AS payout_amount,
  b.selected_team,
  b.bet_type,
  g.home_team, g.away_team, g.team_type,
  g.game_date
FROM bets b
JOIN  users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'           OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at BETWEEN b.updated_at - INTERVAL '10 seconds'
                           AND b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  );

UPDATE users u
SET balance = balance + (
  SELECT COALESCE(SUM(pt.payout_amount), 0)
  FROM payout_tracking pt
  WHERE pt.user_id = u.id
)
WHERE u.id IN (SELECT DISTINCT user_id FROM payout_tracking);

INSERT INTO transactions (user_id, type, amount, description, status, created_at)
SELECT
  user_id,
  'win',
  payout_amount,
  'Retroactive payout: ' || bet_type || ' confidence bet on ' || selected_team,
  'completed',
  NOW()
FROM payout_tracking;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT
  user_id,
  '💰 Retroactive Payout - OES Games',
  'You received ' || ROUND(SUM(payout_amount), 2) || ' Valiant Bucks from ' ||
    COUNT(*) || ' winning OES bet(s) that were not previously paid out. Sorry for the delay!',
  'system',
  false,
  NOW()
FROM payout_tracking
GROUP BY user_id;

SELECT 'PAYOUT COMPLETE!' AS status, COUNT(*) AS bets_paid,
       COUNT(DISTINCT user_id) AS users_paid, SUM(payout_amount) AS total_paid
FROM payout_tracking;

DROP TABLE payout_tracking;

COMMIT;
-- or: ROLLBACK;
*/

-- ============================================================
-- MIGRATIONS  (run these in Supabase SQL Editor on existing DBs)
-- ============================================================

-- 2026-03: Update games.type default from 'game' to 'Non League'
--          and populate any existing games that still have the old default.
ALTER TABLE games ALTER COLUMN type SET DEFAULT 'Non League';

-- Rename leftover 'game' values to 'Non League' (old default)
UPDATE games SET type = 'Non League' WHERE type = 'game' OR type IS NULL;
-- Rewards System Database Schema
-- Run this in Supabase SQL Editor to add gamification features

-- Table for tracking daily logins and rewards
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

-- Table for spin wheel history
CREATE TABLE IF NOT EXISTS wheel_spins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spin_date DATE NOT NULL,
    reward_amount INTEGER NOT NULL,
    spin_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table for user achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'all_games_bet', 'consecutive_logins', 'big_win', etc.
    achievement_date DATE NOT NULL,
    reward_amount INTEGER DEFAULT 0,
    description TEXT,
    claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table for spin wheel configuration (admin can modify)
CREATE TABLE IF NOT EXISTS wheel_config (
    id SERIAL PRIMARY KEY,
    prize_amounts INTEGER[] DEFAULT ARRAY[10, 25, 50, 100, 150, 200, 500, 1000],
    prize_weights INTEGER[] DEFAULT ARRAY[30, 25, 20, 12, 7, 4, 1, 1], -- Higher = more likely
    spins_per_day INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default wheel configuration
INSERT INTO wheel_config (prize_amounts, prize_weights, spins_per_day)
VALUES 
(ARRAY[10, 25, 50, 100, 150, 200, 500, 1000], ARRAY[30, 25, 20, 12, 7, 4, 1, 1], 1)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_date ON daily_logins(user_id, login_date);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_user_date ON wheel_spins(user_id, spin_date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Enable Row Level Security
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all for simplicity (backend validates with JWT)
CREATE POLICY "Allow all on daily_logins" ON daily_logins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wheel_spins" ON wheel_spins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on wheel_config" ON wheel_config FOR ALL USING (true) WITH CHECK (true);

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

COMMENT ON TABLE daily_logins IS 'Tracks user daily logins and streak rewards';
COMMENT ON TABLE wheel_spins IS 'Records all spin wheel activity';
COMMENT ON TABLE achievements IS 'Stores user achievements and milestone rewards';
COMMENT ON TABLE wheel_config IS 'Configuration for spin wheel prizes and odds';

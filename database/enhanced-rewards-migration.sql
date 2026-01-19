-- Enhanced Rewards System Migration
-- Adds girls game incentives and more achievements
-- Run in Supabase SQL Editor

-- Add function to check if user bet on all girls games today
CREATE OR REPLACE FUNCTION check_all_girls_games_bet(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_games INTEGER;
    v_user_bets INTEGER;
BEGIN
    -- Count girls games available today
    SELECT COUNT(*) INTO v_total_games
    FROM games
    WHERE is_visible = true 
    AND status = 'scheduled'
    AND game_date = CURRENT_DATE
    AND team_type = 'girls';
    
    -- If no girls games today, return false
    IF v_total_games = 0 THEN
        RETURN false;
    END IF;
    
    -- Count unique girls games user has bet on today
    SELECT COUNT(DISTINCT game_id) INTO v_user_bets
    FROM bets
    WHERE user_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE
    AND game_id IN (
        SELECT id FROM games 
        WHERE is_visible = true 
        AND status = 'scheduled'
        AND game_date = CURRENT_DATE
        AND team_type = 'girls'
    );
    
    RETURN v_user_bets >= v_total_games;
END;
$$ LANGUAGE plpgsql;

-- Add girls_game_bonus column to bets table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bets' AND column_name='girls_game_bonus') THEN
        ALTER TABLE bets ADD COLUMN girls_game_bonus DECIMAL(10,2) DEFAULT 0;
        COMMENT ON COLUMN bets.girls_game_bonus IS 'Bonus multiplier for girls game bets (e.g., 0.10 for 10% bonus)';
    END IF;
END $$;

-- Create table for bonus multipliers configuration
CREATE TABLE IF NOT EXISTS bonus_multipliers (
    id SERIAL PRIMARY KEY,
    bonus_type VARCHAR(50) NOT NULL UNIQUE,
    multiplier DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default bonus multipliers
INSERT INTO bonus_multipliers (bonus_type, multiplier, description, is_active)
VALUES 
    ('girls_game_base', 0.10, 'Base 10% bonus on all girls game bets', true),
    ('girls_streak_3', 0.05, 'Additional 5% bonus for 3+ consecutive girls bets', true),
    ('girls_streak_7', 0.10, 'Additional 10% bonus for 7+ consecutive girls bets', true),
    ('weekend_bonus', 0.05, 'Extra 5% on weekend bets', true),
    ('rivalry_week', 0.15, 'Special 15% bonus during rivalry week', false)
ON CONFLICT (bonus_type) DO NOTHING;

-- Enable RLS on bonus_multipliers
ALTER TABLE bonus_multipliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on bonus_multipliers" ON bonus_multipliers FOR ALL USING (true) WITH CHECK (true);

-- Create table for weekly/monthly bonus payouts
CREATE TABLE IF NOT EXISTS periodic_bonuses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bonus_type VARCHAR(50) NOT NULL, -- 'weekly_top10', 'monthly_top10', 'girls_champion'
    amount INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rank INTEGER,
    description TEXT,
    claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_periodic_bonuses_user ON periodic_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_periodic_bonuses_period ON periodic_bonuses(period_start, period_end);

ALTER TABLE periodic_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on periodic_bonuses" ON periodic_bonuses FOR ALL USING (true) WITH CHECK (true);

-- Create table for referral system
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    referrer_reward INTEGER DEFAULT 100,
    referred_reward INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed'
    referrer_rewarded BOOLEAN DEFAULT FALSE,
    referred_rewarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);

-- Add referral_code to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
        COMMENT ON COLUMN users.referral_code IS 'User unique referral code for inviting friends';
    END IF;
END $$;

-- Generate referral codes for existing users
UPDATE users 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Function to calculate girls game bonus for a bet
CREATE OR REPLACE FUNCTION calculate_girls_game_bonus(
    p_user_id UUID,
    p_team_type VARCHAR(50)
)
RETURNS DECIMAL AS $$
DECLARE
    v_bonus DECIMAL := 0;
    v_recent_girls_streak INTEGER := 0;
BEGIN
    -- Only apply to girls games
    IF p_team_type != 'girls' THEN
        RETURN 0;
    END IF;
    
    -- Get base girls game bonus
    SELECT COALESCE(multiplier, 0) INTO v_bonus
    FROM bonus_multipliers
    WHERE bonus_type = 'girls_game_base' AND is_active = true;
    
    -- Check for girls game streak
    WITH recent_bets AS (
        SELECT b.id, g.team_type,
               ROW_NUMBER() OVER (ORDER BY b.created_at DESC) as rn
        FROM bets b
        JOIN games g ON b.game_id = g.id
        WHERE b.user_id = p_user_id
        ORDER BY b.created_at DESC
        LIMIT 10
    )
    SELECT COUNT(*) INTO v_recent_girls_streak
    FROM recent_bets
    WHERE team_type = 'girls' AND rn <= 7
    HAVING MIN(CASE WHEN team_type != 'girls' THEN rn ELSE 999 END) > MAX(rn);
    
    -- Add streak bonuses
    IF v_recent_girls_streak >= 7 THEN
        SELECT v_bonus + COALESCE(multiplier, 0) INTO v_bonus
        FROM bonus_multipliers
        WHERE bonus_type = 'girls_streak_7' AND is_active = true;
    ELSIF v_recent_girls_streak >= 3 THEN
        SELECT v_bonus + COALESCE(multiplier, 0) INTO v_bonus
        FROM bonus_multipliers
        WHERE bonus_type = 'girls_streak_3' AND is_active = true;
    END IF;
    
    -- Add weekend bonus if applicable
    IF EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN
        SELECT v_bonus + COALESCE(multiplier, 0) INTO v_bonus
        FROM bonus_multipliers
        WHERE bonus_type = 'weekend_bonus' AND is_active = true;
    END IF;
    
    RETURN v_bonus;
END;
$$ LANGUAGE plpgsql;

-- Function to award periodic bonuses (run via scheduler)
CREATE OR REPLACE FUNCTION award_weekly_bonuses()
RETURNS TABLE(user_id UUID, rank INTEGER, bonus INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_stats AS (
        SELECT 
            b.user_id,
            COUNT(*) as bet_count,
            SUM(CASE WHEN b.outcome = 'won' THEN b.potential_win ELSE 0 END) as total_winnings,
            SUM(CASE WHEN g.team_type = 'girls' THEN 1 ELSE 0 END) as girls_bets
        FROM bets b
        JOIN games g ON b.game_id = g.id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND b.status = 'resolved'
        GROUP BY b.user_id
    ),
    ranked_users AS (
        SELECT 
            ws.user_id,
            ROW_NUMBER() OVER (ORDER BY total_winnings DESC) as rank,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY total_winnings DESC) = 1 THEN 1000
                WHEN ROW_NUMBER() OVER (ORDER BY total_winnings DESC) <= 3 THEN 500
                WHEN ROW_NUMBER() OVER (ORDER BY total_winnings DESC) <= 10 THEN 250
                ELSE 0
            END as bonus,
            -- Extra bonus for girls game supporters
            CASE 
                WHEN ws.girls_bets >= 5 THEN 200
                WHEN ws.girls_bets >= 3 THEN 100
                ELSE 0
            END as girls_bonus
        FROM weekly_stats ws
        WHERE ws.bet_count >= 3 -- Minimum 3 bets to qualify
    )
    SELECT 
        ru.user_id,
        ru.rank::INTEGER,
        (ru.bonus + ru.girls_bonus)::INTEGER
    FROM ranked_users ru
    WHERE ru.bonus > 0 OR ru.girls_bonus > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE bonus_multipliers IS 'Configuration for various bonus multipliers';
COMMENT ON TABLE periodic_bonuses IS 'Weekly and monthly bonus payouts for top performers';
COMMENT ON TABLE referrals IS 'User referral system for growing the platform';
COMMENT ON FUNCTION calculate_girls_game_bonus IS 'Calculates total bonus multiplier for girls game bets';
COMMENT ON FUNCTION award_weekly_bonuses IS 'Awards bonuses to top performers each week';

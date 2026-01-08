-- Add options and option_odds columns to prop_bets table
-- This allows custom options beyond just YES/NO

ALTER TABLE prop_bets 
ADD COLUMN IF NOT EXISTS options JSONB,
ADD COLUMN IF NOT EXISTS option_odds JSONB;

-- Update existing prop bets to have options/option_odds based on yes_odds/no_odds
UPDATE prop_bets
SET 
  options = '["Yes", "No"]'::jsonb,
  option_odds = jsonb_build_object('Yes', yes_odds, 'No', no_odds)
WHERE options IS NULL;

-- Verify the changes
SELECT id, title, options, option_odds, yes_odds, no_odds
FROM prop_bets
LIMIT 5;

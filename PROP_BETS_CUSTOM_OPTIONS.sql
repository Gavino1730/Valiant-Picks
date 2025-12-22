-- Update prop_bets table to support custom options
-- Run this in Supabase SQL Editor

-- Add columns to store custom options and their odds
ALTER TABLE prop_bets ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE prop_bets ADD COLUMN IF NOT EXISTS option_odds JSONB;

-- For existing prop bets, migrate yes/no structure to new options format
-- This converts old "yes"/"no" to new options format
UPDATE prop_bets 
SET 
  options = jsonb_build_array('Yes', 'No'),
  option_odds = jsonb_build_object('Yes', yes_odds, 'No', no_odds)
WHERE options IS NULL;

-- Create index on options column for performance
CREATE INDEX IF NOT EXISTS idx_prop_bets_options ON prop_bets USING GIN (options);

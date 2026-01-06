-- Add is_visible column to prop_bets table
ALTER TABLE prop_bets 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update existing prop bets to be visible by default
UPDATE prop_bets 
SET is_visible = true 
WHERE is_visible IS NULL;

-- Add prop_bet_id column to bets table
-- This links prop bets to the bets table

ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS prop_bet_id INTEGER REFERENCES prop_bets(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bets_prop_bet_id ON bets(prop_bet_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bets'
ORDER BY ordinal_position;

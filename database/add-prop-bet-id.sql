-- Allow prop bets to store their own reference separate from games
ALTER TABLE bets
  ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE bets
  ADD COLUMN IF NOT EXISTS prop_bet_id INTEGER REFERENCES prop_bets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bets_prop_bet_id ON bets(prop_bet_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bets_game_or_prop_check'
  ) THEN
    ALTER TABLE bets
      ADD CONSTRAINT bets_game_or_prop_check CHECK (
        (game_id IS NOT NULL AND prop_bet_id IS NULL)
        OR (game_id IS NULL AND prop_bet_id IS NOT NULL)
      );
  END IF;
END $$;

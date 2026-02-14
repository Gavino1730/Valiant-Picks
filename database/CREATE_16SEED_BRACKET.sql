-- Drop existing bracket tables to start fresh with 16-seed structure
DROP TABLE IF EXISTS bracket_games CASCADE;
DROP TABLE IF EXISTS bracket_teams CASCADE;
DROP TABLE IF EXISTS bracket_entries CASCADE;
DROP TABLE IF EXISTS brackets CASCADE;

-- Create bracket table
CREATE TABLE brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text,
  status text NOT NULL DEFAULT 'open',
  entry_fee numeric NOT NULL DEFAULT 0,
  payout_per_point numeric NOT NULL DEFAULT 1000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bracket_teams table (16 seeds)
CREATE TABLE bracket_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  seed int NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX bracket_teams_unique_seed
  ON bracket_teams (bracket_id, seed);

-- Create bracket_games table for all games in the tournament
CREATE TABLE bracket_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  round int NOT NULL,
  game_number int NOT NULL,
  team1_id uuid REFERENCES bracket_teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES bracket_teams(id) ON DELETE SET NULL,
  winner_team_id uuid REFERENCES bracket_teams(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX bracket_games_unique_round
  ON bracket_games (bracket_id, round, game_number);

-- Create bracket_entries table (user bracket picks)
CREATE TABLE bracket_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  picks jsonb NOT NULL DEFAULT '{}'::jsonb,
  points int NOT NULL DEFAULT 0,
  payout numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX bracket_entries_unique_user
  ON bracket_entries (bracket_id, user_id);

-- Enable RLS
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for simplicity - backend validates with JWT)
CREATE POLICY "allow all brackets" ON brackets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_teams" ON bracket_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_games" ON bracket_games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all bracket_entries" ON bracket_entries FOR ALL USING (true) WITH CHECK (true);

-- Insert the 3A State Bracket
INSERT INTO brackets (name, season, status, entry_fee, payout_per_point)
VALUES ('3A State Bracket', '2026', 'open', 0, 1000);

-- Get bracket ID for team insertion
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A State Bracket' AND season = '2026'
)
INSERT INTO bracket_teams (bracket_id, seed, name)
SELECT b.id, t.seed, t.name
FROM bracket_data b,
(VALUES
  (1, 'Westside Christian'),
  (2, 'Valley Catholic'),
  (3, 'Pleasant Hill'),
  (4, 'Riverside'),
  (5, 'Cascade Christian'),
  (6, 'Salem Acad.'),
  (7, 'St. Mary''s, Medford'),
  (8, 'Burns'),
  (9, 'Team 9'),
  (10, 'Team 10'),
  (11, 'Team 11'),
  (12, 'Team 12'),
  (13, 'Team 13'),
  (14, 'Team 14'),
  (15, 'Team 15'),
  (16, 'Team 16')
) AS t(seed, name);

-- Create Round 1 games (8 games) - standard NCAA seeding
-- Game 1: 1 vs 16
-- Game 2: 8 vs 9
-- Game 3: 5 vs 12
-- Game 4: 4 vs 13
-- Game 5: 6 vs 11
-- Game 6: 3 vs 14
-- Game 7: 7 vs 10
-- Game 8: 2 vs 15

WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A State Bracket' AND season = '2026'
),
team_lookup AS (
  SELECT b.id as bracket_id, bt.id as team_id, bt.seed
  FROM bracket_data b
  JOIN bracket_teams bt ON bt.bracket_id = b.id
),
round1_games AS (
  SELECT 1 as round, 1 as game_number, 1 as seed1, 16 as seed2
  UNION ALL
  SELECT 1, 2, 8, 9
  UNION ALL
  SELECT 1, 3, 5, 12
  UNION ALL
  SELECT 1, 4, 4, 13
  UNION ALL
  SELECT 1, 5, 6, 11
  UNION ALL
  SELECT 1, 6, 3, 14
  UNION ALL
  SELECT 1, 7, 7, 10
  UNION ALL
  SELECT 1, 8, 2, 15
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

-- Create Round 2 games (4 games) - semifinals
-- Winners from games 1&2 → Semifinal 1
-- Winners from games 3&4 → Semifinal 2
-- Winners from games 5&6 → Semifinal 3
-- Winners from games 7&8 → Semifinal 4

WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A State Bracket' AND season = '2026'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 2, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 4) n;

-- Create Round 3 games (2 games) - finals
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A State Bracket' AND season = '2026'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 3, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 2) n;

-- Create Championship game (Round 4)
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A State Bracket' AND season = '2026'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 4, 1, 'scheduled'
FROM bracket_data b;

-- ============================================================
-- GIRLS BRACKET SETUP
-- Run this in Supabase SQL Editor
--
-- Step 1: Adds 'gender' column to brackets table
-- Step 2: Tags the existing boys bracket as 'boys'
-- Step 3: Creates the girls bracket with placeholder teams
--         (update the team names below before running)
-- ============================================================

-- Step 1: Add gender column to brackets table (safe if already exists)
ALTER TABLE brackets
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'boys';

-- Step 2: Tag the existing boys bracket
UPDATE brackets
SET gender = 'boys'
WHERE gender = 'boys' OR gender IS NULL;

-- Step 3: Insert the Girls 3A State Bracket
-- *** REPLACE the team names below with the real seedings ***
INSERT INTO brackets (name, season, status, entry_fee, payout_per_point, gender)
VALUES ('3A Girls State Bracket', '2026', 'open', 0, 1000, 'girls');

-- Step 4: Insert 16 seeded teams for the girls bracket
-- Replace 'Team 1' through 'Team 16' with the actual school names
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND season = '2026' AND gender = 'girls'
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

-- Step 5: Create Round 1 games (standard NCAA seeding)
-- Game 1: 1 vs 16
-- Game 2: 8 vs 9
-- Game 3: 5 vs 12
-- Game 4: 4 vs 13
-- Game 5: 6 vs 11
-- Game 6: 3 vs 14
-- Game 7: 7 vs 10
-- Game 8: 2 vs 15
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND season = '2026' AND gender = 'girls'
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

-- Step 6: Create Round 2 games (quarterfinals)
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 2, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 4) n;

-- Step 7: Create Round 3 games (semifinals)
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 3, n, 'scheduled'
FROM bracket_data b
CROSS JOIN generate_series(1, 2) n;

-- Step 8: Create Championship game (Round 4)
WITH bracket_data AS (
  SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND season = '2026' AND gender = 'girls'
)
INSERT INTO bracket_games (bracket_id, round, game_number, status)
SELECT b.id, 4, 1, 'scheduled'
FROM bracket_data b;

-- ============================================================
-- DONE! The girls bracket is ready.
-- Once you have real team names, run this to update them:
--
-- UPDATE bracket_teams
-- SET name = 'Actual School Name'
-- WHERE bracket_id = (
--   SELECT id FROM brackets WHERE name = '3A Girls State Bracket' AND gender = 'girls'
-- ) AND seed = 1; -- change seed number for each team
-- ============================================================

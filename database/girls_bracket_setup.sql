-- ============================================================
-- Girls Bracket Setup - 2025-26 Season
-- Run this in the Supabase SQL Editor
-- ============================================================
-- Matchups:
--   1 Vale            vs 16 Brookings Harbor
--   8 Sutherlin       vs  9 Cascade Christian
--   5 Sisters         vs 12 Yamhill Carlton
--   4 Creswell        vs 13 Jefferson
--   3 Banks           vs 19 Santiam Christian
--   6 Valley Catholic vs 11 Taft
--   7 Pleasant Hill   vs 10 Coquille
--   2 Amity           vs 18 Westside Christian
-- ============================================================

DO $$
DECLARE
  v_bracket_id uuid;

  -- team IDs (populated by INSERT ... RETURNING)
  t1  uuid;  -- 1  Vale
  t2  uuid;  -- 2  Amity
  t3  uuid;  -- 3  Banks
  t4  uuid;  -- 4  Creswell
  t5  uuid;  -- 5  Sisters
  t6  uuid;  -- 6  Valley Catholic
  t7  uuid;  -- 7  Pleasant Hill
  t8  uuid;  -- 8  Sutherlin
  t9  uuid;  -- 9  Cascade Christian
  t10 uuid;  -- 10 Coquille
  t11 uuid;  -- 11 Taft
  t12 uuid;  -- 12 Yamhill Carlton
  t13 uuid;  -- 13 Jefferson
  t16 uuid;  -- 16 Brookings Harbor
  t18 uuid;  -- 18 Westside Christian
  t19 uuid;  -- 19 Santiam Christian

BEGIN
  -- --------------------------------------------------------
  -- 1. Find the active girls bracket
  -- --------------------------------------------------------
  SELECT id INTO v_bracket_id
  FROM brackets
  WHERE gender = 'girls'
    AND status IN ('open', 'locked', 'in-progress')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_bracket_id IS NULL THEN
    RAISE EXCEPTION
      'No active girls bracket found. Create one first in the Admin Panel (Brackets tab), set gender = girls, then re-run this script.';
  END IF;

  RAISE NOTICE 'Using girls bracket id: %', v_bracket_id;

  -- --------------------------------------------------------
  -- 2. Wipe existing teams + games for this bracket
  --    (safe to re-run; deletes old data first)
  -- --------------------------------------------------------
  DELETE FROM bracket_games WHERE bracket_id = v_bracket_id;
  DELETE FROM bracket_teams WHERE bracket_id = v_bracket_id;

  -- --------------------------------------------------------
  -- 3. Insert the 16 teams
  -- --------------------------------------------------------
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  1, 'Vale')             RETURNING id INTO t1;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  2, 'Amity')            RETURNING id INTO t2;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  3, 'Banks')            RETURNING id INTO t3;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  4, 'Creswell')         RETURNING id INTO t4;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  5, 'Sisters')          RETURNING id INTO t5;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  6, 'Valley Catholic')  RETURNING id INTO t6;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  7, 'Pleasant Hill')    RETURNING id INTO t7;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  8, 'Sutherlin')        RETURNING id INTO t8;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id,  9, 'Cascade Christian') RETURNING id INTO t9;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 10, 'Coquille')         RETURNING id INTO t10;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 11, 'Taft')             RETURNING id INTO t11;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 12, 'Yamhill Carlton')  RETURNING id INTO t12;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 13, 'Jefferson')        RETURNING id INTO t13;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 16, 'Brookings Harbor') RETURNING id INTO t16;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 18, 'Westside Christian') RETURNING id INTO t18;
  INSERT INTO bracket_teams (bracket_id, seed, name) VALUES (v_bracket_id, 19, 'Santiam Christian') RETURNING id INTO t19;

  -- --------------------------------------------------------
  -- 4. Create Round 1 games (exact matchups as given)
  -- --------------------------------------------------------
  INSERT INTO bracket_games (bracket_id, round, game_number, team1_id, team2_id, status) VALUES
    (v_bracket_id, 1, 1, t1,  t16, 'scheduled'),  --  1 Vale            vs 16 Brookings Harbor
    (v_bracket_id, 1, 2, t8,  t9,  'scheduled'),  --  8 Sutherlin       vs  9 Cascade Christian
    (v_bracket_id, 1, 3, t5,  t12, 'scheduled'),  --  5 Sisters         vs 12 Yamhill Carlton
    (v_bracket_id, 1, 4, t4,  t13, 'scheduled'),  --  4 Creswell        vs 13 Jefferson
    (v_bracket_id, 1, 5, t3,  t19, 'scheduled'),  --  3 Banks           vs 19 Santiam Christian
    (v_bracket_id, 1, 6, t6,  t11, 'scheduled'),  --  6 Valley Catholic vs 11 Taft
    (v_bracket_id, 1, 7, t7,  t10, 'scheduled'),  --  7 Pleasant Hill   vs 10 Coquille
    (v_bracket_id, 1, 8, t2,  t18, 'scheduled');  --  2 Amity           vs 18 Westside Christian

  -- --------------------------------------------------------
  -- 5. Create placeholder games for rounds 2–4
  -- --------------------------------------------------------
  INSERT INTO bracket_games (bracket_id, round, game_number, team1_id, team2_id, status) VALUES
    -- Quarterfinals (winners of games 1-2 and 3-4, etc.)
    (v_bracket_id, 2, 1, NULL, NULL, 'scheduled'),
    (v_bracket_id, 2, 2, NULL, NULL, 'scheduled'),
    (v_bracket_id, 2, 3, NULL, NULL, 'scheduled'),
    (v_bracket_id, 2, 4, NULL, NULL, 'scheduled'),
    -- Semifinals
    (v_bracket_id, 3, 1, NULL, NULL, 'scheduled'),
    (v_bracket_id, 3, 2, NULL, NULL, 'scheduled'),
    -- Championship
    (v_bracket_id, 4, 1, NULL, NULL, 'scheduled');

  RAISE NOTICE 'Girls bracket populated successfully! 16 teams + 15 games created.';
END $$;

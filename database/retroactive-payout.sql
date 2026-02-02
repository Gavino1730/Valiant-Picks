-- ============================================
-- RETROACTIVE PAYOUT SCRIPT - OES GAMES
-- Identifies and pays out winning bets for OES (Oregon Episcopal) games that weren't paid
-- ============================================

-- Step 1: Identify winning bets for OES games that don't have corresponding win transactions
-- This query shows bets where:
-- 1. Status is 'resolved' and outcome is 'won'
-- 2. Game involves "Oregon Episcopal" or "OES" 
-- 3. No corresponding 'win' transaction exists within 10 seconds of bet resolution
SELECT 
  '=== UNPAID WINNING BETS FOR OES GAMES ===' as step;

SELECT 
  b.id as bet_id,
  b.user_id,
  u.username,
  b.game_id,
  b.selected_team,
  b.bet_type,
  b.amount as bet_amount,
  b.odds,
  b.potential_win,
  COALESCE(b.potential_win, b.amount * b.odds) as calculated_payout,
  b.status,
  b.outcome,
  b.created_at as bet_placed_at,
  b.updated_at as bet_resolved_at,
  u.balance as current_balance,
  g.home_team,
  g.away_team,
  g.team_type,
  g.result as winning_team,
  g.game_date
FROM bets b
JOIN users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' 
  AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' 
    OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'
    OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at >= b.updated_at - INTERVAL '10 seconds'
      AND t.created_at <= b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  )
ORDER BY g.game_date, b.updated_at;

-- Step 2: Show summary of total owed for OES games
SELECT 
  '=== SUMMARY OF UNPAID WINNINGS (OES GAMES) ===' as step;

SELECT 
  COUNT(*) as unpaid_bet_count,
  COUNT(DISTINCT b.user_id) as affected_users,
  SUM(COALESCE(b.potential_win, b.amount * b.odds)) as total_owed,
  MIN(b.updated_at) as earliest_unpaid,
  MAX(b.updated_at) as latest_unpaid
FROM bets b
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' 
  AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' 
    OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'
    OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at >= b.updated_at - INTERVAL '10 seconds'
      AND t.created_at <= b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  );

-- Step 3: Breakdown by user for OES games
SELECT 
  '=== UNPAID WINNINGS BY USER (OES GAMES) ===' as step;

SELECT 
  u.username,
  u.id as user_id,
  COUNT(b.id) as unpaid_bets,
  SUM(COALESCE(b.potential_win, b.amount * b.odds)) as total_owed,
  u.balance as current_balance,
  u.balance + SUM(COALESCE(b.potential_win, b.amount * b.odds)) as balance_after_payout
FROM bets b
JOIN users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' 
  AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' 
    OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'
    OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at >= b.updated_at - INTERVAL '10 seconds'
      AND t.created_at <= b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  )
GROUP BY u.username, u.id, u.balance
ORDER BY total_owed DESC;

-- ============================================
-- DANGER ZONE: ACTUAL PAYOUT EXECUTION
-- Only run this after confirming the above queries show correct data
-- ============================================

-- IMPORTANT: This section is commented out for safety
-- To execute, uncomment and run in a transaction

/*
BEGIN;

-- Create a temporary table to track what we're paying out (OES games only)
CREATE TEMP TABLE payout_tracking AS
SELECT 
  b.id as bet_id,
  b.user_id,
  u.username,
  COALESCE(b.potential_win, b.amount * b.odds) as payout_amount,
  b.selected_team,
  b.bet_type,
  g.home_team,
  g.away_team,
  g.team_type,
  g.game_date
FROM bets b
JOIN users u ON u.id = b.user_id
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' 
  AND b.outcome = 'won'
  AND (
    g.home_team ILIKE '%Oregon Episcopal%' 
    OR g.away_team ILIKE '%Oregon Episcopal%'
    OR g.home_team ILIKE '%OES%'
    OR g.away_team ILIKE '%OES%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'win'
      AND t.created_at >= b.updated_at - INTERVAL '10 seconds'
      AND t.created_at <= b.updated_at + INTERVAL '10 seconds'
      AND ABS(t.amount - COALESCE(b.potential_win, b.amount * b.odds)) < 0.01
  );

-- Show what we're about to pay out
SELECT 'PAYOUTS TO BE PROCESSED (OES GAMES):' as status;
SELECT * FROM payout_tracking ORDER BY game_date, username, bet_id;

-- Update user balances
UPDATE users u
SET balance = balance + (
  SELECT COALESCE(SUM(pt.payout_amount), 0)
  FROM payout_tracking pt
  WHERE pt.user_id = u.id
)
WHERE u.id IN (SELECT DISTINCT user_id FROM payout_tracking);

-- Create transaction records for each payout
INSERT INTO transactions (user_id, type, amount, description, status, created_at)
SELECT 
  pt.user_id,
  'win' as type,
  pt.payout_amount as amount,
  'Retroactive payout for ' || pt.bet_type || ' confidence bet on ' || pt.selected_team || ' (' || pt.payout_amount || ' Valiant Bucks)' as description,
  'completed' as status,
  NOW() as created_at
FROM payout_tracking pt;

-- Create notifications for affected users
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT 
  user_id,
  '💰 Retroactive Payout - OES Games' as title,
  'You received ' || ROUND(SUM(payout_amount), 2) || ' Valiant Bucks from ' || COUNT(*) || ' winning bet(s) on OES games that were not paid out previously. Sorry for the delay!' as message,
  'system' as type,
  false as is_read,
  NOW() as created_at
FROM payout_tracking
GROUP BY user_id;

-- Show final results
SELECT 
  'PAYOUT COMPLETE!' as status,
  COUNT(*) as bets_paid,
  COUNT(DISTINCT user_id) as users_paid,
  SUM(payout_amount) as total_paid
FROM payout_tracking;

-- Show updated user balances
SELECT 
  u.username,
  COUNT(pt.bet_id) as bets_paid,
  SUM(pt.payout_amount) as amount_received,
  u.balance as new_balance
FROM users u
JOIN payout_tracking pt ON pt.user_id = u.id
GROUP BY u.username, u.balance
ORDER BY u.username;

-- Clean up temp table
DROP TABLE payout_tracking;

-- Review the transaction and COMMIT if everything looks good
-- Otherwise ROLLBACK
COMMIT;
-- or: ROLLBACK;
*/

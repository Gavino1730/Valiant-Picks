# Payout Verification Checklist

After running the retroactive payout for OES games, use this checklist to verify everything worked correctly.

## Pre-Payout Verification

Before running the actual payout, complete these checks:

- [ ] **Dry run completed** - Ran the script/endpoint with `dryRun: true`
- [ ] **Numbers look reasonable** - The payout amounts and affected user count make sense
- [ ] **Only OES games** - All games in the report are Oregon Episcopal boys/girls basketball
- [ ] **No duplicates** - No user appears to be getting paid twice for the same bet
- [ ] **Backup created** - (Optional but recommended) Made a database backup

## Post-Payout Verification

After executing the payout (`dryRun: false`), verify these items:

### 1. Check API Response

- [ ] **Status 200** - API returned success status
- [ ] **Correct counts** - `betsProcessed` matches expected number from dry run
- [ ] **Total matches** - `totalPaid` matches expected amount from dry run
- [ ] **No failures** - All results show `status: 'success'` (or failures are explained)

### 2. Verify User Balances

Pick 2-3 users from the payout list and check their accounts:

#### User 1: `___________`
- [ ] **Balance increased** - Current balance = Previous balance + Payout amount
- [ ] **Transaction exists** - New "win" transaction appears in their history
- [ ] **Correct amount** - Transaction amount matches what was expected
- [ ] **Notification sent** - User has a notification about the retroactive payout

#### User 2: `___________`
- [ ] **Balance increased** 
- [ ] **Transaction exists**
- [ ] **Correct amount**
- [ ] **Notification sent**

#### User 3: `___________`
- [ ] **Balance increased**
- [ ] **Transaction exists**
- [ ] **Correct amount**
- [ ] **Notification sent**

### 3. Database Audit

Run the audit script to verify database integrity:

```bash
# In Supabase SQL Editor, run:
```

```sql
-- Check for remaining unpaid OES bets
SELECT 
  COUNT(*) as remaining_unpaid_bets
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
  );
```

Expected result: **0 remaining unpaid bets**

- [ ] **Zero unpaid bets** - Query returns 0 (all OES game winners have been paid)

### 4. Spot Check Transactions

```sql
-- View recent retroactive payout transactions
SELECT 
  t.id,
  u.username,
  t.amount,
  t.description,
  t.created_at
FROM transactions t
JOIN users u ON u.id = t.user_id
WHERE t.type = 'win'
  AND t.description LIKE '%Retroactive%'
  AND t.created_at > NOW() - INTERVAL '1 hour'
ORDER BY t.created_at DESC;
```

- [ ] **Transactions exist** - Query returns the expected number of transactions
- [ ] **Amounts correct** - Random sample of amounts match the dry run report
- [ ] **Descriptions clear** - All include "Retroactive payout" and mention OES

### 5. Check Notifications

```sql
-- View retroactive payout notifications
SELECT 
  n.id,
  u.username,
  n.title,
  n.message,
  n.is_read,
  n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.title LIKE '%Retroactive Payout%'
  AND n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC;
```

- [ ] **Notifications sent** - Each affected user has a notification
- [ ] **Messages correct** - Messages include the payout amount
- [ ] **Type is system** - Notification type is 'system'

### 6. User Experience Check

(Optional but recommended) Log in as one of the affected users:

- [ ] **Balance visible** - Updated balance shows in the UI
- [ ] **Transaction visible** - Transaction appears in transaction history
- [ ] **Notification visible** - Notification appears in notifications panel
- [ ] **Can place new bets** - User can still place bets normally

## Issues Found

If you encounter any issues, document them here:

### Issue 1: `___________________________________`
- **Severity**: [ ] Critical [ ] Major [ ] Minor
- **Description**: 
- **Resolution**: 
- **Status**: [ ] Fixed [ ] Pending

### Issue 2: `___________________________________`
- **Severity**: [ ] Critical [ ] Major [ ] Minor
- **Description**: 
- **Resolution**: 
- **Status**: [ ] Fixed [ ] Pending

## Sign-Off

- **Verified by**: `___________`
- **Date**: `___________`
- **Total amount paid**: `$___________`
- **Users affected**: `___________`
- **All checks passed**: [ ] Yes [ ] No (see issues above)

## Rollback Plan (If Needed)

If critical issues are found and you need to rollback:

```sql
-- DANGER: Only use if you need to undo the payouts
-- This will remove the payout transactions and restore balances

BEGIN;

-- Get the transaction IDs for retroactive payouts
CREATE TEMP TABLE rollback_transactions AS
SELECT id, user_id, amount
FROM transactions
WHERE type = 'win'
  AND description LIKE '%Retroactive%'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Show what will be rolled back
SELECT 
  u.username,
  rt.amount,
  u.balance as current_balance,
  u.balance - rt.amount as balance_after_rollback
FROM rollback_transactions rt
JOIN users u ON u.id = rt.user_id;

-- Reverse the balance updates
UPDATE users u
SET balance = balance - (
  SELECT COALESCE(SUM(rt.amount), 0)
  FROM rollback_transactions rt
  WHERE rt.user_id = u.id
)
WHERE u.id IN (SELECT user_id FROM rollback_transactions);

-- Delete the transactions
DELETE FROM transactions
WHERE id IN (SELECT id FROM rollback_transactions);

-- Delete the notifications
DELETE FROM notifications
WHERE title LIKE '%Retroactive Payout%'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Review and commit if correct
-- COMMIT;
-- or ROLLBACK;
```

- [ ] **Rollback executed** (if needed)
- [ ] **Balances verified** after rollback
- [ ] **Root cause identified** 

## Notes

Use this section for any additional observations or notes:

---
---
---

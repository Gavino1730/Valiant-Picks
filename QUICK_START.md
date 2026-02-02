# ⚡ Quick Start: Pay Out OES Game Winnings

Users didn't get paid for winning bets on Oregon Episcopal (OES) games. Here's how to fix it in 3 steps:

## Step 1: Get Your Admin Token

1. Go to https://valiantpicks.com
2. Log in as admin
3. Press F12 (open DevTools)
4. Go to: Application → Local Storage → https://valiantpicks.com
5. Copy the value of the `token` key

## Step 2: Run Dry Run (Safe - No Changes)

```bash
cd /home/runner/work/Betting/Betting
node test-retroactive-payout.js YOUR_TOKEN_HERE
```

This will show you:
- How many bets need to be paid
- Which users will be paid
- How much each user will receive

**Example output:**
```
✅ DRY RUN RESULTS

Summary:
  • Bets to process: 8
  • Affected users: 4
  • Total payout: $1,250.00

Breakdown by User:

john_doe (abc-123):
  • 2 bet(s)
  • Total owed: $400.00
  • Bets:
    - Bet #123: $100 @ 2.0x = $200.00
      Boys Basketball on 1/13/26
    - Bet #124: $100 @ 2.0x = $200.00
      Girls Basketball on 1/13/26
```

## Step 3: Execute Payouts (Only if dry run looks correct!)

```bash
node test-retroactive-payout.js YOUR_TOKEN_HERE execute
```

This will:
- ✅ Credit user balances
- ✅ Create transaction records
- ✅ Send notifications to users
- ✅ Show confirmation of payouts

**Done!** Users have been paid and notified.

## Verification

After running, verify a few things:

1. **Check a user's balance** - Did it increase by the right amount?
2. **Check transactions** - Do they have new "win" transactions?
3. **Check notifications** - Did they get a notification about the payout?

Run the audit query in Supabase to confirm no unpaid bets remain:

```sql
SELECT COUNT(*) FROM bets b
LEFT JOIN games g ON g.id = b.game_id
WHERE b.status = 'resolved' AND b.outcome = 'won'
  AND (g.home_team ILIKE '%Oregon Episcopal%' OR g.away_team ILIKE '%Oregon Episcopal%')
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = b.user_id AND t.type = 'win'
    AND t.created_at >= b.updated_at - INTERVAL '10 seconds'
  );
```

Should return: **0** (zero unpaid bets)

## Need Help?

See detailed guides:
- **[PAYOUT_GUIDE.md](PAYOUT_GUIDE.md)** - More detailed instructions
- **[database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md](database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md)** - All methods (API, SQL)
- **[PAYOUT_VERIFICATION.md](PAYOUT_VERIFICATION.md)** - Complete verification checklist

## Safety Notes

- ✅ Dry run mode is **safe** - it makes no changes
- ✅ Won't pay same bet twice (checks for existing transactions)
- ✅ Only processes OES games
- ✅ Admin authentication required
- ✅ All payouts are logged

## Troubleshooting

**"No unpaid winning bets found"**
- Either all bets were already paid, or no OES games have winning bets

**"Permission denied" or 403 error**
- Your token may have expired. Get a fresh one from the browser

**Payout amounts look wrong**
- Don't execute! Check the dry run output carefully
- Verify the game results in the database are correct

## What Gets Fixed

This pays out users who:
1. Won bets on Oregon Episcopal (OES) boys or girls basketball games
2. Had their bets marked as "resolved" with outcome "won"
3. Never received a corresponding "win" transaction

The bug that caused this has been fixed in PR #17, so future games will work correctly.

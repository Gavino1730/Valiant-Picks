# How to Pay Out Missed OES Game Winnings

## Problem Statement

Users placed winning bets on Oregon Episcopal (OES) boys and girls basketball games, but the payouts were not processed correctly. This guide explains how to retroactively pay those users.

## Quick Start (Recommended Method)

The **easiest and safest** way is to use the admin API endpoint:

### 1. Get Your Admin Token

Log in to https://valiantpicks.com as admin, open DevTools (F12), go to Application → Local Storage, and copy the `token` value.

### 2. Run Dry Run Test

```bash
node test-retroactive-payout.js YOUR_ADMIN_TOKEN
```

This shows what would be paid out **without making any changes**.

### 3. Execute Payouts (if dry run looks good)

```bash
node test-retroactive-payout.js YOUR_ADMIN_TOKEN execute
```

This will actually pay out the users.

## Detailed Instructions

For comprehensive step-by-step instructions, see:
- **[database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md](database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md)** - Full guide for both API and SQL methods

## What Gets Fixed

This script will:
1. ✅ Identify all winning bets on OES games that weren't paid
2. ✅ Calculate correct payout amounts (bet amount × odds)
3. ✅ Credit user balances with the missing winnings
4. ✅ Create transaction records for audit trail
5. ✅ Send notifications to affected users

## Safety Features

- **Dry run mode** - Preview changes before executing
- **Idempotent** - Won't pay the same bet twice
- **Admin-only** - Requires admin authentication
- **Transaction logging** - All payouts are tracked
- **User notifications** - Users are informed of payouts

## Files

- **test-retroactive-payout.js** - Node.js test script (recommended)
- **database/retroactive-payout.sql** - SQL script for direct database access
- **database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md** - Comprehensive instructions
- **server/routes/games.js** - API endpoint implementation (line ~740)

## Troubleshooting

### "No unpaid winning bets found"
This could mean:
- All bets were already paid ✅
- No winning bets exist for OES games
- Game names don't match the filter (check that games include "Oregon Episcopal" or "OES" in team names)

### "Permission denied" or "403"
- Make sure you're using a valid admin JWT token
- Check that your admin account has `is_admin = true` in the database

### Wrong payout amounts
Double-check:
1. The `potential_win` field in bets table
2. The `odds` match the confidence level (low=1.2, medium=1.5, high=2.0)
3. The bet `amount` is correct

## Alternative Methods

### Method 1: API Endpoint (Recommended)
Use the Node.js test script (as shown above) or call the endpoint directly with curl/Postman.

### Method 2: SQL Script
For advanced users comfortable with SQL, you can run the SQL script directly in Supabase SQL Editor. See the full instructions in `database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md`.

## After Payout

Once payouts are complete:
1. ✅ Verify user balances increased correctly
2. ✅ Check transaction records exist
3. ✅ Confirm users received notifications
4. ✅ Run the audit script to verify no issues remain

```bash
# Run audit to verify everything is clean
psql < database/audit-bets.sql
```

## Questions?

If you need help:
1. Run the dry run mode first - it's completely safe
2. Check the full instructions in `database/RETROACTIVE_PAYOUT_INSTRUCTIONS.md`
3. Review the code in `server/routes/games.js` (search for `retroactive-payout-oes`)

## Technical Details

The payout logic:
- Uses `potential_win` from bet record, or calculates `amount × odds` if not stored
- Filters to only games where team name includes "Oregon Episcopal" or "OES" (case-insensitive)
- Checks for existing win transactions within ±10 seconds of bet resolution to avoid duplicates
- Creates transaction records with type='win' for audit trail
- Sends system notification to each affected user

The payout issue was fixed in PR #17, so future games should work correctly.

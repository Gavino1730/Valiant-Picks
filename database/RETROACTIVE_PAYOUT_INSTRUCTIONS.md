# Retroactive Payout Instructions - OES Games

## Problem
Users placed winning bets on the OES (Oregon Episcopal) boys and girls basketball games, but the payouts were not processed correctly. This script will identify those unpaid winning bets and credit users their winnings.

## What This Script Does

1. **Identifies unpaid winning bets** - Finds all bets that:
   - Are marked as "resolved" with outcome "won"
   - Are for games involving "Oregon Episcopal" or "OES" teams
   - Don't have a corresponding "win" transaction in the database

2. **Calculates correct payouts** - Uses the formula:
   - Payout = `potential_win` (if stored) OR `bet_amount × odds`

3. **Updates user balances** - Adds the missing winnings to user accounts

4. **Creates transaction records** - Logs each payout as a "win" transaction

5. **Sends notifications** - Notifies users about their retroactive payouts

## How to Use This Script

## SQL Script Method (Alternative)

If you prefer to run SQL directly in Supabase (or if the API endpoint isn't available yet):

### Step 1: Review the Data (READ-ONLY)

First, run the **read-only queries** to see what will be paid out:

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste **ONLY the first 3 queries** from `retroactive-payout.sql` (up to line 97)
3. Run the queries to see:
   - Detailed list of unpaid bets
   - Summary of total amount owed
   - Breakdown by user

**Example output:**
```
=== UNPAID WINNING BETS FOR OES GAMES ===
bet_id | username | bet_amount | odds | calculated_payout | game_date
-------|----------|------------|------|-------------------|----------
123    | john_doe | 100        | 2.0  | 200              | 1/13/26
456    | jane_doe | 50         | 1.5  | 75               | 1/13/26

=== SUMMARY ===
unpaid_bet_count: 2
affected_users: 2
total_owed: 275
```

### Step 2: Verify the Data

Review the output and verify:
- ✅ The games are OES games (boys or girls basketball)
- ✅ The bet amounts and odds look correct
- ✅ The calculated payouts match what you expect
- ✅ No duplicate bets are showing up

### Step 3: Execute the Payout (DANGEROUS - MODIFIES DATABASE)

Once you've verified the data is correct:

1. Locate the **commented transaction block** in `retroactive-payout.sql` (starts at line 102)
2. **UNCOMMENT** the entire transaction block (remove the `/*` at the start and `*/` at the end)
3. Copy the entire uncommented transaction block
4. Paste it into Supabase SQL Editor
5. **Review one more time** - this will modify the database!
6. Click "Run" to execute

The script will:
- Show you exactly what it's about to pay out
- Update user balances
- Create transaction records
- Send notifications to users
- Show a summary of what was paid

### Step 4: Verify the Payout

After running the payout:

1. Check the summary output shows correct numbers
2. Verify a few user accounts in the Supabase dashboard:
   - Check their balance increased correctly
   - Check their transactions include the new "win" entries
   - Check they received a notification

### Step 5: Commit or Rollback

The script runs in a **transaction**, which means:
- If everything looks good → Keep the `COMMIT;` at the end
- If something went wrong → Change `COMMIT;` to `ROLLBACK;` before you see the "transaction complete" message

## Safety Features

✅ **Transaction-based** - If anything fails, all changes are rolled back automatically

✅ **Temporary table** - Tracks exactly what's being paid out before making changes

✅ **Idempotent** - Won't pay the same bet twice (checks for existing transactions)

✅ **Filtered to OES only** - Only processes bets for Oregon Episcopal games

## Troubleshooting

### "No rows returned"
This means there are no unpaid winning bets for OES games. Either:
- All bets were already paid
- No winning bets exist for OES games
- The game name doesn't match the filter (check game names in database)

### "Permission denied"
You need to be logged in as a Supabase admin to run these queries. Make sure you're using the Supabase dashboard SQL Editor, not the API.

### Payout amounts seem wrong
Double-check:
1. The `potential_win` field in the bets table
2. The `odds` field matches the confidence level
3. The bet `amount` is correct

### Users report they still didn't get paid
Check:
1. Their transaction history - look for a recent "win" transaction
2. Their balance before and after the script ran
3. Run the audit script again to see if their bets still show as unpaid

## Alternative: Admin API Endpoint (RECOMMENDED)

The easiest and safest way to process the payouts is through the admin API endpoint. This method:
- ✅ Requires admin authentication
- ✅ Includes a dry-run mode to preview changes
- ✅ Has built-in error handling
- ✅ Automatically sends notifications

### Using the API Endpoint

#### Step 1: Dry Run (Preview Only)

First, run a dry run to see what would be paid out without making any changes:

**Using curl:**
```bash
curl -X POST https://valiantpicks.com/api/games/retroactive-payout-oes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"dryRun": true}'
```

**Using Postman:**
1. Create a new POST request to: `https://valiantpicks.com/api/games/retroactive-payout-oes`
2. Add header: `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`
3. Add JSON body: `{"dryRun": true}`
4. Click Send

**Response Example:**
```json
{
  "dryRun": true,
  "message": "DRY RUN - No changes made. Set dryRun=false to execute payouts.",
  "summary": {
    "betsToProcess": 5,
    "affectedUsers": 3,
    "totalPayout": 450.50
  },
  "userPayouts": [
    {
      "userId": "abc123",
      "username": "john_doe",
      "betCount": 2,
      "totalOwed": 200.00,
      "bets": [
        {
          "betId": 123,
          "amount": 100,
          "odds": 2.0,
          "payout": 200,
          "gameDate": "1/13/26",
          "teamType": "Boys Basketball"
        }
      ]
    }
  ]
}
```

#### Step 2: Review the Dry Run Results

Check the response to verify:
- ✅ The number of bets looks correct
- ✅ The payout amounts are accurate
- ✅ The affected users are who you expect
- ✅ No unexpected data appears

#### Step 3: Execute the Payout

Once you've verified the dry run results, execute the actual payout:

**Using curl:**
```bash
curl -X POST https://valiantpicks.com/api/games/retroactive-payout-oes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"dryRun": false}'
```

**Using Postman:**
1. Same request as before
2. Change JSON body to: `{"dryRun": false}`
3. Click Send

**Success Response:**
```json
{
  "message": "Retroactive payouts processed",
  "betsProcessed": 5,
  "totalPaid": 450.50,
  "affectedUsers": 3,
  "results": [
    {
      "betId": 123,
      "userId": "abc123",
      "payout": 200,
      "status": "success"
    }
  ]
}
```

#### Step 4: Verify

After executing:
1. Check a few user accounts to confirm their balances increased
2. Check transaction histories show the retroactive payouts
3. Verify users received notifications

### Getting Your Admin JWT Token

To get your admin JWT token:

1. **From Browser (easiest):**
   - Log in to Valiant Picks as admin
   - Open browser DevTools (F12)
   - Go to Application/Storage → Local Storage
   - Find the `token` key
   - Copy the value

2. **From API:**
   ```bash
   curl -X POST https://valiantpicks.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "your_admin_username", "password": "your_password"}'
   ```
   The response will include a `token` field.

## SQL Script Method (Alternative)

**Recommended Approach:** Use the API endpoint method (described above) as it's safer and easier. Only use the SQL method if you're comfortable with SQL and direct database access.

If you're unsure about any step, it's better to:
1. Run the dry-run API endpoint multiple times to verify the data
2. Test on a staging/development database first
3. Make a backup of the production database before running
4. Reach out for help if anything looks wrong

## After Payout

Once payouts are complete:
1. ✅ Check user balances are correct
2. ✅ Verify transaction records exist
3. ✅ Confirm notifications were sent
4. ✅ Test that future game resolutions work properly
5. ✅ Document any issues that arose

The payout logic has been fixed in the codebase (PR #17), so future games should pay out correctly automatically.

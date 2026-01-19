# 🚀 Deployment & Testing Checklist

## Pre-Deployment

### 1. Code Review
- [x] All backend files updated
- [x] All frontend files updated
- [x] Database migration created
- [x] Routes registered in server.js
- [x] No TypeScript/linting errors

### 2. Backup
- [ ] Backup Supabase database
- [ ] Export current user data
- [ ] Save current balance totals
- [ ] Document current achievement counts

## Database Migration

### 1. Run Migration Script
```sql
-- In Supabase SQL Editor
-- Copy entire content of: database/enhanced-rewards-migration.sql
-- Execute and verify no errors
```

### 2. Verify Tables Created
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'bonus_multipliers',
  'periodic_bonuses', 
  'referrals'
);

-- Should return 3 rows
```

### 3. Verify Columns Added
```sql
-- Check bets table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bets' AND column_name = 'girls_game_bonus';

-- Check users table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'referral_code';
```

### 4. Verify Functions Created
```sql
-- List database functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name IN (
  'calculate_girls_game_bonus',
  'check_all_girls_games_bet',
  'award_weekly_bonuses'
);

-- Should return 3 rows
```

### 5. Test Functions
```sql
-- Test girls game bonus calculation
SELECT calculate_girls_game_bonus(
  'your-user-id-here'::uuid,
  'girls'
);

-- Should return a decimal (0.10 for 10%)

-- Test girls games check
SELECT check_all_girls_games_bet('your-user-id-here'::uuid);

-- Should return true or false
```

## Backend Deployment

### 1. Commit Changes
```bash
git add .
git commit -m "Add girls game incentives and enhanced rewards system"
git push origin main
```

### 2. Deploy to Railway
```bash
# Railway auto-deploys from GitHub
# Monitor deployment logs
railway logs

# Or manually deploy
railway up
```

### 3. Verify Backend Health
```bash
# Check health endpoint
curl https://valiantpicks.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 4. Test New Endpoints
```bash
# Get bonus multipliers (public)
curl https://valiantpicks.com/api/periodic-bonuses/multipliers

# Should return array of bonus configs

# Get referral code (authenticated)
curl https://valiantpicks.com/api/referrals/code \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"referral_code":"ABC12345"}
```

## Frontend Deployment

### 1. Build Frontend
```bash
cd client
npm run build
```

### 2. Test Build Locally
```bash
# Serve build folder
npx serve -s build

# Open http://localhost:3000
# Verify girls game bonus banner appears
```

### 3. Deploy to Cloudflare Pages
```bash
# Push to your Cloudflare Pages repo
git push cloudflare main

# Or use Cloudflare Pages dashboard
# Upload build folder
```

### 4. Verify Frontend Loads
```bash
# Visit production site
open https://valiantpicks.com

# Check for:
# - Girls game bonus banner
# - No console errors
# - Games load correctly
```

## Testing Workflow

### Test 1: Girls Game Bonus Display ✓
1. [ ] Open games page
2. [ ] Verify bonus banner appears (pink, animated)
3. [ ] Click on a girls basketball game
4. [ ] Verify bet slip shows "🎀 Girls Game Bonus: +10% to +25%"
5. [ ] Enter amount and confidence
6. [ ] Verify bonus payout calculation shows

**Expected Result:**
```
Base Payout: 150 VB
🎀 With Girls Bonus: Up to 187 VB
```

### Test 2: Place Girls Game Bet ✓
1. [ ] Place bet on girls game
2. [ ] Check notification includes 🎀 emoji
3. [ ] Verify balance deducted correctly
4. [ ] Check database: `SELECT girls_game_bonus FROM bets WHERE id = ?`
5. [ ] Verify bonus value stored (0.10 = 10%)

**Expected Result:**
```
Notification: ✅🎀 Bet Placed!
Medium confidence bet... 🎀 +10% Girls Game Bonus!
```

### Test 3: Girls Game Win with Bonus ✓
1. [ ] Admin: Set girls game outcome to winner
2. [ ] Verify winning bet credited with bonus
3. [ ] Check notification mentions bonus percentage
4. [ ] Verify balance updated correctly
5. [ ] Check transaction includes bonus info

**Expected Result:**
```
Payout: 165 VB (150 base + 15 bonus)
Notification: 🎉🎀 Bet Won with Bonus!
Your medium confidence bet on Team won 165 Valiant 
Bucks (including +10% girls game bonus)!
```

### Test 4: Achievement Unlocks ✓
1. [ ] Place 3 consecutive girls game bets
2. [ ] Verify "Girls Streak 3" achievement unlocks
3. [ ] Check achievement modal appears
4. [ ] Claim achievement reward
5. [ ] Verify balance credited

**Expected Result:**
```
Achievement: 💖 Girls Streak 3
Reward: +100 VB
```

### Test 5: Girls Game Milestones ✓
1. [ ] Place 5th girls game bet
2. [ ] Verify "Girls Supporter" unlocks (150 VB)
3. [ ] Place 20th girls game bet
4. [ ] Verify "Girls Champion" unlocks (300 VB)

### Test 6: Betting Milestones ✓
1. [ ] Place 10th total bet
2. [ ] Verify "Bets 10" achievement unlocks (100 VB)
3. [ ] Win 10th bet
4. [ ] Verify "Wins 10" achievement unlocks (150 VB)

### Test 7: Referral System ✓
1. [ ] Generate referral code: GET `/api/referrals/code`
2. [ ] Register new account with code
3. [ ] Verify new user gets 50 VB immediately
4. [ ] New user places first bet
5. [ ] Verify referrer gets 100 VB
6. [ ] Check `/api/referrals/stats` shows referral

**Expected Flow:**
```
1. User A gets code: "SARAH123"
2. User B registers with "SARAH123"
   - User B balance: 1,050 VB (1000 + 50 bonus)
   - User A notification: "New Referral!"
3. User B places first bet
   - User A balance: +100 VB
   - User A notification: "Referral Complete! +100 VB"
```

### Test 8: Weekly Bonuses (Admin) ✓
1. [ ] Admin: POST `/api/periodic-bonuses/award-weekly`
2. [ ] Verify top users receive bonus records
3. [ ] Check notifications sent
4. [ ] User claims bonus
5. [ ] Verify balance credited

**Expected Result:**
```sql
-- Check bonuses created
SELECT * FROM periodic_bonuses 
WHERE bonus_type = 'weekly_top10' 
ORDER BY created_at DESC;

-- User should see claimable bonus
```

### Test 9: Bonus Multiplier Admin ✓
1. [ ] Admin: GET `/api/periodic-bonuses/multipliers`
2. [ ] Verify all multipliers returned
3. [ ] Admin: PUT multiplier to 15%
4. [ ] Place new girls bet
5. [ ] Verify 15% bonus applied (not 10%)

```bash
# Change base bonus to 15%
curl -X PUT https://valiantpicks.com/api/periodic-bonuses/multipliers/girls_game_base \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 0.15, "is_active": true}'
```

### Test 10: Streak Bonus Activation ✓
1. [ ] Place 3 consecutive girls game bets
2. [ ] On 3rd bet, verify bonus increases to 15%
3. [ ] Place 7 consecutive girls game bets
4. [ ] On 7th bet, verify bonus increases to 25%
5. [ ] Place non-girls bet
6. [ ] Next girls bet should reset to 10%

## Performance Testing

### Load Testing
```bash
# Test with 10 concurrent users
ab -n 100 -c 10 https://valiantpicks.com/api/games

# Test bet placement
ab -n 50 -c 5 -p bet.json -T application/json \
  -H "Authorization: Bearer TOKEN" \
  https://valiantpicks.com/api/bets
```

### Database Performance
```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT calculate_girls_game_bonus('user-id'::uuid, 'girls');

-- Should complete in < 50ms

-- Check indexes
SELECT * FROM pg_indexes 
WHERE tablename IN (
  'bonus_multipliers',
  'periodic_bonuses',
  'referrals'
);
```

## Monitoring

### Week 1 Metrics to Track
- [ ] Total girls game bets (target: +50%)
- [ ] Girls/boys bet ratio (target: 40/60)
- [ ] Total bonuses awarded
- [ ] Achievement claim rate
- [ ] New user signups (referrals)
- [ ] Weekly bonus claimants

### SQL Queries for Metrics
```sql
-- Girls game betting rate
SELECT 
  COUNT(CASE WHEN g.team_type = 'girls' THEN 1 END) as girls_bets,
  COUNT(CASE WHEN g.team_type = 'boys' THEN 1 END) as boys_bets,
  COUNT(*) as total_bets
FROM bets b
JOIN games g ON b.game_id = g.id
WHERE b.created_at >= NOW() - INTERVAL '7 days';

-- Total bonuses awarded
SELECT 
  SUM(girls_game_bonus * potential_win) as total_bonus_value
FROM bets
WHERE girls_game_bonus > 0
AND created_at >= NOW() - INTERVAL '7 days';

-- Achievement claims
SELECT 
  achievement_type,
  COUNT(*) as count,
  SUM(reward_amount) as total_rewards
FROM achievements
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY achievement_type
ORDER BY count DESC;

-- Referral stats
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  SUM(CASE WHEN referrer_rewarded THEN referrer_reward ELSE 0 END) as rewards_paid
FROM referrals;
```

## Rollback Plan

### If Issues Occur

#### Option 1: Disable Bonuses
```sql
-- Disable all bonus multipliers
UPDATE bonus_multipliers SET is_active = false;
```

#### Option 2: Remove Bonus Banner
```javascript
// Comment out in Games.js
{/* Girls Game Bonus Promotion */}
{/* <div className="bonus-promo-banner">...</div> */}
```

#### Option 3: Rollback Database
```sql
-- Drop new tables
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS periodic_bonuses CASCADE;
DROP TABLE IF EXISTS bonus_multipliers CASCADE;

-- Remove new columns
ALTER TABLE bets DROP COLUMN IF EXISTS girls_game_bonus;
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_girls_game_bonus;
DROP FUNCTION IF EXISTS check_all_girls_games_bet;
DROP FUNCTION IF EXISTS award_weekly_bonuses;
```

#### Option 4: Rollback Code
```bash
git revert HEAD
git push origin main
```

## Success Criteria

### Technical Success ✓
- [ ] No errors in production logs
- [ ] All endpoints responding
- [ ] Database queries < 100ms
- [ ] Frontend loads in < 2s

### Business Success (Week 1) ✓
- [ ] Girls game bets increase 30%+
- [ ] At least 50 achievements claimed
- [ ] At least 5 referral signups
- [ ] No user complaints about bonuses

### Business Success (Month 1) ✓
- [ ] Girls/boys ratio reaches 45/55
- [ ] Weekly bonuses distributed 4 times
- [ ] 100+ achievements claimed
- [ ] 20+ referrals completed

## Post-Deployment

### Day 1
- [ ] Monitor error logs every 2 hours
- [ ] Check user feedback/complaints
- [ ] Verify bonuses calculating correctly
- [ ] Watch database performance

### Week 1
- [ ] Award first weekly bonuses (Sunday)
- [ ] Review metrics dashboard
- [ ] Survey users about new features
- [ ] Adjust multipliers if needed

### Month 1
- [ ] Analyze full month data
- [ ] Calculate ROI on bonuses
- [ ] Plan additional achievements
- [ ] Consider automated weekly awards

## Documentation

### Update Documentation
- [x] ENHANCED_REWARDS_GUIDE.md
- [x] GIRLS_GAME_INCENTIVES_SUMMARY.md
- [x] GIRLS_GAME_FLOW_EXAMPLE.md
- [ ] Update README.md with new features
- [ ] Update API.md with new endpoints
- [ ] Update CHANGELOG.md

### User Communication
- [ ] Announce new features in app
- [ ] Send email to all users
- [ ] Post on social media
- [ ] Create tutorial video

## Support Preparation

### Common Issues & Solutions

**Issue**: "Bonus not showing in bet slip"
**Solution**: Verify game has team_type='girls' in database

**Issue**: "Achievement not unlocking"
**Solution**: Check database functions ran correctly

**Issue**: "Referral code not working"
**Solution**: Verify code exists in users table

**Issue**: "Bonus not added to winnings"
**Solution**: Check girls_game_bonus column value

### Support Scripts
```sql
-- Check user's girls game bonus status
SELECT 
  b.id,
  b.amount,
  b.odds,
  b.girls_game_bonus,
  b.potential_win,
  g.team_type
FROM bets b
JOIN games g ON b.game_id = g.id
WHERE b.user_id = 'user-id'
AND g.team_type = 'girls'
ORDER BY b.created_at DESC;

-- Manually award achievement
INSERT INTO achievements (
  user_id, 
  achievement_type, 
  achievement_date, 
  reward_amount, 
  description,
  claimed
) VALUES (
  'user-id',
  'girls_supporter',
  CURRENT_DATE,
  150,
  'Bet on 5 girls games!',
  false
);
```

---

## ✅ Final Checks Before Go-Live

- [ ] Database migration completed successfully
- [ ] Backend deployed and health check passes
- [ ] Frontend deployed and loads correctly
- [ ] At least 3 test scenarios completed
- [ ] Monitoring dashboards set up
- [ ] Rollback plan documented and ready
- [ ] Support team briefed
- [ ] User announcement prepared

## 🚀 Ready to Launch!

Once all checks pass, you're ready to go live with the enhanced rewards system!

**Remember**: Start small, monitor closely, and adjust as needed. The beauty of this system is that you can tweak bonus multipliers on the fly without code changes.

Good luck! 🎉

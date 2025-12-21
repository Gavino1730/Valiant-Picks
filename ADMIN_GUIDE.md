# 🎮 Valiant Picks - Admin Quick Reference

## 🔐 First-Time Admin Setup

After deploying the site, you need to manually set an admin user:

1. Register your account through the website
2. Go to Supabase SQL Editor
3. Run this query:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```
4. Log out and log back in

## 🎯 Common Admin Tasks

### Add Games

**Option 1: Seed from Team Schedules** (Recommended)
1. Go to Admin Panel → Manage Games
2. Click "📥 Seed from Schedules"
3. System will import all scheduled games
4. Duplicates are automatically prevented

**Option 2: Manual Creation**
1. Go to Admin Panel → Manage Games
2. Click "+ Create Game"
3. Fill in all fields:
   - Sport Type (Boys/Girls Basketball)
   - Home Team & Away Team
   - Date, Time, Location
   - Odds (default: 1.95 for both teams)
4. Click "Create Game"

### Make Games Visible to Users

**For Individual Games:**
1. Find the game in Manage Games
2. Click "👁️ Toggle Visibility"
3. Confirm the action

**For All Games:**
1. Go to Admin Panel → Manage Games
2. Click "👁️ Show All"
3. Confirm the action

### Hide Games from Users

**For Individual Games:**
1. Find the game in Manage Games
2. Click "👁️ Toggle Visibility" (if visible)

**For All Games:**
1. Go to Admin Panel → Manage Games
2. Click "🚫 Hide All"
3. Confirm the action

### Resolve Game Outcomes

1. Go to Admin Panel → Manage Games
2. Find the completed game
3. Click "⚙️ Set Outcome"
4. Select the winning team
5. Click "Save Outcome"
6. System automatically:
   - Marks all bets as resolved
   - Calculates and distributes winnings
   - Updates user balances
   - Creates notifications

### Delete Games

**Individual Game:**
1. Find the game in Manage Games
2. Click "🗑️ Delete"
3. Confirm deletion

**All Games:**
1. Click "🗑️ Delete All"
2. Confirm TWICE (cannot be undone!)

### Manage Teams

1. Go to Admin Panel → Manage Teams
2. Select a team
3. Tabs available:
   - **Info**: Edit team details, record, coach info
   - **Roster**: View players (read-only)
   - **Schedule**: View games (read-only)

**Note**: Player and schedule editing happens via seed scripts, not UI.

### View All Bets

1. Go to Admin Panel → Manage Bets
2. See all user bets with:
   - User name
   - Game details
   - Amount and confidence
   - Status and outcome
   - Potential winnings

### Manage User Balances

1. Go to Admin Panel → Manage Users
2. Find the user
3. Enter new balance amount
4. Click "Update"
5. Confirm the change

**Common Scenarios:**
- Reward for event: Add Valiant Bucks
- Reset after glitch: Set to specific amount
- Test account: Set to 10,000 for testing

### Create Prop Bets

1. Go to Admin Panel → Prop Bets tab
2. Click "Create Prop Bet"
3. Fill in:
   - Title (e.g., "Will Boys team win tournament?")
   - Description
   - Team Type (Boys/Girls/General)
   - YES odds (e.g., 1.8)
   - NO odds (e.g., 1.8)
   - Expiration date/time
4. Click "Create"

### Resolve Prop Bets

1. Go to Admin Panel → Prop Bets tab
2. Find the prop bet
3. Click "Resolve"
4. Select outcome (YES or NO)
5. Confirm
6. System auto-distributes winnings

## 📊 Monitoring

### Check User Activity
- Go to Admin Panel → Manage Users
- View balances and statistics
- Sort by balance to see top users

### View Betting Patterns
- Go to Admin Panel → Manage Bets
- Filter by game or status
- Analyze confidence levels

### Track Game Performance
- Go to Admin Panel → Manage Games
- See game counts by sport
- Monitor visibility status

## 🚨 Troubleshooting

### Users Can't See Games
**Solution**: Check if games are visible
1. Admin Panel → Manage Games
2. Look for games with "Hidden" status
3. Click "👁️ Show All" or toggle individual games

### Bets Not Resolving
**Solution**: Manually set game outcome
1. Admin Panel → Manage Games
2. Find the game
3. Click "⚙️ Set Outcome"
4. Select winner and save

### User Balance Issues
**Solution**: Manually adjust balance
1. Admin Panel → Manage Users
2. Find the user
3. Set correct balance
4. Update

### Duplicate Games After Seeding
**Solution**: Seeding now prevents duplicates
- Old duplicates: Delete manually
- Future: Seed button won't create duplicates

## 💡 Best Practices

### Before Game Day
1. Seed upcoming games (1 week in advance)
2. Set all new games to HIDDEN
3. Review game details for accuracy
4. Day before: Make games VISIBLE

### After Game Completion
1. Set outcome as soon as score is final
2. Verify winnings distributed correctly
3. Check for any user complaints
4. Archive completed games (keep for history)

### Weekly Maintenance
1. Check for user balance issues
2. Review leaderboard for accuracy
3. Clean up very old completed games
4. Seed next week's games

### User Support
1. Check Manage Users for specific user issues
2. Review their bet history in Manage Bets
3. Can adjust balance if legitimate issue
4. Cannot reverse completed bets

## 🎯 Quick Commands

### SQL Queries (Supabase SQL Editor)

**Make user admin:**
```sql
UPDATE users SET is_admin = true WHERE email = 'email@example.com';
```

**View all admins:**
```sql
SELECT id, username, email, is_admin FROM users WHERE is_admin = true;
```

**Check total Valiant Bucks in circulation:**
```sql
SELECT SUM(balance) as total_valiant_bucks FROM users;
```

**View top 10 users:**
```sql
SELECT username, balance 
FROM users 
WHERE is_admin = false 
ORDER BY balance DESC 
LIMIT 10;
```

**See all pending bets:**
```sql
SELECT u.username, g.home_team, g.away_team, b.amount, b.selected_team
FROM bets b
JOIN users u ON b.user_id = u.id
JOIN games g ON b.game_id = g.id
WHERE b.status = 'pending'
ORDER BY b.created_at DESC;
```

## 📱 Mobile Admin Access

The admin panel works on mobile but is optimized for desktop/tablet. For best experience:
- Use tablet or larger (10" screen minimum)
- Landscape orientation recommended
- Bulk operations easier on desktop

## 🆘 Emergency Contacts

**Technical Issues:**
- Railway (Backend): Check deployment logs
- Cloudflare (Frontend): Check Pages dashboard
- Supabase (Database): Check database health

**For Critical Issues:**
1. Check DEPLOYMENT_CHECKLIST.md
2. Review logs in Railway
3. Check Supabase activity
4. Rollback if necessary

---

**Last Updated**: December 21, 2025
**Version**: 1.0.0

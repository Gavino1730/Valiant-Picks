# Valiant Picks - Bug & Issues Report
*Generated: January 10, 2026*

## 🔴 CRITICAL ISSUES

### 1. **Balance Restoration Logic Bug in Dashboard**
**File**: [Dashboard.js](client/src/components/Dashboard.js#L309-L318)  
**Severity**: HIGH  
**Type**: Logic Error

**Issue**: When a bet fails, the balance restoration uses the `balance` variable from closure, but this is the OLD balance (before optimistic update). If a second bet is placed before the first one fails, the second bet would use the incorrect balance.

**Current Code**:
```javascript
const newBalance = balance - betAmount;  // e.g., 1000 - 100 = 900
setBalance(newBalance);

try {
  await apiClient.post('/bets', betData);
  // ... success
} catch (betError) {
  setBalance(balance);  // ❌ Restores to old value (1000), not keeping second bet deduction
  throw betError;
}
```

**Scenario**: 
1. User has $1000
2. Places first bet for $100 (balance optimistically updated to $900)
3. Immediately places second bet for $100 (balance optimistically updated to $800)
4. First bet fails → balance restored to $1000 (WRONG! Should be $900)

**Fix**: Use the server-returned balance from success case or a proper state queue system.

---

### 2. **Race Condition in Dashboard Balance Fetch**
**File**: [Dashboard.js](client/src/components/Dashboard.js#L309-L318)  
**Severity**: HIGH  
**Type**: Race Condition

**Issue**: After successful bet, code fetches balance from `/users/profile`, but there's a gap where user could place another bet with stale balance.

```javascript
await apiClient.post('/bets', betData);  // Bet placed
// ... small delay ...
const userResponse = await apiClient.get('/users/profile');  // Async fetch
```

If another bet is placed during this async fetch, it uses the pre-update balance.

**Fix**: Use response from POST endpoint directly or implement proper queue system.

---

### 3. **Games.js Prop Bet Balance Issue Differs from Dashboard**
**File**: [Games.js](client/src/components/Games.js#L219-L280)  
**Severity**: HIGH  
**Type**: Inconsistency

**Issue**: Games.js uses `originalBalance` variable for restoration, but Dashboard.js uses `balance` closure variable. This inconsistency could cause issues if either component has subsequent bets.

**Games.js** (correct for single bet):
```javascript
const originalBalance = balance;
const newBalance = balance - amount;
setBalance(newBalance);
try {
  // ...
} catch (err) {
  setBalance(originalBalance);  // ✅ Correct
}
```

**Dashboard.js** (incorrect):
```javascript
const newBalance = balance - betAmount;
setBalance(newBalance);
try {
  // ...
} catch (betError) {
  setBalance(balance);  // ❌ Uses closure balance, not stored original
}
```

**Impact**: If user rapidly places multiple bets, Dashboard could show incorrect balance.

---

### 4. **Missing Error Handling in Bet POST Response**
**File**: [server/routes/bets.js](server/routes/bets.js#L1-L100)  
**Severity**: MEDIUM  
**Type**: Missing Validation

**Issue**: After user balance is deducted, if bet creation fails silently or partially, balance is lost.

```javascript
// No transaction/rollback on failure
await User.updateBalance(req.user.id, -parsedAmount);  // Balance deducted
const bet = await Bet.create(...);  // If this fails, balance is already gone
```

**Fix**: Wrap in transaction or implement rollback on failure.

---

## 🟠 MAJOR ISSUES

### 5. **Deprecated CSS Properties Still Causing Warnings**
**File**: [index.html](client/public/index.html#L38)  
**Severity**: LOW (Compilation Warning)  
**Type**: Browser Compatibility

**Issue**: `-webkit-text-size-adjust` is marked as deprecated in newer standards.

**Status**: ✅ FIXED (removed `text-size-adjust: 100%`)

---

### 6. **Theme-Color Meta Tag Unsupported**
**File**: [index.html](client/public/index.html#L6)  
**Severity**: LOW  
**Type**: Browser Support Warning

**Note**: Theme-color is gracefully ignored by Firefox, not critical.

---

### 7. **Multiple useCallback Dependencies Missing**
**File**: [Dashboard.js](client/src/components/Dashboard.js#L136-L160)  
**Severity**: MEDIUM  
**Type**: React Hook Warning

**Issue**: `fetchProfile` has `[fetchUserProfile, updateUser]` deps but `fetchUserProfile` is passed as prop and could cause stale closure.

```javascript
const fetchProfile = useCallback(async () => {
  if (fetchUserProfile) {
    const updatedUser = await fetchUserProfile();  // Potential stale closure
    // ...
  }
}, [fetchUserProfile, updateUser]);  // What if fetchUserProfile changes?
```

---

### 8. **Polling Not Properly Cleaned Up in Games Component**
**File**: [Games.js](client/src/components/Games.js#L81-L120)  
**Severity**: MEDIUM  
**Type**: Memory Leak

**Issue**: Multiple polling intervals but cleanup might not catch all:

```javascript
useEffect(() => {
  // ... initial load ...
  
  let isActive = true;
  const pollInterval = setInterval(async () => {
    if (isActive) {
      // Polling code
    }
  }, 5000);
  
  return () => {
    isActive = false;
    clearInterval(pollInterval);  // ✅ Good
  };
}, []);
```

**Status**: Actually looks OK - cleanup is proper.

---

## 🟡 MEDIUM ISSUES

### 9. **Admin Panel - Alert Spam on Error**
**File**: [AdminPanel.js](client/src/components/AdminPanel.js#L426-L450)  
**Severity**: MEDIUM  
**Type**: UX Issue

**Issue**: Using `alert()` for errors blocks user interaction. Multiple API errors will spam alerts.

```javascript
catch (err) {
  alert(err.response?.data?.error || 'Failed to create prop pick');  // ❌ Blocking
}
```

**Fix**: Use toast notifications instead.

---

### 10. **No Validation on Team Name Duplicate Bets**
**File**: [server/routes/bets.js](server/routes/bets.js#L60-L65)  
**Severity**: MEDIUM  
**Type**: Business Logic

**Issue**: Server checks for existing bet by user+game, but doesn't validate if selected team exists in the game:

```javascript
const existingBet = await Bet.findByUserAndGame(req.user.id, gameId);
if (existingBet) {
  return res.status(400).json({ error: 'You have already placed a bet on this game' });
}

// But what if selectedTeam is neither home_team nor away_team?
// No validation here
```

**Fix**: Validate `selectedTeam` matches either `home_team` or `away_team`.

---

### 11. **Prop Bet Choice Validation Too Permissive**
**File**: [server/routes/propBets.js](server/routes/propBets.js#L223-L245)  
**Severity**: MEDIUM  
**Type**: Data Validation

**Issue**: Allows ANY non-empty string as choice:

```javascript
if (!choice || typeof choice !== 'string' || choice.trim().length === 0) {
  return res.status(400).json({ error: 'Invalid choice provided' });
}
// ❌ But what if choice is "xyz" when valid options are only ["YES", "NO"]?

const normalizedChoice = choice.toLowerCase().trim();
const matchedOption = propBet.options.find(opt => opt.toLowerCase() === normalizedChoice);
if (matchedOption && propBet.option_odds[matchedOption]) {
  // Only validates AFTER creating the bet
```

**Fix**: Validate choice against `propBet.options` BEFORE creating bet.

---

### 12. **Balance Refill Endpoint Doesn't Prevent Race Condition**
**File**: [server/routes/users.js](server/routes/users.js)  
**Severity**: MEDIUM  
**Type**: Race Condition

**Issue**: Two simultaneous requests to `POST /users/gift-balance` could both grant balance:

```javascript
// Check if pending refill is old enough
if (user.pending_refill_timestamp) {
  const hoursSincePending = (Date.now() - new Date(user.pending_refill_timestamp)) / (1000 * 60 * 60);
  if (hoursSincePending >= 72) {
    // Grant balance and reset timestamp
    // ❌ But what if two requests check this simultaneously?
  }
}
```

**Fix**: Use atomic database update with row locking or version check.

---

### 13. **Notifications Auto-Mark Logic Could Skip Notifications**
**File**: [Notifications.js](client/src/components/Notifications.js#L6-L35)  
**Severity**: MEDIUM  
**Type**: Race Condition

**Issue**: Multiple rapid fetches could trigger multiple mark-all-read calls:

```javascript
useEffect(() => {
  fetchNotifications();
  const pollInterval = setInterval(fetchNotifications, 5000);
  return () => clearInterval(pollInterval);
}, []);

const fetchNotifications = async () => {
  const response = await apiClient.get('/notifications');
  const unreadNotifications = response.data.filter(n => !n.is_read);
  if (unreadNotifications.length > 0) {
    await apiClient.put('/notifications/mark-all-read');  // Multiple concurrent calls possible
  }
};
```

**Fix**: Add flag to prevent duplicate mark-all-read calls.

---

## 🟢 MINOR ISSUES

### 14. **Missing Null Check in Bet Outcome Display**
**File**: [BetList.js](client/src/components/BetList.js#L69-L85)  
**Severity**: LOW  
**Type**: Defensive Coding

**Issue**: `potential_win` could be undefined/null:

```javascript
<div className="bet-value">
  {bet.potential_win ? formatCurrency(bet.potential_win) : '—'}
</div>
```

If `potential_win` is 0, this shows "—" instead of "$0".

**Fix**: Check `bet.potential_win !== null && bet.potential_win !== undefined`.

---

### 15. **No Timeout on Fetch Calls**
**File**: Multiple  
**Severity**: LOW  
**Type**: Performance

**Issue**: Most API calls use default 30s timeout. For slow networks, could hang.

**Current**: `Teams.js` has explicit 5s timeout, others don't specify.

**Fix**: Add consistent timeout (5-10s) across all API calls.

---

### 16. **Error Logging Could Send Sensitive Data**
**File**: [errorLogger.js](server/middleware/errorLogger.js)  
**Severity**: LOW  
**Type**: Security

**Issue**: Logs `requestBody` which could contain passwords, tokens, etc.:

```javascript
requestBody: req.body,  // ❌ Could contain secrets
```

**Fix**: Sanitize sensitive fields before logging.

---

### 17. **Confetti Component Missing Cleanup**
**File**: [Dashboard.js](client/src/components/Dashboard.js#L170-L190)  
**Severity**: LOW  
**Type**: Memory Leak

**Issue**: `setShowConfetti(true)` followed by `setTimeout(() => setShowConfetti(false))` could fire after unmount:

```javascript
setShowConfetti(true);
setTimeout(() => {
  setWinNotification(null);
  setShowConfetti(false);  // ❌ Could fire after unmount
}, 3000);
```

**Fix**: Use useEffect with cleanup to cancel timeout.

---

### 18. **No Validation on Game Date/Time Format**
**File**: [server/routes/games.js](server/routes/games.js)  
**Severity**: LOW  
**Type**: Data Validation

**Issue**: Game creation doesn't validate date/time format:

```javascript
gameDate: req.body.gameDate,  // No format validation
gameTime: req.body.gameTime   // Could be "invalid"
```

**Fix**: Validate format is `YYYY-MM-DD` and `HH:MM:SS`.

---

### 19. **Teams Component Falls Back to Hardcoded Data**
**File**: [Teams.js](client/src/components/Teams.js#L117-L140)  
**Severity**: LOW  
**Type**: Data Consistency

**Issue**: Falls back to hardcoded team data if API fails, which is stale:

```javascript
const hardcodedData = getHardcodedTeams();
try {
  const response = await apiClient.get('/teams', { timeout: 5000 });
  // Use response if good
} catch {
  // Falls back to hardcodedData
}
```

**Note**: This is actually good UX for fallback, but hardcoded data may become outdated.

---

## 📋 SUMMARY TABLE

| Issue | Severity | Type | Status |
|-------|----------|------|--------|
| Balance restoration on bet failure | 🔴 HIGH | Logic Error | ❌ NEEDS FIX |
| Race condition in balance fetch | 🔴 HIGH | Race Condition | ❌ NEEDS FIX |
| Inconsistent balance logic (Dashboard vs Games) | 🔴 HIGH | Inconsistency | ❌ NEEDS FIX |
| Missing error handling in bet post | 🔴 HIGH | Missing Validation | ❌ NEEDS FIX |
| Deprecated CSS properties | 🟠 MEDIUM | Browser Compat | ✅ FIXED |
| Theme-color meta warning | 🟠 MEDIUM | Browser Support | ✅ IGNORED |
| Missing useCallback dependencies | 🟠 MEDIUM | React Hook | ⚠️ LOW IMPACT |
| Alert spam in AdminPanel | 🟡 MEDIUM | UX Issue | ❌ NEEDS FIX |
| No validation on team name | 🟡 MEDIUM | Business Logic | ❌ NEEDS FIX |
| Prop bet choice validation | 🟡 MEDIUM | Data Validation | ❌ NEEDS FIX |
| Balance refill race condition | 🟡 MEDIUM | Race Condition | ❌ NEEDS FIX |
| Notifications auto-mark race condition | 🟡 MEDIUM | Race Condition | ❌ NEEDS FIX |
| Missing null check in bet display | 🟢 LOW | Defensive Code | ⚠️ MINOR |
| No timeout on fetch calls | 🟢 LOW | Performance | ⚠️ MINOR |
| Error logging sends sensitive data | 🟢 LOW | Security | ❌ NEEDS FIX |
| Confetti cleanup missing | 🟢 LOW | Memory Leak | ❌ NEEDS FIX |
| No validation on game date/time | 🟢 LOW | Data Validation | ⚠️ MINOR |
| Hardcoded team fallback | 🟢 LOW | Data Consistency | ✅ OK |

## 🎯 RECOMMENDED FIX PRIORITY

**Phase 1 (Critical - Fix ASAP)**:
1. Balance restoration logic (#1)
2. Race condition in balance fetch (#2)
3. Inconsistent balance logic (#3)
4. Missing error handling on bet (#4)

**Phase 2 (Important)**:
5. Admin panel alert spam (#9)
6. Team name validation (#10)
7. Prop bet choice validation (#11)
8. Balance refill race condition (#12)

**Phase 3 (Polish)**:
9. Notification auto-mark race condition (#13)
10. Confetti cleanup (#17)
11. Error logging sanitization (#16)


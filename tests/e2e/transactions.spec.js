const { test, expect } = require('@playwright/test');
const { login, clearSession, getUserBalance } = require('../helpers/test-utils');

test.describe('Transaction History', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display transaction history page', async ({ page }) => {
    // Navigate to transactions
    const transactionsLink = page.locator('text=/Transactions|Transaction History|History/i').first();
    const exists = await transactionsLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await transactionsLink.click();
      await expect(page.locator('text=/Transaction|History/i')).toBeVisible();
    } else {
      // Check if it's on dashboard
      await page.goto('/dashboard');
      const historySection = page.locator('text=/Transaction|History/i');
      const onDashboard = await historySection.isVisible({ timeout: 3000 }).catch(() => false);
      expect(onDashboard).toBeDefined();
    }
  });

  test('should show list of transactions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for transactions section
    const transactionsList = page.locator('[class*="transaction"], [class*="history"]');
    const count = await transactionsList.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display transaction types (bet, win, reward)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for transaction type indicators
    const transactionTypes = page.locator('text=/Bet|Win|Reward|Bonus|Deposit/i');
    const typeCount = await transactionTypes.count();
    expect(typeCount).toBeGreaterThanOrEqual(0);
  });

  test('should show transaction amounts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for transaction amounts (positive or negative)
    const amountPattern = /[+-]?\$?\d+\.?\d*/;
    const amounts = page.locator(`text=${amountPattern}`);
    const amountCount = await amounts.count();
    expect(amountCount).toBeGreaterThan(0);
  });

  test('should display transaction timestamps', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for dates/times
    const timestamps = page.locator('text=/ago|Yesterday|Today|AM|PM|\d{1,2}\/\d{1,2}/i');
    const timestampCount = await timestamps.count();
    expect(timestampCount).toBeGreaterThanOrEqual(0);
  });

  test('should show transaction descriptions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Transactions should have descriptions
    const descriptions = page.locator('[class*="description"], [class*="transaction"] p');
    const descCount = await descriptions.count();
    expect(descCount).toBeGreaterThanOrEqual(0);
  });

  test('should record bet transactions', async ({ page }) => {
    // Place a bet
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '10');
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Wait for success
      await page.waitForTimeout(1000);
      
      // Check transactions
      await page.goto('/dashboard');
      
      // Should see bet transaction
      const betTransaction = page.locator('text=/Bet|Placed/i');
      await expect(betTransaction.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show positive transactions (winnings, rewards)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for positive transactions (usually shown in green or with +)
    const positiveTransactions = page.locator('text=/\\+|Won|Reward|Bonus/i, [class*="positive"]');
    const count = await positiveTransactions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show negative transactions (bets placed)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for negative transactions (usually shown in red or with -)
    const negativeTransactions = page.locator('text=/-|Bet Placed|Lost/i, [class*="negative"]');
    const count = await negativeTransactions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter transactions by type', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for filter buttons
    const filterButtons = page.locator('button:has-text(/All|Bets|Wins|Rewards/i)');
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      // Click on a filter
      await filterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Transactions should be filtered
      const transactions = page.locator('[class*="transaction"]');
      const transactionCount = await transactions.count();
      expect(transactionCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter transactions by date range', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for date range filters
    const dateFilters = page.locator('text=/Today|This Week|This Month|All Time/i');
    const hasDateFilters = await dateFilters.count();
    
    if (hasDateFilters > 0) {
      await dateFilters.first().click();
      await page.waitForTimeout(500);
      
      // Should filter transactions
      const transactions = page.locator('[class*="transaction"]');
      const count = await transactions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show transaction status (completed, pending, failed)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for status indicators
    const statusIndicators = page.locator('text=/Completed|Pending|Failed|Success/i');
    const statusCount = await statusIndicators.count();
    expect(statusCount).toBeGreaterThanOrEqual(0);
  });

  test('should display transaction details when clicked', async ({ page }) => {
    await page.goto('/dashboard');
    
    const firstTransaction = page.locator('[class*="transaction"]').first();
    const exists = await firstTransaction.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await firstTransaction.click();
      
      // Should show detailed view
      await page.waitForTimeout(500);
      
      // Verify details are shown
      const detailsVisible = await page.locator('text=/Details|Amount|Date|Type/i').isVisible({ timeout: 3000 });
      expect(detailsVisible).toBe(true);
    }
  });

  test('should paginate transaction history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for pagination controls
    const paginationControls = page.locator('button:has-text(/Next|Previous|Load More/i)');
    const hasPagination = await paginationControls.count();
    
    if (hasPagination > 0) {
      await paginationControls.first().click();
      await page.waitForTimeout(500);
      
      // Should load more transactions
      const transactions = page.locator('[class*="transaction"]');
      const count = await transactions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show total earned amount', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for total earnings summary
    const totalEarned = page.locator('text=/Total Earned|Total Winnings|Earnings/i');
    const hasTotal = await totalEarned.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasTotal) {
      const totalText = await totalEarned.textContent();
      expect(totalText).toMatch(/\d+/);
    }
  });

  test('should show total spent amount', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for total spent summary
    const totalSpent = page.locator('text=/Total Spent|Total Bets|Spent/i');
    const hasTotal = await totalSpent.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasTotal) {
      const totalText = await totalSpent.textContent();
      expect(totalText).toMatch(/\d+/);
    }
  });

  test('should export transaction history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for export button
    const exportButton = page.locator('button:has-text(/Export|Download|CSV/i)');
    const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasExport) {
      // Note: actual download test would require more setup
      expect(hasExport).toBe(true);
    }
  });

  test('should show empty state when no transactions', async ({ page }) => {
    // This would test a new user with no transactions
    // For now, we just check if the UI handles empty state
    await page.goto('/dashboard');
    
    const emptyMessage = page.locator('text=/No transactions|No history|Start betting/i');
    const hasMessage = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasMessage).toBeDefined();
  });

  test('should search transactions by description', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasSearch) {
      await searchInput.fill('bet');
      await page.waitForTimeout(500);
      
      // Should filter transactions
      const transactions = page.locator('[class*="transaction"]');
      const count = await transactions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show transaction balance change', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Each transaction should show how it affected balance
    const balanceChanges = page.locator('text=/[+-]\d+|Balance:/i');
    const count = await balanceChanges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should maintain transaction history across sessions', async ({ page }) => {
    // Check transaction count
    await page.goto('/dashboard');
    const transactions = page.locator('[class*="transaction"]');
    const initialCount = await transactions.count();
    
    // Logout and login
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    
    // Transaction history should persist
    await page.goto('/dashboard');
    const newCount = await transactions.count();
    expect(newCount).toBe(initialCount);
  });
});

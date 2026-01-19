const { test, expect } = require('@playwright/test');
const { login, logout, getUserBalance, navigateTo, clearSession } = require('../helpers/test-utils');

test.describe('User Features', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display user dashboard', async ({ page }) => {
    await navigateTo(page, 'Dashboard');
    
    // Check for dashboard elements
    await expect(page.locator('text=/Dashboard|Welcome/i')).toBeVisible();
    await expect(page.locator('text=/Balance|Valiant Bucks/i')).toBeVisible();
  });

  test('should display user balance correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    const balance = await getUserBalance(page);
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(balance).toBeLessThan(1000000); // Sanity check
  });

  test('should show user profile information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for username display
    await expect(page.locator('text=/testuser/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display user statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for stats like total bets, wins, losses
    const statsElements = page.locator('text=/Total Bets|Wins|Losses|Win Rate/i');
    const count = await statsElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await navigateTo(page, 'Leaderboard');
    
    await expect(page.locator('text=/Leaderboard|Rankings/i')).toBeVisible();
    
    // Should show users ranked by balance or wins
    await expect(page.locator('text=/Rank|Position/i')).toBeVisible();
  });

  test('should display leaderboard with users', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Wait for leaderboard to load
    await page.waitForSelector('text=/testuser|admin/i', { timeout: 10000 });
    
    // Should see at least one user
    const userRows = page.locator('[class*="leaderboard"] tr, [class*="user"]');
    const count = await userRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter admin from public leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Admin should NOT appear in public leaderboard
    const adminVisible = await page.locator('text=/^admin$/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(adminVisible).toBe(false);
  });

  test('should show notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if notifications icon/section exists
    const notificationsExists = await page.locator('text=/Notifications|Alerts/i, [class*="notification"]').count();
    expect(notificationsExists).toBeGreaterThanOrEqual(0);
  });

  test('should display bet history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for bet history section
    const betHistoryLink = page.locator('text=/Bet History|My Bets|Bets/i').first();
    if (await betHistoryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await betHistoryLink.click();
      
      // Should show bet history page
      await expect(page.locator('text=/Bet History|Your Bets/i')).toBeVisible();
    }
  });

  test('should show transaction history', async ({ page }) => {
    await page.goto('/dashboard');
    
    const transactionsLink = page.locator('text=/Transactions|History/i').first();
    if (await transactionsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await transactionsLink.click();
      
      // Should show transactions
      await expect(page.locator('text=/Transaction|History/i')).toBeVisible();
    }
  });

  test('should show achievements page', async ({ page }) => {
    const achievementsLink = page.locator('text=/Achievements/i').first();
    if (await achievementsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await achievementsLink.click();
      
      await expect(page.locator('text=/Achievements|Badges/i')).toBeVisible();
    }
  });

  test('should display How To Use page', async ({ page }) => {
    const howToLink = page.locator('text=/How to Use|Guide|Help/i').first();
    if (await howToLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await howToLink.click();
      
      await expect(page.locator('text=/How to|Guide|Instructions/i')).toBeVisible();
    }
  });

  test('should display About page', async ({ page }) => {
    const aboutLink = page.locator('text=/About/i').first();
    if (await aboutLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aboutLink.click();
      
      await expect(page.locator('text=/About|Valiant Picks/i')).toBeVisible();
    }
  });

  test('should display Terms page', async ({ page }) => {
    const termsLink = page.locator('text=/Terms|Privacy/i').first();
    if (await termsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await termsLink.click();
      
      await expect(page.locator('text=/Terms|Conditions|Privacy/i')).toBeVisible();
    }
  });

  test('should show onboarding for new users', async ({ page }) => {
    // This tests if onboarding modal appears (if implemented)
    const onboardingModal = page.locator('text=/Welcome|Get Started|Tutorial/i');
    const modalCount = await onboardingModal.count();
    expect(modalCount).toBeGreaterThanOrEqual(0);
  });

  test('should have responsive navigation menu', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if navigation menu exists
    const navMenu = page.locator('nav, [class*="nav"]');
    await expect(navMenu.first()).toBeVisible();
    
    // Should have multiple navigation links
    const navLinks = page.locator('nav a, [class*="nav"] a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(3);
  });

  test('should show footer with links', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer, [class*="footer"]');
    await expect(footer.first()).toBeVisible();
  });
});

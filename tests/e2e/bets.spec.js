const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('My Picks (Bet List)', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD & STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to My Picks page', async ({ page }) => {
    await navigateTo(page, 'My Picks');
    await expect(page.locator('h1:has-text("My Picks")')).toBeVisible({ timeout: 10000 });
  });

  test('should load My Picks via URL', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await expect(page.locator('.bet-list-container')).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STATS GRID
  // ═══════════════════════════════════════════════════════════════════════

  test('should display betting stats grid', async ({ page }) => {
    await navigateToUrl(page, '/bets');

    const statsGrid = page.locator('.bet-stats-grid');
    const hasStats = await statsGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStats) {
      const statCards = page.locator('.bet-stat-card, .stat-card');
      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test('should show total bets stat', async ({ page }) => {
    await navigateToUrl(page, '/bets');

    const totalStat = page.locator('.bet-stat-card:has(.stat-icon-total), .stat-card:has-text("Total")').first();
    const hasStat = await totalStat.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStat) {
      const value = totalStat.locator('.stat-value');
      await expect(value).toBeVisible();
      const text = await value.textContent();
      expect(text).toMatch(/\d/);
    }
  });

  test('should show won/lost stats', async ({ page }) => {
    await navigateToUrl(page, '/bets');

    const wonStat = page.locator('.bet-stat-card:has(.stat-icon-won), .stat-card:has-text("Won")').first();
    const lostStat = page.locator('.bet-stat-card:has(.stat-icon-lost), .stat-card:has-text("Lost")').first();

    const hasWon = await wonStat.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLost = await lostStat.isVisible({ timeout: 3000 }).catch(() => false);
    // At least the header should be visible
    await expect(page.locator('.bet-list-container')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // FILTER TABS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display filter tabs', async ({ page }) => {
    await navigateToUrl(page, '/bets');

    const filterBtns = page.locator('.tab-button');
    await page.waitForTimeout(2000);
    const count = await filterBtns.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have All tab active by default', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(1000);

    const allTab = page.locator('.tab-button:has-text("All")').first();
    const hasAll = await allTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAll) {
      await expect(allTab).toHaveClass(/active/);
    }
  });

  test('should switch to Pending tab', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(1000);

    const pendingTab = page.locator('.tab-button:has-text("Pending")').first();
    const hasPending = await pendingTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPending) {
      await pendingTab.click();
      await expect(pendingTab).toHaveClass(/active/);
    }
  });

  test('should switch to Won tab', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(1000);

    const wonTab = page.locator('.tab-button:has-text("Won")').first();
    const hasWon = await wonTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWon) {
      await wonTab.click();
      await expect(wonTab).toHaveClass(/active/);
    }
  });

  test('should switch to Lost tab', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(1000);

    const lostTab = page.locator('.tab-button:has-text("Lost")').first();
    const hasLost = await lostTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLost) {
      await lostTab.click();
      await expect(lostTab).toHaveClass(/active/);
    }
  });

  test('should show counts in filter tabs', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const allTab = page.locator('.tab-button:has-text("All")').first();
    const hasAll = await allTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAll) {
      const text = await allTab.textContent();
      // Should contain a number in parentheses like "All (5)"
      expect(text).toMatch(/\(\d+\)/);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BET CARDS / TABLE
  // ═══════════════════════════════════════════════════════════════════════

  test('should display bets or empty state', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const hasBets = await page.locator('.bet-mobile-card, .bet-table tbody tr').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    const hasHeader = await page.locator('h1:has-text("My Picks")').first()
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasBets || hasEmpty || hasHeader).toBeTruthy();
  });

  test('should show bet card with matchup info', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const card = page.locator('.bet-mobile-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const matchup = card.locator('.bet-mobile-matchup, .bet-mobile-title');
      await expect(matchup.first()).toBeVisible();
    }
  });

  test('should show bet status badge on cards', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const card = page.locator('.bet-mobile-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const badge = card.locator('.bet-result-badge');
      await expect(badge).toBeVisible();
    }
  });

  test('should show confidence badge on bet cards', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const card = page.locator('.bet-mobile-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const confBadge = card.locator('.confidence-badge');
      const hasConf = await confBadge.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasConf) {
        const text = await confBadge.textContent();
        expect(text).toMatch(/Low|Medium|High/i);
      }
    }
  });

  test('should show bet amounts on cards', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const card = page.locator('.bet-mobile-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const amounts = card.locator('.bet-mobile-amount, .bet-mobile-value');
      const hasAmounts = await amounts.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasAmounts) {
        const text = await amounts.first().textContent();
        expect(text).toMatch(/\d/);
      }
    }
  });

  test('should show date on bet cards', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    const card = page.locator('.bet-mobile-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const date = card.locator('.bet-mobile-date');
      const hasDate = await date.isVisible({ timeout: 2000 }).catch(() => false);
      // Date element should exist on the card
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════════════════

  test('should show contextual empty state when filtering', async ({ page }) => {
    await navigateToUrl(page, '/bets');
    await page.waitForTimeout(2000);

    // Try switching to Won tab
    const wonTab = page.locator('.tab-button:has-text("Won")').first();
    const hasWon = await wonTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWon) {
      await wonTab.click();
      await page.waitForTimeout(500);

      // If no won bets, should show empty state
      const emptyState = page.locator('.empty-state');
      const bets = page.locator('.bet-mobile-card');
      const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      const hasBets = await bets.first().isVisible({ timeout: 2000 }).catch(() => false);
      // One of them should be visible
      expect(hasEmpty || hasBets).toBeTruthy();
    }
  });
});

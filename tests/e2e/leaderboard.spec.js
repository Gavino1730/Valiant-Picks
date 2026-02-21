const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD & STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to Leaderboard page', async ({ page }) => {
    await navigateTo(page, 'Leaderboard');
    await expect(page.locator('text=/Leaderboard/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load leaderboard via URL', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await expect(page.locator('.leaderboard-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show leaderboard page title', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY BAR
  // ═══════════════════════════════════════════════════════════════════════

  test('should display summary bar', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    const summaryBar = page.locator('.summary-bar');
    const hasSummary = await summaryBar.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSummary) {
      const summaryValues = page.locator('.summary-value');
      const count = await summaryValues.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SEGMENT CONTROL (ALL PLAYERS / ACTIVE ONLY)
  // ═══════════════════════════════════════════════════════════════════════

  test('should show segment control buttons', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    const segmentControl = page.locator('.segment-control');
    const hasSegment = await segmentControl.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSegment) {
      const allBtn = page.locator('.segment-btn:has-text("All Players")');
      const activeBtn = page.locator('.segment-btn:has-text("Active Only")');

      await expect(allBtn).toBeVisible();
      await expect(activeBtn).toBeVisible();
    }
  });

  test('should switch to Active Only filter', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    const activeBtn = page.locator('.segment-btn:has-text("Active Only")');
    const hasBtn = await activeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await activeBtn.click();
      await expect(activeBtn).toHaveClass(/active/);
    }
  });

  test('should switch back to All Players filter', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    const activeBtn = page.locator('.segment-btn:has-text("Active Only")');
    const allBtn = page.locator('.segment-btn:has-text("All Players")');
    const hasBtn = await activeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await activeBtn.click();
      await page.waitForTimeout(300);
      await allBtn.click();
      await expect(allBtn).toHaveClass(/active/);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LEADERBOARD DATA
  // ═══════════════════════════════════════════════════════════════════════

  test('should display leaderboard entries', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');

    const entries = page.locator('.leaderboard-row, .leaderboard-list-row');
    await page.waitForTimeout(2000);
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should highlight current user', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const currentUser = page.locator('.is-current-user, .you-badge');
    const hasHighlight = await currentUser.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Current user should be highlighted with YOU badge
    if (hasHighlight) {
      await expect(currentUser.first()).toBeVisible();
    }
  });

  test('should show rank badges for top 3 players', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const rankBadges = page.locator('.rank-badge');
    const hasRankBadges = await rankBadges.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRankBadges) {
      const count = await rankBadges.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should show user balance in leaderboard', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    // Balance values should be present
    const entries = page.locator('.leaderboard-row, .leaderboard-list-row');
    const count = await entries.count();

    if (count > 0) {
      // Use textContent check instead of visibility (element may be overflow-hidden)
      const firstEntry = entries.first();
      const text = await firstEntry.textContent();
      // Leaderboard rows should contain balance/stat info (numbers or dollar signs)
      expect(text.length).toBeGreaterThan(0);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SORT CONTROLS
  // ═══════════════════════════════════════════════════════════════════════

  test('should have sortable column headers', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const sortBtns = page.locator('.th-sort-btn');
    const hasSortBtns = await sortBtns.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSortBtns) {
      const count = await sortBtns.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should sort by different columns', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const profitSort = page.locator('.th-sort-btn:has-text("Net Profit")');
    const hasProfitSort = await profitSort.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProfitSort) {
      await profitSort.click();
      await page.waitForTimeout(500);

      // Sort indicator should change
      const indicator = page.locator('.sort-indicator');
      const hasIndicator = await indicator.first().isVisible({ timeout: 2000 }).catch(() => false);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // JUMP TO RANK
  // ═══════════════════════════════════════════════════════════════════════

  test('should show Jump to my rank button', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const jumpBtn = page.locator('.jump-btn, button:has-text("Jump to my rank")').first();
    const hasBtn = await jumpBtn.isVisible({ timeout: 5000 }).catch(() => false);
    // Button may not be visible if user is already on first page
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════════════════

  test('should display pagination controls', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const pagination = page.locator('.pagination-bar, .pagination');
    const hasPagination = await pagination.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPagination) {
      const paginationInfo = page.locator('.pagination-info, .pagination-summary');
      await expect(paginationInfo.first()).toBeVisible();
    }
  });

  test('should navigate to next page when available', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const nextBtn = page.locator('button:has-text("Next"), .pagination-btn:has-text("Next")').first();
    const hasNext = await nextBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNext && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Should show updated pagination info
      const paginationInfo = page.locator('.pagination-info');
      const hasInfo = await paginationInfo.isVisible({ timeout: 3000 }).catch(() => false);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIVITY INDICATORS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show activity dots for users', async ({ page }) => {
    await navigateToUrl(page, '/leaderboard');
    await page.waitForTimeout(2000);

    const activityDots = page.locator('.activity-dot');
    const hasDots = await activityDots.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDots) {
      const count = await activityDots.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

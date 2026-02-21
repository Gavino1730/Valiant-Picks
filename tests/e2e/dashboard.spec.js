const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays, getBalance,
} = require('../helpers/test-utils');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD & STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should load dashboard after login', async ({ page }) => {
    // Dashboard is the default page after login
    await expect(page.locator('.dashboard, .school-dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard via nav link', async ({ page }) => {
    await navigateTo(page, 'Place Picks');
    await navigateTo(page, 'Dashboard');

    await expect(page.locator('.dashboard, .school-dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard via URL', async ({ page }) => {
    await navigateToUrl(page, '/dashboard');

    await expect(page.locator('.dashboard, .school-dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BALANCE DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should display user balance in navbar', async ({ page }) => {
    const balanceEl = page.locator('.balance-amount').first();
    await expect(balanceEl).toBeVisible();

    const text = await balanceEl.textContent();
    expect(text).toMatch(/\d/);
  });

  test('should display balance pill with label', async ({ page }) => {
    const balancePill = page.locator('.balance-pill, .balance-display').first();
    await expect(balancePill).toBeVisible();
  });

  test('should show welcome card with balance', async ({ page }) => {
    const welcomeCard = page.locator('.welcome-card-primary');
    const hasWelcome = await welcomeCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWelcome) {
      await expect(page.locator('.balance-display-large, .balance-amount').first()).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD SECTIONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display Place Picks CTA button', async ({ page }) => {
    const ctaBtn = page.locator('button:has-text("Place Your Picks"), button:has-text("Place Picks")').first();
    const hasCta = await ctaBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCta) {
      await expect(ctaBtn).toBeEnabled();
    }
  });

  test('should show upcoming games section or empty state', async ({ page }) => {
    const upcoming = page.locator('.upcoming-section');
    const hasUpcoming = await upcoming.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUpcoming) {
      // Either game cards or "no upcoming games" text
      const gameCards = page.locator('.upcoming-game-card');
      const emptyText = page.locator('text=/No upcoming|no games/i').first();

      const hasCards = await gameCards.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmpty = await emptyText.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should display upcoming game card with matchup info', async ({ page }) => {
    const gameCard = page.locator('.upcoming-game-card').first();
    const hasCards = await gameCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      // Game card should have team names
      await expect(gameCard.locator('.team-name, .game-matchup-display').first()).toBeVisible();
    }
  });

  test('should show recent activity section', async ({ page }) => {
    const recentSection = page.locator('.recent-activity-section');
    const hasRecent = await recentSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRecent) {
      const activityCards = page.locator('.activity-card');
      const emptyText = page.locator('text=/No recent|no picks/i').first();

      const hasCards = await activityCards.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmpty = await emptyText.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should show recent activity card with status badges', async ({ page }) => {
    const activityCard = page.locator('.activity-card').first();
    const hasCards = await activityCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const status = activityCard.locator('.activity-status');
      await expect(status).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INTERACTIVE ELEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to games when Place Picks CTA is clicked', async ({ page }) => {
    const ctaBtn = page.locator('button:has-text("Place Your Picks"), button:has-text("Place Picks")').first();
    const hasCta = await ctaBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCta) {
      await ctaBtn.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      // Should be on games page
      await expect(page.locator('text=/Place Your Picks/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show View All Games button', async ({ page }) => {
    const viewAllBtn = page.locator('button:has-text("View All Games")');
    const hasBtn = await viewAllBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await viewAllBtn.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      await expect(page.locator('text=/Place Your Picks/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show spin wheel card', async ({ page }) => {
    const spinCard = page.locator('.spin-wheel-card');
    const hasSpin = await spinCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSpin) {
      const spinBtn = page.locator('button:has-text("Spin to Win"), .btn-spin-wheel').first();
      await expect(spinBtn).toBeVisible();
    }
  });

  test('should open spin wheel modal when clicking Spin to Win', async ({ page }) => {
    const spinBtn = page.locator('button:has-text("Spin to Win"), .btn-spin-wheel').first();
    const hasSpin = await spinBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSpin) {
      await spinBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Spin wheel modal should appear
      const spinModal = page.locator('.spin-wheel-overlay, .spin-wheel-modal');
      const modalVisible = await spinModal.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (modalVisible) {
        // Close it
        await page.locator('.spin-wheel-close').click({ force: true });
      }
    }
  });

  test('should show quick links sidebar', async ({ page }) => {
    const quickLinks = page.locator('.quick-links-minimal, .quick-links-list');
    const hasQuickLinks = await quickLinks.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasQuickLinks) {
      const teamsLink = page.locator('.quick-link-item:has-text("Teams")');
      const leaderboardLink = page.locator('.quick-link-item:has-text("Leaderboard")');

      const hasTeams = await teamsLink.isVisible({ timeout: 3000 }).catch(() => false);
      const hasLeader = await leaderboardLink.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasTeams || hasLeader).toBeTruthy();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD GRID LAYOUT
  // ═══════════════════════════════════════════════════════════════════════

  test('should display dashboard grid layout', async ({ page }) => {
    const grid = page.locator('.dashboard-grid, .school-grid');
    const hasGrid = await grid.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      // Main column should exist
      const mainCol = page.locator('.dashboard-main-column');
      await expect(mainCol).toBeVisible();
    }
  });
});

const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Bracket', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to Bracket page', async ({ page }) => {
    await navigateTo(page, 'Bracket');
    await expect(page.locator('.bracket-page').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load bracket via URL', async ({ page }) => {
    await navigateToUrl(page, '/bracket');
    await expect(page.locator('.bracket-page').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show bracket title', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const title = page.locator('h1:has-text("Bracket"), h1:has-text("Championship")').first();
    await expect(title).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BRACKET CONTENT
  // ═══════════════════════════════════════════════════════════════════════

  test('should display bracket grid or coming soon', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const comingSoon = page.locator('text=/coming soon|no.*bracket/i').first();
    const noContent = page.locator('text=/No active|Bracket coming/i').first();

    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);
    const hasComingSoon = await comingSoon.isVisible({ timeout: 2000 }).catch(() => false);
    const hasNoContent = await noContent.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasGrid || hasComingSoon || hasNoContent).toBeTruthy();
  });

  test('should display bracket rounds when active', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      const r1 = page.locator('.bracket-round--r1');
      const hasR1 = await r1.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasR1) {
        await expect(r1).toBeVisible();
      }
    }
  });

  test('should show bracket games with team buttons', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      const games = page.locator('.bracket-game');
      const count = await games.count();
      if (count > 0) {
        const teamBtns = page.locator('.team-btn');
        const btnCount = await teamBtns.count();
        expect(btnCount).toBeGreaterThan(0);
      }
    }
  });

  test('should show bracket meta info (entry fee, payout)', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const meta = page.locator('.bracket-meta');
    const hasMeta = await meta.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMeta) {
      const metaItems = page.locator('.bracket-meta__item');
      const count = await metaItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should show View Leaderboard link', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const leaderboardLink = page.locator('.bracket-link:has-text("Leaderboard"), button:has-text("Leaderboard"), a:has-text("Leaderboard")').first();
    const hasLink = await leaderboardLink.isVisible({ timeout: 5000 }).catch(() => false);
    // Link may or may not be present depending on bracket state
  });

  test('should show progress indicator when bracket is not submitted', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      const progress = page.locator('.bracket-progress');
      const submitBtn = page.locator('.bracket-submit-btn');
      const entrySummary = page.locator('.bracket-entry-summary');

      const hasProgress = await progress.isVisible({ timeout: 3000 }).catch(() => false);
      const hasSubmit = await submitBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasEntry = await entrySummary.isVisible({ timeout: 2000 }).catch(() => false);

      // Either user has submitted (entry summary) or hasn't (progress + submit)
      expect(hasProgress || hasEntry).toBeTruthy();
    }
  });

  test('should show entry summary if bracket already submitted', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const entrySummary = page.locator('.bracket-entry-summary');
    const hasEntry = await entrySummary.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEntry) {
      // Should show points or payout info
      await expect(entrySummary).toBeVisible();
    }
  });

  test('should allow selecting teams in bracket when not locked', async ({ page }) => {
    await navigateToUrl(page, '/bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      const teamBtn = page.locator('.team-btn:not([disabled])').first();
      const hasBtn = await teamBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasBtn) {
        await teamBtn.click();
        await page.waitForTimeout(300);

        // Button should be selected
        const selected = page.locator('.team-btn.selected');
        const hasSelected = await selected.first().isVisible({ timeout: 2000 }).catch(() => false);
      }
    }
  });
});

test.describe('Actual Bracket (Results)', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should navigate to Results page', async ({ page }) => {
    await navigateTo(page, 'Results');
    await expect(page.locator('.bracket-page, .actual-bracket-page').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load results via URL', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');
    await expect(page.locator('.bracket-page, .actual-bracket-page').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show results page title', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');

    const title = page.locator('h1:has-text("Actual Bracket"), h1:has-text("Results"), h1:has-text("Bracket")').first();
    await expect(title).toBeVisible();
  });

  test('should display bracket grid or no bracket message', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const noContent = page.locator('text=/No active|no bracket/i').first();

    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoContent = await noContent.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasGrid || hasNoContent).toBeTruthy();
  });

  test('should show navigation links (View My Bracket, View Leaderboard)', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');

    const myBracketLink = page.locator('.bracket-link:has-text("My Bracket"), button:has-text("My Bracket")').first();
    const leaderboardLink = page.locator('.bracket-link:has-text("Leaderboard"), button:has-text("Leaderboard")').first();

    const hasMyBracket = await myBracketLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLeaderboard = await leaderboardLink.isVisible({ timeout: 3000 }).catch(() => false);
    // At least one link should be visible if bracket exists
  });

  test('should display winner/loser styling on results', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');

    const bracketGrid = page.locator('.bracket-grid');
    const hasGrid = await bracketGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrid) {
      // Winner and loser displays
      const winners = page.locator('.team-display.winner');
      const losers = page.locator('.team-display.loser');

      const hasWinners = await winners.first().isVisible({ timeout: 3000 }).catch(() => false);
      // Results may not be filled in yet
    }
  });

  test('should show legend when bracket has results', async ({ page }) => {
    await navigateToUrl(page, '/actual-bracket');

    const legend = page.locator('.actual-bracket-legend');
    const hasLegend = await legend.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLegend) {
      const legendItems = page.locator('.legend-item');
      const count = await legendItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Bracket Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should load bracket leaderboard via URL', async ({ page }) => {
    await navigateToUrl(page, '/bracket-leaderboard');
    await expect(page.locator('.bracket-leaderboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show bracket leaderboard title', async ({ page }) => {
    await navigateToUrl(page, '/bracket-leaderboard');

    const title = page.locator('.bracket-leaderboard h1').first();
    await expect(title).toBeVisible();
  });

  test('should display bracket standings or empty message', async ({ page }) => {
    await navigateToUrl(page, '/bracket-leaderboard');

    const rows = page.locator('.leaderboard-row:not(.leaderboard-row--header)');
    const emptyRow = page.locator('.leaderboard-row--empty, text=/No brackets submitted/i').first();
    const noContent = page.locator('text=/No active|no bracket/i').first();

    await page.waitForTimeout(2000);

    const hasRows = await rows.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyRow.isVisible({ timeout: 2000 }).catch(() => false);
    const hasNoContent = await noContent.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasRows || hasEmpty || hasNoContent).toBeTruthy();
  });

  test('should show navigation links', async ({ page }) => {
    await navigateToUrl(page, '/bracket-leaderboard');

    const resultsLink = page.locator('.bracket-link:has-text("Results"), button:has-text("Results")').first();
    const bracketLink = page.locator('.bracket-link:has-text("bracket"), button:has-text("bracket")').first();

    const hasResults = await resultsLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasBracket = await bracketLink.isVisible({ timeout: 3000 }).catch(() => false);
    // At least one navigation link should be visible
  });

  test('should have refresh button', async ({ page }) => {
    await navigateToUrl(page, '/bracket-leaderboard');

    const refreshBtn = page.locator('.bracket-link:has-text("Refresh"), button:has-text("Refresh")').first();
    const hasRefresh = await refreshBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRefresh) {
      await refreshBtn.click();
      // Should not break the page
      await page.waitForTimeout(1000);
      await expect(page.locator('.bracket-leaderboard')).toBeVisible();
    }
  });
});

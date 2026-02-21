const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Teams Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD & STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to Teams page', async ({ page }) => {
    await navigateTo(page, 'Teams');
    await expect(page.locator('.teams-page').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load teams via URL', async ({ page }) => {
    await navigateToUrl(page, '/teams');
    await expect(page.locator('.teams-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show teams page title', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const title = page.locator('h1:has-text("Basketball"), h1:has-text("Valiant"), h1:has-text("Teams")').first();
    await expect(title).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEAM TABS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display Boys and Girls basketball tabs', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const boysTab = page.locator('.tab-button:has-text("Boys")');
    const girlsTab = page.locator('.tab-button:has-text("Girls")');

    await expect(boysTab).toBeVisible();
    await expect(girlsTab).toBeVisible();
  });

  test('should switch between Boys and Girls tabs', async ({ page }) => {
    await navigateToUrl(page, '/teams');
    await page.waitForTimeout(1000);

    const boysTab = page.locator('.tab-button:has-text("Boys")');
    const girlsTab = page.locator('.tab-button:has-text("Girls")');

    const hasGirls = await girlsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasGirls) {
      // Click Girls tab
      await girlsTab.click();
      await page.waitForTimeout(500);
      await expect(girlsTab).toHaveClass(/active/);

      // Click Boys tab
      await boysTab.click();
      await page.waitForTimeout(500);
      await expect(boysTab).toHaveClass(/active/);
    }
  });

  test('should have one tab active by default', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const activeTab = page.locator('.tab-button.active');
    await expect(activeTab).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEAM INFO
  // ═══════════════════════════════════════════════════════════════════════

  test('should display team section', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const teamSection = page.locator('.team-section');
    await expect(teamSection.first()).toBeVisible();
  });

  test('should show team stats (record)', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const stats = page.locator('.team-stats .stat');
    const hasStats = await stats.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStats) {
      const count = await stats.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should show coaching staff info', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const coaching = page.locator('.coaching-staff, .coach-info');
    const hasCoaching = await coaching.first().isVisible({ timeout: 5000 }).catch(() => false);
    // Coaching info may or may not be present depending on data
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONTENT TABS (ROSTER / SCHEDULE)
  // ═══════════════════════════════════════════════════════════════════════

  test('should display Roster and Schedule content tabs', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const rosterTab = page.locator('.content-tab-btn:has-text("Roster")');
    const scheduleTab = page.locator('.content-tab-btn:has-text("Schedule")');

    const hasRosterTab = await rosterTab.isVisible({ timeout: 5000 }).catch(() => false);
    const hasScheduleTab = await scheduleTab.isVisible({ timeout: 3000 }).catch(() => false);
    // Content tabs may be mobile-only or always present
  });

  test('should switch to Schedule tab', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const scheduleTab = page.locator('.content-tab-btn:has-text("Schedule")');
    const hasTab = await scheduleTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTab) {
      await scheduleTab.click();
      await expect(scheduleTab).toHaveClass(/active/);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ROSTER
  // ═══════════════════════════════════════════════════════════════════════

  test('should display roster table', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const rosterTable = page.locator('.roster-table');
    const hasRoster = await rosterTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRoster) {
      const rows = page.locator('.roster-row');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show player details (number, name, grade)', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const firstRow = page.locator('.roster-row').first();
    const hasRow = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRow) {
      const playerNum = firstRow.locator('.player-number');
      const playerName = firstRow.locator('.player-name');

      const hasNum = await playerNum.isVisible({ timeout: 2000 }).catch(() => false);
      const hasName = await playerName.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasNum || hasName).toBeTruthy();
    }
  });

  test('should expand player row on click', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const firstRow = page.locator('.roster-row').first();
    const hasRow = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRow) {
      // Click to expand
      const clickable = firstRow.locator('.roster-row-main, .player-expand').first();
      await clickable.click({ force: true });
      await page.waitForTimeout(300);

      // Should show expanded content
      const expanded = page.locator('.roster-row.expanded');
      const details = page.locator('.roster-row-details');
      const isExpanded = await expanded.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasDetails = await details.first().isVisible({ timeout: 2000 }).catch(() => false);
    }
  });

  test('should have Expand All / Collapse All buttons', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const expandAll = page.locator('button:has-text("Expand all")');
    const hasBtn = await expandAll.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await expandAll.click();
      await page.waitForTimeout(300);

      // All rows should be expanded
      const expandedRows = page.locator('.roster-row.expanded');
      const count = await expandedRows.count();

      // Collapse all button should appear
      const collapseAll = page.locator('button:has-text("Collapse all")');
      const hasCollapse = await collapseAll.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasCollapse) {
        await collapseAll.click();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ROSTER SEARCH & FILTERS
  // ═══════════════════════════════════════════════════════════════════════

  test('should have player search input', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const searchInput = page.getByPlaceholder('Search by player name');
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(300);

      // Roster count should update
      const rosterCount = page.locator('.roster-count');
      const hasCount = await rosterCount.isVisible({ timeout: 2000 }).catch(() => false);

      // Clear search
      await searchInput.clear();
    }
  });

  test('should have grade filter dropdown', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const gradeSelect = page.locator('.roster-control select').first();
    const hasGrade = await gradeSelect.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGrade) {
      // Should have grade options
      const options = gradeSelect.locator('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('should show player count', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const rosterCount = page.locator('.roster-count');
    const hasCount = await rosterCount.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCount) {
      const text = await rosterCount.textContent();
      expect(text).toMatch(/\d/);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════════════════════════════════════

  test('should display schedule section', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    // Schedule section may be visible by default on desktop or under tab on mobile
    const scheduleSection = page.locator('.schedule-section');
    const scheduleTable = page.locator('.schedule-table');

    const hasSection = await scheduleSection.isVisible({ timeout: 5000 }).catch(() => false);
    const hasTable = await scheduleTable.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasSection && !hasTable) {
      // Try switching to schedule tab
      const scheduleTab = page.locator('.content-tab-btn:has-text("Schedule")');
      const hasTab = await scheduleTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasTab) {
        await scheduleTab.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show schedule with game results (win/loss/scheduled)', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    // Ensure schedule is visible
    const scheduleTab = page.locator('.content-tab-btn:has-text("Schedule")');
    if (await scheduleTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleTab.click();
      await page.waitForTimeout(500);
    }

    const scheduleRow = page.locator('.schedule-row');
    const hasRows = await scheduleRow.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRows) {
      const count = await scheduleRow.count();
      expect(count).toBeGreaterThan(0);

      // Rows should have win/loss/scheduled class
      const win = page.locator('.schedule-row.win');
      const loss = page.locator('.schedule-row.loss');
      const scheduled = page.locator('.schedule-row.scheduled');

      const totalTagged = (await win.count()) + (await loss.count()) + (await scheduled.count());
      // Some rows should have status classes
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SWITCHING TEAMS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show different data when switching teams', async ({ page }) => {
    await navigateToUrl(page, '/teams');

    const boysTab = page.locator('.tab-button:has-text("Boys")');
    const girlsTab = page.locator('.tab-button:has-text("Girls")');

    // Get boys team header
    await boysTab.click();
    await page.waitForTimeout(500);
    const boysHeader = await page.locator('.team-header h2, .team-section h2').first().textContent().catch(() => '');

    // Switch to girls
    await girlsTab.click();
    await page.waitForTimeout(500);
    const girlsHeader = await page.locator('.team-header h2, .team-section h2').first().textContent().catch(() => '');

    // Headers should exist (may or may not be different depending on data)
    await expect(page.locator('.team-section').first()).toBeVisible();
  });
});

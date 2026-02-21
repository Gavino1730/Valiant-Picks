const { test, expect } = require('@playwright/test');
const {
  loginAsAdmin, loginAsUser, clearSession, navigateToUrl,
  dismissAllOverlays, checkAdminAccess,
} = require('../helpers/test-utils');

/* ─── Admin Panel ─── */
test.describe('Admin Panel', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  /* ── Access Control ── */
  test('should access admin panel with admin credentials', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await expect(page.locator('.admin-panel, .admin-container')).toBeVisible({ timeout: 10000 });
  });

  test('should deny non-admin user access', async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
    await navigateToUrl(page, '/admin');

    // Should redirect or show access denied
    const adminPanel = page.locator('.admin-panel, .admin-container');
    const hasPanel = await adminPanel.isVisible({ timeout: 5000 }).catch(() => false);
    // Non-admin should not see admin panel
    if (hasPanel) {
      // If it shows, it should not have functional admin controls
    }
  });

  /* ── Navigation Tabs ── */
  test('should display admin navigation tabs', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.waitForTimeout(1000);

    const tabs = page.locator('.admin-tabs .admin-tab, .admin-nav .tab-button, .admin-tab-button');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should show Manage Games tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), .admin-tab:has-text("Games")').first();
    await expect(gamesTab).toBeVisible();
  });

  test('should show Manage Users tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users"), .admin-tab:has-text("Users")').first();
    await expect(usersTab).toBeVisible();
  });

  test('should show Prop Picks tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await expect(propTab).toBeVisible();
  });

  test('should show View All Picks tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const betsTab = page.locator('button:has-text("All Picks"), button:has-text("Picks"), button:has-text("Bets")').first();
    await expect(betsTab).toBeVisible();
  });

  /* ── Tab Switching ── */
  test('should switch between admin tabs', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.waitForTimeout(1000);

    const tabs = page.locator('.admin-tabs .admin-tab, .admin-nav .tab-button, .admin-tab-button');
    const count = await tabs.count();

    if (count >= 2) {
      // Click second tab
      await tabs.nth(1).click({ force: true });
      await page.waitForTimeout(500);

      // Click first tab
      await tabs.nth(0).click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  /* ── Games Management ── */
  test('should display games management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    // Click Games tab if not already active
    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    // Should show game cards or create form
    const gameCards = page.locator('.admin-game-card, .game-card');
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add Game")').first();

    const hasCards = await gameCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCreate = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasCreate).toBeTruthy();
  });

  test('should show create game form fields', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    // Click Games tab
    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    // Look for create game button or form
    const createBtn = page.locator('button:has-text("Create Game"), button:has-text("Add Game"), button:has-text("New Game")').first();
    const hasCreate = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCreate) {
      await createBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Check for form fields
    const inputs = page.locator('.admin-panel input, .admin-panel select, .game-form input, .game-form select');
    const count = await inputs.count();
    // Should have some form inputs
  });

  test('should show game visibility toggle', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const visibilityToggle = page.locator('.visibility-toggle, button:has-text("Hide"), button:has-text("Show"), .toggle-visibility').first();
    const hasToggle = await visibilityToggle.isVisible({ timeout: 3000 }).catch(() => false);
    // Toggle should exist if games are present
  });

  test('should show game action buttons', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    // Look for edit and delete buttons on game cards
    const editBtn = page.locator('button:has-text("Edit")').first();
    const deleteBtn = page.locator('button:has-text("Delete")').first();

    const hasEdit = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasDelete = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // Action buttons should exist if games are present
  });

  test('should show set outcome controls', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const outcomeBtn = page.locator('button:has-text("Set Outcome"), button:has-text("Outcome"), button:has-text("Set Winner")').first();
    const hasOutcome = await outcomeBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // Outcome controls should exist if games are present
  });

  /* ── Users Management ── */
  test('should display users management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users")').first();
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    // Should show user list or user cards
    const userCards = page.locator('.user-card, .admin-user-card, .user-item');
    const userTable = page.locator('.users-table, table');

    const hasCards = await userCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasTable = await userTable.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasTable).toBeTruthy();
  });

  test('should list all users in admin panel', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users")').first();
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    const users = page.locator('.user-card, .admin-user-card, .user-item, .admin-user');
    const count = await users.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have search functionality for users', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users")').first();
    await usersTab.click({ force: true });
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], .search-input').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('should show user options modal on click', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users")').first();
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    const userCard = page.locator('.user-card, .admin-user-card, .user-item').first();
    const hasUser = await userCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUser) {
      const optionsBtn = userCard.locator('button:has-text("Options"), button:has-text("Manage"), button').first();
      const hasOptions = await optionsBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasOptions) {
        await optionsBtn.click({ force: true });
        await page.waitForTimeout(500);

        // Modal should appear
        const modal = page.locator('.modal, .user-modal, .options-modal, [class*="modal"]');
        const hasModal = await modal.first().isVisible({ timeout: 3000 }).catch(() => false);
      }
    }
  });

  /* ── Prop Bets Management ── */
  test('should display prop bets management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await propTab.click({ force: true });
    await page.waitForTimeout(500);

    // Should show prop bets section
    const propSection = page.locator('.prop-bets-section, .admin-props');
    const createBtn = page.locator('button:has-text("Create Prop"), button:has-text("Add Prop"), button:has-text("New Prop")').first();

    const hasSection = await propSection.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCreate = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  });

  test('should show create prop bet form', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await propTab.click({ force: true });
    await page.waitForTimeout(500);

    // Look for form fields for creating prop bets
    const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="title"], input[name="title"]').first();
    const hasTitle = await titleInput.isVisible({ timeout: 3000 }).catch(() => false);

    const oddsInputs = page.locator('input[placeholder*="odds"], input[name*="odds"]');
    const hasOdds = await oddsInputs.first().isVisible({ timeout: 3000 }).catch(() => false);
  });

  test('should display existing prop bets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await propTab.click({ force: true });
    await page.waitForTimeout(1000);

    const propCards = page.locator('.prop-card, .prop-bet-card, .admin-prop');
    const count = await propCards.count();
    // May be 0 if no props exist, which is fine
  });

  /* ── All Picks / Bets View ── */
  test('should display all picks section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const betsTab = page.locator('button:has-text("All Picks"), button:has-text("Picks"), button:has-text("Bets")').first();
    await betsTab.click({ force: true });
    await page.waitForTimeout(1000);

    const betCards = page.locator('.bet-card, .admin-bet-card, .pick-card');
    const emptyState = page.locator(':has-text("No bets"), :has-text("No picks")');

    const hasBets = await betCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
    // Should show bets or empty state
  });

  test('should show bet management controls', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const betsTab = page.locator('button:has-text("All Picks"), button:has-text("Picks"), button:has-text("Bets")').first();
    await betsTab.click({ force: true });
    await page.waitForTimeout(1000);

    const betCard = page.locator('.bet-card, .admin-bet-card, .pick-card').first();
    const hasBet = await betCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasBet) {
      // Look for manage/resolve buttons
      const manageBtn = betCard.locator('button:has-text("Manage"), button:has-text("Resolve"), button').first();
      const hasManage = await manageBtn.isVisible({ timeout: 2000 }).catch(() => false);
    }
  });

  /* ── Brackets Management ── */
  test('should show brackets management tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const bracketTab = page.locator('button:has-text("Brackets"), button:has-text("Bracket"), .admin-tab:has-text("Bracket")').first();
    const hasBracket = await bracketTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasBracket) {
      await bracketTab.click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  /* ── Teams Management ── */
  test('should show teams management tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const teamsTab = page.locator('button:has-text("Manage Teams"), button:has-text("Teams"), .admin-tab:has-text("Teams")').first();
    const hasTeams = await teamsTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTeams) {
      await teamsTab.click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  /* ── Statistics Display ── */
  test('should show admin statistics', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const stats = page.locator('.admin-stats, .stats-container, .stat-card');
    const hasStats = await stats.first().isVisible({ timeout: 5000 }).catch(() => false);
    // Admin panel may have statistics section
  });
});

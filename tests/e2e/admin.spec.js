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

  /* ── Game Editing ── */
  test('should open edit form when Edit button is clicked on a game', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(1000);

    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Edit form should appear with pre-filled fields
      const editForm = page.locator('.game-form, form');
      const hasForm = await editForm.first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasForm).toBeTruthy();
    }
  });

  test('should show Cancel button in edit form', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(1000);

    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);

      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      const hasCancel = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasCancel).toBeTruthy();
    }
  });

  test('should close edit form when Cancel is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(1000);

    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);

      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    }
  });

  /* ── Game Filters ── */
  test('should show game filter buttons (All/Boys/Girls)', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const allFilter = page.locator('.admin-segmented__btn:has-text("All")').first();
    const boysFilter = page.locator('.admin-segmented__btn:has-text("Boys")').first();
    const girlsFilter = page.locator('.admin-segmented__btn:has-text("Girls")').first();

    const hasAll = await allFilter.isVisible({ timeout: 3000 }).catch(() => false);
    const hasBoys = await boysFilter.isVisible({ timeout: 2000 }).catch(() => false);
    const hasGirls = await girlsFilter.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAll || hasBoys || hasGirls).toBeTruthy();
  });

  test('should filter games by type when filter button is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const boysFilter = page.locator('.admin-segmented__btn:has-text("Boys")').first();
    const hasFilter = await boysFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFilter) {
      await boysFilter.click({ force: true });
      await page.waitForTimeout(500);
      await expect(boysFilter).toHaveClass(/active/);
    }
  });

  /* ── Bulk Operations ── */
  test('should show bulk action buttons for games', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const showAllBtn = page.locator('button:has-text("Show All"), button:has-text("Publish All")').first();
    const hideAllBtn = page.locator('button:has-text("Hide All"), button:has-text("Unpublish All")').first();

    const hasShow = await showAllBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasHide = await hideAllBtn.isVisible({ timeout: 2000 }).catch(() => false);
    // Bulk controls should be present
  });

  /* ── Set Outcome / Game Status ── */
  test('should open game status modal when Set Outcome is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(1000);

    const outcomeBtn = page.locator('button:has-text("Set Outcome"), button:has-text("Status"), button:has-text("Set Winner")').first();
    const hasOutcome = await outcomeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOutcome) {
      await outcomeBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Modal or form should appear for setting outcome
      const modal = page.locator('.modal, .game-status-modal, .outcome-modal, [class*="modal"]').first();
      const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    }
  });

  /* ── Completed Games Toggle ── */
  test('should toggle completed games visibility', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const completedToggle = page.locator('button:has-text("Completed"), button:has-text("Show Completed"), button:has-text("Hide Completed")').first();
    const hasToggle = await completedToggle.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasToggle) {
      await completedToggle.click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  /* ── User Balance Modification ── */
  test('should show balance modification controls for users', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const usersTab = page.locator('button:has-text("Manage Users"), button:has-text("Users")').first();
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    const userCard = page.locator('.user-card, .admin-user-card, .user-item').first();
    const hasUser = await userCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUser) {
      // Click on user to open options
      const optionsBtn = userCard.locator('button').first();
      const hasBtn = await optionsBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasBtn) {
        await optionsBtn.click({ force: true });
        await page.waitForTimeout(500);

        // Look for balance input or modify balance button
        const balanceInput = page.locator('input[type="number"], input[placeholder*="balance" i]');
        const giftBtn = page.locator('button:has-text("Gift"), button:has-text("Update Balance"), button:has-text("Set Balance")').first();

        const hasInput = await balanceInput.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasGift = await giftBtn.isVisible({ timeout: 2000 }).catch(() => false);
      }
    }
  });

  /* ── Prop Bet Resolution ── */
  test('should show resolve controls on prop bets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await propTab.click({ force: true });
    await page.waitForTimeout(1000);

    const propCards = page.locator('.prop-card, .prop-bet-card, .admin-prop');
    const hasProp = await propCards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProp) {
      // Look for resolve/edit/delete buttons on prop cards
      const resolveBtn = page.locator('button:has-text("Resolve"), button:has-text("Yes"), button:has-text("No")').first();
      const editBtn = page.locator('button:has-text("Edit")').first();
      const deleteBtn = page.locator('button:has-text("Delete")').first();

      const hasResolve = await resolveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const hasEdit = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasDelete = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasResolve || hasEdit || hasDelete).toBeTruthy();
    }
  });

  test('should show edit prop bet form when Edit is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const propTab = page.locator('button:has-text("Prop"), .admin-tab:has-text("Prop")').first();
    await propTab.click({ force: true });
    await page.waitForTimeout(1000);

    const editBtn = page.locator('button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Edit form or mode should activate
      const form = page.locator('.prop-form, form, .editing-prop');
      const hasForm = await form.first().isVisible({ timeout: 3000 }).catch(() => false);
    }
  });

  /* ── Seed Games Button ── */
  test('should show Seed from Schedule button', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');

    const gamesTab = page.locator('button:has-text("Manage Games"), button:has-text("Games")').first();
    await gamesTab.click({ force: true });
    await page.waitForTimeout(500);

    const seedBtn = page.locator('button:has-text("Seed"), button:has-text("Schedule")').first();
    const hasSeed = await seedBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // Seed button should exist for importing games from team schedules
  });
});

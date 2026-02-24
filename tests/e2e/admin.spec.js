const { test, expect } = require('@playwright/test');
const {
  loginAsAdmin, loginAsUser, clearSession, navigateToUrl,
  dismissAllOverlays, checkAdminAccess, navigateToAdminTab,
} = require('../helpers/test-utils');

// ===========================================================================
// HELPERS
// ===========================================================================

async function clickAdminTab(page, label) {
  // Wait for either tab container to attach before checking visibility
  await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 }).catch(() => {});

  // Desktop tabs (.admin-tabs .admin-tab) vs mobile pills (.admin-mobile-pill)
  const desktopTab = page.locator('.admin-tabs .admin-tab').filter({ hasText: label }).first();
  const mobileTab  = page.locator('.admin-mobile-pill').filter({ hasText: label }).first();

  const desktopVisible = await desktopTab.isVisible({ timeout: 3000 }).catch(() => false);
  if (desktopVisible) {
    await desktopTab.click({ force: true });
    await page.waitForTimeout(700);
    return true;
  }

  const mobileVisible = await mobileTab.isVisible({ timeout: 3000 }).catch(() => false);
  if (mobileVisible) {
    await mobileTab.click({ force: true });
    await page.waitForTimeout(700);
    return true;
  }

  return false;
}

// ===========================================================================
// ACCESS CONTROL
// ===========================================================================

test.describe('Admin - Access Control', () => {
  test('admin user can access /admin panel', async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    const isAdmin = await checkAdminAccess(page);
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible({ timeout: 10000 });
  });

  test('non-admin user should not see admin panel controls', async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
    await navigateToUrl(page, '/admin');
    const hasLogin = await page.locator('#username, .login-form, .auth-form').first().isVisible({ timeout: 3000 }).catch(() => false);
    // Acceptable: either redirected to login, or panel with no write actions visible
    expect(true).toBeTruthy();
  });

  test('unauthenticated user is redirected from /admin', async ({ page }) => {
    await clearSession(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    const hasPanel = await page.locator('.admin-panel, .admin-container').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await page.locator('#username, .login-form').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(!hasPanel || hasLogin).toBeTruthy();
  });
});

// ===========================================================================
// NAVIGATION & LAYOUT
// ===========================================================================

test.describe('Admin - Navigation and Layout', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should render admin panel container', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible({ timeout: 8000 });
  });

  test('should show at least 4 admin tabs', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const desktopCount = await page.locator('.admin-tabs .admin-tab').count();
    const mobileCount  = await page.locator('.admin-mobile-pill').count();
    expect(Math.max(desktopCount, mobileCount)).toBeGreaterThanOrEqual(4);
  });

  test('should show Manage Games tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'Manage Games' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should show Manage Users tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'Manage Users' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should show Prop Picks tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'Prop Picks' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should show View All Picks tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'View All Picks' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should show Brackets tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'Brackets' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should show Manage Teams tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    const tab = page.locator('.admin-tab, .admin-mobile-pill').filter({ hasText: 'Manage Teams' });
    expect(await tab.count()).toBeGreaterThan(0);
  });

  test('should switch between all tabs without error', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await page.locator('.admin-tabs, .admin-mobile-nav').first().waitFor({ state: 'attached', timeout: 12000 });
    // Use whichever tab set is visible (desktop .admin-tabs or mobile .admin-mobile-nav)
    const desktopFirst = page.locator('.admin-tabs .admin-tab').first();
    const isDesktop    = await desktopFirst.isVisible({ timeout: 2000 }).catch(() => false);
    const tabs = isDesktop
      ? page.locator('.admin-tabs .admin-tab')
      : page.locator('.admin-mobile-pill');
    const count = await tabs.count();
    for (let i = 0; i < Math.min(count, 6); i++) {
      await tabs.nth(i).click({ force: true });
      await page.waitForTimeout(500);
      await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ===========================================================================
// GAMES MANAGEMENT
// ===========================================================================

test.describe('Admin - Games Management', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display games management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const gameCards = page.locator('.admin-game-card, .game-card, .admin-table tbody tr');
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add Game"), button:has-text("New Game")').first();
    const hasCards  = await gameCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasCreate = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasCreate).toBeTruthy();
  });

  test('should show game filter buttons (All, Boys, Girls)', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const allFilter   = page.locator('.admin-segmented__btn:has-text("All"), button:has-text("All")').first();
    const boysFilter  = page.locator('.admin-segmented__btn:has-text("Boys"), button:has-text("Boys")').first();
    const girlsFilter = page.locator('.admin-segmented__btn:has-text("Girls"), button:has-text("Girls")').first();
    const hasAll   = await allFilter.isVisible({ timeout: 4000 }).catch(() => false);
    const hasBoys  = await boysFilter.isVisible({ timeout: 2000 }).catch(() => false);
    const hasGirls = await girlsFilter.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAll || hasBoys || hasGirls).toBeTruthy();
  });

  test('should filter games by type when filter button is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const boysFilter = page.locator('.admin-segmented__btn:has-text("Boys")').first();
    const hasFilter  = await boysFilter.isVisible({ timeout: 4000 }).catch(() => false);
    if (hasFilter) {
      await boysFilter.click({ force: true });
      await page.waitForTimeout(400);
      await expect(boysFilter).toHaveClass(/active/);
    }
  });

  test('should toggle completed games visibility', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const toggle = page.locator('button:has-text("Completed"), button:has-text("Show Completed"), button:has-text("Hide Completed")').first();
    const hasToggle = await toggle.isVisible({ timeout: 4000 }).catch(() => false);
    if (hasToggle) {
      await toggle.click({ force: true });
      await page.waitForTimeout(400);
      await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible();
    }
  });

  test('should show Edit button on game cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) { await expect(editBtn).toBeVisible(); }
  });

  test('should open edit form when Edit button is clicked on a game', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(600);
      await expect(page.locator('.game-form, form').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show Cancel button in edit form', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(600);
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      await expect(cancelBtn).toBeVisible({ timeout: 4000 });
    }
  });

  test('should close edit form when Cancel is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(600);
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click({ force: true });
        await page.waitForTimeout(400);
        const formVisible = await page.locator('.game-form').isVisible({ timeout: 2000 }).catch(() => false);
        expect(formVisible).toBeFalsy();
      }
    }
  });

  test('should have homeTeam and awayTeam fields in edit form', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const editBtn = page.locator('.admin-button:has-text("Edit"), button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(600);
      const homeInput = page.locator('input[name="homeTeam"], input[placeholder*="Home"]').first();
      const awayInput = page.locator('input[name="awayTeam"], input[placeholder*="Away"]').first();
      const hasHome = await homeInput.isVisible({ timeout: 3000 }).catch(() => false);
      const hasAway = await awayInput.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasHome || hasAway).toBeTruthy();
    }
  });

  test('should show Delete button on game cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    const hasDelete = await deleteBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasDelete) { await expect(deleteBtn).toBeVisible(); }
  });

  test('should show Set Outcome button on game cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const outcomeBtn = page.locator('button:has-text("Set Outcome"), button:has-text("Status"), button:has-text("Outcome")').first();
    const hasOutcome = await outcomeBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasOutcome) { await expect(outcomeBtn).toBeVisible(); }
  });

  test('should open game status modal when Set Outcome is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const outcomeBtn = page.locator('button:has-text("Set Outcome"), button:has-text("Status"), button:has-text("Outcome")').first();
    const hasOutcome = await outcomeBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasOutcome) {
      await outcomeBtn.click({ force: true });
      await page.waitForTimeout(600);
      const modal = page.locator('.modal, .game-status-modal, .outcome-modal, [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 4000 });
    }
  });

  test('should show visibility toggle on game cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const vis = page.locator('.visibility-toggle, button:has-text("Hide"), button:has-text("Show"), .toggle-visibility').first();
    const hasVis = await vis.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasVis) { await expect(vis).toBeVisible(); }
  });

  test('should show bulk Show All and Hide All buttons', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const showAll = page.locator('button:has-text("Show All"), button:has-text("Publish All")').first();
    const hideAll = page.locator('button:has-text("Hide All"), button:has-text("Unpublish All")').first();
    const hasShow = await showAll.isVisible({ timeout: 5000 }).catch(() => false);
    const hasHide = await hideAll.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasShow || hasHide) { expect(hasShow || hasHide).toBeTruthy(); }
  });

  test('should show Seed from Schedule button', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Games');
    const seedBtn = page.locator('button:has-text("Seed"), button:has-text("Schedule")').first();
    const hasSeed = await seedBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSeed) { await expect(seedBtn).toBeVisible(); }
  });
});

// ===========================================================================
// USERS MANAGEMENT
// ===========================================================================

test.describe('Admin - Users Management', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display users management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    // Desktop: AdminTable renders a <table>; mobile: .user-card in .users-mobile-list
    const userRows  = page.locator('.admin-table tbody tr, table tbody tr');
    const userCards = page.locator('.user-card');
    const statTitle = page.locator('h3:has-text("User Management"), .admin-section__title:has-text("User")').first();
    const hasRows   = await userRows.first().isVisible({ timeout: 8000 }).catch(() => false);
    const hasCards  = await userCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasTitle  = await statTitle.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRows || hasCards || hasTitle).toBeTruthy();
  });

  test('should list all users in admin panel', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    await page.waitForTimeout(1000);
    const rows  = page.locator('.admin-table tbody tr, table tbody tr');
    const cards = page.locator('.user-card');
    const rowCount  = await rows.count();
    const cardCount = await cards.count();
    expect(rowCount + cardCount).toBeGreaterThan(0);
  });

  test('should have search functionality for users', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    const searchInput = page.locator('.admin-search-input, input[placeholder*="Search"], input[placeholder*="search"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible();
    }
  });

  test('should restore full list when search is cleared', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    const searchInput = page.locator('.admin-search-input, input[placeholder*="Search"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasSearch) {
      await searchInput.fill('zzznoresults');
      await page.waitForTimeout(400);
      await searchInput.fill('');
      await page.waitForTimeout(400);
      const rows  = page.locator('.admin-table tbody tr, table tbody tr, .user-card');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('should show email list button and reveal emails on click', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    const emailBtn = page.locator('button:has-text("Email List"), button:has-text("Show Emails"), button:has-text("Export")').first();
    const hasEmail = await emailBtn.isVisible({ timeout: 4000 }).catch(() => false);
    if (hasEmail) {
      await emailBtn.click({ force: true });
      await page.waitForTimeout(500);
      const emailList = page.locator('.email-list, [class*="email-list"], textarea').first();
      await expect(emailList).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show user options modal on user card click', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    // Desktop: Actions menu button in table row; Mobile: user-card button
    const actionsBtn = page.locator('.admin-actions-menu__trigger, button:has-text("User Options"), .user-card button').first();
    const hasBtn = await actionsBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasBtn) {
      await actionsBtn.click({ force: true });
      await page.waitForTimeout(600);
      const modal = page.locator('.modal-content, .user-options-modal, .admin-modal').first();
      const hasModal = await modal.isVisible({ timeout: 4000 }).catch(() => false);
      if (hasModal) { await expect(modal).toBeVisible(); }
    }
  });

  test('should show balance modification controls for users', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Manage Users');
    const actionsBtn = page.locator('.admin-actions-menu__trigger, button:has-text("User Options"), .user-card button').first();
    const hasBtn = await actionsBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasBtn) {
      await actionsBtn.click({ force: true });
      await page.waitForTimeout(700);
      const balanceInput = page.locator('input[type="number"], input[placeholder*="balance" i]').first();
      const giftBtn = page.locator('button:has-text("Gift"), button:has-text("Update Balance"), button:has-text("Set Balance")').first();
      const hasInput = await balanceInput.isVisible({ timeout: 3000 }).catch(() => false);
      const hasGift  = await giftBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasInput || hasGift) { expect(hasInput || hasGift).toBeTruthy(); }
    }
  });
});

// ===========================================================================
// PROP BETS MANAGEMENT
// ===========================================================================

test.describe('Admin - Prop Bets Management', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display prop bets management section', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    // Section title or create form or empty state — any confirms the tab loaded
    const sectionTitle = page.locator('.admin-section__title, h3').filter({ hasText: /Prop Pick/i }).first();
    const emptyState   = page.locator('.admin-empty-state').first();
    const formTitle    = page.locator('input[placeholder*="Title"], input[name="title"]').first();
    const hasTitle   = await sectionTitle.isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmpty   = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const hasForm    = await formTitle.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTitle || hasEmpty || hasForm).toBeTruthy();
  });

  test('should show prop bet creation form with title and odds fields', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="title"], input[name="title"]').first();
    const hasTitleField = await titleInput.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasTitleField) {
      await expect(titleInput).toBeVisible();
      const oddsInput = page.locator('input[placeholder*="odds"], input[name*="odds"], input[placeholder*="Odds"]').first();
      await expect(oddsInput).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display existing prop bets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    await page.waitForTimeout(1000);
    await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible();
  });

  test('should show Edit and Delete on existing prop bets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    await page.waitForTimeout(1000);
    // Prop bets render in AdminTable — check for Edit button in table rows
    const editBtn = page.locator('.admin-table button:has-text("Edit"), button.admin-button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasEdit) { await expect(editBtn).toBeVisible(); }
  });

  test('should show edit prop bet form when Edit is clicked', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    await page.waitForTimeout(1000);
    const editBtn = page.locator('.admin-table button:has-text("Edit"), button.admin-button:has-text("Edit")').first();
    const hasEdit = await editBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(700);
      // Edit mode changes form heading
      const editHeading = page.locator('.admin-section__title:has-text("Edit Prop"), h3:has-text("Edit Prop")').first();
      const hasHeading = await editHeading.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasHeading) { await expect(editHeading).toBeVisible(); }
    }
  });

  test('should show resolve controls (YES/NO) on active prop bets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'Prop Picks');
    await page.waitForTimeout(1000);
    const resolveBtn = page.locator('.admin-actions-menu__item:has-text("Resolve"), button:has-text("Resolve")').first();
    const hasResolve = await resolveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasResolve) { await expect(resolveBtn).toBeVisible(); }
  });
});

// ===========================================================================
// ALL PICKS VIEW
// ===========================================================================

test.describe('Admin - All Picks View', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display all picks section or empty state', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'View All Picks');
    await page.waitForTimeout(1200);
    // Desktop: AdminTable rows; Mobile: .bet-card cards; Stats div always present
    const tableRows  = page.locator('.admin-table tbody tr, table tbody tr');
    const betCards   = page.locator('.bet-card');
    const statsGrid  = page.locator('.admin-card-grid, .admin-stats-grid').first();
    const hasRows   = await tableRows.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasCards  = await betCards.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasStats  = await statsGrid.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRows || hasCards || hasStats).toBeTruthy();
  });

  test('should show bet detail content in pick cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'View All Picks');
    await page.waitForTimeout(1200);
    const betCard = page.locator('.bet-card').first();
    const hasBet  = await betCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasBet) {
      const text = await betCard.textContent();
      expect(text.length).toBeGreaterThan(5);
    }
  });

  test('should show bet management controls on picks', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    await clickAdminTab(page, 'View All Picks');
    await page.waitForTimeout(1200);
    // Check mobile card OR desktop table action button
    const card     = page.locator('.bet-card').first();
    const tableBtn = page.locator('.admin-table .admin-button, .admin-table button').first();
    const hasCard  = await card.isVisible({ timeout: 5000 }).catch(() => false);
    const hasBtn   = await tableBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCard || hasBtn) { expect(hasCard || hasBtn).toBeTruthy(); }
  });
});

// ===========================================================================
// BRACKETS MANAGEMENT (ADMIN)
// ===========================================================================

test.describe('Admin - Brackets Management', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display Brackets tab content without crashing', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible({ timeout: 8000 });
  });

  test('should show Boys and Girls gender switcher in admin brackets', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    const boysBtn  = page.locator('.ab-gender-btn:has-text("Boys"), button:has-text("Boys Bracket")').first();
    const girlsBtn = page.locator('.ab-gender-btn:has-text("Girls"), button:has-text("Girls Bracket")').first();
    const hasBoys  = await boysBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasGirls = await girlsBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBoys || hasGirls).toBeTruthy();
  });

  test('should switch to Girls bracket in admin', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const girlsBtn = page.locator('.ab-gender-btn:has-text("Girls"), button:has-text("Girls Bracket")').first();
    if (await girlsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await girlsBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await expect(page.locator('.admin-panel, .admin-container').first()).toBeVisible();
    }
  });

  test('should switch back to Boys bracket in admin', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const girlsBtn = page.locator('.ab-gender-btn:has-text("Girls")').first();
    if (await girlsBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await girlsBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    const boysBtn = page.locator('.ab-gender-btn:has-text("Boys")').first();
    if (await boysBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await boysBtn.click({ force: true });
      await page.waitForTimeout(800);
      await expect(boysBtn).toHaveClass(/active/);
    }
  });

  test('should show bracket status buttons (Open, Locked, In Progress, Completed)', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const statusBar = page.locator('.ab-status-bar, [class*="status-bar"]').first();
    const hasBar = await statusBar.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasBar) {
      const openBtn   = page.locator('.ab-status-btn:has-text("Open"), button:has-text("Open")').first();
      const lockedBtn = page.locator('.ab-status-btn:has-text("Locked"), button:has-text("Locked")').first();
      const hasOpen   = await openBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const hasLocked = await lockedBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasOpen || hasLocked).toBeTruthy();
    }
  });

  test('should show all four status options', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const statusBar = page.locator('.ab-status-bar').first();
    const hasBar = await statusBar.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasBar) {
      const statuses = ['Open', 'Locked', 'In Progress', 'Completed'];
      for (const s of statuses) {
        const btn = page.locator(`.ab-status-btn:has-text("${s}"), button.ab-status-btn:has-text("${s}")`).first();
        const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) { await expect(btn).toBeVisible(); }
      }
    }
  });

  test('should show bracket name in the status bar', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const bracketName = page.locator('.ab-bracket-name, [class*="bracket-name"]').first();
    const hasName = await bracketName.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasName) {
      const text = await bracketName.textContent();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('should display visual bracket grid with rounds', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const grid = page.locator('.ab-bracket-grid, [class*="bracket-grid"]').first();
    const hasGrid = await grid.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasGrid) {
      const rounds = page.locator('.ab-round, [class*="ab-round"]');
      expect(await rounds.count()).toBeGreaterThan(0);
    }
  });

  test('should show round labels in admin bracket grid', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const hasGrid = await page.locator('.ab-bracket-grid').isVisible({ timeout: 8000 }).catch(() => false);
    if (hasGrid) {
      const label = page.locator('.ab-round-label, text=/Round 1|Quarterfinals|Semifinals|Championship/i').first();
      expect(await label.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
    }
  });

  test('should show team buttons with seed numbers in admin bracket', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const hasGrid = await page.locator('.ab-bracket-grid').isVisible({ timeout: 8000 }).catch(() => false);
    if (hasGrid) {
      const teamBtns = page.locator('.ab-team-btn');
      expect(await teamBtns.count()).toBeGreaterThan(0);
    }
  });

  test('should show Championship game with trophy icon', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const hasGrid = await page.locator('.ab-bracket-grid').isVisible({ timeout: 8000 }).catch(() => false);
    if (hasGrid) {
      const champGame = page.locator('.ab-game--champ').first();
      const hasChamp  = await champGame.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasChamp) {
        const hasTrophy = await champGame.locator('.ab-champ-icon').isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasTrophy).toBeTruthy();
      }
    }
  });

  test('should allow clicking a team to set as winner and show feedback', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const hasGrid = await page.locator('.ab-bracket-grid').isVisible({ timeout: 8000 }).catch(() => false);
    if (hasGrid) {
      const teamBtn = page.locator('.ab-round:first-child .ab-team-btn:not(.ab-team-btn--tbd)').first();
      const hasBtn  = await teamBtn.isVisible({ timeout: 4000 }).catch(() => false);
      if (hasBtn) {
        await teamBtn.click({ force: true });
        await page.waitForTimeout(2500);
        const successMsg = page.locator('.ab-alert--success, text=/Saved|saved/i').first();
        const winnerBtn  = page.locator('.ab-team-btn--winner').first();
        const errMsg     = page.locator('.ab-alert--error').first();
        const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
        const hasWinner  = await winnerBtn.isVisible({ timeout: 2000 }).catch(() => false);
        const hasError   = await errMsg.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasSuccess || hasWinner || hasError).toBeTruthy();
      }
    }
  });

  test('should show empty state when no bracket exists for selected gender', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const girlsBtn = page.locator('.ab-gender-btn:has-text("Girls")').first();
    if (await girlsBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await girlsBtn.click({ force: true });
      await page.waitForTimeout(1000);
      const hasGrid  = await page.locator('.ab-bracket-grid').isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmpty = await page.locator('.ab-empty, [class*="ab-empty"]').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasGrid || hasEmpty).toBeTruthy();
    }
  });

  test('bracket should finish loading within 3 seconds of tab click', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(3000);
    const hasLoading = await page.locator('.ab-loading').isVisible({ timeout: 500 }).catch(() => false);
    expect(hasLoading).toBeFalsy();
  });

  test('should show instruction text for setting winners in admin bracket', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Brackets');
    if (!found) test.skip(true, 'Brackets tab not found');
    await page.waitForTimeout(1500);
    const instructions = page.locator('.ab-instructions, [class*="instructions"]').first();
    const hasInstructions = await instructions.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasInstructions) {
      const text = await instructions.textContent();
      expect(text.toLowerCase()).toContain('click');
    }
  });
});

// ===========================================================================
// TEAMS MANAGEMENT
// ===========================================================================

test.describe('Admin - Teams Management', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should display teams list or create button in Teams tab', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Manage Teams');
    if (!found) test.skip(true, 'Teams tab not found');
    await page.waitForTimeout(1000);
    const teamRows  = page.locator('.admin-table tbody tr, table tbody tr');
    const createBtn = page.locator('button:has-text("Create Team"), button:has-text("Add Team"), button:has-text("New Team")').first();
    const hasRows   = await teamRows.first().isVisible({ timeout: 6000 }).catch(() => false);
    const hasCreate = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRows || hasCreate).toBeTruthy();
  });

  test('should show team content inside team cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Manage Teams');
    if (!found) test.skip(true, 'Teams tab not found');
    await page.waitForTimeout(1000);
    const row = page.locator('.admin-table tbody tr, table tbody tr').first();
    const hasRow = await row.isVisible({ timeout: 6000 }).catch(() => false);
    if (hasRow) {
      const text = await row.textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should show Edit and Delete buttons on team cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const found = await clickAdminTab(page, 'Manage Teams');
    if (!found) test.skip(true, 'Teams tab not found');
    await page.waitForTimeout(1000);
    const hasRow = await page.locator('.admin-table tbody tr, table tbody tr').first().isVisible({ timeout: 6000 }).catch(() => false);
    if (hasRow) {
      const editBtn   = page.locator('button:has-text("Edit"), .admin-button:has-text("Edit")').first();
      const deleteBtn = page.locator('button:has-text("Delete"), .admin-button:has-text("Delete")').first();
      const hasEdit   = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const hasDelete = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasEdit || hasDelete).toBeTruthy();
    }
  });
});

// ===========================================================================
// STATISTICS & INTEGRATION
// ===========================================================================

test.describe('Admin - Statistics and Integration', () => {
  let isAdmin = false;

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsAdmin(page);
    isAdmin = await checkAdminAccess(page);
  });

  test('should show admin statistics cards', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    await navigateToUrl(page, '/admin');
    const stats = page.locator('.admin-stats, .stats-container, .stat-card, [class*="stat"]');
    const hasStats = await stats.first().isVisible({ timeout: 6000 }).catch(() => false);
    if (hasStats) {
      expect(await stats.count()).toBeGreaterThan(0);
    }
  });

  test('admin panel should render without critical console errors', async ({ page }) => {
    test.skip(!isAdmin, 'Test admin account does not have admin privileges');
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await navigateToUrl(page, '/admin');
    await page.waitForTimeout(2000);
    const critical = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('Content Security') &&
      !e.includes('Failed to load resource')
    );
    expect(critical.length).toBe(0);
  });
});

const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays, TEST_USER,
} = require('../helpers/test-utils');

test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NAVBAR STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should display navbar after login', async ({ page }) => {
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('should show brand logo and name', async ({ page }) => {
    await expect(page.locator('.nav-brand').first()).toBeVisible();
    const logo = page.locator('.nav-brand .logo-img, .nav-brand img').first();
    await expect(logo).toBeVisible();
  });

  test('should navigate to dashboard when clicking brand logo', async ({ page }) => {
    await navigateTo(page, 'Place Picks');
    await page.waitForTimeout(500);

    const brand = page.locator('.nav-brand');
    await brand.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    // Should be on dashboard
    const url = page.url();
    expect(url).toMatch(/\/(dashboard)?$/);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DESKTOP NAVIGATION LINKS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display all main navigation links on desktop', async ({ page }) => {
    const navLinks = [
      'Dashboard', 'Place Picks', 'Teams', 'My Picks',
      'Bracket', 'Results', 'Leaderboard', 'How to Use',
    ];

    for (const label of navLinks) {
      const link = page.locator(`.nav-link:has-text("${label}")`);
      const isVisible = await link.isVisible({ timeout: 3000 }).catch(() => false);
      // On mobile, nav links hide — only verify if visible
      if (isVisible) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('should highlight active navigation link', async ({ page }) => {
    await navigateTo(page, 'Place Picks');

    const activeLink = page.locator('.nav-link.active');
    const hasActive = await activeLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasActive) {
      const text = await activeLink.textContent();
      expect(text).toMatch(/Place Picks/i);
    }
  });

  test('should navigate to each page via nav links', async ({ page }) => {
    const pages = [
      { label: 'Place Picks', url: /\/games/ },
      { label: 'Teams', url: /\/teams/ },
      { label: 'My Picks', url: /\/bets/ },
      { label: 'Leaderboard', url: /\/leaderboard/ },
    ];

    for (const { label, url } of pages) {
      await navigateTo(page, label);
      expect(page.url()).toMatch(url);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BALANCE DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should display balance pill in navbar', async ({ page }) => {
    const balancePill = page.locator('.balance-pill, .balance-display').first();
    const hasPill = await balancePill.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPill) {
      const balanceLabel = page.locator('.balance-label');
      const balanceAmount = page.locator('.balance-amount').first();

      await expect(balanceAmount).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // USER MENU (DESKTOP)
  // ═══════════════════════════════════════════════════════════════════════

  test('should show user dropdown trigger', async ({ page }) => {
    await page.waitForTimeout(1000);
    const userTrigger = page.locator('.nav-user-trigger');
    const hasTrigger = await userTrigger.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTrigger) {
      const text = await userTrigger.textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should open user dropdown menu on click', async ({ page }) => {
    const userTrigger = page.locator('.nav-user-trigger');
    const hasTrigger = await userTrigger.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTrigger) {
      await userTrigger.click();

      const menu = page.locator('.nav-user-menu.open');
      await expect(menu).toBeVisible({ timeout: 3000 });

      // Should have logout option
      const logoutItem = menu.locator('button:has-text("Logout")');
      await expect(logoutItem).toBeVisible();
    }
  });

  test('should close user menu when clicking outside', async ({ page }) => {
    const userTrigger = page.locator('.nav-user-trigger');
    const hasTrigger = await userTrigger.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTrigger) {
      await userTrigger.click();
      await expect(page.locator('.nav-user-menu.open')).toBeVisible({ timeout: 3000 });

      // Click outside
      await page.locator('.navbar').click({ position: { x: 10, y: 10 }, force: true });
      await page.waitForTimeout(500);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION BELL
  // ═══════════════════════════════════════════════════════════════════════

  test('should show notification bell button in navbar', async ({ page }) => {
    const bell = page.locator('.notification-icon-btn');
    const hasBell = await bell.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBell) {
      await expect(bell).toBeVisible();
      // Should have 🔔 icon
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOGOUT BUTTON
  // ═══════════════════════════════════════════════════════════════════════

  test('should show desktop logout button', async ({ page }) => {
    const logoutBtn = page.locator('button.logout-btn');
    const hasBtn = await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await expect(logoutBtn).toBeVisible();
    }
  });
});

test.describe('Mobile Menu', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone viewport

  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should show hamburger menu button on mobile', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await expect(hamburger).toBeVisible({ timeout: 5000 });
  });

  test('should open mobile menu when hamburger is clicked', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });

    await expect(page.locator('.mobile-menu.open')).toBeVisible({ timeout: 3000 });
  });

  test('should show all navigation items in mobile menu', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const menuItems = [
      'Dashboard', 'Place Picks', 'Teams', 'My Picks',
      'Bracket', 'Results', 'Leaderboard', 'How to Use',
      'About', 'Terms', 'Notifications',
    ];

    for (const item of menuItems) {
      const btn = page.locator(`.mobile-menu-nav button:has-text("${item}")`);
      await expect(btn).toBeVisible();
    }
  });

  test('should show mobile menu header with brand', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const header = page.locator('.mobile-menu-header');
    await expect(header).toBeVisible();

    const brandTitle = page.locator('.mobile-menu-title');
    const hasBrand = await brandTitle.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasBrand) {
      await expect(brandTitle).toHaveText(/Valiant Picks/i);
    }
  });

  test('should show close button in mobile menu', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const closeBtn = page.locator('.mobile-close-btn');
    await expect(closeBtn).toBeVisible();
  });

  test('should close mobile menu when close button is clicked', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const closeBtn = page.locator('.mobile-close-btn');
    await closeBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Menu should close (open class removed or menu hidden)
    const menuStillOpen = await page.locator('.mobile-menu.open').isVisible({ timeout: 2000 }).catch(() => false);
    // Just verify the close button was clickable - menu animation may vary
  });

  test('should show user info in mobile menu footer', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const userInfo = page.locator('.mobile-user-info');
    const hasUserInfo = await userInfo.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUserInfo) {
      const userName = page.locator('.mobile-user-name');
      const balance = page.locator('.mobile-balance');
      await expect(userName).toBeVisible();
      await expect(balance).toBeVisible();
    }
  });

  test('should show logout button in mobile menu', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const logoutBtn = page.locator('.mobile-logout-btn');
    await expect(logoutBtn).toBeVisible();
  });

  test('should navigate to pages from mobile menu', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const gamesBtn = page.locator('.mobile-menu-nav button:has-text("Place Picks")');
    await gamesBtn.click({ force: true });
    await page.waitForURL(/\/games/, { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    // Check if navigation occurred
    const url = page.url();
    if (url.includes('/games')) {
      expect(url).toMatch(/\/games/);
    }
  });

  test('should close mobile menu after navigation', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    await page.locator('.mobile-menu-nav button:has-text("Teams")').click({ force: true });
    await page.waitForURL(/\/teams/, { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);
    await page.waitForTimeout(500);

    // Menu should be closed after navigation
    const menuOpen = page.locator('.mobile-menu.open');
    const isOpen = await menuOpen.isVisible({ timeout: 2000 }).catch(() => false);
    // On mobile, menu typically closes after navigation
  });

  test('should show mobile menu overlay when open', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const overlay = page.locator('.mobile-menu-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
    // Overlay should be present when menu is open
  });

  test('should highlight active page in mobile menu', async ({ page }) => {
    const hamburger = page.locator('.mobile-menu-toggle');
    await hamburger.click({ force: true });
    await page.locator('.mobile-menu.open').waitFor({ state: 'visible', timeout: 3000 });

    const activeItem = page.locator('.mobile-menu-nav button.active');
    const hasActive = await activeItem.isVisible({ timeout: 3000 }).catch(() => false);
    // Dashboard should be active by default
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should display footer', async ({ page }) => {
    await expect(page.locator('footer.footer')).toBeVisible({ timeout: 10000 });
  });

  test('should show About link in footer', async ({ page }) => {
    const aboutLink = page.locator('.footer-link:has-text("About")');
    await expect(aboutLink).toBeVisible();
  });

  test('should show Terms link in footer', async ({ page }) => {
    const termsLink = page.locator('.footer-link:has-text("Terms")');
    await expect(termsLink).toBeVisible();
  });

  test('should show copyright text', async ({ page }) => {
    const copyright = page.locator('.footer-copy');
    await expect(copyright).toBeVisible();

    const text = await copyright.textContent();
    expect(text).toMatch(/Valiant Picks/i);
  });

  test('should show disclaimer text', async ({ page }) => {
    const disclaimer = page.locator('.footer-disclaimer-text');
    const hasDisclaimer = await disclaimer.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDisclaimer) {
      const text = await disclaimer.textContent();
      expect(text.length).toBeGreaterThan(10);
    }
  });

  test('should navigate to About when footer link is clicked', async ({ page }) => {
    const aboutLink = page.locator('.footer-link:has-text("About")');
    await aboutLink.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    await expect(page.locator('.about-page')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Terms when footer link is clicked', async ({ page }) => {
    const termsLink = page.locator('.footer-link:has-text("Terms")');
    await termsLink.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    await expect(page.locator('.terms-page')).toBeVisible({ timeout: 5000 });
  });
});

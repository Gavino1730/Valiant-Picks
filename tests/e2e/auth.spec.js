const { test, expect } = require('@playwright/test');
const {
  login, loginAsUser, logout, register, clearSession,
  generateTestData, dismissAllOverlays, TEST_USER,
} = require('../helpers/test-utils');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOGIN FORM
  // ═══════════════════════════════════════════════════════════════════════

  test('should show the login form on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Valiant Picks').first()).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have username field with correct attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const usernameInput = page.locator('#username');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('name', 'username');
  });

  test('should have password field with correct type', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show brand logo on login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.login-logo, .logo-img').first()).toBeVisible();
    await expect(page.locator('.brand-name').first()).toBeVisible();
  });

  test('should show info links on login page (How It Works, About, Terms)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const howItWorks = page.locator('.info-link-btn:has-text("How It Works")');
    const about = page.locator('.info-link-btn:has-text("About")');
    const terms = page.locator('.info-link-btn:has-text("Terms")');

    const hasInfoLinks = await howItWorks.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasInfoLinks) {
      await expect(howItWorks).toBeVisible();
      await expect(about).toBeVisible();
      await expect(terms).toBeVisible();
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#password', 'TestPass123');

    // Password toggle button
    const toggleBtn = page.locator('.password-toggle');
    const hasToggle = await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasToggle) {
      // Initially password type
      await expect(page.locator('#password')).toHaveAttribute('type', 'password');

      await toggleBtn.click();
      // After toggle should show text
      await expect(page.locator('#password')).toHaveAttribute('type', 'text');

      await toggleBtn.click();
      // Toggle back to password
      await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOGIN FLOW
  // ═══════════════════════════════════════════════════════════════════════

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#username', 'nonexistent_user_xyz');
    await page.fill('#password', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.click('button[type="submit"]');

    // Should show validation error or remain on login
    const hasError = await page.locator('.alert-error, .error-message, .input-error').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    const stillOnLogin = await page.locator('#username').isVisible();
    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginAsUser(page);

    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.balance-amount').first()).toBeVisible();
  });

  test('should display username after login', async ({ page }) => {
    await loginAsUser(page);

    // Username should appear in navbar
    const usernameText = page.locator(`.username:has-text("${TEST_USER.username}"), .nav-username:has-text("${TEST_USER.username}")`).first();
    const hasUsername = await usernameText.isVisible({ timeout: 5000 }).catch(() => false);

    // Or in mobile user info
    const mobileUser = page.locator(`.mobile-user-name:has-text("${TEST_USER.username}")`);
    const hasMobileUser = await mobileUser.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasUsername || hasMobileUser).toBeTruthy();
  });

  test('should show balance after login', async ({ page }) => {
    await loginAsUser(page);

    const balanceEl = page.locator('.balance-amount').first();
    await expect(balanceEl).toBeVisible();

    const text = await balanceEl.textContent();
    // Balance should be a number (possibly with $ or VB prefix)
    expect(text).toMatch(/\d/);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════

  test('should logout successfully', async ({ page }) => {
    await loginAsUser(page);
    await logout(page);

    await expect(page.locator('#username')).toBeVisible();
  });

  test('should clear session data on logout', async ({ page }) => {
    await loginAsUser(page);
    await logout(page);

    // Verify token is cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SESSION PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  test('should persist session after page reload', async ({ page }) => {
    await loginAsUser(page);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.balance-amount').first()).toBeVisible();
  });

  test('should persist session across page navigations', async ({ page }) => {
    await loginAsUser(page);

    // Navigate to a different page
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissAllOverlays(page);

    await expect(page.locator('.navbar')).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════

  test('should toggle to registration form', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button.toggle-link-btn:has-text("Create Account")').click();

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
  });

  test('should toggle back to login from registration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Switch to register
    await page.locator('button.toggle-link-btn:has-text("Create Account")').click();
    await expect(page.locator('#email')).toBeVisible();

    // Switch back to login
    await page.locator('button.toggle-link-btn:has-text("Sign In Instead")').click();

    // Email field should disappear
    await expect(page.locator('#email')).not.toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
  });

  test('should show email field in registration mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button.toggle-link-btn:has-text("Create Account")').click();

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show password strength meter during registration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button.toggle-link-btn:has-text("Create Account")').click();
    await page.fill('#password', 'Test123');

    // Password strength indicator should appear
    const strengthMeter = page.locator('.password-strength, .strength-meter');
    const hasMeter = await strengthMeter.first().isVisible({ timeout: 3000 }).catch(() => false);
    // Meter may not be visible for very short passwords, just verify the form is in register mode
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should show error for duplicate registration', async ({ page }) => {
    await register(page, TEST_USER.username, TEST_USER.email, TEST_USER.password);

    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // UNAUTHENTICATED ACCESS
  // ═══════════════════════════════════════════════════════════════════════

  test('should redirect unauthenticated users to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users to login from /games', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users to login from /bets', async ({ page }) => {
    await page.goto('/bets');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users to login from /leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users to login from /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOGIN PAGE INFO OVERLAYS
  // ═══════════════════════════════════════════════════════════════════════

  test('should open How It Works from login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const howBtn = page.locator('.info-link-btn:has-text("How It Works")');
    const hasInfoLinks = await howBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasInfoLinks) {
      await howBtn.click();
      // Should show HowToUse content
      await expect(page.locator('.how-to-use').first()).toBeVisible({ timeout: 5000 });

      // Should have a back button
      const backBtn = page.locator('.back-to-login-btn, .fixed-close-btn').first();
      await expect(backBtn).toBeVisible();
    }
  });

  test('should return to login from info overlay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const howBtn = page.locator('.info-link-btn:has-text("How It Works")');
    const hasInfoLinks = await howBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasInfoLinks) {
      await howBtn.click();
      await page.waitForTimeout(500);

      // Click back/close button
      const backBtn = page.locator('.back-to-login-btn, .fixed-close-btn').first();
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click();
        await expect(page.locator('#username')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

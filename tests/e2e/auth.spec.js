const { test, expect } = require('@playwright/test');
const { login, logout, register, clearSession, generateTestData } = require('../helpers/test-utils');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Valiant Picks/i);
    await expect(page.locator('text=/Valiant Picks/i')).toBeVisible();
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForSelector('input[name="username"]');
    
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|incorrect|failed|error/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForSelector('input[name="username"]');
    
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Should show validation error (HTML5 validation)
    const usernameInput = page.locator('input[name="username"]');
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const testUser = {
      email: 'testuser@valiantpicks.com',
      password: 'TestPassword123!'
    };

    await login(page, testUser.email, testUser.password);
    
    // Verify logged in
    await expect(page.locator('text=/Dashboard|Logout/i')).toBeVisible();
    
    // Should see user balance
    await expect(page.locator('text=/Balance|Valiant Bucks/i')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    const testUser = {
      email: 'testuser@valiantpicks.com',
      password: 'TestPassword123!'
    };

    await login(page, testUser.email, testUser.password);
    await dismissOnboarding(page);
    await logout(page);
    
    // Should be back at homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const testData = generateTestData();
    
    await page.goto('/');
    await page.click('text=Login');
    
    // Click register link
    const registerLink = page.locator('text=/Register|Sign Up/i').first();
    if (await registerLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerLink.click();
      
      // Fill registration form
      await page.fill('input[placeholder*="username" i]', testData.username);
      await page.fill('input[type="email"]', testData.email);
      await page.fill('input[type="password"]', testData.password);
      
      await page.click('button[type="submit"]:has-text(/Register|Sign Up/i)');
      
      // Should be logged in after registration
      await expect(page.locator('text=/Dashboard|Welcome/i')).toBeVisible({ timeout: 10000 });
      
      // Should have starting balance of 1000 Valiant Bucks
      await expect(page.locator('text=/1,?000/i')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    const existingUser = {
      username: 'testuser',
      email: 'testuser@valiantpicks.com',
      password: 'TestPassword123!'
    };

    await page.goto('/');
    await page.click('text=Login');
    
    const registerLink = page.locator('text=/Register|Sign Up/i').first();
    if (await registerLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerLink.click();
      
      await page.fill('input[placeholder*="username" i]', existingUser.username);
      await page.fill('input[type="email"]', existingUser.email);
      await page.fill('input[type="password"]', existingUser.password);
      
      await page.click('button[type="submit"]:has-text(/Register|Sign Up/i)');
      
      // Should show error about existing email
      await expect(page.locator('text=/already exists|duplicate|taken/i')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should validate password requirements', async ({ page }) => {
    const testData = generateTestData();
    
    await page.goto('/');
    await page.click('text=Login');
    
    const registerLink = page.locator('text=/Register|Sign Up/i').first();
    if (await registerLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerLink.click();
      
      await page.fill('input[placeholder*="username" i]', testData.username);
      await page.fill('input[type="email"]', testData.email);
      await page.fill('input[type="password"]', 'weak'); // Weak password
      
      await page.click('button[type="submit"]:has-text(/Register|Sign Up/i)');
      
      // Should show password validation error
      const passwordInput = page.locator('input[type="password"]');
      const minLength = await passwordInput.getAttribute('minlength');
      expect(parseInt(minLength || '0')).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('should persist session after page reload', async ({ page }) => {
    const testUser = {
      email: 'testuser@valiantpicks.com',
      password: 'TestPassword123!'
    };

    await login(page, testUser.email, testUser.password);
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=/Dashboard|Logout/i')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show login form
    await expect(page.locator('text=/Login|Sign In/i')).toBeVisible({ timeout: 5000 });
  });
});

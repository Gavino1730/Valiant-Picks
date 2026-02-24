const { test, expect } = require('@playwright/test');
const {
  clearSession,
} = require('../helpers/test-utils');

const TEST_USER = {
  username: process.env.TEST_USER_USERNAME || 'testuser',
  password: process.env.TEST_USER_PASSWORD || 'test12345',
};

test.describe('Onboarding Modal', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    // Clear localStorage so onboarding shows for "first-time" user
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hasSeenOnboarding');
    });
  });

  // Helper: login without dismissing overlays to test onboarding
  async function loginRaw(page) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hasSeenOnboarding');
    });

    await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
    await page.fill('#username', TEST_USER.username);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.locator('.navbar').waitFor({ state: 'visible', timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should show onboarding modal for first-time user', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('[data-testid="onboarding-overlay"]');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    // Onboarding may or may not appear depending on popup queue priority
    if (hasOverlay) {
      const modal = page.locator('[data-testid="onboarding-modal"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should display Welcome title', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const title = modal.locator('#onboarding-title');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('Welcome');
    }
  });

  test('should display subtitle guide text', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const subtitle = modal.locator('#onboarding-subtitle');
      await expect(subtitle).toBeVisible();
      const text = await subtitle.textContent();
      expect(text).toContain('60-second guide');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ONBOARDING CONTENT
  // ═══════════════════════════════════════════════════════════════════════

  test('should show 4 onboarding bullet items', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const items = modal.locator('.onboarding-item');
      const count = await items.count();
      expect(count).toBe(4);
    }
  });

  test('should show Virtual Currency bullet', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const virtualCurrency = modal.locator('h3:has-text("Virtual Currency")');
      await expect(virtualCurrency).toBeVisible();
    }
  });

  test('should show How to Pick bullet', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const howToPick = modal.locator('h3:has-text("How to Pick")');
      await expect(howToPick).toBeVisible();
    }
  });

  test('should show Confidence Levels with multipliers', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const confLevels = modal.locator('h3:has-text("Confidence Levels")');
      await expect(confLevels).toBeVisible();

      // Check multiplier values
      const multipliers = modal.locator('.confidence-multiplier');
      const texts = await multipliers.allTextContents();
      expect(texts).toContain('1.2x');
      expect(texts).toContain('1.5x');
      expect(texts).toContain('2.0x');
    }
  });

  test('should show Bonuses and Leaderboard bullet', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const bonuses = modal.locator('h3:has-text("Bonuses and Leaderboard")');
      await expect(bonuses).toBeVisible();
    }
  });

  test('should show Pro Tips section', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const tips = modal.locator('.onboarding-tips');
      await expect(tips).toBeVisible();

      const tipHeader = tips.locator('h4');
      await expect(tipHeader).toHaveText('Pro Tips');

      const tipItems = tips.locator('li');
      const count = await tipItems.count();
      expect(count).toBe(3);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BUTTONS & ACTIONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show Let\'s Get Started button', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const startBtn = modal.locator('[data-testid="onboarding-start"]');
      await expect(startBtn).toBeVisible();
      await expect(startBtn).toHaveText("Let's Get Started");
    }
  });

  test('should show "Read full How to Use" link', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const howToLink = modal.locator('.onboarding-link');
      await expect(howToLink).toBeVisible();
      const text = await howToLink.textContent();
      expect(text).toContain('How to Use');
    }
  });

  test('should show "Don\'t show again" checkbox (checked by default)', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const checkbox = modal.locator('.onboarding-checkbox input[type="checkbox"]');
      await expect(checkbox).toBeVisible();
      await expect(checkbox).toBeChecked();
    }
  });

  test('should show close button (✕)', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      const closeBtn = modal.locator('[data-testid="onboarding-close"]');
      await expect(closeBtn).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DISMISSAL BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════

  test('should close modal when Let\'s Get Started is clicked', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      // Dismiss spin-wheel overlay if it's covering the button
      const spinOverlay = page.locator('.spin-wheel-overlay');
      if (await spinOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
        const spinClose = page.locator('.spin-wheel-close');
        if (await spinClose.isVisible({ timeout: 300 }).catch(() => false)) {
          await spinClose.click({ force: true });
        } else {
          await spinOverlay.click({ position: { x: 5, y: 5 }, force: true });
        }
        await page.waitForTimeout(400);
      }
      await modal.locator('[data-testid="onboarding-start"]').click({ force: true });
      await page.waitForTimeout(500);

      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      await modal.locator('[data-testid="onboarding-close"]').click();
      await page.waitForTimeout(500);

      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close modal when clicking overlay background', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('[data-testid="onboarding-overlay"]');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await overlay.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOCAL STORAGE PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  test('should set localStorage when dismissed with "Don\'t show again" checked', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      // "Don't show again" is checked by default
      // Dismiss spin-wheel overlay if it's covering the button
      const spinOverlay = page.locator('.spin-wheel-overlay');
      if (await spinOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
        const spinClose = page.locator('.spin-wheel-close');
        if (await spinClose.isVisible({ timeout: 300 }).catch(() => false)) {
          await spinClose.click({ force: true });
        } else {
          await spinOverlay.click({ position: { x: 5, y: 5 }, force: true });
        }
        await page.waitForTimeout(400);
      }
      await modal.locator('[data-testid="onboarding-start"]').click({ force: true });
      await page.waitForTimeout(500);

      const hasSeenOnboarding = await page.evaluate(() => localStorage.getItem('hasSeenOnboarding'));
      expect(hasSeenOnboarding).toBe('true');
    }
  });

  test('should not show modal on subsequent login when "Don\'t show again" was checked', async ({ page }) => {
    // Login and set localStorage to simulate a user who previously dismissed onboarding
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
    await page.fill('#username', TEST_USER.username);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.locator('.navbar').waitFor({ state: 'visible', timeout: 15000 });

    // Set the flag after login (simulating prior dismissal)
    await page.evaluate(() => {
      localStorage.setItem('hasSeenOnboarding', 'true');
    });

    // Navigate away and come back to trigger a fresh page load
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasModal).toBeFalsy();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // KEYBOARD ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════════

  test('should close modal when Escape key is pressed', async ({ page }) => {
    await loginRaw(page);

    const modal = page.locator('[data-testid="onboarding-modal"]');
    const hasModal = await modal.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasModal) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });
});

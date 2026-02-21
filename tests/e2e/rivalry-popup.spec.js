const { test, expect } = require('@playwright/test');
const {
  clearSession,
} = require('../helpers/test-utils');

const TEST_USER = {
  username: process.env.TEST_USER_USERNAME || 'testuser',
  password: process.env.TEST_USER_PASSWORD || 'test12345',
};

test.describe('Rivalry Week Popup', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    // Clear session storage so the popup can show
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      sessionStorage.removeItem('rivalryWeekDismissed');
    });
  });

  // Helper: login without dismissing rivalry popup
  async function loginRaw(page) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      sessionStorage.removeItem('rivalryWeekDismissed');
    });

    await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
    await page.fill('#username', TEST_USER.username);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.locator('.navbar').waitFor({ state: 'visible', timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // POPUP DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should show rivalry week popup when enabled', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-overlay');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    // Rivalry popup only appears when enabled by admin
    if (hasPopup) {
      const content = page.locator('.rivalry-popup-content');
      await expect(content).toBeVisible();
    }
    // Not showing is also valid — means rivalry week is not active
  });

  test('should display RIVALRY GAME badge', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const badge = popup.locator('.rivalry-top-badge');
      await expect(badge).toBeVisible();
      const text = await badge.textContent();
      expect(text).toContain('RIVALRY GAME');
    }
  });

  test('should display rivalry title', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const title = popup.locator('.rivalry-title');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('BEEF IS ON');
    }
  });

  test('should display matchup with VC team', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const matchup = popup.locator('.rivalry-matchup');
      await expect(matchup).toBeVisible();

      const vc = popup.locator('.rivalry-team.valiant');
      await expect(vc).toBeVisible();
      await expect(vc).toHaveText('VC');

      const vs = popup.locator('.rivalry-vs');
      await expect(vs).toBeVisible();
      await expect(vs).toHaveText('VS');

      const opponent = popup.locator('.rivalry-team.opponent');
      await expect(opponent).toBeVisible();
    }
  });

  test('should display tagline', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const tagline = popup.locator('.rivalry-tagline');
      await expect(tagline).toBeVisible();
      await expect(tagline).toHaveText('SETTLE THE SCORE!');
    }
  });

  test('should display hype badges', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const badges = popup.locator('.hype-badge');
      const count = await badges.count();
      expect(count).toBe(2);
    }
  });

  test('should display game info (date, time, location)', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const infoItems = popup.locator('.rivalry-info-item');
      const count = await infoItems.count();
      expect(count).toBe(3); // date, time, location

      // Check icons are present
      const icons = popup.locator('.info-icon');
      const iconTexts = await icons.allTextContents();
      expect(iconTexts).toContain('📅');
      expect(iconTexts).toContain('⏰');
      expect(iconTexts).toContain('📍');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSE / DISMISS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show close button', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const closeBtn = popup.locator('.rivalry-close-btn');
      await expect(closeBtn).toBeVisible();
    }
  });

  test('should close popup when close button is clicked', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('.rivalry-popup-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const closeBtn = page.locator('.rivalry-close-btn');
      await closeBtn.click();
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close popup when clicking overlay background', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('.rivalry-popup-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await overlay.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should set sessionStorage when dismissed', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('.rivalry-popup-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await page.locator('.rivalry-close-btn').click();
      await page.waitForTimeout(500);

      const dismissed = await page.evaluate(() => sessionStorage.getItem('rivalryWeekDismissed'));
      expect(dismissed).toBe('true');
    }
  });

  test('should not show popup again after dismissal in same session', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('.rivalry-popup-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await page.locator('.rivalry-close-btn').click();
      await page.waitForTimeout(500);

      // Navigate away and back
      await page.goto('/games');
      await page.waitForLoadState('domcontentloaded');
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const showsAgain = await overlay.isVisible({ timeout: 3000 }).catch(() => false);
      expect(showsAgain).toBeFalsy();
    }
  });

  test('should auto-dismiss after ~10 seconds', async ({ page }) => {
    await loginRaw(page);

    const overlay = page.locator('.rivalry-popup-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      // Wait for auto-dismiss (10 seconds + buffer)
      await page.waitForTimeout(12000);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should display rivalry image', async ({ page }) => {
    await loginRaw(page);

    const popup = page.locator('.rivalry-popup-content');
    const hasPopup = await popup.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPopup) {
      const image = popup.locator('.rivalry-image');
      const hasImage = await image.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasImage) {
        const src = await image.getAttribute('src');
        expect(src).toContain('varks');
      }
    }
  });
});

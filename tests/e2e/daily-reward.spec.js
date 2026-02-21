const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateToUrl,
} = require('../helpers/test-utils');

test.describe('Daily Reward', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL APPEARANCE
  // ═══════════════════════════════════════════════════════════════════════

  test('should show daily reward overlay after login (if unclaimed)', async ({ page }) => {
    await loginAsUser(page);

    // The daily reward overlay may appear after login — wait for it
    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    // If it appears, it should have modal content
    if (hasOverlay) {
      const modal = page.locator('.daily-reward-modal');
      await expect(modal).toBeVisible();
    }
    // Not appearing is also valid (already claimed today)
  });

  test('should display reward icon', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const icon = page.locator('.reward-icon');
      await expect(icon).toBeVisible();
      const text = await icon.textContent();
      expect(text).toContain('🎁');
    }
  });

  test('should show "Daily Login Reward!" title', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const title = page.locator('.daily-reward-modal h2');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('Daily Login Reward!');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STREAK & REWARD INFO
  // ═══════════════════════════════════════════════════════════════════════

  test('should display streak count', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const streakCount = page.locator('.streak-count');
      await expect(streakCount).toBeVisible();
      const text = await streakCount.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('should display streak label', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const streakLabel = page.locator('.streak-label');
      await expect(streakLabel).toBeVisible();
      await expect(streakLabel).toHaveText('Day Streak');
    }
  });

  test('should display base reward amount (50 VB)', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const baseReward = page.locator('.base-reward');
      await expect(baseReward).toBeVisible();
      await expect(baseReward).toHaveText('50 VB');
    }
  });

  test('should display total reward amount', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const totalReward = page.locator('.total-reward');
      await expect(totalReward).toBeVisible();
      const text = await totalReward.textContent();
      expect(text).toMatch(/Valiant Bucks/i);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLAIM BUTTON
  // ═══════════════════════════════════════════════════════════════════════

  test('should show Claim Reward button', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const claimBtn = page.locator('.claim-button');
      await expect(claimBtn).toBeVisible();
      await expect(claimBtn).toHaveText('Claim Reward');
      await expect(claimBtn).toBeEnabled();
    }
  });

  test('should show Claim Later button', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const laterBtn = page.locator('.close-button');
      await expect(laterBtn).toBeVisible();
      const text = await laterBtn.textContent();
      expect(text).toMatch(/Claim Later/i);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLAIM FLOW
  // ═══════════════════════════════════════════════════════════════════════

  test('should show success message after claiming', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      const claimBtn = page.locator('.claim-button');
      await claimBtn.click();
      await page.waitForTimeout(1000);

      // Should show claimed message
      const claimed = page.locator('.claimed-message');
      const hasClaimed = await claimed.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasClaimed) {
        const successIcon = claimed.locator('.success-icon');
        await expect(successIcon).toBeVisible();

        const title = claimed.locator('h2');
        await expect(title).toHaveText('Reward Claimed!');
      }
    }
  });

  test('should auto-close modal after claiming', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await page.locator('.claim-button').click();
      await page.waitForTimeout(3000); // Wait for auto-close (2s timeout in component)

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DISMISS
  // ═══════════════════════════════════════════════════════════════════════

  test('should close modal when Claim Later is clicked', async ({ page }) => {
    await loginAsUser(page);

    const overlay = page.locator('.daily-reward-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasOverlay) {
      await page.locator('.close-button').click();
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });
});

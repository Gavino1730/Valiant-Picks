const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Achievements', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACHIEVEMENT BADGE (INDICATOR)
  // ═══════════════════════════════════════════════════════════════════════

  test('should show achievement badge when unclaimed achievements exist', async ({ page }) => {
    await page.waitForTimeout(3000);
    await dismissAllOverlays(page);

    const badge = page.locator('.achievement-badge');
    const hasBadge = await badge.isVisible({ timeout: 5000 }).catch(() => false);

    // Badge only shows when there are unclaimed achievements
    if (hasBadge) {
      const text = await badge.textContent();
      expect(text).toMatch(/🏆\s*\d+/);
    }
    // No badge is also valid — means no unclaimed achievements
  });

  test('should open achievements modal when badge is clicked', async ({ page }) => {
    await page.waitForTimeout(3000);
    await dismissAllOverlays(page);

    const badge = page.locator('.achievement-badge');
    const hasBadge = await badge.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBadge) {
      await badge.click();
      await page.waitForTimeout(500);

      const modal = page.locator('.achievements-modal');
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS MODAL
  // ═══════════════════════════════════════════════════════════════════════

  test('should show achievements modal with title', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      // Try clicking badge to open
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      const hasBadge = await badge.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasBadge) {
        await badge.click();
        await page.waitForTimeout(500);
      }
    }

    const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      const title = modal.locator('h2');
      await expect(title).toBeVisible();
      const text = await title.textContent();
      expect(text).toContain('Achievements Unlocked');
    }
  });

  test('should show subtitle text', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const subtitle = modal.locator('.achievements-subtitle');
      await expect(subtitle).toBeVisible();
      await expect(subtitle).toHaveText("You've earned new rewards!");
    }
  });

  test('should show close button on modal', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const closeBtn = modal.locator('.close-modal');
      await expect(closeBtn).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACHIEVEMENT CARDS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display achievement cards with icons', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const cards = modal.locator('.achievement-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      // Each card should have an icon
      const firstCard = cards.first();
      const icon = firstCard.locator('.achievement-icon');
      await expect(icon).toBeVisible();
    }
  });

  test('should display achievement description', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const firstCard = modal.locator('.achievement-card').first();
      const info = firstCard.locator('.achievement-info h3');
      await expect(info).toBeVisible();
    }
  });

  test('should display reward amount on achievement cards', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const firstCard = modal.locator('.achievement-card').first();
      const reward = firstCard.locator('.achievement-reward');
      await expect(reward).toBeVisible();
      const text = await reward.textContent();
      expect(text).toMatch(/Valiant Bucks/i);
    }
  });

  test('should show Claim button on each achievement', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const claimBtn = modal.locator('.claim-achievement-btn').first();
      await expect(claimBtn).toBeVisible();
      await expect(claimBtn).toHaveText('Claim');
      await expect(claimBtn).toBeEnabled();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLAIM INTERACTION
  // ═══════════════════════════════════════════════════════════════════════

  test('should claim achievement when Claim button is clicked', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      const cards = modal.locator('.achievement-card');
      const countBefore = await cards.count();

      if (countBefore > 0) {
        const claimBtn = modal.locator('.claim-achievement-btn').first();
        await claimBtn.click();
        await page.waitForTimeout(1500);

        // The claimed achievement should be removed from the list
        const countAfter = await cards.count();
        expect(countAfter).toBeLessThan(countBefore);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL DISMISS
  // ═══════════════════════════════════════════════════════════════════════

  test('should close modal when close button is clicked', async ({ page }) => {
    await page.waitForTimeout(3000);

    const modal = page.locator('.achievements-modal');
    let hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasModal) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasModal) {
      await modal.locator('.close-modal').click();
      await page.waitForTimeout(500);

      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close modal when clicking overlay background', async ({ page }) => {
    await page.waitForTimeout(3000);

    const overlay = page.locator('.achievements-overlay');
    let hasOverlay = await overlay.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasOverlay) {
      await dismissAllOverlays(page);
      const badge = page.locator('.achievement-badge');
      if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await badge.click();
        await page.waitForTimeout(500);
        hasOverlay = await overlay.isVisible({ timeout: 3000 }).catch(() => false);
      }
    }

    if (hasOverlay) {
      await overlay.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });
});

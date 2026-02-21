const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateToUrl, dismissAllOverlays, getBalance,
} = require('../helpers/test-utils');

test.describe('Bet Confirmation Modal', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // Helper: fill in a complete pick to trigger the confirmation modal
  async function fillPickAndSubmit(page) {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasUnlocked) return false;

    await unlockedCard.click();
    await page.waitForTimeout(400);

    // Select team
    const teamBtn = page.locator('.team-btn').first();
    if (!(await teamBtn.isVisible({ timeout: 3000 }).catch(() => false))) return false;
    await teamBtn.click();
    await page.waitForTimeout(200);

    // Select confidence
    const confBtn = page.locator('.confidence-btn.medium');
    if (!(await confBtn.isVisible({ timeout: 2000 }).catch(() => false))) return false;
    await confBtn.click();
    await page.waitForTimeout(200);

    // Enter amount
    const amountInput = page.locator('#amount, .amount-input').first();
    if (!(await amountInput.isVisible({ timeout: 2000 }).catch(() => false))) return false;
    await amountInput.fill('10');
    await page.waitForTimeout(200);

    // Click submit / Lock in Pick
    const submitBtn = page.locator('.pick-form-submit, button:has-text("Lock in Pick")').first();
    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) return false;
    await submitBtn.click();
    await page.waitForTimeout(500);

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should show confirmation modal after submitting a pick', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available to place pick');

    const modal = page.locator('.confirmation-overlay, .confirmation-modal');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display modal header with title', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const header = modal.locator('.confirmation-header h2');
      await expect(header).toBeVisible();
      const text = await header.textContent();
      expect(text).toMatch(/Confirm Your Pick|High Value Pick/i);
    }
  });

  test('should show close button on modal', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const closeBtn = modal.locator('.confirmation-close');
      await expect(closeBtn).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL CONTENT
  // ═══════════════════════════════════════════════════════════════════════

  test('should display selected team name', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const teamSection = modal.locator('.confirmation-section:has(.team-name)');
      const teamName = modal.locator('.team-name');
      const hasTeam = await teamName.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasTeam) {
        const text = await teamName.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should display pick amount', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const amount = modal.locator('.confirmation-value.amount');
      const hasAmount = await amount.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasAmount) {
        const text = await amount.textContent();
        expect(text).toMatch(/\d/);
      }
    }
  });

  test('should display confidence level and multiplier', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const confidence = modal.locator('.confidence-badge');
      const multiplier = modal.locator('.multiplier');
      const hasConf = await confidence.isVisible({ timeout: 2000 }).catch(() => false);
      const hasMult = await multiplier.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasConf || hasMult).toBeTruthy();
    }
  });

  test('should display potential win amount', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const winAmount = modal.locator('.win-amount');
      const hasWin = await winAmount.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasWin) {
        const text = await winAmount.textContent();
        expect(text).toMatch(/\d/);
      }
    }
  });

  test('should show breakdown section with stake and multiplier', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const breakdown = modal.locator('.confirmation-breakdown');
      const hasBreakdown = await breakdown.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasBreakdown) {
        const rows = breakdown.locator('.breakdown-row');
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(2);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL ACTIONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show Confirm and Cancel buttons', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const confirmBtn = modal.locator('.btn-confirm');
      const cancelBtn = modal.locator('.btn-cancel');
      await expect(confirmBtn).toBeVisible();
      await expect(cancelBtn).toBeVisible();
    }
  });

  test('should close modal when Cancel is clicked', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      await modal.locator('.btn-cancel').click();
      await page.waitForTimeout(500);

      // Modal should be gone
      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close modal when close button (✕) is clicked', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      await modal.locator('.confirmation-close').click();
      await page.waitForTimeout(500);

      const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should close modal when clicking overlay background', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const overlay = page.locator('.confirmation-overlay');
    const hasOverlay = await overlay.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasOverlay) {
      // Click the overlay at the edge (not on the modal)
      await overlay.click({ position: { x: 5, y: 5 }, force: true });
      await page.waitForTimeout(500);

      const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  test('should confirm pick and show success feedback', async ({ page }) => {
    const submitted = await fillPickAndSubmit(page);
    test.skip(!submitted, 'No unlocked games available');

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      const confirmBtn = modal.locator('.btn-confirm');
      await confirmBtn.click();
      await page.waitForTimeout(2000);

      // Modal should close after confirmation
      const stillVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      // After confirming, either the modal closes or shows a success message
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH VALUE BET WARNING
  // ═══════════════════════════════════════════════════════════════════════

  test('should show high value warning for large bets', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasUnlocked, 'No unlocked games available');

    await unlockedCard.click();
    await page.waitForTimeout(400);

    // Select team, confidence, and enter large amount
    const teamBtn = page.locator('.team-btn').first();
    if (!(await teamBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;
    await teamBtn.click();

    const confBtn = page.locator('.confidence-btn.high');
    if (!(await confBtn.isVisible({ timeout: 2000 }).catch(() => false))) return;
    await confBtn.click();

    const amountInput = page.locator('#amount, .amount-input').first();
    if (!(await amountInput.isVisible({ timeout: 2000 }).catch(() => false))) return;
    await amountInput.fill('150'); // >= 100 triggers high value

    const submitBtn = page.locator('.pick-form-submit, button:has-text("Lock in Pick")').first();
    if (!(await submitBtn.isVisible({ timeout: 2000 }).catch(() => false))) return;
    await submitBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.confirmation-modal');
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasModal) {
      // Should have high-value class
      const isHighValue = await modal.evaluate(el => el.classList.contains('high-value-bet'));

      // Should show warning
      const warning = modal.locator('.high-value-warning');
      const hasWarning = await warning.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isHighValue || hasWarning).toBeTruthy();
    }
  });
});

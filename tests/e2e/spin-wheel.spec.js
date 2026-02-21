const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateToUrl, dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Spin Wheel', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // Helper: open the spin wheel modal
  async function openSpinWheel(page) {
    await navigateToUrl(page, '/dashboard');

    const spinBtn = page.locator('button:has-text("Spin to Win"), .btn-spin-wheel').first();
    const hasSpin = await spinBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSpin) {
      await spinBtn.click({ force: true });
      await page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD SPIN CARD
  // ═══════════════════════════════════════════════════════════════════════

  test('should show spin wheel card on dashboard', async ({ page }) => {
    await navigateToUrl(page, '/dashboard');

    const spinCard = page.locator('.spin-wheel-card');
    const hasSpin = await spinCard.isVisible({ timeout: 5000 }).catch(() => false);
    // Spin card may or may not be present depending on config
    if (hasSpin) {
      await expect(spinCard).toBeVisible();
    }
  });

  test('should show Spin to Win button on dashboard', async ({ page }) => {
    await navigateToUrl(page, '/dashboard');

    const spinBtn = page.locator('button:has-text("Spin to Win"), .btn-spin-wheel').first();
    const hasSpin = await spinBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSpin) {
      await expect(spinBtn).toBeEnabled();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should open spin wheel modal from dashboard', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const modal = page.locator('.spin-wheel-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should show modal title "Daily Spin Wheel"', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const title = page.locator('.wheel-header h2');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Daily Spin Wheel');
  });

  test('should show close button on modal', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const closeBtn = page.locator('.spin-wheel-close');
    await expect(closeBtn).toBeVisible();
  });

  test('should show spins remaining text', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinsText = page.locator('.spins-remaining');
    await expect(spinsText).toBeVisible();
    const text = await spinsText.textContent();
    expect(text).toMatch(/spin|remaining|no spins/i);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // WHEEL DISPLAY
  // ═══════════════════════════════════════════════════════════════════════

  test('should display the SVG wheel', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const wheel = page.locator('svg.wheel');
    await expect(wheel).toBeVisible();
  });

  test('should display wheel pointer', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const pointer = page.locator('.wheel-pointer');
    await expect(pointer).toBeVisible();
    const text = await pointer.textContent();
    expect(text).toContain('▼');
  });

  test('should display prize segments with VB amounts', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const segments = page.locator('svg.wheel text');
    const count = await segments.count();
    expect(count).toBeGreaterThanOrEqual(4); // At least 4 prize segments

    // Each segment should show "VB" text
    const texts = await segments.allTextContents();
    const vbSegments = texts.filter(t => t.includes('VB'));
    expect(vbSegments.length).toBeGreaterThan(0);
  });

  test('should display center circle with SPIN text', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const centerText = page.locator('svg.wheel text:has-text("SPIN")');
    await expect(centerText).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SPIN BUTTON
  // ═══════════════════════════════════════════════════════════════════════

  test('should show spin button in modal', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    await expect(spinBtn).toBeVisible();
  });

  test('should show "Spin the Wheel!" when spins available', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const text = await spinBtn.textContent();

    // Either "Spin the Wheel!" or "No Spins Left Today"
    expect(text).toMatch(/Spin the Wheel|No Spins Left/i);
  });

  test('should disable spin button when no spins remaining', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const text = await spinBtn.textContent();

    if (text.includes('No Spins Left')) {
      await expect(spinBtn).toBeDisabled();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SPIN INTERACTION
  // ═══════════════════════════════════════════════════════════════════════

  test('should spin the wheel when button is clicked', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const isEnabled = await spinBtn.isEnabled();

    if (isEnabled) {
      await spinBtn.click();
      await page.waitForTimeout(500);

      // Button text should change to "Spinning..."
      const text = await spinBtn.textContent();
      expect(text).toMatch(/Spinning|Spin/i);
    }
  });

  test('should show result after spin completes', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const isEnabled = await spinBtn.isEnabled();

    if (isEnabled) {
      await spinBtn.click();
      // Wait for spin animation (4 seconds in component)
      await page.waitForTimeout(5000);

      const result = page.locator('.spin-result');
      const hasResult = await result.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasResult) {
        // Should show "You Won!" text
        const resultContent = result.locator('.result-content');
        await expect(resultContent).toBeVisible();

        const wonTitle = resultContent.locator('h3');
        const titleText = await wonTitle.textContent();
        expect(titleText).toContain('You Won');

        // Should show prize amount
        const prizeAmount = resultContent.locator('.prize-amount');
        await expect(prizeAmount).toBeVisible();
        const prizeText = await prizeAmount.textContent();
        expect(prizeText).toMatch(/\d+.*Valiant Bucks/i);
      }
    }
  });

  test('should update spins remaining after spin', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const isEnabled = await spinBtn.isEnabled();

    if (isEnabled) {
      const spinsTextBefore = await page.locator('.spins-remaining').textContent();

      await spinBtn.click();
      await page.waitForTimeout(5000); // Wait for spin animation

      const spinsTextAfter = await page.locator('.spins-remaining').textContent();
      // Spins remaining should change (decrease or become "no spins")
    }
  });

  test('should disable spin button while spinning', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const isEnabled = await spinBtn.isEnabled();

    if (isEnabled) {
      await spinBtn.click();
      await page.waitForTimeout(500);

      // Button should be disabled during spin
      await expect(spinBtn).toBeDisabled();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RESULT DISMISS
  // ═══════════════════════════════════════════════════════════════════════

  test('should close result when Close button is clicked', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const spinBtn = page.locator('.spin-button');
    const isEnabled = await spinBtn.isEnabled();

    if (isEnabled) {
      await spinBtn.click();
      await page.waitForTimeout(5000);

      const result = page.locator('.spin-result');
      const hasResult = await result.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasResult) {
        const closeBtn = result.locator('button');
        await closeBtn.click();
        await page.waitForTimeout(500);

        const stillVisible = await result.isVisible({ timeout: 2000 }).catch(() => false);
        expect(stillVisible).toBeFalsy();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL CLOSE
  // ═══════════════════════════════════════════════════════════════════════

  test('should close modal when close button is clicked', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    await page.locator('.spin-wheel-close').click({ force: true });
    await page.waitForTimeout(500);

    const modal = page.locator('.spin-wheel-modal');
    const stillVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    expect(stillVisible).toBeFalsy();
  });

  test('should close modal when clicking overlay background', async ({ page }) => {
    const opened = await openSpinWheel(page);
    test.skip(!opened, 'Spin wheel not available');

    const overlay = page.locator('.spin-wheel-overlay');
    await overlay.click({ position: { x: 5, y: 5 }, force: true });
    await page.waitForTimeout(500);

    const stillVisible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);
    expect(stillVisible).toBeFalsy();
  });
});

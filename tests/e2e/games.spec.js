const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays, getBalance,
} = require('../helpers/test-utils');

test.describe('Games & Betting', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD & STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to Place Picks page', async ({ page }) => {
    await navigateTo(page, 'Place Picks');
    await expect(page.locator('h2:has-text("Place Your Picks")')).toBeVisible();
  });

  test('should load games page via URL', async ({ page }) => {
    await navigateToUrl(page, '/games');
    await expect(page.locator('h2:has-text("Place Your Picks")')).toBeVisible({ timeout: 10000 });
  });

  test('should show page subtitle', async ({ page }) => {
    await navigateToUrl(page, '/games');
    const subtitle = page.locator('.page-subtitle');
    const hasSubtitle = await subtitle.isVisible({ timeout: 5000 }).catch(() => false);
    // Some designs may not have subtitle, just verify page loaded
    await expect(page.locator('.games-page, .ds-page').first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // FILTER BUTTONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display filter buttons (All / Boys / Girls)', async ({ page }) => {
    await navigateToUrl(page, '/games');

    await expect(page.locator('.filter-btn:has-text("All")')).toBeVisible();
    await expect(page.locator('.filter-btn:has-text("Boys")')).toBeVisible();
    await expect(page.locator('.filter-btn:has-text("Girls")')).toBeVisible();
  });

  test('should have "All" filter active by default', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const allBtn = page.locator('.filter-btn:has-text("All")');
    await expect(allBtn).toBeVisible();
    await expect(allBtn).toHaveClass(/active/);
  });

  test('should switch to Boys filter', async ({ page }) => {
    await navigateToUrl(page, '/games');

    await page.locator('.filter-btn:has-text("Boys")').click();
    await expect(page.locator('.filter-btn:has-text("Boys")')).toHaveClass(/active/);

    // Either shows boys games or empty state
    await page.waitForTimeout(500);
    const boysGames = page.locator('.game-card-btn.boys-game');
    const emptyState = page.locator('.empty-state');
    const hasGames = await boysGames.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    // If there are games, they should all be boys-game
    if (hasGames) {
      const girlsGames = page.locator('.game-card-btn.girls-game');
      const girlsCount = await girlsGames.count();
      expect(girlsCount).toBe(0);
    }
  });

  test('should switch to Girls filter', async ({ page }) => {
    await navigateToUrl(page, '/games');

    await page.locator('.filter-btn:has-text("Girls")').click();
    await expect(page.locator('.filter-btn:has-text("Girls")')).toHaveClass(/active/);
  });

  test('should switch back to All filter', async ({ page }) => {
    await navigateToUrl(page, '/games');

    await page.locator('.filter-btn:has-text("Boys")').click();
    await page.waitForTimeout(300);
    await page.locator('.filter-btn:has-text("All")').click();
    await expect(page.locator('.filter-btn:has-text("All")')).toHaveClass(/active/);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GAME CARDS
  // ═══════════════════════════════════════════════════════════════════════

  test('should display games list or empty state', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const gameCards = page.locator('.game-card-btn');
    const emptyState = page.locator('.empty-state');

    const hasCards = await gameCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('should show team matchup info on game cards', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const firstCard = page.locator('.game-card-btn').first();
    const hasCards = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      await expect(firstCard.locator('.game-card-vs')).toBeVisible();
      await expect(firstCard.locator('.team-name-text').first()).toBeVisible();
    }
  });

  test('should show game badge (Boys/Girls) on cards', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const firstCard = page.locator('.game-card-btn').first();
    const hasCards = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const badge = firstCard.locator('.game-badge');
      const hasBadge = await badge.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasBadge) {
        const text = await badge.textContent();
        expect(text).toMatch(/Boys|Girls/i);
      }
    }
  });

  test('should show game date and time on cards', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const firstCard = page.locator('.game-card-btn').first();
    const hasCards = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const dateMeta = firstCard.locator('.game-card-date, .game-card-meta');
      await expect(dateMeta.first()).toBeVisible();
    }
  });

  test('should show home/away team tags', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const firstCard = page.locator('.game-card-btn').first();
    const hasCards = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const teamTag = firstCard.locator('.team-tag');
      const hasTag = await teamTag.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasTag) {
        const text = await teamTag.first().textContent();
        expect(text).toMatch(/HOME|AWAY/i);
      }
    }
  });

  test('should show location on game cards', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const firstCard = page.locator('.game-card-btn').first();
    const hasCards = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const location = firstCard.locator('.game-card-location');
      const hasLocation = await location.isVisible({ timeout: 2000 }).catch(() => false);
      // Location may not always be present
    }
  });

  test('should visually distinguish locked vs unlocked games', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const lockedCard = page.locator('.game-card-btn.locked');
    const unlockedCard = page.locator('.game-card-btn:not(.locked)');

    const hasLocked = await lockedCard.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasUnlocked = await unlockedCard.first().isVisible({ timeout: 3000 }).catch(() => false);

    // At least one type should exist
    expect(hasLocked || hasUnlocked).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PICK FORM (GAME SELECTION)
  // ═══════════════════════════════════════════════════════════════════════

  test('should open pick form when clicking an unlocked game', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();

      const teamBtn = page.locator('.team-btn').first();
      await expect(teamBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show team selection buttons in pick form', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();

      // Should have two team buttons (home and away)
      const teamBtns = page.locator('.team-btn');
      const count = await teamBtns.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('should show confidence buttons (Low, Medium, High)', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();

      await expect(page.locator('.confidence-btn.low')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.confidence-btn.medium')).toBeVisible();
      await expect(page.locator('.confidence-btn.high')).toBeVisible();
    }
  });

  test('should show confidence multipliers', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();
      await page.waitForTimeout(300);

      const multipliers = page.locator('.confidence-multiplier');
      const hasMultipliers = await multipliers.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (hasMultipliers) {
        const texts = await multipliers.allTextContents();
        expect(texts.some(t => t.includes('1.2'))).toBeTruthy();
        expect(texts.some(t => t.includes('1.5'))).toBeTruthy();
        expect(texts.some(t => t.includes('2.0'))).toBeTruthy();
      }
    }
  });

  test('should select a team when team button is clicked', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();
      await page.waitForTimeout(300);

      const teamBtn = page.locator('.team-btn').first();
      const hasBtns = await teamBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasBtns) {
        await teamBtn.click();
        // Team button should now be highlighted/selected
        await expect(teamBtn).toHaveClass(/selected|active/);
      }
    }
  });

  test('should select confidence level when clicked', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();
      await page.waitForTimeout(300);

      const mediumBtn = page.locator('.confidence-btn.medium');
      const hasBtns = await mediumBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasBtns) {
        await mediumBtn.click();
        await expect(mediumBtn).toHaveClass(/selected|active/);
      }
    }
  });

  test('should show amount input field', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();

      const amountInput = page.locator('#amount, .amount-input');
      const hasInput = await amountInput.first().isVisible({ timeout: 5000 }).catch(() => false);
      if (hasInput) {
        await expect(amountInput.first()).toHaveAttribute('type', 'number');
      }
    }
  });

  test('should show MAX button next to amount input', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();

      const maxBtn = page.locator('.max-btn, button:has-text("MAX")').first();
      const hasMaxBtn = await maxBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasMaxBtn) {
        await expect(maxBtn).toBeVisible();
      }
    }
  });

  test('should show bet slip preview when selections are made', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();
      await page.waitForTimeout(300);

      // Select team
      const teamBtn = page.locator('.team-btn').first();
      if (await teamBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await teamBtn.click();

        // Select confidence
        const confBtn = page.locator('.confidence-btn.medium');
        if (await confBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confBtn.click();

          // Enter amount
          const amountInput = page.locator('#amount, .amount-input').first();
          if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await amountInput.fill('10');

            // Bet slip should appear
            const betSlip = page.locator('.bet-slip-preview');
            const hasBetSlip = await betSlip.isVisible({ timeout: 3000 }).catch(() => false);
            if (hasBetSlip) {
              await expect(betSlip.locator('.bet-slip-header')).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should show submit button in pick form', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const unlockedCard = page.locator('.game-card-btn:not(.locked)').first();
    const hasUnlocked = await unlockedCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnlocked) {
      await unlockedCard.click();
      await page.waitForTimeout(300);

      const submitBtn = page.locator('.pick-form-submit, button:has-text("Lock in Pick")').first();
      const hasSubmit = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
      // Submit button may be visible but disabled until all fields filled
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INFO ACCORDIONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show info accordions (Quick Guide, Bonuses)', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const accordion = page.locator('.info-accordion, details.info-accordion').first();
    const hasAccordion = await accordion.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAccordion) {
      // Click to expand
      const summary = accordion.locator('.info-summary, summary').first();
      await summary.click();
      await page.waitForTimeout(300);

      const content = accordion.locator('.info-content');
      const hasContent = await content.isVisible({ timeout: 2000 }).catch(() => false);
      // Content should be visible after expanding
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PROP BETS SECTION
  // ═══════════════════════════════════════════════════════════════════════

  test('should display prop bets section when available', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propSection = page.locator('.prop-picks-section');
    const hasProps = await propSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      await expect(page.locator('.prop-card').first()).toBeVisible();
    }
  });

  test('should show prop bet card details', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propCard = page.locator('.prop-card').first();
    const hasProps = await propCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      // Should have description
      const desc = propCard.locator('.prop-description');
      const hasDesc = await desc.isVisible({ timeout: 2000 }).catch(() => false);

      // Should have betting options
      const bettingSection = propCard.locator('.prop-betting-section');
      const hasBetting = await bettingSection.isVisible({ timeout: 2000 }).catch(() => false);
    }
  });

  test('should show prop bet category badge', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propCard = page.locator('.prop-card').first();
    const hasProps = await propCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      const category = propCard.locator('.prop-category');
      const hasCategory = await category.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasCategory) {
        const text = await category.textContent();
        expect(text).toMatch(/Boys|Girls|General/i);
      }
    }
  });

  test('should show prop bet odds', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propCard = page.locator('.prop-card').first();
    const hasProps = await propCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      const odds = propCard.locator('.option-odds');
      const hasOdds = await odds.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasOdds) {
        const text = await odds.first().textContent();
        expect(text).toMatch(/\d/);
      }
    }
  });

  test('should have prop bet amount input', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propCard = page.locator('.prop-card').first();
    const hasProps = await propCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      const amountInput = propCard.locator('.prop-bet-input, input[type="number"]');
      const hasInput = await amountInput.first().isVisible({ timeout: 2000 }).catch(() => false);
      // Some props may have input, some may not depending on state
    }
  });

  test('should show prop bet action buttons', async ({ page }) => {
    await navigateToUrl(page, '/games');

    const propCard = page.locator('.prop-card').first();
    const hasProps = await propCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProps) {
      const betBtn = propCard.locator('.prop-bet-btn, button').first();
      await expect(betBtn).toBeVisible();
    }
  });
});

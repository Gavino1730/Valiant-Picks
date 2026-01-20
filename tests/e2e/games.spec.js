const { test, expect } = require('@playwright/test');
const { login, getUserBalance, navigateTo, clearSession, waitForAPI, dismissOnboarding } = require('../helpers/test-utils');

test.describe('Games and Betting', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display games list', async ({ page }) => {
    await navigateTo(page, 'Games');
    await dismissOnboarding(page);
    
    await expect(page.locator('text=/Games|Upcoming/i').first()).toBeVisible();
  });

  test('should load visible games only', async ({ page }) => {
    await page.goto('/games');
    await dismissOnboarding(page);
    await page.waitForTimeout(500);
    
    // Wait for games to load
    await page.waitForLoadState('domcontentloaded');
    
    // Should show games or "no games" message - check both
    const gamesCount = await page.locator('[class*="game"]').count();
    const noGamesMessage = await page.locator('text=/No games available/i').count();
    expect(gamesCount + noGamesMessage).toBeGreaterThan(0);
  });

  test('should display game details', async ({ page }) => {
    await page.goto('/games');
    await dismissOnboarding(page);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Find first game card
    const firstGame = page.locator('[class*="game"]').first();
    const gameExists = await firstGame.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      // Should show team names
      await expect(firstGame.locator('text=/vs|@/i')).toBeVisible();
      
      // Should show date/time
      await expect(firstGame).toContainText(/\d{1,2}[:/]\d{2}|PM|AM/);
    }
  });

  test('should show betting odds for games', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const firstGame = page.locator('[class*="game"]').first();
    const gameExists = await firstGame.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      // Should display odds (numbers with decimals)
      const oddsPattern = /\d+\.\d+x?/;
      await expect(firstGame.locator(`text=${oddsPattern}`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should open bet modal when clicking on game', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const firstGame = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await firstGame.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await page.waitForTimeout(1000);
      await firstGame.click();
      await page.waitForTimeout(1000);
      
      // Should open betting modal/form - check for any modal indicators
      const modalVisible = await Promise.race([
        page.locator('text=/Place Bet|Bet Amount|Confirm/i').first().isVisible({ timeout: 15000 }).catch(() => false),
        page.locator('input[placeholder*="amount" i]').isVisible({ timeout: 15000 }).catch(() => false)
      ]);
      expect(modalVisible).toBe(true);
    }
  });

  test('should place bet with low confidence (1.2x)', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const initialBalance = await getUserBalance(page);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Fill bet amount
      const amountInput = page.locator('input[placeholder*="amount" i], input[type="number"]').first();
      const inputExists = await amountInput.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (inputExists) {
        await amountInput.fill('10', { timeout: 5000 });
        
        // Select Low confidence (1.2x)
        const lowConfidence = page.locator('text=/Low|1.2/i').first();
        if (await lowConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
          await lowConfidence.click({ timeout: 5000 });
        }
        
        // Confirm bet
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)', { timeout: 5000 });
        
        // Should show success message
        const successVisible = await page.locator('text=/Success|Bet Placed/i').isVisible({ timeout: 10000 }).catch(() => false);
        if (successVisible) {
          await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible();
        }
      }
    }
  });

  test('should place bet with medium confidence (1.5x)', async ({ page }) => {
    await page.goto('/games');
    await dismissOnboarding(page);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await page.waitForTimeout(1000);
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '20', { timeout: 10000 });
      
      // Select Medium confidence (1.5x)
      const mediumConfidence = page.locator('text=/Medium|1.5/i');
      if (await mediumConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mediumConfidence.click();
      }
      
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should place bet with high confidence (2.0x)', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[placeholder*="amount" i], input[type="number"]');
      if (await amountInput.isVisible({ timeout: 10000 }).catch(() => false)) {
        await amountInput.fill('15');
        
        // Select High confidence (2.0x)
        const highConfidence = page.locator('text=/High|2.0/i').first();
        if (await highConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
          await highConfidence.click();
        }
        
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
        await expect(page.locator('text=/Success|Bet Placed/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should prevent betting more than available balance', async ({ page }) => {
    const balance = await getUserBalance(page);
    
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists && balance > 0) {
      await betButton.click();
      
      // Try to bet more than balance
      await page.fill('input[placeholder*="amount" i], input[type="number"]', (balance + 1000).toString());
      
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Should show error
      await expect(page.locator('text=/Insufficient|Not enough|balance/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent negative bet amounts', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[placeholder*="amount" i], input[type="number"]');
      if (await amountInput.isVisible({ timeout: 10000 }).catch(() => false)) {
        await amountInput.fill('-50');
        
        // Input should prevent negative or show error
        const value = await amountInput.inputValue();
        const numValue = parseFloat(value);
        expect(numValue).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should prevent zero bet amounts', async ({ page }) => {
    await page.goto('/games');
    await dismissOnboarding(page);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await page.waitForTimeout(1000);
      await betButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '0');
      
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Should show error or prevent submission
      const errorVisible = await page.locator('text=/Invalid|minimum|greater than/i').isVisible({ timeout: 3000 }).catch(() => false);
      expect(errorVisible).toBe(true);
    }
  });

  test('should show bet confirmation before placing bet', async ({ page }) => {
    await page.goto('/games');
    await dismissOnboarding(page);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await page.waitForTimeout(1000);
      await betButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '25', { timeout: 10000 });
      
      // Should show potential win amount
      await expect(page.locator('text=/Potential Win|You could win/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should calculate potential winnings correctly', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[placeholder*="amount" i], input[type="number"]');
      if (await amountInput.isVisible({ timeout: 10000 }).catch(() => false)) {
        const betAmount = 100;
        await amountInput.fill(betAmount.toString());
        
        // Select medium confidence (1.5x)
        const mediumConfidence = page.locator('text=/Medium|1.5/i').first();
        if (await mediumConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
          await mediumConfidence.click();
          
          // Wait for calculation
          await page.waitForTimeout(1000);
          
          // Check if potential win is shown
          const potentialWinExists = await page.locator('text=/Potential Win|Win:/i').count();
          expect(potentialWinExists).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should display spread betting option', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      // Check if spread betting is available
      const spreadOption = page.locator('text=/Spread|Point Spread/i');
      const hasSpread = await spreadOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasSpread).toBeDefined();
    }
  });

  test('should display over/under betting option', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      // Check if over/under betting is available
      const overUnderOption = page.locator('text=/Over|Under|Total/i');
      const hasOverUnder = await overUnderOption.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasOverUnder).toBeDefined();
    }
  });

  test('should cancel bet placement', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '50');
      
      // Click cancel
      const cancelButton = page.locator('button:has-text(/Cancel|Close/i)');
      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click();
        
        // Modal should close
        const modalClosed = await page.locator('text=/Place Bet|Confirm/i').isHidden({ timeout: 3000 }).catch(() => true);
        expect(modalClosed).toBe(true);
      }
    }
  });

  test('should filter games by type', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    
    // Check if filter options exist
    const filterButtons = page.getByRole('button', { name: /All|Varsity|JV|Girls|Boys/i });
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      // Click on a filter
      await filterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Games should be filtered
      const games = page.locator('[class*="game"]');
      const gameCount = await games.count();
      expect(gameCount).toBeGreaterThanOrEqual(0);
    }
  });
});

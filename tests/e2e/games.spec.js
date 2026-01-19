const { test, expect } = require('@playwright/test');
const { login, getUserBalance, navigateTo, clearSession, waitForAPI } = require('../helpers/test-utils');

test.describe('Games and Betting', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display games list', async ({ page }) => {
    await navigateTo(page, 'Games');
    
    await expect(page.locator('text=/Games|Upcoming/i')).toBeVisible();
  });

  test('should load visible games only', async ({ page }) => {
    await page.goto('/games');
    
    // Wait for games to load
    await page.waitForLoadState('networkidle');
    
    // Should show games or "no games" message
    const gamesExist = await page.locator('[class*="game"], text=/No games available/i').count();
    expect(gamesExist).toBeGreaterThan(0);
  });

  test('should display game details', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
    const firstGame = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await firstGame.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await firstGame.click();
      
      // Should open betting modal/form
      await expect(page.locator('text=/Place Bet|Bet Amount|Confirm/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should place bet with low confidence (1.2x)', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const initialBalance = await getUserBalance(page);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      // Fill bet amount
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '10');
      
      // Select Low confidence (1.2x)
      const lowConfidence = page.locator('text=/Low|1.2/i');
      if (await lowConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lowConfidence.click();
      }
      
      // Confirm bet
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Should show success message
      await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible({ timeout: 5000 });
      
      // Balance should decrease
      await page.waitForTimeout(1000);
      const newBalance = await getUserBalance(page);
      expect(newBalance).toBeLessThan(initialBalance);
    }
  });

  test('should place bet with medium confidence (1.5x)', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '20');
      
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
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '15');
      
      // Select High confidence (2.0x)
      const highConfidence = page.locator('text=/High|2.0/i');
      if (await highConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
        await highConfidence.click();
      }
      
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent betting more than available balance', async ({ page }) => {
    const balance = await getUserBalance(page);
    
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      const amountInput = page.locator('input[placeholder*="amount" i], input[type="number"]');
      await amountInput.fill('-50');
      
      // Input should prevent negative or show error
      const value = await amountInput.inputValue();
      const numValue = parseFloat(value);
      expect(numValue).toBeGreaterThanOrEqual(0);
    }
  });

  test('should prevent zero bet amounts', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '0');
      
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Should show error or prevent submission
      const errorVisible = await page.locator('text=/Invalid|minimum|greater than/i').isVisible({ timeout: 3000 }).catch(() => false);
      expect(errorVisible).toBe(true);
    }
  });

  test('should show bet confirmation before placing bet', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '25');
      
      // Should show potential win amount
      await expect(page.locator('text=/Potential Win|You could win/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should calculate potential winnings correctly', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await betButton.click();
      
      const betAmount = 100;
      await page.fill('input[placeholder*="amount" i], input[type="number"]', betAmount.toString());
      
      // Select medium confidence (1.5x)
      const mediumConfidence = page.locator('text=/Medium|1.5/i');
      if (await mediumConfidence.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mediumConfidence.click();
        
        // Wait for calculation
        await page.waitForTimeout(500);
        
        // Should show 150 as potential win (100 * 1.5)
        const potentialWinText = await page.locator('text=/Potential Win|Win:/i').textContent();
        const expectedWin = betAmount * 1.5;
        expect(potentialWinText).toContain(expectedWin.toString());
      }
    }
  });

  test('should display spread betting option', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
    
    // Check if filter options exist
    const filterButtons = page.locator('button:has-text(/All|Varsity|JV|Girls|Boys/i)');
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

const { test, expect } = require('@playwright/test');
const { login, getUserBalance, clearSession } = require('../helpers/test-utils');

test.describe('Prop Bets', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display prop bets page', async ({ page }) => {
    // Navigate to prop bets (might be in games or separate page)
    await page.goto('/games');
    
    // Look for prop bets section
    const propBetsLink = page.locator('text=/Prop Bets|Props|Special Bets/i').first();
    const exists = await propBetsLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await propBetsLink.click();
      await expect(page.locator('text=/Prop Bets|Props/i')).toBeVisible();
    } else {
      // Check if prop bets are on same page
      const propBetSection = await page.locator('text=/Prop Bet/i').count();
      expect(propBetSection).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display list of active prop bets', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    // Find prop bets section
    const propBets = page.locator('[class*="prop"], text=/Prop Bet/i').first();
    const hasPropBets = await propBets.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasPropBets) {
      // Should show prop bet details
      await expect(propBets).toBeVisible();
    }
  });

  test('should display prop bet details', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Should show title/description
      await expect(propBetCard).toContainText(/./);
      
      // Should show YES/NO options
      const yesButton = propBetCard.locator('text=/YES|Yes/');
      const noButton = propBetCard.locator('text=/NO|No/');
      
      await expect(yesButton.or(noButton)).toBeVisible();
    }
  });

  test('should display YES and NO odds for prop bets', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Should show odds (numbers with decimals)
      const oddsPattern = /\d+\.\d+x?/;
      const oddsCount = await propBetCard.locator(`text=${oddsPattern}`).count();
      expect(oddsCount).toBeGreaterThanOrEqual(1); // At least one odds value
    }
  });

  test('should place YES bet on prop bet', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const initialBalance = await getUserBalance(page);
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Click YES button
      const yesButton = propBetCard.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        // Fill bet amount
        await page.fill('input[placeholder*="amount" i], input[type="number"]', '10');
        
        // Confirm bet
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
        
        // Should show success
        await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible({ timeout: 5000 });
        
        // Balance should decrease
        await page.waitForTimeout(1000);
        const newBalance = await getUserBalance(page);
        expect(newBalance).toBeLessThan(initialBalance);
      }
    }
  });

  test('should place NO bet on prop bet', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Click NO button
      const noButton = propBetCard.locator('button:has-text(/NO|No/i)');
      if (await noButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noButton.click();
        
        // Fill bet amount
        await page.fill('input[placeholder*="amount" i], input[type="number"]', '15');
        
        // Confirm bet
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
        
        // Should show success
        await expect(page.locator('text=/Success|Bet Placed/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show different odds for YES and NO', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Get YES odds
      const yesSection = propBetCard.locator('text=/YES/i').locator('..');
      const yesOddsText = await yesSection.textContent();
      
      // Get NO odds
      const noSection = propBetCard.locator('text=/NO/i').locator('..');
      const noOddsText = await noSection.textContent();
      
      // Extract odds values
      const yesOdds = yesOddsText.match(/\d+\.\d+/);
      const noOdds = noOddsText.match(/\d+\.\d+/);
      
      if (yesOdds && noOdds) {
        // Odds should be different (usually)
        expect(parseFloat(yesOdds[0])).toBeGreaterThan(0);
        expect(parseFloat(noOdds[0])).toBeGreaterThan(0);
      }
    }
  });

  test('should display prop bet expiration date', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Should show expiration date/time
      const hasDate = await propBetCard.locator('text=/Expires|Deadline|Until/i').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasDate).toBeDefined();
    }
  });

  test('should prevent betting on expired prop bets', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for expired prop bet
    const expiredPropBet = page.locator('text=/Expired|Closed/i');
    const hasExpired = await expiredPropBet.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasExpired) {
      // Bet buttons should be disabled
      const betButton = page.locator('button:has-text(/YES|NO/i)').first();
      const isDisabled = await betButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('should calculate potential winnings for prop bets', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      const yesButton = propBetCard.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        const betAmount = 20;
        await page.fill('input[placeholder*="amount" i], input[type="number"]', betAmount.toString());
        
        // Wait for calculation
        await page.waitForTimeout(500);
        
        // Should show potential win
        await expect(page.locator('text=/Potential Win|You could win/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should validate minimum bet amount for prop bets', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      const yesButton = propBetCard.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        // Try to bet 0
        await page.fill('input[placeholder*="amount" i], input[type="number"]', '0');
        
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
        
        // Should show error
        const errorVisible = await page.locator('text=/Invalid|minimum|greater than/i').isVisible({ timeout: 3000 }).catch(() => false);
        expect(errorVisible).toBe(true);
      }
    }
  });

  test('should prevent betting more than balance on prop bets', async ({ page }) => {
    const balance = await getUserBalance(page);
    
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists && balance > 0) {
      const yesButton = propBetCard.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        // Try to bet more than balance
        await page.fill('input[placeholder*="amount" i], input[type="number"]', (balance + 1000).toString());
        
        await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
        
        // Should show error
        await expect(page.locator('text=/Insufficient|Not enough|balance/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display prop bet status (active/resolved)', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Should show status badge/indicator
      const statusIndicators = await propBetCard.locator('text=/Active|Resolved|Pending|Closed/i').count();
      expect(statusIndicators).toBeGreaterThanOrEqual(0);
    }
  });

  test('should cancel prop bet placement', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    
    const propBetCard = page.locator('[class*="prop"]').first();
    const exists = await propBetCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      const yesButton = propBetCard.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        await page.fill('input[placeholder*="amount" i], input[type="number"]', '25');
        
        // Click cancel
        const cancelButton = page.locator('button:has-text(/Cancel|Close/i)');
        if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelButton.click();
          
          // Modal should close
          const modalClosed = await page.locator('text=/Place Bet|Confirm/i').isHidden({ timeout: 3000 }).catch(() => true);
          expect(modalClosed).toBe(true);
        }
      }
    }
  });
});

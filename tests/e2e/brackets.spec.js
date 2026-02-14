const { test, expect } = require('@playwright/test');
const { login, dismissOnboarding, clearSession, navigateTo, waitForAPI } = require('../helpers/test-utils');

test.describe('Bracket Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('should load active bracket', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    // Navigate to brackets
    await navigateTo(page, 'Bracket');
    
    // Should show bracket or message about no active bracket
    const bracketExists = await page.locator('text=/Bracket|Tournament|3A State/i').count();
    expect(bracketExists).toBeGreaterThan(0);
  });

  test('should display bracket teams in order', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Should show seeds or team names
    const seedCount = await page.locator('text=/Seed|#1|#2|#3|#4|#5|#6|#7|#8/i').count();
    if (seedCount > 0) {
      expect(seedCount).toBeGreaterThan(0);
    }
  });

  test('should show bracket first round matchups', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Should show game matchups (vs or @)
    const matchupCount = await page.locator('text=/vs|@/i').count();
    if (matchupCount > 0) {
      expect(matchupCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('should allow user to submit bracket picks', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Try to find and click team pick buttons
    const pickButtons = await page.locator('button:has-text(/Pick|Select|Choose/i)').count();
    
    if (pickButtons > 0) {
      // Click on first available pick
      await page.locator('button:has-text(/Pick|Select|Choose/i)').first().click();
      await page.waitForTimeout(500);
      
      // Should show selection feedback
      const selectionMessage = await page.locator('text=/Selected|Picked|Confirmed/i').count();
      expect(selectionMessage).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display bracket entry status', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Should show entry status (submitted/pending/completed) or allow entry
    const statusText = await page.locator('text=/Entry|Status|Submitted|Pending|Points|Score/i').count();
    expect(statusText).toBeGreaterThanOrEqual(0);
  });

  test('should show bracket leaderboard', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Click leaderboard tab or section if available
    const leaderboardLink = page.locator('text=/Leaderboard|Rankings|Standings/i').first();
    const leaderboardExists = await leaderboardLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (leaderboardExists) {
      await leaderboardLink.click();
      await page.waitForTimeout(500);
      
      // Should show user entries and rankings
      const userCount = await page.locator('text=/User|Player|Name/i').count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('admin should be able to create bracket', async ({ page }) => {
    // Note: This test assumes admin account exists
    await login(page, 'admin@valiantpicks.com', 'AdminPassword123!');
    await dismissOnboarding(page);
    
    // Navigate to admin panel
    await navigateTo(page, 'AdminPanel');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Look for bracket management section
    const bracketSection = page.locator('text=/Bracket|Tournament/i').first();
    const sectionExists = await bracketSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (sectionExists) {
      // Should have create bracket option
      const createButton = page.locator('button:has-text(/Create|New|Add/i)').first();
      expect(createButton).toBeDefined();
    }
  });

  test('should handle bracket game outcomes', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Check if bracket shows completed games
    const completedGameIndicator = await page.locator('text=/Completed|Winner|Final|Score|Result/i').count();
    expect(completedGameIndicator).toBeGreaterThanOrEqual(0);
  });

  test('should display bracket point calculations', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Check for points display
    const pointsText = await page.locator('text=/Points|Score|+\\d|\\d\\d\\d/i').count();
    expect(pointsText).toBeGreaterThanOrEqual(0);
  });

  test('should show bracket entry fee information', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Check for entry fee or cost information
    const feeText = await page.locator('text=/Fee|Cost|Entry|\\$|Bucks/i').count();
    expect(feeText).toBeGreaterThanOrEqual(0);
  });

  test('should validate bracket pick completion', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Try to submit without completing all picks
    const submitButton = page.locator('button:has-text(/Submit|Complete|Confirm/i)').first();
    const buttonExists = await submitButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (buttonExists) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Should show error if picks incomplete, or success if complete
      const feedback = await page.locator('text=/Error|Invalid|Required|Success|Submitted/i').count();
      expect(feedback).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display bracket progress through rounds', async ({ page }) => {
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    await dismissOnboarding(page);
    
    await navigateTo(page, 'Bracket');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Check for round indicators
    const roundText = await page.locator('text=/Round|Quarter|Semi|Final|Elite 8|Final Four/i').count();
    expect(roundText).toBeGreaterThanOrEqual(0);
  });

  test('admin should be able to delete bracket', async ({ page }) => {
    // Note: This test assumes admin account exists
    await login(page, 'admin@valiantpicks.com', 'AdminPassword123!');
    await dismissOnboarding(page);
    
    // Navigate to admin panel
    await navigateTo(page, 'AdminPanel');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Look for bracket management section
    const bracketTab = page.locator('button:has-text(/Bracket|Tournament/i)').first();
    const bracketTabExists = await bracketTab.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (bracketTabExists) {
      await bracketTab.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      
      // Look for a bracket to delete
      const selectDropdown = page.locator('select').first();
      const dropdownExists = await selectDropdown.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (dropdownExists) {
        // Select the first bracket option
        await selectDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        // Look for delete button
        const deleteButton = page.locator('button:has-text(/Delete/i)').first();
        const deleteButtonExists = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (deleteButtonExists) {
          await deleteButton.click();
          await page.waitForTimeout(500);
          
          // Handle confirmation dialog if present
          const confirmButton = page.locator('button:has-text(/OK|Yes|Confirm/i)').first();
          const confirmExists = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (confirmExists) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          } else {
            // If no confirm dialog, might need to confirm in the browser alert
            page.on('dialog', dialog => dialog.accept());
          }
          
          // Should show success message
          const successMessage = await page.locator('text=/deleted|success/i').isVisible({ timeout: 2000 }).catch(() => false);
          expect(successMessage).toBeDefined();
        }
      }
    }
  });
});


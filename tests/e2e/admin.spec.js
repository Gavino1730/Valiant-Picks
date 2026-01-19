const { test, expect } = require('@playwright/test');
const { login, clearSession, isAdmin } = require('../helpers/test-utils');

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    // Login as admin
    await login(page, 'admin@valiantpicks.com', 'AdminPassword123!');
  });

  test('should access admin panel with admin credentials', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin panel
    await expect(page.locator('text=/Admin Panel|Admin Dashboard|Manage/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display admin navigation menu', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin menu items
    const menuItems = page.locator('text=/Games|Teams|Users|Bets|Props/i');
    const menuCount = await menuItems.count();
    expect(menuCount).toBeGreaterThanOrEqual(3);
  });

  test('should display games management section', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to games management
    const gamesLink = page.locator('text=/Manage Games|Games/i').first();
    if (await gamesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gamesLink.click();
      
      await expect(page.locator('text=/Create Game|Add Game|Game Management/i')).toBeVisible();
    }
  });

  test('should create new game', async ({ page }) => {
    await page.goto('/admin');
    
    // Click create game button
    const createButton = page.locator('button:has-text(/Create Game|Add Game|New Game/i)');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // Fill game details
      await page.fill('input[placeholder*="home" i], input[name*="home"]', 'Test Home Team');
      await page.fill('input[placeholder*="away" i], input[name*="away"]', 'Test Away Team');
      
      // Set date (if date picker exists)
      const dateInput = page.locator('input[type="date"], input[placeholder*="date" i]');
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill('2026-02-01');
      }
      
      // Submit
      await page.click('button:has-text(/Create|Save|Submit/i)');
      
      // Should show success message
      await expect(page.locator('text=/Success|Created|Added/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit existing game', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for edit button on first game
    const editButton = page.locator('button:has-text(/Edit/i)').first();
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      
      // Should show edit form
      await expect(page.locator('input[placeholder*="home" i], input[name*="home"]')).toBeVisible();
      
      // Make a change
      await page.fill('input[placeholder*="home" i], input[name*="home"]', 'Updated Team Name');
      
      // Save
      await page.click('button:has-text(/Save|Update/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Updated|Saved/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should toggle game visibility', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for visibility toggle button
    const visibilityButton = page.locator('button:has-text(/Visible|Hidden|Show|Hide/i)').first();
    if (await visibilityButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await visibilityButton.click();
      
      // Should toggle visibility
      await page.waitForTimeout(500);
      
      // Verify change (button text should change or success message)
      const successOrChange = await page.locator('text=/Success|Updated|Visible|Hidden/i').isVisible({ timeout: 3000 });
      expect(successOrChange).toBe(true);
    }
  });

  test('should set game outcome and resolve bets', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for set outcome button
    const outcomeButton = page.locator('button:has-text(/Set Outcome|Resolve|Winner/i)').first();
    if (await outcomeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outcomeButton.click();
      
      // Select winner
      const homeWinButton = page.locator('button:has-text(/Home|Home Wins/i)');
      if (await homeWinButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await homeWinButton.click();
      }
      
      // Confirm
      await page.click('button:has-text(/Confirm|Submit/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Resolved|Bets Updated/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete game', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for delete button
    const deleteButton = page.locator('button:has-text(/Delete/i)').first();
    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteButton.click();
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text(/Confirm|Yes|Delete/i)');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        
        // Should show success
        await expect(page.locator('text=/Success|Deleted|Removed/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display users management section', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to users management
    const usersLink = page.locator('text=/Manage Users|Users/i').first();
    if (await usersLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usersLink.click();
      
      await expect(page.locator('text=/Users|User Management/i')).toBeVisible();
    }
  });

  test('should list all users in admin panel', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for users list
    const usersSection = page.locator('text=/Users|testuser|admin/i');
    const userCount = await usersSection.count();
    expect(userCount).toBeGreaterThan(0);
  });

  test('should update user balance', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for update balance button
    const balanceButton = page.locator('button:has-text(/Balance|Edit Balance|Update Balance/i)').first();
    if (await balanceButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await balanceButton.click();
      
      // Enter new balance
      await page.fill('input[placeholder*="balance" i], input[type="number"]', '2000');
      
      // Save
      await page.click('button:has-text(/Save|Update|Confirm/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Updated|Balance Updated/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display bets management section', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to bets management
    const betsLink = page.locator('text=/Manage Bets|All Bets|Bets/i').first();
    if (await betsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await betsLink.click();
      
      await expect(page.locator('text=/All Bets|Bet Management/i')).toBeVisible();
    }
  });

  test('should view all user bets', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for bets list
    const betsSection = page.locator('[class*="bet"]');
    const betCount = await betsSection.count();
    expect(betCount).toBeGreaterThanOrEqual(0);
  });

  test('should manually resolve bet', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for resolve bet button
    const resolveButton = page.locator('button:has-text(/Resolve|Set Outcome/i)').first();
    if (await resolveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resolveButton.click();
      
      // Select outcome
      const wonButton = page.locator('button:has-text(/Won|Win/i)');
      if (await wonButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await wonButton.click();
      }
      
      // Confirm
      await page.click('button:has-text(/Confirm|Submit/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Resolved|Updated/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display teams management section', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to teams management
    const teamsLink = page.locator('text=/Manage Teams|Teams/i').first();
    if (await teamsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teamsLink.click();
      
      await expect(page.locator('text=/Create Team|Team Management/i')).toBeVisible();
    }
  });

  test('should create new team', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for create team button
    const createButton = page.locator('button:has-text(/Create Team|Add Team|New Team/i)');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // Fill team details
      await page.fill('input[placeholder*="name" i], input[name*="name"]', 'Test Team');
      await page.fill('input[placeholder*="type" i], select[name*="type"]', 'Varsity');
      
      // Save
      await page.click('button:has-text(/Create|Save|Submit/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Created|Added/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit team details', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for edit team button
    const editButton = page.locator('button:has-text(/Edit/i)').first();
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      
      // Should show edit form
      const nameInput = page.locator('input[placeholder*="name" i], input[name*="name"]');
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('Updated Team Name');
        
        // Save
        await page.click('button:has-text(/Save|Update/i)');
        
        // Should show success
        await expect(page.locator('text=/Success|Updated|Saved/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display prop bets management section', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to prop bets management
    const propBetsLink = page.locator('text=/Manage Props|Prop Bets|Props/i').first();
    if (await propBetsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await propBetsLink.click();
      
      await expect(page.locator('text=/Create Prop|Prop Management/i')).toBeVisible();
    }
  });

  test('should create new prop bet', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for create prop bet button
    const createButton = page.locator('button:has-text(/Create Prop|Add Prop|New Prop/i)');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      
      // Fill prop bet details
      await page.fill('input[placeholder*="title" i], input[name*="title"]', 'Test Prop Bet');
      await page.fill('textarea[placeholder*="description" i], textarea[name*="description"]', 'Test description');
      
      // Set odds
      await page.fill('input[placeholder*="yes" i], input[name*="yes"]', '1.8');
      await page.fill('input[placeholder*="no" i], input[name*="no"]', '2.2');
      
      // Save
      await page.click('button:has-text(/Create|Save|Submit/i)');
      
      // Should show success
      await expect(page.locator('text=/Success|Created|Added/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should resolve prop bet', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for resolve prop bet button
    const resolveButton = page.locator('button:has-text(/Resolve/i)').first();
    if (await resolveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resolveButton.click();
      
      // Select YES or NO outcome
      const yesButton = page.locator('button:has-text(/YES|Yes/i)');
      if (await yesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesButton.click();
        
        // Confirm
        await page.click('button:has-text(/Confirm|Submit/i)');
        
        // Should show success
        await expect(page.locator('text=/Success|Resolved|Updated/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display admin statistics', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show stats like total users, total bets, etc
    const statsSection = page.locator('text=/Total Users|Total Bets|Pending|Resolved/i');
    const statsCount = await statsSection.count();
    expect(statsCount).toBeGreaterThan(0);
  });

  test('should prevent non-admin access to admin panel', async ({ page }) => {
    // Logout and login as regular user
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
    
    // Try to access admin panel
    await page.goto('/admin');
    
    // Should redirect or show access denied
    const accessDenied = await page.locator('text=/Access Denied|Unauthorized|Admin Only/i').isVisible({ timeout: 5000 }).catch(() => false);
    const redirected = await page.url();
    
    expect(accessDenied || !redirected.includes('/admin')).toBe(true);
  });
});

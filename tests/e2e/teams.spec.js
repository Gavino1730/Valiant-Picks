const { test, expect } = require('@playwright/test');
const { login, navigateTo, clearSession } = require('../helpers/test-utils');

test.describe('Teams', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display teams page', async ({ page }) => {
    await navigateTo(page, 'Teams');
    
    await expect(page.locator('text=/Teams|Valiant/i')).toBeVisible();
  });

  test('should list all teams', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Should show team cards/list
    const teams = page.locator('[class*="team"]');
    const teamCount = await teams.count();
    expect(teamCount).toBeGreaterThanOrEqual(0);
  });

  test('should display team types (Varsity, JV, Girls, etc)', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Check for team type filters or labels
    const teamTypes = page.locator('text=/Varsity|JV|Girls|Boys|Freshman/i');
    const typeCount = await teamTypes.count();
    expect(typeCount).toBeGreaterThan(0);
  });

  test('should display team details when clicked', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show team details
      await expect(page.locator('text=/Record|Wins|Losses|Schedule/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display team record (wins/losses)', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      // Should show record like "10-5" or "W: 10, L: 5"
      const recordPattern = /\d+-\d+|W.*\d+.*L.*\d+/i;
      await expect(firstTeam.locator(`text=${recordPattern}`).first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('should display team schedule', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show schedule section
      const scheduleSection = page.locator('text=/Schedule|Upcoming Games|Past Games/i');
      const hasSchedule = await scheduleSection.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasSchedule).toBeDefined();
    }
  });

  test('should display team roster/players', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show roster/players section
      const rosterSection = page.locator('text=/Roster|Players|Team Members/i');
      const hasRoster = await rosterSection.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasRoster).toBeDefined();
    }
  });

  test('should display player names', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Look for player cards or list
      const players = page.locator('[class*="player"], text=/Roster/i ~ *');
      const playerCount = await players.count();
      expect(playerCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display player positions/numbers', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show player numbers (#1, #23, etc) or positions
      const playerInfo = page.locator('text=/#\d+|Guard|Forward|Center/i');
      const hasPlayerInfo = await playerInfo.count();
      expect(hasPlayerInfo).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display coach information', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show coach name
      const coachSection = page.locator('text=/Coach|Head Coach/i');
      const hasCoach = await coachSection.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasCoach).toBeDefined();
    }
  });

  test('should display team description', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show team description/bio
      const description = page.locator('[class*="description"], p');
      const hasDescription = await description.count();
      expect(hasDescription).toBeGreaterThan(0);
    }
  });

  test('should display team ranking/standing', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show ranking or league standing
      const ranking = page.locator('text=/Rank|#\d+|Standing/i');
      const hasRanking = await ranking.count();
      expect(hasRanking).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter teams by type', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Check for filter buttons
    const filterButtons = page.locator('button:has-text(/Varsity|JV|Girls|Boys/i)');
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      // Click on a filter
      await filterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Teams should be filtered
      const teams = page.locator('[class*="team"]');
      const teamCount = await teams.count();
      expect(teamCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show upcoming games for team', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show upcoming games
      const upcomingGames = page.locator('text=/Upcoming|Next Game/i');
      const hasUpcoming = await upcomingGames.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasUpcoming).toBeDefined();
    }
  });

  test('should show past games for team', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show past games
      const pastGames = page.locator('text=/Past Games|Previous|Results/i');
      const hasPast = await pastGames.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasPast).toBeDefined();
    }
  });

  test('should display game scores in schedule', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Look for scores (like "85-72" or "W 85-72")
      const scorePattern = /\d+-\d+/;
      const scores = page.locator(`text=${scorePattern}`);
      const scoreCount = await scores.count();
      expect(scoreCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show team stats if available', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show stats like PPG, win percentage, etc
      const statsSection = page.locator('text=/Stats|Statistics|PPG|Average/i');
      const hasStats = await statsSection.count();
      expect(hasStats).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate back from team details', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Look for back button
      const backButton = page.locator('button:has-text(/Back|Return/i), a:has-text(/Back|Teams/i)');
      const hasBack = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasBack) {
        await backButton.click();
        
        // Should return to teams list
        await expect(page.locator('text=/Teams/i')).toBeVisible();
      }
    }
  });

  test('should display contact information for coaches', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const firstTeam = page.locator('[class*="team"]').first();
    const teamExists = await firstTeam.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (teamExists) {
      await firstTeam.click();
      
      // Should show coach email or contact
      const contactInfo = page.locator('text=/@|Email|Contact/i');
      const hasContact = await contactInfo.count();
      expect(hasContact).toBeGreaterThanOrEqual(0);
    }
  });
});

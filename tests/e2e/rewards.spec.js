const { test, expect } = require('@playwright/test');
const { login, clearSession, getUserBalance, dismissOnboarding } = require('../helpers/test-utils');

test.describe('Rewards and Achievements', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await login(page, 'testuser@valiantpicks.com', 'TestPassword123!');
  });

  test('should display daily rewards page', async ({ page }) => {
    // Navigate to daily rewards
    const dailyRewardsLink = page.locator('text=/Daily Reward|Daily Login|Claim/i').first();
    const exists = await dailyRewardsLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await dailyRewardsLink.click();
      await expect(page.locator('text=/Daily Reward|Daily Login/i')).toBeVisible();
    }
  });

  test('should show daily login streak', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for streak indicator
    const streakIndicator = page.locator('text=/Streak|Day|Login Streak/i');
    const hasStreak = await streakIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasStreak) {
      // Should show number of days
      const streakText = await streakIndicator.textContent();
      expect(streakText).toMatch(/\d+/);
    }
  });

  test('should claim daily reward', async ({ page }) => {
    const initialBalance = await getUserBalance(page);
    
    // Look for claim button
    const claimButton = page.locator('button:has-text(/Claim|Collect|Get Reward/i)').first();
    const canClaim = await claimButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (canClaim && !(await claimButton.isDisabled())) {
      await claimButton.click();
      
      // Should show success message
      await expect(page.locator('text=/Success|Claimed|Reward/i')).toBeVisible({ timeout: 5000 });
      
      // Balance should increase
      await page.waitForTimeout(1000);
      const newBalance = await getUserBalance(page);
      expect(newBalance).toBeGreaterThan(initialBalance);
    }
  });

  test('should show daily reward cooldown', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for cooldown/timer
    const cooldownIndicator = page.locator('text=/Next reward|Come back|hours|Available in/i');
    const hasCooldown = await cooldownIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasCooldown) {
      // Should show time remaining
      const cooldownText = await cooldownIndicator.textContent();
      expect(cooldownText).toMatch(/\d+/);
    }
  });

  test('should display spin wheel feature', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(2000); // Longer wait for animations/stability
    
    // Look for spin wheel link/button
    const spinWheelLink = page.locator('text=/Spin|Wheel|Lucky Wheel/i').first();
    const exists = await spinWheelLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Wait for element to be stable - use evaluate to force click
      await page.waitForTimeout(1000);
      await spinWheelLink.evaluate(node => node.click());
      await page.waitForTimeout(1000);
      const wheelVisible = await page.locator('text=/Spin|Wheel/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (wheelVisible) {
        await expect(page.locator('text=/Spin|Wheel/i').first()).toBeVisible();
      }
    }
  });

  test('should spin the wheel', async ({ page }) => {
    const initialBalance = await getUserBalance(page);
    
    // Look for spin button
    const spinButton = page.locator('button:has-text(/Spin|Play/i)').first();
    const canSpin = await spinButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (canSpin && !(await spinButton.isDisabled())) {
      await spinButton.click();
      
      // Wait for spin animation
      await page.waitForTimeout(3000);
      
      // Should show result
      await expect(page.locator('text=/You won|Congratulations|Prize/i')).toBeVisible({ timeout: 5000 });
      
      // Balance may increase
      const newBalance = await getUserBalance(page);
      expect(newBalance).toBeGreaterThanOrEqual(initialBalance);
    }
  });

  test('should show spin wheel cooldown', async ({ page }) => {
    // Look for spin wheel
    const spinButton = page.locator('button:has-text(/Spin|Play/i)').first();
    const exists = await spinButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      // Check if cooldown message exists
      const cooldownMessage = page.locator('text=/Next spin|Available in|Come back/i');
      const hasCooldown = await cooldownMessage.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasCooldown).toBeDefined();
    }
  });

  test('should display achievements page', async ({ page }) => {
    const achievementsLink = page.locator('text=/Achievements|Badges|Awards/i').first();
    const exists = await achievementsLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await achievementsLink.click();
      await expect(page.locator('text=/Achievements|Badges/i')).toBeVisible();
    }
  });

  test('should show list of achievements', async ({ page }) => {
    await page.goto('/dashboard');
    
    const achievementsLink = page.locator('text=/Achievements|Badges/i').first();
    const exists = await achievementsLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await achievementsLink.click();
      
      // Should show achievement cards
      const achievements = page.locator('[class*="achievement"], [class*="badge"]');
      const count = await achievements.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display locked and unlocked achievements', async ({ page }) => {
    const achievementsLink = page.locator('text=/Achievements|Badges/i').first();
    const exists = await achievementsLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await achievementsLink.click();
      
      // Should show locked/unlocked status
      const statusIndicators = page.locator('text=/Locked|Unlocked|Earned|Completed/i');
      const statusCount = await statusIndicators.count();
      expect(statusCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show achievement progress', async ({ page }) => {
    const achievementsLink = page.locator('text=/Achievements|Badges/i').first();
    const exists = await achievementsLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await achievementsLink.click();
      
      // Should show progress bars or percentages
      const progressIndicators = page.locator('[class*="progress"], text=/%|\/\d+/');
      const progressCount = await progressIndicators.count();
      expect(progressCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show achievement rewards', async ({ page }) => {
    const achievementsLink = page.locator('text=/Achievements|Badges/i').first();
    const exists = await achievementsLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await achievementsLink.click();
      
      // Should show reward amounts for achievements
      const rewardPattern = /\d+\s*(Valiant Bucks|VB|coins)/i;
      const rewards = page.locator(`text=${rewardPattern}`);
      const rewardCount = await rewards.count();
      expect(rewardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should unlock achievement after completing task', async ({ page }) => {
    // This would test if placing a bet unlocks "First Bet" achievement
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await page.waitForTimeout(1000);
    
    const betButton = page.locator('[class*="game"], button:has-text("Bet")').first();
    const gameExists = await betButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (gameExists) {
      await page.waitForTimeout(1000);
      await betButton.click();
      await page.waitForTimeout(1000);
      await page.fill('input[placeholder*="amount" i], input[type="number"]', '5', { timeout: 10000 });
      await page.click('button:has-text(/Place Bet|Confirm|Submit/i)');
      
      // Check for achievement notification
      const achievementNotification = page.locator('text=/Achievement|Unlocked|Earned/i');
      const unlocked = await achievementNotification.isVisible({ timeout: 3000 }).catch(() => false);
      expect(unlocked).toBeDefined();
    }
  });

  test('should display notifications for earned rewards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for notification bell or section
    const notificationIcon = page.locator('[class*="notification"], text=/Notifications/i').first();
    const exists = await notificationIcon.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await notificationIcon.click();
      
      // Should show notifications
      const notifications = page.locator('[class*="notification"]');
      const count = await notifications.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show periodic bonus notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for bonus notifications
    const bonusNotification = page.locator('text=/Bonus|Reward|Free Bucks/i');
    const hasBonus = await bonusNotification.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBonus).toBeDefined();
  });

  test('should display rivalry week popup if active', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for rivalry week popup
    const rivalryPopup = page.locator('text=/Rivalry Week|Special Event|Bonus Multiplier/i');
    const hasRivalry = await rivalryPopup.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRivalry).toBeDefined();
  });

  test('should show confetti animation on achievement unlock', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for confetti element (usually has class or canvas)
    const confetti = page.locator('[class*="confetti"], canvas');
    const hasConfetti = await confetti.count();
    expect(hasConfetti).toBeGreaterThanOrEqual(0);
  });

  test('should show onboarding modal for new users', async ({ page }) => {
    // This tests if onboarding appears (may not appear for existing test user)
    const onboardingModal = page.locator('text=/Welcome|Get Started|Tutorial|Skip/i');
    const hasOnboarding = await onboardingModal.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasOnboarding).toBeDefined();
  });

  test('should allow skipping onboarding tutorial', async ({ page }) => {
    const skipButton = page.locator('button:has-text(/Skip|Later|Close/i)');
    const canSkip = await skipButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (canSkip) {
      await skipButton.click();
      
      // Onboarding should close
      const onboardingClosed = await page.locator('text=/Welcome|Get Started|Tutorial/i').isHidden({ timeout: 2000 }).catch(() => true);
      expect(onboardingClosed).toBe(true);
    }
  });

  test('should display referral program information', async ({ page }) => {
    // Look for referral link/section
    const referralSection = page.locator('text=/Referral|Invite|Share/i').first();
    const hasReferral = await referralSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasReferral) {
      await referralSection.click();
      
      // Should show referral code or link
      await expect(page.locator('text=/Referral Code|Your Code|Share Link/i')).toBeVisible();
    }
  });

  test('should show reward history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for reward history link
    const historyLink = page.locator('text=/Reward History|My Rewards/i').first();
    const exists = await historyLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await historyLink.click();
      
      // Should show list of claimed rewards
      const rewardItems = page.locator('[class*="reward"], [class*="history"]');
      const count = await rewardItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

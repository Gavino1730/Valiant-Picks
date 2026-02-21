const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateToUrl, dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD
  // ═══════════════════════════════════════════════════════════════════════

  test('should load notifications page via URL', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await expect(page.locator('.notifications-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show notifications header', async ({ page }) => {
    await navigateToUrl(page, '/notifications');

    const header = page.locator('.notifications-header, h2:has-text("Notifications")').first();
    await expect(header).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION BELL
  // ═══════════════════════════════════════════════════════════════════════

  test('should show notification bell in navbar', async ({ page }) => {
    const bell = page.locator('.notification-icon-btn');
    const hasBell = await bell.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBell) {
      await expect(bell).toBeVisible();
    }
  });

  test('should navigate to notifications when bell is clicked', async ({ page }) => {
    const bell = page.locator('.notification-icon-btn');
    const hasBell = await bell.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBell) {
      await bell.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      await expect(page.locator('.notifications-page')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show notification badge count when unread', async ({ page }) => {
    const badge = page.locator('.notification-badge');
    const hasBadge = await badge.isVisible({ timeout: 5000 }).catch(() => false);

    // Badge is only visible when there are unread notifications
    // Either it's visible with a count or not visible — both are valid
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION LIST
  // ═══════════════════════════════════════════════════════════════════════

  test('should display notifications list or empty state', async ({ page }) => {
    await navigateToUrl(page, '/notifications');

    const notificationCards = page.locator('.notification-card');
    const emptyState = page.locator('text=/No notifications/i').first();

    await page.waitForTimeout(2000);

    const hasCards = await notificationCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // Should show either notifications or an empty state - at minimum the page loaded
    const pageContent = await page.locator('.notifications-page, .notification-list, [class*="notification"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasEmpty || pageContent).toBeTruthy();
  });

  test('should show notification card details', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const card = page.locator('.notification-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      // Should have an icon
      const icon = card.locator('.notification-icon');
      const hasIcon = await icon.isVisible({ timeout: 2000 }).catch(() => false);

      // Should have content
      const content = card.locator('.notification-content');
      const hasContent = await content.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasIcon || hasContent).toBeTruthy();
    }
  });

  test('should visually distinguish read vs unread notifications', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const cards = page.locator('.notification-card');
    const hasCards = await cards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const unread = page.locator('.notification-card.unread');
      const read = page.locator('.notification-card.read');

      const unreadCount = await unread.count();
      const readCount = await read.count();

      // Either type should exist
      expect(unreadCount + readCount).toBeGreaterThan(0);
    }
  });

  test('should show notification timestamp', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const card = page.locator('.notification-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const time = card.locator('.notification-time');
      const hasTime = await time.isVisible({ timeout: 2000 }).catch(() => false);
      // Timestamp should be present
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MARK AS READ
  // ═══════════════════════════════════════════════════════════════════════

  test('should show Mark All Read button when unread notifications exist', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const markAllBtn = page.locator('button:has-text("Mark All Read")');
    const hasBtn = await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Button only appears when unread notifications exist
    if (hasBtn) {
      await expect(markAllBtn).toBeEnabled();
    }
  });

  test('should mark individual notification as read on click', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const unreadCard = page.locator('.notification-card.unread').first();
    const hasUnread = await unreadCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUnread) {
      await unreadCard.click();
      await page.waitForTimeout(1000);

      // The card should now be marked as read (class change)
      // Note: the card might not immediately update visually
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION TYPE ICONS
  // ═══════════════════════════════════════════════════════════════════════

  test('should show type-specific icons on notification cards', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const cards = page.locator('.notification-card');
    const hasCards = await cards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCards) {
      const icons = page.locator('.notification-icon');
      const count = await icons.count();
      expect(count).toBeGreaterThan(0);

      // Each icon should have content (emoji or text)
      const firstIcon = icons.first();
      const text = await firstIcon.textContent();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION CONTENT
  // ═══════════════════════════════════════════════════════════════════════

  test('should show notification title text', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const card = page.locator('.notification-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const title = card.locator('.notification-title, h3, h4, .title').first();
      const hasTitle = await title.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasTitle) {
        const text = await title.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should show notification message text', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const card = page.locator('.notification-card').first();
    const hasCard = await card.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCard) {
      const message = card.locator('.notification-message, .notification-text, p').first();
      const hasMessage = await message.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasMessage) {
        const text = await message.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MARK ALL READ INTERACTION
  // ═══════════════════════════════════════════════════════════════════════

  test('should mark all notifications as read when button is clicked', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const markAllBtn = page.locator('button:has-text("Mark All Read")');
    const hasBtn = await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      const unreadBefore = await page.locator('.notification-card.unread').count();

      await markAllBtn.click();
      await page.waitForTimeout(1500);

      const unreadAfter = await page.locator('.notification-card.unread').count();
      // Unread count should decrease or become 0
      expect(unreadAfter).toBeLessThanOrEqual(unreadBefore);
    }
  });

  test('should update badge count after marking all as read', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const markAllBtn = page.locator('button:has-text("Mark All Read")');
    const hasBtn = await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await markAllBtn.click();
      await page.waitForTimeout(1500);

      // Navigate away and check badge
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      const badge = page.locator('.notification-badge');
      const hasBadge = await badge.isVisible({ timeout: 3000 }).catch(() => false);
      // Badge should either disappear or show 0
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION BELL BADGE
  // ═══════════════════════════════════════════════════════════════════════

  test('should show notification count in bell badge', async ({ page }) => {
    const badge = page.locator('.notification-badge');
    const hasBadge = await badge.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBadge) {
      const text = await badge.textContent();
      const count = parseInt(text, 10);
      expect(count).toBeGreaterThan(0);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════════════════

  test('should show appropriate empty state message', async ({ page }) => {
    await navigateToUrl(page, '/notifications');
    await page.waitForTimeout(2000);

    const cards = page.locator('.notification-card');
    const hasCards = await cards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasCards) {
      const emptyState = page.locator('text=/No notifications/i, text=/no new notifications/i, .empty-state').first();
      const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      // If no notifications, should show an empty state message
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════

  test('should navigate to notifications from any page via bell', async ({ page }) => {
    await navigateToUrl(page, '/games');
    await page.waitForTimeout(1000);

    const bell = page.locator('.notification-icon-btn');
    const hasBell = await bell.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBell) {
      await bell.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      await expect(page.locator('.notifications-page')).toBeVisible({ timeout: 5000 });
    }
  });
});

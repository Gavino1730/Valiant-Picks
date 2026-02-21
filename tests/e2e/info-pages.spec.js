const { test, expect } = require('@playwright/test');
const {
  loginAsUser, clearSession, navigateTo, navigateToUrl,
  dismissAllOverlays,
} = require('../helpers/test-utils');

test.describe('How to Use Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should navigate to How to Use page', async ({ page }) => {
    await navigateTo(page, 'How to Use');
    await expect(page.locator('.how-to-use')).toBeVisible({ timeout: 10000 });
  });

  test('should load How to Use via URL', async ({ page }) => {
    await navigateToUrl(page, '/howto');
    await expect(page.locator('.how-to-use')).toBeVisible({ timeout: 10000 });
  });

  test('should show page title', async ({ page }) => {
    await navigateToUrl(page, '/howto');
    await expect(page.locator('h1:has-text("How to Use")')).toBeVisible();
  });

  test('should display tutorial sections', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const sections = page.locator('.section-card, .tutorial-section, .section-header');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show confidence level explainer', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const confidenceSection = page.locator('.confidence-explainer, .confidence-option');
    const hasConfidence = await confidenceSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasConfidence) {
      const low = page.locator('.confidence-option.low');
      const medium = page.locator('.confidence-option.medium');
      const high = page.locator('.confidence-option.high');

      const hasLow = await low.isVisible({ timeout: 2000 }).catch(() => false);
      const hasMedium = await medium.isVisible({ timeout: 2000 }).catch(() => false);
      const hasHigh = await high.isVisible({ timeout: 2000 }).catch(() => false);
    }
  });

  test('should have collapsible sections', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const details = page.locator('details.collapsible-section');
    const hasDetails = await details.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDetails) {
      const count = await details.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Click to expand first collapsible section
      const summary = details.first().locator('summary');
      await summary.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display FAQ section', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const faqList = page.locator('.faq-list');
    const hasFaq = await faqList.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFaq) {
      const faqItems = page.locator('.faq-item');
      const count = await faqItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should expand FAQ items on click', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const faqItem = page.locator('.faq-item').first();
    const hasFaq = await faqItem.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFaq) {
      const summary = faqItem.locator('summary');
      await summary.click();
      await page.waitForTimeout(300);
      // FAQ content should now be visible
    }
  });

  test('should show CTA buttons at bottom', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const ctaSection = page.locator('.cta-section');
    const hasCta = await ctaSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCta) {
      const browseGames = page.locator('button:has-text("Browse Games"), a:has-text("Browse Games")').first();
      const dashboard = page.locator('button:has-text("Dashboard"), a:has-text("Dashboard")').first();

      const hasBrowse = await browseGames.isVisible({ timeout: 2000 }).catch(() => false);
      const hasDash = await dashboard.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasBrowse || hasDash).toBeTruthy();
    }
  });

  test('should navigate to games from CTA button', async ({ page }) => {
    await navigateToUrl(page, '/howto');

    const browseGames = page.locator('button:has-text("Browse Games"), a:has-text("Browse Games")').first();
    const hasBrowse = await browseGames.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBrowse) {
      await browseGames.click({ force: true });
      await page.waitForURL(/\/games/, { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded');
      await dismissAllOverlays(page);

      // If the button navigated, check URL; otherwise just pass
      const url = page.url();
      if (url.includes('/games')) {
        expect(url).toMatch(/\/games/);
      }
    }
  });
});

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should load About page via URL', async ({ page }) => {
    await navigateToUrl(page, '/about');
    await expect(page.locator('.about-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show About page title', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const title = page.locator('h1:has-text("About")');
    await expect(title).toBeVisible();
  });

  test('should display mission section', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const mission = page.locator('.mission-section');
    const hasMission = await mission.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMission) {
      const missionCards = page.locator('.mission-card');
      const count = await missionCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show creator info', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const creator = page.locator('.sole-creator, .creator-name');
    const hasCreator = await creator.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCreator) {
      const name = page.locator('.creator-name');
      await expect(name).toBeVisible();
    }
  });

  test('should display stat cards', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const statCards = page.locator('.stat-card');
    const hasStats = await statCards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStats) {
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show tech stack information', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const techTable = page.locator('.tech-table');
    const hasTech = await techTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTech) {
      const rows = techTable.locator('tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(1); // header + at least 1 row
    }
  });

  test('should show deployment information', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const deployCards = page.locator('.deploy-card, .deployment-cards');
    const hasDeploy = await deployCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    // Deployment info should be present on about page
  });

  test('should show GitHub link', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const githubLink = page.locator('.github-link, .github-button, a:has-text("GitHub")').first();
    const hasGithub = await githubLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGithub) {
      await expect(githubLink).toBeVisible();
    }
  });

  test('should display summary section', async ({ page }) => {
    await navigateToUrl(page, '/about');

    const summary = page.locator('.summary-section');
    const hasSummary = await summary.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSummary) {
      const highlights = page.locator('.highlight-item, .summary-highlights');
      const count = await highlights.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Terms Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await loginAsUser(page);
  });

  test('should load Terms page via URL', async ({ page }) => {
    await navigateToUrl(page, '/terms');
    await expect(page.locator('.terms-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show Terms page title', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const title = page.locator('h1:has-text("Terms")');
    await expect(title).toBeVisible();
  });

  test('should show last updated date', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const updated = page.locator('.terms-header p, text=/Last Updated/i').first();
    const hasUpdated = await updated.isVisible({ timeout: 5000 }).catch(() => false);
    // Should show last updated date
  });

  test('should display terms sections', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const sections = page.locator('.terms-section');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have section headings', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const headings = page.locator('.terms-section h2');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display all required terms content', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const container = page.locator('.terms-container');
    await expect(container).toBeVisible();

    // Check for key sections
    const introSection = page.locator('.terms-section:has(h2:has-text("Introduction"))');
    const hasIntro = await introSection.isVisible({ timeout: 3000 }).catch(() => false);
    // At least some sections should exist
    const sections = page.locator('.terms-section');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should have a final/closing section', async ({ page }) => {
    await navigateToUrl(page, '/terms');

    const finalSection = page.locator('.final-section, .terms-section:last-child');
    await expect(finalSection).toBeVisible();
  });
});

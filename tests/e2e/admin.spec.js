const { test, expect } = require('@playwright/test');
const {
  loginAsAdmin, loginAsUser, clearSession, navigateToUrl,
  dismissAllOverlays, checkAdminAccess, navigateToAdminTab,
} = require('../helpers/test-utils');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Click an admin tab by matching text; tries desktop and mobile pill selectors. */
async function clickAdminTab(page, labelPattern) {
  const tab = page.locator(
    `button:has-text("${labelPattern}"), .admin-tab:has-text("${labelPattern}"), .admin-mobile-pill:has-text("${labelPattern}")`
  ).first();
  const hasTab = await tab.isVisible({ timeout: 5000 }).catch(() => false);
  if (hasTab) {
    await tab.click({ force: true });
    await page.waitForTimeout(600);
  }
  return hasTab;
}

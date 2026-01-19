const { expect } = require('@playwright/test');

/**
 * Login helper function
 */
async function login(page, email, password) {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  
  // Check if already on login page or need to click login
  const usernameInput = page.locator('input[name="username"]');
  const isLoginPage = await usernameInput.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (!isLoginPage) {
    // Not on login page, click login button
    await page.click('text=Login');
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
  }
  
  // Map email to username
  const username = email.includes('admin') ? 'testadmin' : 'testuser';
  
  // Fill in credentials
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (dashboard or home page)
  await page.waitForURL(/\/(dashboard)?/, { timeout: 15000 });
  
  // Dismiss onboarding modal if present
  const skipButton = page.locator('button:has-text(/Skip|Close|Got it/i)').first();
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
  
  // Verify we're logged in (check for logout button - use .first() to avoid strict mode)
  await expect(page.locator('button.logout-btn').first()).toBeVisible({ timeout: 5000 });
}

/**
 * Logout helper function
 */
async function logout(page) {
  // Look for logout button/link
  const logoutButton = page.locator('text=Logout').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/', { timeout: 5000 });
  }
}

/**
 * Register a new user
 */
async function register(page, username, email, password) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Check if already on login page
  const usernameInput = page.locator('input[name="username"]');
  const isLoginPage = await usernameInput.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (!isLoginPage) {
    await page.click('text=Login');
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
  }
  
  // Click to switch to register mode
  const registerLink = page.locator('text=/Create Account|Sign Up|Register/i, button:has-text(/Create Account|Sign Up|Register/i)').first();
  if (await registerLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await registerLink.click();
    await page.waitForTimeout(500);
  }
  
  // Fill registration form using name attributes
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success
  await page.waitForURL(/\/(dashboard)?/, { timeout: 15000 });
}

/**
 * Get user balance from UI
 */
async function getUserBalance(page) {
  const balanceText = await page.locator('text=/Balance:|Valiant Bucks/i').first().textContent();
  const match = balanceText.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
}

/**
 * Wait for API response
 */
async function waitForAPI(page, urlPattern) {
  return page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Navigate to a specific page
 */
async function navigateTo(page, linkText) {
  await page.click(`text=${linkText}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Check for error messages
 */
async function expectNoErrors(page) {
  const errorSelectors = [
    '.error',
    '.error-message',
    '[class*="error"]',
    'text=/error|failed|wrong/i'
  ];
  
  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector).first();
    if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
      const errorText = await errorElement.textContent();
      throw new Error(`Unexpected error found: ${errorText}`);
    }
  }
}

/**
 * Generate unique test data
 */
function generateTestData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@valiantpicks.com`,
    password: `TestPass${timestamp}!`,
  };
}

/**
 * Wait for element to be visible
 */
async function waitForElement(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if user is admin
 */
async function isAdmin(page) {
  // Navigate to admin panel and check if accessible
  await page.goto('/admin');
  const adminPanelVisible = await page.locator('text=/Admin Panel|Manage Games/i').isVisible({ timeout: 3000 }).catch(() => false);
  return adminPanelVisible;
}

/**
 * Place a bet on a game
 */
async function placeBet(page, gameSelector, betType, amount, confidence = 'medium') {
  // Click on the game
  await page.click(gameSelector);
  
  // Select bet type (moneyline, spread, over/under)
  await page.click(`text=${betType}`);
  
  // Enter amount
  await page.fill('input[placeholder*="amount" i]', amount.toString());
  
  // Select confidence level
  await page.click(`text=${confidence}`);
  
  // Confirm bet
  await page.click('button:has-text("Place Bet")');
  
  // Wait for confirmation
  await expect(page.locator('text=/Bet Placed|Success/i')).toBeVisible({ timeout: 5000 });
}

/**
 * Clear all cookies and storage
 */
async function clearSession(page) {
  await page.context().clearCookies();
  
  // Only clear storage if we're on a valid page
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore - no page loaded yet, nothing to clear
  }
}

module.exports = {
  login,
  logout,
  register,
  getUserBalance,
  waitForAPI,
  navigateTo,
  expectNoErrors,
  generateTestData,
  waitForElement,
  isAdmin,
  placeBet,
  clearSession,
};

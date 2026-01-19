const { expect } = require('@playwright/test');

/**
 * Login helper function
 */
async function login(page, email, password) {
  await page.goto('/');
  
  // Wait for and click login button
  await page.click('text=Login');
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Login")');
  
  // Wait for successful login (dashboard or home page)
  await page.waitForURL(/\/(dashboard)?/, { timeout: 10000 });
  
  // Verify we're logged in (check for logout button or user menu)
  await expect(page.locator('text=/Logout|Dashboard/i')).toBeVisible({ timeout: 5000 });
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
  await page.click('text=Login');
  
  // Look for register/sign up link
  const registerLink = page.locator('text=/Register|Sign Up/i').first();
  if (await registerLink.isVisible()) {
    await registerLink.click();
  }
  
  // Fill registration form
  await page.fill('input[placeholder*="username" i]', username);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]:has-text(/Register|Sign Up/i)');
  
  // Wait for success
  await page.waitForURL(/\/(dashboard)?/, { timeout: 10000 });
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
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
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

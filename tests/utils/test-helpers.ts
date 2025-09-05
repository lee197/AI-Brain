/**
 * Common test utilities and helpers for AI Brain E2E tests
 */
import { Page, expect } from '@playwright/test'

/**
 * Test configuration constants
 */
export const TEST_CONFIG = {
  // Test accounts
  DEMO_USER: {
    email: 'leeqii197@gmail.com',
    password: 'Liqi624473@'
  },
  ADMIN_USER: {
    email: 'admin@aibrain.com', 
    password: 'admin123'
  },
  
  // Test workspace
  TEST_WORKSPACE_ID: 'e7c5aa1e-de00-4327-81dd-cfeba3030081',
  
  // Timeouts
  TIMEOUTS: {
    SHORT: 2000,
    MEDIUM: 5000,
    LONG: 10000,
    EXTRA_LONG: 30000
  }
} as const

/**
 * Common page object patterns and helpers
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be ready (no loading indicators)
   */
  async waitForPageReady() {
    await this.page.waitForSelector('body', { state: 'visible' })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Login with test user
   */
  async loginAsUser(credentials = TEST_CONFIG.DEMO_USER) {
    await this.page.goto('/login')
    await this.waitForPageReady()
    
    await this.page.fill('input[type="email"]', credentials.email)
    await this.page.fill('input[type="password"]', credentials.password)
    await this.page.click('button[type="submit"]')
    
    // Wait for successful login (redirect away from login page)
    await this.page.waitForURL(/\/(contexts|dashboard|home|\/)/, { timeout: TEST_CONFIG.TIMEOUTS.LONG })
    await this.waitForPageReady()
  }

  /**
   * Navigate to test workspace
   */
  async goToTestWorkspace() {
    await this.page.goto(`/contexts/${TEST_CONFIG.TEST_WORKSPACE_ID}`)
    await this.waitForPageReady()
  }

  /**
   * Find elements with multiple selector strategies
   */
  async findElement(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector)
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        return element
      }
    }
    return null
  }

  /**
   * Wait for any of multiple elements to be visible
   */
  async waitForAnyElement(selectors: string[], timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    const promises = selectors.map(selector => 
      this.page.locator(selector).waitFor({ state: 'visible', timeout }).catch(() => null)
    )
    
    const results = await Promise.allSettled(promises)
    const successIndex = results.findIndex(result => result.status === 'fulfilled' && result.value !== null)
    
    if (successIndex === -1) {
      throw new Error(`None of the elements were found: ${selectors.join(', ')}`)
    }
    
    return this.page.locator(selectors[successIndex])
  }

  /**
   * Check if user is authenticated (not on login page)
   */
  async isAuthenticated() {
    const currentUrl = this.page.url()
    return !currentUrl.includes('/login') && !currentUrl.includes('/signup')
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    })
  }

  /**
   * Fill form field with better error handling
   */
  async fillField(selector: string, value: string, timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    const field = this.page.locator(selector)
    await field.waitFor({ state: 'visible', timeout })
    await field.fill(value)
    
    // Verify the value was set
    const actualValue = await field.inputValue()
    if (actualValue !== value) {
      throw new Error(`Failed to fill field ${selector}. Expected: "${value}", Actual: "${actualValue}"`)
    }
  }

  /**
   * Click button with retry logic
   */
  async clickButton(selector: string, timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    const button = this.page.locator(selector)
    await button.waitFor({ state: 'visible', timeout })
    
    // Ensure button is enabled
    await expect(button).not.toBeDisabled()
    
    await button.click()
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.animate-spin',
      'text=Loading...',
      'text=加载中...'
    ]
    
    for (const selector of loadingSelectors) {
      await this.page.locator(selector).waitFor({ state: 'hidden' }).catch(() => {
        // Ignore if selector not found
      })
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  static generateUniqueId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static generateTestEmail() {
    return `test_${this.generateUniqueId()}@example.com`
  }

  static generateWorkspaceName() {
    return `测试工作空间_${this.generateUniqueId()}`
  }

  static generateTestMessage() {
    return `这是一条测试消息 ${this.generateUniqueId()}`
  }
}

/**
 * Assertion helpers
 */
export class TestAssertions {
  static async shouldBeVisible(page: Page, selector: string, timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    await expect(page.locator(selector)).toBeVisible({ timeout })
  }

  static async shouldContainText(page: Page, selector: string, text: string | RegExp, timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    await expect(page.locator(selector)).toContainText(text, { timeout })
  }

  static async shouldBeEnabled(page: Page, selector: string, timeout = TEST_CONFIG.TIMEOUTS.MEDIUM) {
    const element = page.locator(selector)
    await element.waitFor({ state: 'visible', timeout })
    await expect(element).not.toBeDisabled()
  }

  static async shouldHaveURL(page: Page, pattern: string | RegExp, timeout = TEST_CONFIG.TIMEOUTS.LONG) {
    await expect(page).toHaveURL(pattern, { timeout })
  }
}

/**
 * Mock helpers
 */
export class MockHelpers {
  static async mockAPIResponse(page: Page, urlPattern: string, response: any) {
    await page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  }

  static async mockAPIError(page: Page, urlPattern: string, status = 500) {
    await page.route(urlPattern, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mocked error for testing' })
      })
    })
  }
}

/**
 * Export commonly used combinations
 */
export function createPageHelpers(page: Page) {
  return new PageHelpers(page)
}

export function createTestAssertions() {
  return TestAssertions
}

export { TestDataGenerator, MockHelpers }
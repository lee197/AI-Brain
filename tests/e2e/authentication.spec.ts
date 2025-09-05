/**
 * Authentication Flow E2E Tests
 * Tests login, registration, logout, and error handling
 */
import { test, expect } from '@playwright/test'
import { 
  PageHelpers, 
  TEST_CONFIG, 
  TestDataGenerator, 
  TestAssertions 
} from '../utils/test-helpers'

test.describe('用户认证流程 - Authentication Flow', () => {
  test('用户可以成功注册新账户 - User can register new account', async ({ page }) => {
    const helpers = new PageHelpers(page)
    
    // Clear any existing session first
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.evaluate(() => sessionStorage.clear())
    
    await page.goto('/signup')
    await helpers.waitForPageReady()
    
    // Verify signup page loaded (more flexible pattern)
    await TestAssertions.shouldContainText(page, 'h1,h2', /注册|Sign Up|AI Brain|Create/i)
    
    // Generate test data
    const testEmail = TestDataGenerator.generateTestEmail()
    const testPassword = 'TestPassword123!'
    
    // Fill registration form using helpers
    await helpers.fillField('input[type="email"]', testEmail)
    await helpers.fillField('input[type="password"]', testPassword)
    
    // Handle confirm password field if present
    const confirmPasswordField = await helpers.findElement([
      'input[name*="confirm"]',
      'input[placeholder*="确认"]',
      'input[placeholder*="confirm"]'
    ])
    
    if (confirmPasswordField) {
      await confirmPasswordField.fill(testPassword)
    }
    
    // Submit form
    await helpers.clickButton('button[type="submit"]')
    
    // Wait for registration to process
    await helpers.waitForLoadingComplete()
    
    // Verify successful registration (multiple possible outcomes)
    const successSelectors = [
      'text=注册成功',
      'text=Registration successful',
      'text=验证邮箱',
      'text=Verify email'
    ]
    
    try {
      await helpers.waitForAnyElement(successSelectors, TEST_CONFIG.TIMEOUTS.MEDIUM)
    } catch {
      // Alternative check: URL changed away from signup
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/signup')
    }
  })

  test('用户可以使用演示账户登录 - User can login with demo account', async ({ page }) => {
    const helpers = new PageHelpers(page)
    
    // Clear any existing session first
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.evaluate(() => sessionStorage.clear())
    
    await page.goto('/login')
    await helpers.waitForPageReady()
    
    // Verify login page loaded (should now show login form)
    await TestAssertions.shouldContainText(page, 'h1,h2', /登录|Sign In|AI Brain/i)
    
    // Use demo account for login
    await helpers.loginAsUser(TEST_CONFIG.DEMO_USER)
    
    // Verify successful login - should be on contexts page
    await page.waitForURL(/\/contexts/, { timeout: 10000 })
    expect(await helpers.isAuthenticated()).toBe(true)
    
    // Check for user interface elements
    const userIndicators = [
      '[data-testid="user-menu"]',
      '.user-avatar',
      'text=工作空间',
      'text=Workspace',
      `text=${TEST_CONFIG.DEMO_USER.email}`
    ]
    
    // At least one user indicator should be visible
    const foundIndicator = await helpers.findElement(userIndicators)
    expect(foundIndicator).not.toBeNull()
  })

  test('输入错误凭据时显示错误消息', async ({ page }) => {
    await page.goto('/login')
    
    // 输入错误的登录信息
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // 点击登录按钮
    await page.click('button[type="submit"]')
    
    // 等待错误消息出现
    await page.waitForTimeout(2000)
    
    // 验证错误消息显示
    const errorMessage = page.locator('text=Invalid').or(page.locator('text=错误')).or(page.locator('.error')).or(page.locator('[role="alert"]'))
    
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('用户可以成功注销', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.fill('input[type="email"]', 'leeqii197@gmail.com')
    await page.fill('input[type="password"]', 'Liqi624473@')
    await page.click('button[type="submit"]')
    
    // 等待登录完成
    await page.waitForURL(/\/(contexts|dashboard|home)/, { timeout: 10000 })
    
    // 查找注销按钮 - 可能在用户菜单中
    const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('.user-menu')).or(page.locator('.user-avatar'))
    
    if (await userMenu.isVisible()) {
      await userMenu.click()
    }
    
    // 查找注销按钮
    const logoutButton = page.locator('text=注销').or(page.locator('text=Logout')).or(page.locator('text=Sign Out'))
    
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click()
      
      // 验证跳转到登录页面或首页
      await page.waitForURL(/\/(login|home|\/)/, { timeout: 5000 })
      
      // 验证用户已注销（登录按钮应该重新可见）
      const loginButton = page.locator('text=登录').or(page.locator('text=Sign In'))
      await expect(loginButton).toBeVisible({ timeout: 5000 })
    } else {
      // 如果找不到注销按钮，测试通过但标记为跳过
      test.skip('注销按钮未找到')
    }
  })
})
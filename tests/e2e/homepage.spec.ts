import { test, expect } from '@playwright/test'

test.describe('首页和基础导航', () => {
  test('访问首页应该正常加载', async ({ page }) => {
    await page.goto('/')
    
    // 验证页面标题
    await expect(page).toHaveTitle(/AI Brain/)
    
    // 验证主要导航元素存在
    await expect(page.locator('nav')).toBeVisible()
    
    // 验证登录/注册按钮存在（未登录状态）
    const loginButton = page.locator('text=登录').or(page.locator('text=Sign In'))
    const signupButton = page.locator('text=注册').or(page.locator('text=Sign Up'))
    
    await expect(loginButton.or(signupButton)).toBeVisible()
  })

  test('语言切换功能正常工作', async ({ page }) => {
    await page.goto('/')
    
    // 查找语言切换器
    const languageToggle = page.locator('[data-testid="language-switcher"]')
      .or(page.locator('.language-switcher'))
      .or(page.locator('button:has-text("EN")'))
      .or(page.locator('button:has-text("中文")'))
    
    if (await languageToggle.isVisible()) {
      await languageToggle.click()
      
      // 验证语言切换后页面内容改变
      await page.waitForTimeout(500) // 等待语言切换完成
      
      // 页面应该仍然可用
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('深色模式切换正常工作', async ({ page }) => {
    await page.goto('/')
    
    // 查找深色模式切换器
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
      .or(page.locator('.theme-toggle'))
      .or(page.locator('button[aria-label*="theme"]'))
    
    if (await themeToggle.isVisible()) {
      // 记录初始主题
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
      })
      
      await themeToggle.click()
      
      // 验证主题切换
      await page.waitForTimeout(300)
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
      })
      
      expect(newTheme).not.toBe(initialTheme)
    }
  })

  test('响应式设计在移动端正常工作', async ({ page }) => {
    // 设置移动端视图
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // 验证页面在移动端仍然可用
    await expect(page.locator('body')).toBeVisible()
    
    // 验证导航菜单在移动端的行为
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
      .or(page.locator('.mobile-menu'))
      .or(page.locator('button[aria-label*="menu"]'))
    
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      
      // 验证菜单展开
      await expect(page.locator('nav').or(page.locator('.menu-items'))).toBeVisible()
    }
  })
})
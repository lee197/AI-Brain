import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // 访问登录页面
  await page.goto('/login')

  // 使用演示账户登录
  await page.fill('input[type="email"]', 'demo@aibrain.com')
  await page.fill('input[type="password"]', 'demo123')
  await page.click('button[type="submit"]')

  // 等待登录成功并跳转到首页或工作空间页面
  await page.waitForURL(/\/(contexts|dashboard|home)/)
  
  // 验证登录成功的标识，例如用户头像或菜单
  await expect(page.locator('[data-testid="user-menu"]').or(page.locator('.user-avatar'))).toBeVisible()

  // 保存认证状态
  await page.context().storageState({ path: authFile })
})
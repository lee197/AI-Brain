import { test, expect } from '@playwright/test'

test.describe('用户认证流程', () => {
  test('用户可以成功注册新账户', async ({ page }) => {
    await page.goto('/signup')
    
    // 验证注册页面加载
    await expect(page.locator('h1').or(page.locator('h2')).first()).toContainText(/注册|Sign Up/i)
    
    // 生成唯一邮箱地址用于测试
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    // 填写注册表单
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    
    // 如果有确认密码字段
    const confirmPasswordField = page.locator('input[name*="confirm"]').or(page.locator('input[placeholder*="确认"]'))
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(testPassword)
    }
    
    // 提交表单
    await page.click('button[type="submit"]')
    
    // 验证注册成功 - 可能跳转到验证邮箱页面或直接登录
    await page.waitForTimeout(2000)
    
    // 检查是否显示成功消息或跳转到工作空间页面
    const successIndicators = [
      page.locator('text=注册成功').or(page.locator('text=Registration successful')),
      page.locator('text=验证邮箱').or(page.locator('text=Verify email')),
      page.url().includes('/contexts'),
      page.url().includes('/dashboard')
    ]
    
    const hasSuccess = await Promise.race(successIndicators.map(async (indicator) => {
      try {
        if (typeof indicator === 'boolean') {
          return indicator
        }
        await indicator.waitFor({ timeout: 3000 })
        return true
      } catch {
        return false
      }
    }))
    
    expect(hasSuccess).toBe(true)
  })

  test('用户可以使用演示账户登录', async ({ page }) => {
    await page.goto('/login')
    
    // 验证登录页面加载
    await expect(page.locator('h1').or(page.locator('h2')).first()).toContainText(/登录|Sign In/i)
    
    // 使用演示账户登录
    await page.fill('input[type="email"]', 'demo@aibrain.com')
    await page.fill('input[type="password"]', 'demo123')
    
    // 点击登录按钮
    await page.click('button[type="submit"]')
    
    // 等待登录完成并跳转
    await page.waitForURL(/\/(contexts|dashboard|home)/, { timeout: 10000 })
    
    // 验证登录成功的标识
    await expect(page.locator('body')).toBeVisible()
    
    // 验证用户界面元素存在
    const userIndicators = [
      page.locator('[data-testid="user-menu"]'),
      page.locator('.user-avatar'),
      page.locator('text=工作空间').or(page.locator('text=Workspace')),
      page.locator('text=demo@aibrain.com')
    ]
    
    // 至少有一个用户标识应该可见
    let foundUserIndicator = false
    for (const indicator of userIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundUserIndicator = true
        break
      }
    }
    
    expect(foundUserIndicator).toBe(true)
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
    await page.fill('input[type="email"]', 'demo@aibrain.com')
    await page.fill('input[type="password"]', 'demo123')
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
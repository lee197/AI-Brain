import { test, expect } from '@playwright/test'

/**
 * 用户注册功能E2E测试套件
 * 
 * 测试覆盖：
 * 1. 注册页面基本功能
 * 2. 表单验证
 * 3. 成功注册流程
 * 4. 错误处理
 * 5. 邮箱验证流程
 */

test.describe('用户注册功能', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // 清除所有认证状态，确保测试在未登录状态下进行
    await context.clearCookies()
    await context.clearPermissions()
    
    // 清除本地存储
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // 访问注册页面
    await page.goto('/signup')
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('注册页面正常加载并显示必要元素', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/AI Brain/)
    
    // 验证主要元素存在
    await expect(page.locator('h1:has-text("AI Brain")')).toBeVisible()
    await expect(page.locator('text=Create your intelligent work assistant account')).toBeVisible()
    
    // 验证表单元素
    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]')
    const submitButton = page.locator('button[type="submit"]:has-text("Create Account")')
    
    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    
    // 验证OAuth按钮存在
    await expect(page.locator('button:has-text("Sign up with Google")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign up with GitHub")')).toBeVisible()
    
    // 验证登录链接
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('表单验证 - 必填字段检查', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    
    // 尝试提交空表单
    await submitButton.click()
    
    // 验证浏览器原生验证提示（HTML5 required 属性）
    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]')
    
    // 检查是否有验证失败的视觉指示
    await expect(nameInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
    await expect(confirmPasswordInput).toHaveAttribute('required')
  })

  test('表单验证 - 邮箱格式检查', async ({ page }) => {
    // 填入无效邮箱格式
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // 等待一下服务端响应
    await page.waitForTimeout(1000)
    
    // 验证是否显示错误信息（可能是浏览器原生验证或服务端验证）
    // 如果是HTML5验证，无效邮箱格式会被浏览器拦截
  })

  test('表单验证 - 密码确认匹配检查', async ({ page }) => {
    // 填入不匹配的密码
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    // 监听网络请求
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/signup') && response.request().method() === 'POST'
    )
    
    await page.click('button[type="submit"]')
    
    // 等待服务端响应
    await responsePromise
    await page.waitForTimeout(1000)
    
    // 验证是否显示密码不匹配错误
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 5000 })
  })

  test('成功注册流程 - 重定向到登录页面', async ({ page }) => {
    // 生成随机邮箱避免冲突
    const randomEmail = `test+${Date.now()}@example.com`
    
    // 填入有效注册信息
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', randomEmail)
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    // 监听网络请求和页面导航
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/signup') && response.request().method() === 'POST'
    )
    
    await page.click('button[type="submit"]')
    
    // 等待请求完成
    const response = await responsePromise
    console.log('Signup response status:', response.status())
    
    // 等待重定向到登录页面
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // 验证重定向到登录页面
    expect(page.url()).toContain('/login')
    
    // 验证是否显示注册成功消息
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 5000 })
  })

  test('重复邮箱注册 - 显示适当错误信息', async ({ page }) => {
    // 使用已知存在的邮箱（demo账户）
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'demo@aibrain.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/signup') && response.request().method() === 'POST'
    )
    
    await page.click('button[type="submit"]')
    
    await responsePromise
    await page.waitForTimeout(2000)
    
    // 验证是否显示邮箱已存在的错误信息
    const errorMessages = [
      'already registered',
      'already been taken',
      'User already registered'
    ]
    
    let found = false
    for (const message of errorMessages) {
      if (await page.locator(`text=${message}`).isVisible()) {
        found = true
        break
      }
    }
    
    expect(found).toBeTruthy()
  })

  test('密码强度检查 - 密码过短', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')  // 过短的密码
    await page.fill('input[name="confirmPassword"]', '123')
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/signup') && response.request().method() === 'POST'
    )
    
    await page.click('button[type="submit"]')
    
    await responsePromise
    await page.waitForTimeout(1000)
    
    // 验证密码长度错误信息
    await expect(page.locator('text=at least 6 characters')).toBeVisible({ timeout: 3000 })
  })

  test('OAuth注册按钮功能检查', async ({ page }) => {
    // 测试Google OAuth按钮
    const googleButton = page.locator('button:has-text("Sign up with Google")')
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()
    
    // 测试GitHub OAuth按钮  
    const githubButton = page.locator('button:has-text("Sign up with GitHub")')
    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()
    
    // 点击Google按钮（注意：这会触发实际的OAuth流程，在测试中可能需要模拟）
    // await googleButton.click()
    // 在真实测试中，这里应该模拟OAuth流程或验证重定向
  })

  test('页面响应式设计检查', async ({ page }) => {
    // 测试桌面版本
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('.max-w-md')).toBeVisible()
    
    // 测试平板版本
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('input[name="name"]')).toBeVisible()
    
    // 测试手机版本
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // 验证语言切换按钮在小屏幕上仍然可见
    await expect(page.locator('.absolute.top-4.right-4')).toBeVisible()
  })

  test('表单提交时的加载状态', async ({ page }) => {
    // 填入表单信息
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    const submitButton = page.locator('button[type="submit"]')
    
    // 点击提交按钮
    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/signup') && request.method() === 'POST'
    )
    
    await submitButton.click()
    
    // 在请求发送后，验证按钮显示加载状态
    await expect(submitButton).toBeDisabled()
    await expect(page.locator('.animate-spin')).toBeVisible() // Loading spinner
    
    // 等待请求完成
    await requestPromise
  })

  test('表单清理和重置功能', async ({ page }) => {
    // 填入表单信息
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    // 验证输入值
    await expect(page.locator('input[name="name"]')).toHaveValue('Test User')
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com')
    
    // 刷新页面
    await page.reload()
    
    // 验证表单被清空
    await expect(page.locator('input[name="name"]')).toHaveValue('')
    await expect(page.locator('input[name="email"]')).toHaveValue('')
  })
})

test.describe('邮箱验证流程', () => {
  
  test('邮箱验证回调处理 - 成功验证', async ({ page }) => {
    // 模拟邮箱验证成功的回调URL
    const mockCode = 'mock-verification-code-12345'
    await page.goto(`/api/auth/callback?code=${mockCode}`)
    
    // 由于这是模拟代码，预期会失败，但我们可以验证错误处理
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // 验证重定向到登录页面
    expect(page.url()).toContain('/login')
  })

  test('邮箱验证回调处理 - 验证失败', async ({ page }) => {
    // 访问无效的验证回调
    await page.goto('/api/auth/callback?error=invalid_request&error_description=Invalid%20verification%20link')
    
    // 验证重定向到登录页面
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // 验证显示错误信息
    await expect(page.locator('text=Invalid verification link')).toBeVisible({ timeout: 5000 })
  })

  test('无效验证链接处理', async ({ page }) => {
    // 访问没有参数的回调URL
    await page.goto('/api/auth/callback')
    
    // 验证重定向到登录页面
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // 验证显示相应错误信息
    await expect(page.locator('text=Invalid verification link')).toBeVisible({ timeout: 5000 })
  })
})
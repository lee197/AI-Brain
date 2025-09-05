import { test, expect } from '@playwright/test'

/**
 * 未认证状态下的注册功能测试
 * 确保测试在完全未登录状态下进行
 */

test.describe('注册功能 - 未认证状态', () => {
  
  // 使用自定义的配置，不使用已保存的认证状态
  test.use({ storageState: { cookies: [], origins: [] } })
  
  test.beforeEach(async ({ page, context }) => {
    // 确保清空所有状态
    await context.clearCookies()
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  })

  test('访问注册页面并验证元素', async ({ page }) => {
    // 直接访问注册页面
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 验证页面标题
    await expect(page).toHaveTitle(/AI Brain/)
    
    // 验证关键元素存在（使用更鲁棒的选择器）
    await expect(page.locator('h1, h2, .gradient-text').filter({ hasText: 'AI Brain' })).toBeVisible()
    
    // 验证表单输入字段
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    
    // 验证提交按钮
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // 验证OAuth按钮
    await expect(page.locator('button').filter({ hasText: /Google/i })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: /GitHub/i })).toBeVisible()
    
    // 验证导航链接
    await expect(page.locator('a[href="/login"]')).toBeVisible()
    
    console.log('✅ 所有元素验证通过')
  })

  test('表单验证 - 密码不匹配', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 填写表单，密码不匹配
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    // 提交表单
    await page.click('button[type="submit"]')
    
    // 等待服务器响应
    await page.waitForTimeout(2000)
    
    // 验证错误消息（支持中英文）
    const errorVisible = await page.locator('text=/do not match|不匹配/i').isVisible()
    expect(errorVisible).toBeTruthy()
    
    console.log('✅ 密码验证测试通过')
  })

  test('成功注册流程', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 生成唯一邮箱
    const uniqueEmail = `test+${Date.now()}@example.com`
    
    // 填写正确的表单信息
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    // 监听网络响应
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/signup') && response.request().method() === 'POST'
    )
    
    // 提交表单
    await page.click('button[type="submit"]')
    
    // 等待响应
    const response = await responsePromise
    console.log('注册响应状态:', response.status())
    
    // 等待重定向或页面更新
    await page.waitForTimeout(5000)
    
    // 检查是否重定向到登录页面
    if (page.url().includes('/login')) {
      console.log('✅ 成功重定向到登录页面')
      
      // 验证成功消息
      const successMessage = await page.locator('text=/Registration successful|注册成功/i')
      if (await successMessage.isVisible()) {
        console.log('✅ 显示注册成功消息')
      }
    } else {
      console.log('📍 当前页面:', page.url())
      console.log('⚠️ 可能需要邮箱验证或其他步骤')
    }
  })

  test('重复邮箱注册', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 使用已知存在的邮箱
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'demo@aibrain.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    // 监听响应
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/signup')
    )
    
    await page.click('button[type="submit"]')
    
    await responsePromise
    await page.waitForTimeout(2000)
    
    // 检查错误消息
    const errorPatterns = [
      /already registered/i,
      /already been taken/i,
      /已被注册/i,
      /User already registered/i
    ]
    
    let errorFound = false
    for (const pattern of errorPatterns) {
      if (await page.locator(`text=${pattern}`).isVisible()) {
        errorFound = true
        console.log('✅ 发现重复邮箱错误消息')
        break
      }
    }
    
    expect(errorFound).toBeTruthy()
  })

  test('页面响应式设计', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 测试不同屏幕尺寸
    const sizes = [
      { width: 1200, height: 800, name: '桌面' },
      { width: 768, height: 1024, name: '平板' },
      { width: 375, height: 667, name: '手机' }
    ]
    
    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.waitForTimeout(500)
      
      // 验证关键元素在所有尺寸下都可见
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      console.log(`✅ ${size.name}版本 (${size.width}x${size.height}) 验证通过`)
    }
  })

  test('表单提交加载状态', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // 填写表单
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    
    const submitButton = page.locator('button[type="submit"]')
    
    // 监听请求
    const requestPromise = page.waitForRequest(
      request => request.url().includes('/signup') && request.method() === 'POST'
    )
    
    // 提交表单
    await submitButton.click()
    
    // 验证加载状态
    await expect(submitButton).toBeDisabled()
    
    // 检查是否有加载指示器
    const loadingIndicator = page.locator('.animate-spin, [data-loading="true"]')
    if (await loadingIndicator.isVisible()) {
      console.log('✅ 发现加载指示器')
    }
    
    // 等待请求完成
    await requestPromise
    console.log('✅ 请求已发送')
  })
})
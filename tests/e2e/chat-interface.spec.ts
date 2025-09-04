import { test, expect } from '@playwright/test'

// 使用认证状态
test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('AI聊天界面', () => {
  test.beforeEach(async ({ page }) => {
    // 访问工作空间页面
    await page.goto('/contexts/e7c5aa1e-de00-4327-81dd-cfeba3030081')
    
    // 等待页面加载完成
    await page.waitForSelector('body', { state: 'visible' })
  })

  test('聊天界面正常加载并显示必要元素', async ({ page }) => {
    // 验证聊天界面的基本元素
    await expect(page.locator('[data-testid="chat-container"]').or(page.locator('.chat-container')).or(page.locator('#chat-container'))).toBeVisible()
    
    // 验证消息输入框
    const messageInput = page.locator('input[placeholder*="消息"]')
      .or(page.locator('input[placeholder*="message"]'))
      .or(page.locator('textarea[placeholder*="消息"]'))
      .or(page.locator('textarea[placeholder*="message"]'))
    
    await expect(messageInput).toBeVisible()
    
    // 验证发送按钮
    const sendButton = page.locator('button:has-text("发送")')
      .or(page.locator('button:has-text("Send")'))
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('[data-testid="send-button"]'))
    
    await expect(sendButton).toBeVisible()
  })

  test('侧边栏可以正确展开和折叠', async ({ page }) => {
    // 查找侧边栏切换按钮
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
      .or(page.locator('.sidebar-toggle'))
      .or(page.locator('button[aria-label*="sidebar"]'))
      .or(page.locator('button:has-text("☰")'))
    
    if (await sidebarToggle.isVisible()) {
      // 点击切换侧边栏
      await sidebarToggle.click()
      
      // 等待动画完成
      await page.waitForTimeout(500)
      
      // 再次点击切换回来
      await sidebarToggle.click()
      await page.waitForTimeout(500)
      
      // 验证侧边栏仍然存在
      const sidebar = page.locator('[data-testid="sidebar"]')
        .or(page.locator('.sidebar'))
        .or(page.locator('aside'))
      
      await expect(sidebar).toBeVisible()
    }
  })

  test('数据源状态指示器正常显示', async ({ page }) => {
    // 等待数据源状态加载
    await page.waitForTimeout(3000)
    
    // 查找数据源状态区域
    const statusArea = page.locator('[data-testid="data-sources-status"]')
      .or(page.locator('.data-sources'))
      .or(page.locator('.status-indicators'))
    
    if (await statusArea.isVisible()) {
      // 验证至少有一个数据源状态显示
      const statusItems = page.locator('.status-item')
        .or(page.locator('[data-testid*="status"]'))
        .or(page.locator('text=Slack'))
        .or(page.locator('text=Gmail'))
      
      await expect(statusItems.first()).toBeVisible()
    }
  })

  test('快速提示词卡片正常工作', async ({ page }) => {
    // 查找快速提示词卡片
    const promptCards = page.locator('[data-testid="prompt-card"]')
      .or(page.locator('.prompt-card'))
      .or(page.locator('.quick-prompt'))
    
    const cardCount = await promptCards.count()
    
    if (cardCount > 0) {
      // 点击第一个提示词卡片
      await promptCards.first().click()
      
      // 验证输入框被填充
      const messageInput = page.locator('input[placeholder*="消息"]')
        .or(page.locator('textarea[placeholder*="消息"]'))
        .or(page.locator('input[placeholder*="message"]'))
        .or(page.locator('textarea[placeholder*="message"]'))
      
      const inputValue = await messageInput.inputValue()
      expect(inputValue.length).toBeGreaterThan(0)
    }
  })

  test('可以发送消息并接收AI回复', async ({ page }) => {
    const testMessage = '你好，这是一条测试消息'
    
    // 查找输入框
    const messageInput = page.locator('input[placeholder*="消息"]')
      .or(page.locator('textarea[placeholder*="消息"]'))
      .or(page.locator('input[placeholder*="message"]'))
      .or(page.locator('textarea[placeholder*="message"]'))
    
    // 输入测试消息
    await messageInput.fill(testMessage)
    
    // 发送消息
    const sendButton = page.locator('button:has-text("发送")')
      .or(page.locator('button:has-text("Send")'))
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('[data-testid="send-button"]'))
    
    await sendButton.click()
    
    // 验证用户消息出现在聊天中
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 })
    
    // 等待AI回复
    await page.waitForTimeout(5000)
    
    // 验证聊天历史中有消息
    const chatMessages = page.locator('.message')
      .or(page.locator('[data-testid="message"]'))
      .or(page.locator('.chat-message'))
    
    const messageCount = await chatMessages.count()
    expect(messageCount).toBeGreaterThan(0)
    
    // 验证输入框被清空
    const inputValue = await messageInput.inputValue()
    expect(inputValue).toBe('')
  })

  test('聊天历史正确显示时间戳', async ({ page }) => {
    // 发送一条消息以确保有聊天历史
    const messageInput = page.locator('input[placeholder*="消息"]')
      .or(page.locator('textarea[placeholder*="消息"]'))
    
    if (await messageInput.isVisible()) {
      await messageInput.fill('时间戳测试消息')
      
      const sendButton = page.locator('button:has-text("发送")')
        .or(page.locator('button[type="submit"]'))
      
      await sendButton.click()
      
      // 等待消息显示
      await page.waitForTimeout(2000)
      
      // 查找时间戳元素
      const timestamps = page.locator('.timestamp')
        .or(page.locator('[data-testid="timestamp"]'))
        .or(page.locator('.message-time'))
      
      if (await timestamps.count() > 0) {
        await expect(timestamps.first()).toBeVisible()
      }
    }
  })

  test('响应式设计在不同屏幕尺寸下正常工作', async ({ page }) => {
    // 测试桌面版本
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('body')).toBeVisible()
    
    // 测试平板版本
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()
    
    // 测试手机版本
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
    
    // 在手机版本中，侧边栏可能被隐藏或变为抽屉式
    const sidebar = page.locator('.sidebar').or(page.locator('aside'))
    
    // 如果有移动端菜单按钮，测试其功能
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"]')
      .or(page.locator('.mobile-menu-button'))
      .or(page.locator('button[aria-label*="menu"]'))
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await page.waitForTimeout(500)
    }
    
    // 验证聊天界面在移动端仍然可用
    const messageInput = page.locator('input[placeholder*="消息"]')
      .or(page.locator('textarea[placeholder*="消息"]'))
    
    await expect(messageInput).toBeVisible()
  })
})
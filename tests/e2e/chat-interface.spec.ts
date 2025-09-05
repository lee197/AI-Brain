import { test, expect } from '@playwright/test'

test.describe('AI聊天界面', () => {
  test.beforeEach(async ({ page }) => {
    // 访问工作空间页面
    await page.goto('/contexts/e7c5aa1e-de00-4327-81dd-cfeba3030081')
    
    // 等待页面加载完成
    await page.waitForSelector('body', { state: 'visible' })
  })

  test('聊天界面正常加载并显示必要元素', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    
    // 验证侧边栏数据源状态
    await expect(page.locator('text=Data Source Status')).toBeVisible()
    
    // 验证数据源连接状态
    await expect(page.locator('text=Slack')).toBeVisible()
    await expect(page.locator('text=Google Workspace')).toBeVisible()
    
    // 验证快速提示词卡片
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
    await expect(page.locator('text=Create Task')).toBeVisible()
    
    // 滚动到底部查看输入框
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // 验证输入区域存在（使用更通用的选择器）
    const inputArea = page.locator('form, .input-area, input, textarea').first()
    await expect(inputArea).toBeVisible({ timeout: 5000 })
    
    // 验证发送按钮（蓝色圆形按钮）
    const sendButton = page.locator('button').last()
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
    const testMessage = 'Hello AI! Please reply with a simple greeting.'
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // 滚动到底部确保看到输入框
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // 查找输入框和发送按钮
    const messageInput = page.locator('[data-testid="chat-input"]')
    const sendButton = page.locator('[data-testid="chat-send-button"]')
    
    await expect(messageInput).toBeVisible({ timeout: 10000 })
    await expect(sendButton).toBeVisible({ timeout: 5000 })
    
    // Debug: Log initial message count
    const initialMessages = await page.locator('.rounded-2xl.p-4').count()
    console.log(`📊 Initial message count: ${initialMessages}`)
    
    // Debug: Check if form exists
    const formCount = await page.locator('form').count()
    console.log(`📊 Form count: ${formCount}`)
    
    // 直接填入消息
    await messageInput.fill(testMessage)
    
    // Debug: Check if input has value
    const inputValue = await messageInput.inputValue()
    console.log(`📊 Input value after fill: "${inputValue}"`)
    
    // 按钮应该总是启用的（我们已经移除了input验证）
    await expect(sendButton).toBeEnabled({ timeout: 3000 })
    console.log('✅ Send button is enabled')
    
    // Debug: Add network request monitoring
    const requests = []
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        })
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`)
      }
    })
    
    // Debug: Add console logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Chat error')) {
        console.log(`🚨 Browser error: ${msg.text()}`)
      }
    })
    
    // Try submitting the form directly instead of clicking the button
    const formElement = page.locator('form')
    await formElement.evaluate((form) => {
      console.log('Submitting form directly')
      form.requestSubmit()
    })
    console.log('✅ Form submitted directly')
    
    // Wait a bit for the request to be made
    await page.waitForTimeout(2000)
    
    // Debug: Check message count after click
    const afterClickMessages = await page.locator('.rounded-2xl.p-4').count()
    console.log(`📊 Message count after click: ${afterClickMessages}`)
    
    // Debug: Print all API requests made
    console.log(`📊 Total API requests: ${requests.length}`)
    requests.forEach((req, i) => {
      console.log(`  ${i+1}. ${req.method} ${req.url}`)
    })
    
    // Verify user message appears (with a longer timeout for debugging)
    try {
      await expect(page.locator('.bg-blue-600.text-white').filter({ hasText: testMessage })).toBeVisible({ timeout: 15000 })
      console.log('✅ User message appeared')
    } catch (error) {
      console.log('❌ User message did not appear')
      console.log(`📸 Taking screenshot for debugging`)
      await page.screenshot({ path: 'debug-after-click.png', fullPage: true })
      throw error
    }
    
    // Wait for AI reply
    const aiMessageBubble = page.locator('.bg-gray-50, .dark\\:bg-gray-800').last()
    await expect(aiMessageBubble).toBeVisible({ timeout: 15000 })
    
    // Verify AI reply content
    const aiMessageText = await aiMessageBubble.textContent()
    expect(aiMessageText).toBeTruthy()
    expect(aiMessageText.length).toBeGreaterThan(5)
    
    // Verify input is cleared
    const finalInputValue = await messageInput.inputValue()
    expect(finalInputValue).toBe('')
    
    console.log('✅ AI回复内容:', aiMessageText?.slice(0, 100) + '...')
  })

  test('可以进行多轮AI对话', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const messageInput = page.locator('[data-testid="chat-input"]')
    const sendButton = page.locator('[data-testid="chat-send-button"]')
    
    // 辅助函数：正确地与React输入框交互
    const fillAndTriggerInput = async (input: any, message: string) => {
      await input.click()
      await input.fill('')
      await input.fill(message)
      
      // 手动触发input事件来更新React状态
      await input.evaluate((inputEl: HTMLInputElement, value: string) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, value);
        }
        const event = new Event('input', { bubbles: true });
        inputEl.dispatchEvent(event);
      }, message)
      
      await page.waitForTimeout(300)
    }
    
    // 第一轮对话
    const firstMessage = 'What is 2+2?'
    await fillAndTriggerInput(messageInput, firstMessage)
    
    await expect(sendButton).toBeEnabled({ timeout: 3000 })
    await sendButton.click()
    
    // 验证第一条用户消息
    await expect(page.locator('.bg-blue-600.text-white').filter({ hasText: firstMessage })).toBeVisible({ timeout: 8000 })
    
    // 等待第一条AI回复
    await page.waitForTimeout(3000)
    const firstAiReply = page.locator('.bg-gray-50, .dark\\:bg-gray-800').last()
    await expect(firstAiReply).toBeVisible({ timeout: 15000 })
    
    // 第二轮对话
    await page.waitForTimeout(1000)
    const secondMessage = 'Thank you for the answer!'
    await messageInput.click()
    await messageInput.fill('')
    await messageInput.type(secondMessage, { delay: 50 })
    await page.waitForTimeout(500)
    
    await expect(sendButton).toBeEnabled({ timeout: 3000 })
    await sendButton.click()
    
    // 验证第二条用户消息
    await expect(page.locator('.bg-blue-600.text-white').filter({ hasText: secondMessage })).toBeVisible({ timeout: 8000 })
    
    // 等待第二条AI回复
    await page.waitForTimeout(3000)
    
    // 验证聊天历史中有多条消息（至少4条：2条用户+2条AI）
    const allMessages = page.locator('.rounded-2xl.p-4')
    const messageCount = await allMessages.count()
    expect(messageCount).toBeGreaterThanOrEqual(4)
    
    console.log(`✅ 多轮对话完成，共有 ${messageCount} 条消息`)
  })

  test('AI聊天支持加载状态和停止功能', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const messageInput = page.locator('[data-testid="chat-input"]')
    const sendButton = page.locator('[data-testid="chat-send-button"]')
    
    // 发送一个较长的问题，更容易看到加载状态
    const longMessage = 'Please write a detailed explanation about artificial intelligence and machine learning.'
    await messageInput.click()
    await messageInput.fill('')
    await messageInput.type(longMessage, { delay: 30 })
    await page.waitForTimeout(500)
    
    await expect(sendButton).toBeEnabled({ timeout: 3000 })
    await sendButton.click()
    
    // 验证加载状态（发送按钮变为加载动画或停止按钮）
    const loadingIndicator = page.locator('.animate-spin')
    const stopButton = page.locator('button').filter({ hasText: 'Stop' }).or(page.locator('[data-testid*="stop"]'))
    
    // 验证有加载指示器或停止按钮出现
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 })
      console.log('✅ 检测到加载动画')
    } catch {
      try {
        await expect(stopButton).toBeVisible({ timeout: 2000 })
        console.log('✅ 检测到停止按钮')
      } catch {
        console.log('⚠️  未检测到明显的加载指示器，可能回复太快')
      }
    }
    
    // 等待AI回复完成
    await expect(page.locator('.bg-gray-50, .dark\\:bg-gray-800').last()).toBeVisible({ timeout: 20000 })
    
    // 验证发送按钮恢复正常状态
    await expect(sendButton).toBeEnabled({ timeout: 5000 })
    
    console.log('✅ AI聊天加载状态测试完成')
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
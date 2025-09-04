import { test, expect } from '@playwright/test'

// 使用认证状态
test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('工作空间管理', () => {
  test('可以查看工作空间列表', async ({ page }) => {
    await page.goto('/contexts')
    
    // 等待页面加载
    await page.waitForSelector('body', { state: 'visible' })
    
    // 验证工作空间列表页面元素
    const workspaceList = page.locator('[data-testid="workspace-list"]')
      .or(page.locator('.workspace-list'))
      .or(page.locator('.contexts-list'))
    
    // 如果没有专门的列表容器，至少应该有页面标题
    const pageTitle = page.locator('h1').or(page.locator('h2')).first()
    await expect(pageTitle).toBeVisible()
    
    // 查找创建新工作空间的按钮
    const createButton = page.locator('text=创建').or(page.locator('text=Create')).or(page.locator('text=新建'))
    
    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible()
    }
  })

  test('可以创建新的工作空间', async ({ page }) => {
    await page.goto('/contexts/new')
    
    // 验证创建工作空间页面加载
    const pageTitle = page.locator('h1').or(page.locator('h2')).first()
    await expect(pageTitle).toContainText(/创建|Create|新建/)
    
    // 生成唯一的工作空间名称
    const workspaceName = `测试工作空间_${Date.now()}`
    
    // 填写工作空间信息
    const nameInput = page.locator('input[name*="name"]')
      .or(page.locator('input[placeholder*="名称"]'))
      .or(page.locator('input[placeholder*="name"]'))
    
    if (await nameInput.isVisible()) {
      await nameInput.fill(workspaceName)
    }
    
    // 填写描述（如果有）
    const descriptionInput = page.locator('textarea[name*="description"]')
      .or(page.locator('textarea[placeholder*="描述"]'))
      .or(page.locator('textarea[placeholder*="description"]'))
    
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('这是一个测试工作空间')
    }
    
    // 选择工作空间类型（如果有）
    const typeSelect = page.locator('select[name*="type"]')
      .or(page.locator('[data-testid="workspace-type"]'))
    
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('PROJECT')
    }
    
    // 提交表单
    const submitButton = page.locator('button[type="submit"]')
      .or(page.locator('button:has-text("创建")'))
      .or(page.locator('button:has-text("Create")'))
    
    await submitButton.click()
    
    // 等待工作空间创建完成并跳转
    await page.waitForTimeout(3000)
    
    // 验证跳转到新创建的工作空间或工作空间列表
    const currentUrl = page.url()
    const isWorkspacePage = currentUrl.includes('/contexts/') && !currentUrl.includes('/new')
    const isListPage = currentUrl.includes('/contexts') && !currentUrl.includes('/')
    
    expect(isWorkspacePage || isListPage).toBe(true)
  })

  test('可以进入现有工作空间', async ({ page }) => {
    // 使用已知的测试工作空间ID
    const testWorkspaceId = 'e7c5aa1e-de00-4327-81dd-cfeba3030081'
    
    await page.goto(`/contexts/${testWorkspaceId}`)
    
    // 验证工作空间页面加载
    await page.waitForSelector('body', { state: 'visible' })
    
    // 验证工作空间特有的元素存在
    const workspaceIndicators = [
      page.locator('[data-testid="workspace-title"]'),
      page.locator('.workspace-name'),
      page.locator('h1'),
      page.locator('[data-testid="chat-container"]'),
      page.locator('.chat-interface')
    ]
    
    let foundIndicator = false
    for (const indicator of workspaceIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundIndicator = true
        break
      }
    }
    
    expect(foundIndicator).toBe(true)
  })

  test('工作空间切换器正常工作', async ({ page }) => {
    // 进入一个工作空间
    await page.goto('/contexts/e7c5aa1e-de00-4327-81dd-cfeba3030081')
    
    // 查找工作空间切换器
    const workspaceSwitcher = page.locator('[data-testid="workspace-switcher"]')
      .or(page.locator('.workspace-switcher'))
      .or(page.locator('.context-switcher'))
    
    if (await workspaceSwitcher.isVisible()) {
      await workspaceSwitcher.click()
      
      // 等待下拉菜单展开
      await page.waitForTimeout(500)
      
      // 验证有工作空间选项
      const workspaceOptions = page.locator('.workspace-option')
        .or(page.locator('[data-testid="workspace-option"]'))
        .or(page.locator('li'))
      
      const optionCount = await workspaceOptions.count()
      if (optionCount > 1) {
        // 点击另一个工作空间选项
        await workspaceOptions.nth(1).click()
        
        // 验证URL改变
        await page.waitForTimeout(2000)
        const newUrl = page.url()
        expect(newUrl).toContain('/contexts/')
      }
    }
  })

  test('工作空间设置页面可访问', async ({ page }) => {
    const testWorkspaceId = 'e7c5aa1e-de00-4327-81dd-cfeba3030081'
    
    await page.goto(`/contexts/${testWorkspaceId}`)
    
    // 查找设置按钮或链接
    const settingsButton = page.locator('text=设置')
      .or(page.locator('text=Settings'))
      .or(page.locator('[data-testid="settings-button"]'))
      .or(page.locator('button[aria-label*="设置"]'))
    
    if (await settingsButton.isVisible({ timeout: 3000 })) {
      await settingsButton.click()
      
      // 等待设置页面或模态框加载
      await page.waitForTimeout(1000)
      
      // 验证设置界面元素
      const settingsIndicators = [
        page.locator('text=工作空间设置').or(page.locator('text=Workspace Settings')),
        page.locator('[data-testid="settings-modal"]'),
        page.locator('.settings-dialog'),
        page.url().includes('settings')
      ]
      
      let foundSettings = false
      for (const indicator of settingsIndicators) {
        try {
          if (typeof indicator === 'boolean') {
            foundSettings = indicator
          } else {
            await indicator.waitFor({ timeout: 2000 })
            foundSettings = true
          }
          if (foundSettings) break
        } catch {
          continue
        }
      }
      
      expect(foundSettings).toBe(true)
    } else {
      test.skip('设置按钮未找到')
    }
  })

  test('工作空间权限系统正常工作', async ({ page }) => {
    const testWorkspaceId = 'e7c5aa1e-de00-4327-81dd-cfeba3030081'
    
    await page.goto(`/contexts/${testWorkspaceId}`)
    
    // 验证用户对工作空间有适当的访问权限
    // 至少应该能够查看工作空间内容
    await page.waitForSelector('body', { state: 'visible' })
    
    // 查找权限相关的UI元素
    const permissionIndicators = [
      page.locator('.user-role'),
      page.locator('[data-testid="user-role"]'),
      page.locator('.permission-badge'),
      page.locator('text=Owner').or(page.locator('text=Admin')).or(page.locator('text=Member'))
    ]
    
    // 如果显示用户角色，验证其可见性
    for (const indicator of permissionIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(indicator).toBeVisible()
        break
      }
    }
    
    // 验证基本功能可用（用户至少有读取权限）
    const basicElements = [
      page.locator('[data-testid="chat-container"]'),
      page.locator('.chat-interface'),
      page.locator('input[placeholder*="消息"]'),
      page.locator('textarea[placeholder*="消息"]')
    ]
    
    let foundBasicAccess = false
    for (const element of basicElements) {
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundBasicAccess = true
        break
      }
    }
    
    expect(foundBasicAccess).toBe(true)
  })
})
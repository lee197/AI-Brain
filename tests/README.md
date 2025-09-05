# 🧪 AI Brain E2E Testing Suite

企业级用户体验测试框架，基于 Playwright 构建，确保 AI Brain 在各种浏览器和设备上的稳定性和用户体验。

## 📁 目录结构

```
tests/
├── e2e/                          # E2E测试文件
│   ├── authentication.spec.ts    # 用户认证测试
│   ├── chat-interface.spec.ts    # AI聊天功能测试
│   ├── homepage.spec.ts          # 首页和导航测试
│   └── workspace-management.spec.ts # 工作空间管理测试
├── setup/                        # 全局设置
│   ├── global-setup.ts          # 测试前全局设置
│   └── global-teardown.ts       # 测试后全局清理
├── utils/                        # 测试工具
│   ├── test-helpers.ts          # 通用助手函数
│   └── test-constants.ts        # 测试常量和选择器
├── auth.setup.ts                # 认证设置
└── README.md                    # 本文件
```

## 🚀 快速开始

```bash
# 1. 安装浏览器 (首次运行)
npx playwright install

# 2. 运行所有测试
npx playwright test

# 3. 查看测试报告
npx playwright show-report
```

## 🎯 测试覆盖范围

- ✅ **认证系统**: 登录、注册、注销流程
- ✅ **AI聊天界面**: 消息发送、接收、显示
- ✅ **工作空间管理**: 创建、查看、切换工作空间
- ✅ **响应式设计**: 桌面端、平板、手机适配
- ✅ **国际化功能**: 中英文界面切换
- ✅ **主题切换**: 深色/浅色模式

## ⚙️ 测试配置

### 测试账户
```yaml
演示用户:
  邮箱: demo@aibrain.com
  密码: demo123

管理员用户:
  邮箱: admin@aibrain.com  
  密码: admin123

测试工作空间ID: e7c5aa1e-de00-4327-81dd-cfeba3030081
```

### 浏览器支持
- ✅ Chrome (Chromium)
- ✅ Firefox  
- ✅ Safari (WebKit)
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS)

## 🛠️ 开发指南

### 编写新测试
```typescript
import { test, expect } from '@playwright/test'
import { PageHelpers, TEST_CONFIG } from '../utils/test-helpers'

test.describe('功能描述', () => {
  test('应该完成某项操作', async ({ page }) => {
    const helpers = new PageHelpers(page)
    
    await page.goto('/target-page')
    await helpers.waitForPageReady()
    
    // 执行操作
    await helpers.clickButton('button[type="submit"]')
    
    // 验证结果
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

### 测试工具使用
```typescript
const helpers = new PageHelpers(page)

// 登录用户
await helpers.loginAsUser(TEST_CONFIG.DEMO_USER)

// 填写表单
await helpers.fillField('input[type="email"]', 'test@example.com')

// 点击按钮
await helpers.clickButton('button[type="submit"]')

// 等待页面就绪
await helpers.waitForPageReady()

// 截图调试
await helpers.takeScreenshot('debug-screenshot')
```

## 📊 测试报告

测试完成后会生成多种格式的报告：
- **HTML报告**: `test-results/html-report/index.html`
- **JSON结果**: `test-results/results.json`
- **JUnit XML**: `test-results/junit.xml`

## 🐛 调试测试

```bash
# 可视化模式运行
HEADED=true npx playwright test

# 调试模式
npx playwright test --debug

# UI模式
npx playwright test --ui

# 查看失败跟踪
npx playwright show-trace test-results/*/trace.zip
```

---

🎯 **目标**: 确保AI Brain在任何使用场景下都能提供稳定、优质的用户体验。
# AI Brain 自动化测试

本目录包含 AI Brain 项目的端到端 (E2E) 自动化测试，使用 Playwright 测试框架。

## 🚀 快速开始

### 1. 安装测试依赖
```bash
npm run test:setup
```

### 2. 运行所有测试
```bash
npm run test
```

### 3. 交互式UI测试
```bash
npm run test:ui
```

### 4. 调试模式
```bash
npm run test:debug
```

## 📁 测试结构

```
tests/
├── auth.setup.ts              # 认证设置
├── e2e/                       # 端到端测试
│   ├── homepage.spec.ts       # 首页和基础导航
│   ├── authentication.spec.ts # 用户认证流程
│   ├── chat-interface.spec.ts # AI聊天界面
│   └── workspace-management.spec.ts # 工作空间管理
└── README.md                  # 测试文档
```

## 🧪 测试用例覆盖

### 1. 首页和基础导航 (`homepage.spec.ts`)
- ✅ 首页正常加载
- ✅ 语言切换功能
- ✅ 深色模式切换
- ✅ 响应式设计测试

### 2. 用户认证 (`authentication.spec.ts`)
- ✅ 用户注册流程
- ✅ 演示账户登录
- ✅ 错误凭据处理
- ✅ 用户注销功能

### 3. AI聊天界面 (`chat-interface.spec.ts`)
- ✅ 聊天界面基本元素
- ✅ 侧边栏展开/折叠
- ✅ 数据源状态指示器
- ✅ 快速提示词卡片
- ✅ 消息发送和AI回复
- ✅ 时间戳显示
- ✅ 响应式设计

### 4. 工作空间管理 (`workspace-management.spec.ts`)
- ✅ 工作空间列表查看
- ✅ 创建新工作空间
- ✅ 进入现有工作空间
- ✅ 工作空间切换
- ✅ 工作空间设置
- ✅ 权限系统验证

## 🔧 测试配置

### 演示账户
测试使用以下演示账户：
- **邮箱**: demo@aibrain.com
- **密码**: demo123
- **工作空间ID**: e7c5aa1e-de00-4327-81dd-cfeba3030081

### 浏览器支持
- ✅ Chromium (Chrome)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari

### 测试环境
- **基础URL**: http://localhost:3002
- **开发服务器**: 自动启动 (npm run dev)
- **超时设置**: 2分钟服务器启动

## 📊 测试报告

### 生成HTML报告
```bash
npm run test:report
```

### 查看测试结果
测试结果保存在：
- `test-results/` - 测试失败截图和视频
- `playwright-report/` - HTML测试报告

## 🛠 开发指南

### 添加新测试
1. 在 `tests/e2e/` 目录创建新的 `.spec.ts` 文件
2. 使用认证状态：`test.use({ storageState: 'playwright/.auth/user.json' })`
3. 编写测试用例并运行验证

### 测试最佳实践
1. **使用语义化选择器**: 优先使用 `data-testid` 属性
2. **等待元素可见**: 使用 `await expect().toBeVisible()`
3. **处理异步操作**: 使用适当的等待和超时
4. **移动端测试**: 验证响应式设计
5. **错误处理**: 测试异常情况和边界条件

### 调试测试失败
```bash
# 以可视化模式运行单个测试
npx playwright test tests/e2e/chat-interface.spec.ts --headed --debug

# 查看测试执行轨迹
npx playwright show-trace test-results/[test-name]/trace.zip
```

## 🔍 选择器策略

测试使用多重选择器策略以提高稳定性：

```typescript
// 示例：多种选择器备选方案
const messageInput = page.locator('input[placeholder*="消息"]')
  .or(page.locator('textarea[placeholder*="消息"]'))
  .or(page.locator('input[placeholder*="message"]'))
  .or(page.locator('textarea[placeholder*="message"]'))
```

## 📈 持续集成

测试配置支持 CI/CD 环境：
- ✅ 失败重试机制
- ✅ 并行测试执行
- ✅ 截图和视频记录
- ✅ HTML报告生成

## 🚨 注意事项

1. **服务器依赖**: 测试需要开发服务器运行在端口 3002
2. **数据库状态**: 确保 Supabase 数据库连接正常
3. **认证状态**: 部分测试需要用户登录状态
4. **网络延迟**: 在慢网络环境下可能需要调整超时设置

## 📞 故障排除

### 常见问题
1. **服务器启动失败**: 检查端口 3002 是否被占用
2. **认证失败**: 验证演示账户是否可用
3. **元素未找到**: 检查页面是否完全加载
4. **超时错误**: 增加相应操作的等待时间

### 获取帮助
- 查看 Playwright 官方文档: https://playwright.dev
- 查看项目 CLAUDE.md 了解架构详情
- 运行 `npm run test:debug` 进行交互式调试
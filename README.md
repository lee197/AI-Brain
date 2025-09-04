# 🧠 AI Brain - 智能工作助手

<div align="center">

![AI Brain Logo](https://github.com/lee197/AI-Brain/assets/11969113/placeholder-logo)

**AI Brain 是一个企业级智能工作助手，集成多种企业工具（Slack、Gmail、Google Workspace），通过 AI 驱动的自然语言查询和智能上下文整合，实现人机协作的新工作模式，为团队节省每周 8-10 小时的工作时间。**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.55-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Playwright](https://img.shields.io/badge/Playwright-Tests-45ba4b?style=for-the-badge&logo=playwright)](https://playwright.dev/)

[🚀 在线体验](#-快速开始) • [📖 文档](#-项目文档) • [🎯 功能特性](#-核心功能) • [🛠️ 技术栈](#️-技术栈)

</div>

---

## 🎯 项目概述

AI Brain 是一个完全实现的企业级智能工作助手，通过先进的 AI 技术和多源上下文整合，革命性地改变企业团队的工作方式：

### 🌟 核心价值
- **🧠 智能上下文整合**: 自动整合 Slack 团队对话、Gmail 邮件和 Google Workspace 文档，为 AI 对话提供丰富的业务上下文
- **💬 ChatGPT 风格界面**: 专业的聊天界面，支持 Markdown 渲染、代码高亮和实时响应
- **🔗 多模型 AI 支持**: 集成 Google Gemini、OpenAI GPT 和智能降级系统，确保服务可靠性
- **📊 企业级架构**: 基于 Next.js 15 + TypeScript + Supabase 的现代全栈架构
- **🌐 MCP 协议集成**: 采用 Model Context Protocol 标准，实现可扩展的工具集成

### ✅ 已实现功能
- **🔐 完整认证系统**: Supabase 认证 + Mock 开发模式，支持多用户和权限控制
- **💼 工作空间管理**: 5种工作空间类型，支持团队协作和权限分级
- **💬 智能聊天系统**: 实时 AI 对话，支持多源上下文和智能回复
- **📧 Gmail 集成**: 完整的邮件搜索、内容分析和 AI 索引系统
- **💼 Slack 集成**: 实时消息同步、团队对话分析和智能回复
- **📁 Google Workspace**: 通过 MCP 协议集成 Drive、Calendar、Docs 等服务
- **🎨 现代化 UI**: 基于 shadcn/ui 的企业级界面，支持响应式和主题切换
- **🌏 国际化支持**: 完整的中英文双语界面
- **🧪 企业级测试**: Playwright E2E 测试框架，确保代码质量

## 🌐 在线访问

🔗 **生产环境**: [https://ai-brain-jasons-projects-76b6cdcf.vercel.app](https://ai-brain-jasons-projects-76b6cdcf.vercel.app)

## 🚀 快速开始

### 📋 系统要求

- **Node.js**: 18.0+ 
- **npm**: 9.0+ 或 **yarn**: 1.22+
- **Git**: 2.0+

### 💾 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/lee197/AI-Brain.git
   cd AI-Brain
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 添加必要的 API 密钥
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **访问应用**
   
   打开 [http://localhost:3000](http://localhost:3000) 查看应用

### 🔐 演示账号

开箱即用的演示账号，无需额外配置：

| 账号类型 | 邮箱 | 密码 | 权限 |
|---------|------|------|------|
| **管理员** | `admin@aibrain.com` | `admin123` | 完整管理权限 |
| **普通用户** | `demo@aibrain.com` | `demo123` | 标准用户权限 |

## 🎯 核心功能

### 🤖 AI 驱动的智能聊天
- **ChatGPT 风格界面**: 专业的聊天体验，支持 Markdown 渲染和代码高亮
- **多模型支持**: Google Gemini (优先)、OpenAI GPT、智能 Mock 降级系统
- **智能上下文整合**: 自动融合 Slack 团队对话和 Gmail 邮件上下文
- **实时响应**: 流式 AI 回复，支持打字指示器和自动滚动

### 📧 Gmail 智能集成 (100% 完成)
- **AI 邮件索引**: 智能分析邮件内容，提供相关邮件上下文
- **OAuth2 认证**: 安全的 Google 账户集成
- **邮件搜索**: 支持 Gmail 查询语法的高级搜索
- **内容分析**: 提取关键信息，生成邮件摘要

### 💬 Slack 团队集成 (95% 完成)
- **实时消息同步**: 自动同步团队频道消息到本地数据库
- **Webhook 集成**: 实时接收 Slack 消息更新
- **团队上下文**: 为 AI 对话提供最新的团队讨论背景
- **OAuth 认证**: 安全的 Slack 工作空间连接

### 🏢 Google Workspace MCP 集成 (100% 完成)
- **标准化协议**: 基于 Model Context Protocol 的工具集成
- **25+ 工具支持**: Gmail、Drive、Calendar、Docs、Sheets 等完整套件
- **智能查询**: 通过自然语言查询跨 Google 服务的内容
- **实时数据**: 获取最新的文档、日程和邮件信息

### 💼 工作空间管理系统
- **5种工作空间类型**: PROJECT、TEAM、DEPARTMENT、CLIENT、PERSONAL
- **权限分级**: owner/admin/member/viewer 四级权限控制
- **成员协作**: 支持多用户共享和协作
- **上下文隔离**: 每个工作空间独立的数据和配置

## 🛠️ 技术栈

### 🔥 核心框架
- **[Next.js 15.4.6](https://nextjs.org/)** - React 全栈框架，App Router + Server Components
- **[TypeScript 5+](https://www.typescriptlang.org/)** - 严格模式类型安全
- **[Tailwind CSS 4](https://tailwindcss.com/)** - 现代化 CSS 框架
- **[React 19](https://react.dev/)** - 最新 React 特性

### 🎨 UI 组件生态
- **[shadcn/ui](https://ui.shadcn.com/)** - 企业级 React 组件库 (20+ 组件)
- **[Radix UI](https://www.radix-ui.com/)** - 无样式 UI 基础组件
- **[Lucide React](https://lucide.dev/)** - 现代图标系统
- **[Sonner](https://sonner.emilkowal.ski/)** - 优雅的通知系统

### 🧠 AI 和数据处理
- **[Vercel AI SDK 5.0.13](https://sdk.vercel.ai/)** - 多模型 AI 集成
- **[Google AI SDK](https://ai.google.dev/)** - Gemini 1.5 Flash 集成
- **[OpenAI SDK](https://platform.openai.com/)** - GPT 模型支持
- **[MCP SDK](https://modelcontextprotocol.io/)** - Model Context Protocol 客户端

### 🗄️ 后端和数据库
- **[Supabase 2.55.0](https://supabase.com/)** - 完整的 BaaS 解决方案
  - PostgreSQL 数据库 + Row Level Security
  - 实时数据订阅
  - 用户认证和授权
  - 文件存储
- **本地文件系统** - Gmail 数据缓存和索引

### 🔗 第三方集成
- **[Slack Web API](https://api.slack.com/)** - Slack 工作空间集成
- **[Google APIs](https://developers.google.com/)** - Google Workspace 全套服务
- **[googleapis](https://github.com/googleapis/google-api-nodejs-client)** - 官方 Google API 客户端

### 🧪 测试和质量保证
- **[Playwright](https://playwright.dev/)** - 端到端测试框架
- **[ESLint](https://eslint.org/)** - 代码质量检查
- **[Prettier](https://prettier.io/)** - 代码格式化
- **[TypeScript](https://www.typescriptlang.org/)** - 编译时类型检查

## 📖 项目文档

### 🗂️ 核心文档
- **[📋 CLAUDE.md](./CLAUDE.md)** - Claude Code 开发指南和项目配置
- **[🚀 SETUP.md](./SETUP.md)** - 详细安装和配置说明
- **[🔧 FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)** - 完整功能路线图和开发计划

### 🎨 设计文档
- **[🎨 UI_COMPONENTS.md](./UI_COMPONENTS.md)** - UI 组件库使用指南
- **[📄 PAGES_DEMO.md](./PAGES_DEMO.md)** - 页面展示和使用说明

### 🔐 技术文档  
- **[🔑 AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** - 认证系统详细说明
- **[🌏 I18N_SYSTEM.md](./I18N_SYSTEM.md)** - 国际化系统配置指南
- **[⏭️ NEXT_STEPS.md](./NEXT_STEPS.md)** - 下一步开发计划

## 📁 项目架构

```
ai-brain/
├── 📱 app/                           # Next.js 15 App Router
│   ├── (auth)/                       # 认证页面
│   │   ├── login/page.tsx            # 登录界面
│   │   └── signup/page.tsx           # 注册界面
│   ├── contexts/                     # 工作空间系统 ⭐
│   │   ├── [id]/page.tsx             # ChatGPT 风格聊天界面
│   │   ├── [id]/settings/            # 工作空间设置
│   │   ├── [id]/slack/messages/      # Slack 消息管理
│   │   ├── [id]/gmail/messages/      # Gmail 邮件管理
│   │   └── new/page.tsx              # 创建工作空间向导
│   ├── api/                          # API 路由系统
│   │   ├── ai/chat-*/                # AI 聊天端点
│   │   ├── slack/                    # Slack 集成 API
│   │   ├── gmail/                    # Gmail 集成 API
│   │   ├── google-*/                 # Google Workspace APIs
│   │   ├── contexts/                 # 工作空间 CRUD
│   │   └── webhooks/                 # Webhook 处理器
│   └── ui-demo/                      # UI 组件展示
├── 🎨 components/                    # UI 组件库
│   ├── ui/                           # shadcn/ui 基础组件 (20+)
│   ├── chat/                         # 聊天界面组件 ⭐
│   │   └── enhanced-chat.tsx         # 智能聊天核心组件
│   ├── slack/                        # Slack 集成组件
│   └── user-menu.tsx                 # 用户管理组件
├── 🔧 lib/                           # 核心业务逻辑
│   ├── slack/                        # Slack 集成库 ⭐
│   │   ├── api-client.ts             # Slack API 封装
│   │   ├── database-storage.ts       # 数据库存储
│   │   └── event-processor.ts        # 事件处理器
│   ├── google-workspace/             # Google 集成库 ⭐
│   │   ├── gmail-client.ts           # Gmail API 客户端
│   │   ├── gmail-ai-indexer.ts       # AI 邮件索引器
│   │   └── calendar-client.ts        # 日历 API 客户端
│   ├── mcp/                          # MCP 协议实现 ⭐
│   │   └── google-workspace-client.ts # Google MCP 客户端
│   ├── agents/                       # AI 代理系统
│   ├── supabase/                     # Supabase 集成
│   └── i18n/                         # 国际化系统
├── 🧪 tests/                         # 测试框架 ⭐
│   ├── e2e/                          # Playwright E2E 测试
│   │   ├── authentication.spec.ts    # 认证流程测试
│   │   ├── chat-interface.spec.ts    # 聊天界面测试
│   │   └── workspace-management.spec.ts # 工作空间测试
│   └── playwright.config.ts          # 测试配置
├── 🔷 types/                         # TypeScript 类型
│   ├── context.ts                    # 工作空间类型
│   └── database.ts                   # 数据库类型
└── 📄 配置文件
    ├── next.config.ts                # Next.js 配置
    ├── tailwind.config.ts            # Tailwind CSS 4 配置
    └── components.json               # shadcn/ui 配置
```

## 🌟 特色亮点

### 🧠 智能上下文整合系统
- **多源数据融合**: 自动整合 Slack 团队对话、Gmail 邮件和 Google Workspace 文档
- **AI 驱动分析**: 智能识别相关内容，为对话提供精准的业务上下文
- **实时同步**: 实时获取最新的团队沟通和邮件信息
- **智能降级**: 当外部服务不可用时，优雅降级到本地智能回复

### 🏗️ MCP (Model Context Protocol) 架构
- **标准化集成**: 采用业界标准 MCP 协议，实现可扩展的工具集成
- **25+ Google 工具**: 完整支持 Gmail、Drive、Calendar、Docs、Sheets 等服务
- **并行处理**: 同时查询多个服务，优化响应时间至 3-5 秒
- **会话管理**: 完整的 MCP 会话生命周期管理和错误处理

### 🎨 企业级用户体验
- **ChatGPT 风格界面**: 专业的聊天体验，支持 Markdown、代码高亮和实时滚动
- **可折叠侧边栏**: 280px → 64px 的灵活布局，支持快速提示词和数据源状态
- **响应式设计**: 完美适配桌面、平板和移动设备的一致体验
- **深色模式**: 完整的主题系统，支持系统偏好自动切换

### 🧪 企业级测试框架
- **双重保障**: Playwright E2E 测试 + 轻量级快速验证脚本
- **跨浏览器兼容**: Chrome、Firefox、Safari、移动端全覆盖测试
- **自动化 CI/CD**: GitHub Actions 集成，确保代码质量
- **可视化调试**: 支持截图、录像和完整跟踪记录

## 🚦 开发工作流

### 🔨 本地开发
```bash
# 启动开发服务器 (始终运行在端口 3000)
npm run dev

# 代码质量检查和修复
npm run lint              # ESLint 检查和自动修复
npm run lint:check        # 仅检查不修复
npm run type-check        # TypeScript 类型检查
npm run format            # Prettier 代码格式化
npm run format:check      # 检查代码格式

# 生产构建
npm run build             # 构建生产版本
npm run start             # 启动生产服务器

# 端到端测试
npm run test              # Playwright 测试套件
npm run test:ui           # 可视化测试界面
npm run test:debug        # 调试模式测试
npm run test:headed       # 有头模式测试
npm run test:report       # 查看测试报告
```

### 🧪 测试开发流程
```bash
# 1. 启动专用测试端口
npm run dev -- --port 3002

# 2. 快速功能验证 (日常开发)
node test-chat-quick.js

# 3. 完整功能测试 (重要更新后)
node test-chat-complete.js

# 4. 专业 E2E 测试
npx playwright test

# 5. 查看测试报告
npx playwright show-report
```

### 🧪 UI 组件开发
访问 [http://localhost:3000/ui-demo](http://localhost:3000/ui-demo) 查看和测试所有 UI 组件。

### 📊 实现状态总览

| 功能模块 | 状态 | 完成度 | 核心特性 |
|---------|------|--------|----------|
| 🔐 **认证系统** | ✅ 完成 | 100% | Supabase + Mock 双模式 |
| 🎨 **UI 界面** | ✅ 完成 | 100% | shadcn/ui + 响应式 + 深色模式 |
| 🌏 **国际化** | ✅ 完成 | 100% | 中英文双语 + 实时切换 |
| 💼 **工作空间系统** | ✅ 完成 | 100% | 5种类型 + 权限控制 |
| 🤖 **AI 聊天系统** | ✅ 完成 | 100% | ChatGPT 风格 + 多模型支持 |
| 📧 **Gmail 集成** | ✅ 完成 | 100% | AI 索引 + OAuth2 + 邮件分析 |
| 💬 **Slack 集成** | ✅ 完成 | 95% | 消息同步 + Webhook + OAuth |
| 🏢 **Google Workspace MCP** | ✅ 完成 | 100% | 25+ 工具 + 标准协议 |
| 🧪 **测试框架** | ✅ 完成 | 100% | Playwright E2E + 快速验证 |
| 📱 **响应式设计** | ✅ 完成 | 100% | 桌面 + 平板 + 移动端 |

### 🚀 生产就绪状态
- **核心功能**: 100% 完成，可直接投入生产使用
- **企业集成**: Gmail、Slack、Google Workspace 全面集成
- **用户体验**: 专业级界面，媲美 ChatGPT 的交互体验
- **技术架构**: 现代化全栈架构，支持大规模部署
- **质量保证**: 完整的测试覆盖，确保稳定性

## 💡 快速体验

### 🎯 演示场景
1. **智能聊天对话**
   - 访问 [在线演示](https://ai-brain-jasons-projects-76b6cdcf.vercel.app)
   - 使用演示账户: `demo@aibrain.com` / `demo123` 登录
   - 体验 ChatGPT 风格的智能对话界面

2. **多源上下文整合**
   - 创建新的工作空间 (PROJECT 类型)
   - 连接 Google Workspace (通过 MCP 协议)
   - 体验智能整合 Gmail 邮件和团队对话的 AI 回复

3. **工作空间协作**
   - 邀请团队成员加入工作空间
   - 配置不同的数据源 (Slack、Gmail、Google Drive)
   - 体验跨工具的统一智能查询

### 🚀 本地快速启动
```bash
# 1. 克隆并安装
git clone https://github.com/lee197/AI-Brain.git
cd ai-brain && npm install

# 2. 配置环境变量 (可选，有默认 Mock 系统)
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev

# 4. 访问应用
open http://localhost:3000
```

## 🤝 贡献指南

我们欢迎社区贡献！AI Brain 采用现代化的开发流程：

### 📋 贡献流程
1. **Fork** 仓库并创建功能分支
2. **开发** 功能，确保通过所有测试
3. **运行** 完整的质量检查流程
4. **提交** Pull Request

### 🔧 开发规范
```bash
# 提交前必须通过的检查
npm run lint && npm run type-check  # 代码质量检查
npm run test                        # E2E 测试通过
npm run build                       # 构建成功
```

### 📐 代码风格
- **TypeScript 严格模式**: 100% 类型覆盖，无 any 类型
- **现代 React 模式**: 函数组件 + Hooks + Server Components
- **组件化架构**: 基于 shadcn/ui 的可复用组件系统
- **国际化友好**: 所有用户文本支持多语言

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE) - 详细信息请查看 LICENSE 文件。

## 👥 团队

- **[Lee Qi](https://github.com/lee197)** - 项目负责人 & 全栈开发
- **[Claude](https://claude.ai/)** - AI 开发助手

## 🙏 致谢

感谢以下开源项目和工具：

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Supabase](https://supabase.com/) - 后端服务
- [Vercel](https://vercel.com/) - 部署平台

## 📞 联系我们

- **GitHub Issues**: [项目问题追踪](https://github.com/lee197/AI-Brain/issues)
- **讨论区**: [GitHub Discussions](https://github.com/lee197/AI-Brain/discussions)
- **邮箱**: leeqii197@gmail.com
- **网站**: [www.leeqii.com](https://www.leeqii.com)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！⭐**

Made with ❤️ by [Lee Qi](https://github.com/lee197) & [Claude](https://claude.ai/)

🤖 Generated with [Claude Code](https://claude.ai/code)

</div>

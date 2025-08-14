# 🤖 AI Brain - 智能工作助手

<div align="center">

![AI Brain Logo](https://github.com/lee197/AI-Brain/assets/11969113/placeholder-logo)

**AI Brain 是一个企业级智能工作助手，集成多种企业工具（Slack、Jira、GitHub、Google Workspace），通过 AI 驱动的自然语言查询和自动化工作流程，为团队节省每周 8-10 小时的工作时间。**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

[🚀 在线体验](#-快速开始) • [📖 文档](#-项目文档) • [🎯 功能特性](#-核心功能) • [🛠️ 技术栈](#️-技术栈)

</div>

---

## 🎯 项目概述

AI Brain 旨在革命性地改变企业团队的工作方式，通过智能化的 AI 助手实现：

- **🔄 工具集成**: 一站式访问 Slack、Jira、GitHub、Google Workspace 等企业工具
- **💬 自然语言查询**: 用自然语言跨所有工具进行搜索和操作
- **⚡ 自动化工作流**: AI 驱动的任务自动执行和流程优化
- **🧠 上下文感知**: 基于项目/团队/公司知识的智能响应
- **👥 人机协作**: 人在回路的验证和持续学习机制
- **🔄 实时同步**: 跨平台数据实时同步和更新
- **🔒 权限控制**: 基于角色的安全访问控制

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

### 🔗 多工具集成
- **Slack**: 消息同步、频道管理、自动回复
- **Jira**: 任务创建、状态更新、报告生成  
- **GitHub**: 代码分析、PR 管理、Issue 追踪
- **Google Workspace**: 文档编辑、日历管理、邮件处理

### 🧠 AI 智能特性
- **自然语言处理**: 理解复杂的业务查询和指令
- **上下文记忆**: 基于历史对话和项目背景的智能响应
- **智能推荐**: 基于团队习惯和项目需求的操作建议
- **自动化工作流**: 重复任务的智能自动化执行

### 🌐 用户体验
- **🎨 现代化界面**: 基于 shadcn/ui 的专业企业级设计
- **📱 响应式布局**: 完美适配桌面、平板和移动设备
- **🌏 多语言支持**: 中文/英文双语界面
- **🎨 主题定制**: 明/暗主题切换

## 🛠️ 技术栈

### 核心框架
- **[Next.js 14+](https://nextjs.org/)** - React 全栈框架，App Router
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript 超集
- **[Tailwind CSS](https://tailwindcss.com/)** - 实用优先的 CSS 框架

### UI 组件库
- **[shadcn/ui](https://ui.shadcn.com/)** - 现代化 React 组件库
- **[Lucide React](https://lucide.dev/)** - 美观的图标库
- **[Radix UI](https://www.radix-ui.com/)** - 低级 UI 原语

### 后端服务
- **[Supabase](https://supabase.com/)** - 开源 Firebase 替代方案
  - PostgreSQL 数据库
  - 实时订阅
  - 身份验证
- **[Vercel AI SDK](https://sdk.vercel.ai/)** - AI 集成工具包

### 开发工具
- **[ESLint](https://eslint.org/)** - 代码质量检查
- **[Prettier](https://prettier.io/)** - 代码格式化
- **[Husky](https://typicode.github.io/husky/)** - Git hooks

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

## 📁 项目结构

```
AI-Brain/
├── 📱 app/                          # Next.js App Router 页面
│   ├── (auth)/                      # 认证相关页面
│   │   ├── login/                   # 登录页面
│   │   └── signup/                  # 注册页面
│   ├── (dashboard)/                 # 主应用页面
│   ├── api/                         # API 路由
│   └── ui-demo/                     # UI 组件演示
├── 🎨 components/                   # React 组件
│   ├── ui/                          # shadcn/ui 基础组件
│   ├── language-switcher.tsx        # 语言切换器
│   └── user-menu.tsx               # 用户菜单
├── 🔧 lib/                          # 工具函数和配置
│   ├── auth-actions.ts              # 认证操作
│   ├── i18n/                        # 国际化配置
│   ├── mock-auth.ts                 # 模拟认证系统
│   └── supabase/                    # Supabase 配置
├── 🎯 hooks/                        # React Hooks
├── 🔷 types/                        # TypeScript 类型定义
├── ⚙️ middleware.ts                 # 路由中间件
└── 📄 配置文件
    ├── next.config.ts               # Next.js 配置
    ├── tailwind.config.ts           # Tailwind 配置
    └── components.json              # shadcn/ui 配置
```

## 🌟 特色亮点

### 🔐 智能认证系统
- **双模式支持**: 开发环境的模拟认证 + 生产环境的 Supabase 认证
- **无缝切换**: 通过环境变量一键切换认证模式
- **安全设计**: 服务端/客户端分离的认证架构

### 🎨 现代化设计
- **企业级 UI**: 专业、简洁、现代的界面设计
- **组件化架构**: 高度可复用的模块化组件设计
- **响应式布局**: 完美适配各种屏幕尺寸

### 🌏 国际化支持
- **多语言界面**: 完整的中英文双语支持
- **动态切换**: 实时语言切换，无需刷新页面
- **扩展性强**: 易于添加新语言支持

## 🚦 开发工作流

### 🔨 本地开发
```bash
# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 构建生产版本
npm run build
```

### 🧪 UI 组件开发
访问 [http://localhost:3000/ui-demo](http://localhost:3000/ui-demo) 查看和测试所有 UI 组件。

### 📊 项目状态

| 功能模块 | 状态 | 完成度 |
|---------|------|--------|
| 🔐 认证系统 | ✅ 完成 | 100% |
| 🎨 UI 界面 | ✅ 完成 | 100% |
| 🌏 国际化 | ✅ 完成 | 100% |
| 🔗 Slack 集成 | 🚧 开发中 | 30% |
| 📋 Jira 集成 | 📋 计划中 | 0% |
| 🐙 GitHub 集成 | 📋 计划中 | 0% |
| 📊 Google Workspace | 📋 计划中 | 0% |

## 🤝 贡献指南

我们欢迎社区贡献！请查看以下指南：

1. **Fork** 此仓库
2. **创建** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 变更 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **打开** Pull Request

### 🎨 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 规则
- 组件使用函数式编程范式
- 优先使用 Server Components

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

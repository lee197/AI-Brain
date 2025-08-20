# AI Brain - Claude Code Development Guide

## 🎯 Project Overview

AI Brain is an intelligent workplace assistant that integrates with enterprise tools (Slack, Jira, GitHub, Google Workspace) to centralize knowledge, automate workflows, and provide AI-powered assistance to teams.

**Core Value**: Save 8-10 hours per week by enabling AI-human pairing as the default working style.

## 📊 Current Implementation Status

### ✅ Completed Features

#### Core Infrastructure
- **Next.js 15 + TypeScript** - App Router架构完成
- **Mock Authentication System** - 开发环境认证系统，支持admin@aibrain.com/demo@aibrain.com
- **Bilingual Support (i18n)** - 完整的中英文切换系统
- **UI Component System** - shadcn/ui组件库集成完成
- **Dark Mode Support** - 主题切换功能就绪

#### Context Workspace System  
- **Context Management** - 工作空间创建、切换、管理
- **Context Types** - PROJECT/TEAM/DEPARTMENT/CLIENT/PERSONAL五种类型
- **Member Management** - 成员权限系统（owner/admin/member/viewer）
- **Context Dashboard** - 独立的工作空间聊天界面

#### AI Chat System
- **ChatGPT-Style Interface** - 完整的对话界面实现
  - 可折叠侧边栏 (280px宽度)
  - 快速提示词卡片 (6个常用提示)
  - 数据源状态指示器
  - 消息气泡样式 (用户/AI/Slack消息区分)
- **Multi-Model Support**
  - Google Gemini API (优先使用，免费额度)
  - OpenAI API (备选)
  - 智能降级机制
  - Mock响应系统 (无API时智能回复)
- **Real-time Features**
  - 打字指示器动画
  - 自动滚动到最新消息
  - 消息时间戳显示

#### Slack Integration (Partial)
- **OAuth Authentication Flow** - Slack App安装流程
- **API Client** - SlackWebApi封装类
- **Channel Management** - 频道列表获取和选择
- **Message Sending** - 发送消息到指定频道
- **Status Checking** - 连接状态检查端点
- **Demo Mode** - 演示模式支持
- **UI Components**
  - AddToSlackButton - Slack连接按钮
  - SlackSendMessage - 消息发送对话框
  - SlackSuccessToast - 成功提示
  - SlackConnectionToggle - 连接状态切换

#### Data Source System
- **Integration Framework** - 数据源配置架构
- **Status Indicators** - 实时状态显示（connected/syncing/error）
- **Configuration Modal** - 数据源配置界面
- **Multi-Source Support** - 支持Slack/Jira/GitHub/Google/Notion

### 🚧 In Progress Features

#### Slack Integration (Advanced)
- [ ] Event Webhook接收 - `/api/webhooks/slack`端点已创建未完成
- [ ] 实时消息同步 - Supabase Realtime订阅已配置未测试
- [ ] 消息历史存储 - 数据库表已设计未实现
- [ ] Bot消息响应 - 事件处理器框架已搭建

#### Other Integrations
- [ ] Jira连接器 - UI已完成，API未实现
- [ ] GitHub集成 - UI已完成，API未实现
- [ ] Google Workspace - UI已完成，API未实现
- [ ] Notion集成 - UI已完成，API未实现

### ❌ Not Started Features

- **Supabase Integration** - 数据库连接未配置
- **Vector Search (RAG)** - 知识库系统未实现
- **Workflow Automation** - 自动化工作流未开始
- **Analytics Dashboard** - 数据分析面板未开始
- **Production Deployment** - Vercel部署未配置

## 🛠 Technology Stack

```yaml
Framework: Next.js 15.4.6
Language: TypeScript 5.x (strict mode)
UI: shadcn/ui + Tailwind CSS 4
State: React Hooks + Context API
AI: Vercel AI SDK 5.0.13
Auth: Mock System (dev) / Supabase (prod ready)
Integrations:
  - @slack/web-api 7.9.3
  - jira.js 5.2.2
  - octokit 5.0.3
  - googleapis 156.0.0
  - @notionhq/client 4.0.2
```

## 📁 Project Structure

```
ai-brain/
├── app/
│   ├── (auth)/           # 认证页面 ✅
│   ├── contexts/         # 工作空间管理 ✅
│   │   ├── [id]/page.tsx # ChatGPT风格聊天界面 ✅
│   │   └── new/page.tsx  # 创建工作空间向导 ✅
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts       # AI聊天端点 ✅
│   │   │   └── chat-gemini/route.ts # Gemini API ✅
│   │   ├── slack/        # Slack API端点 (部分完成)
│   │   └── contexts/     # Context CRUD ✅
│   └── dashboard/        # 重定向到contexts ✅
├── components/
│   ├── ui/              # shadcn组件 ✅
│   ├── slack/           # Slack组件 ✅
│   └── language-switcher.tsx # 语言切换 ✅
├── lib/
│   ├── i18n/            # 国际化系统 ✅
│   ├── mock-auth.ts     # 模拟认证 ✅
│   ├── slack/           # Slack集成库 (部分)
│   └── supabase/        # Supabase配置 (未激活)
└── types/               # TypeScript类型定义 ✅
```

## 🔑 Environment Variables

```env
# Current Active Settings
NEXT_PUBLIC_USE_MOCK_AUTH=true  # 使用模拟认证

# AI Models (Optional - System works without them)
GEMINI_API_KEY=your-key         # Google Gemini (推荐)
OPENAI_API_KEY=your-key         # OpenAI GPT

# Slack Integration (Optional)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-secret

# Supabase (Ready but not required)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
# Login with: admin@aibrain.com / admin123
```

## 🎨 UI Implementation Details

### ChatGPT-Style Interface ✅
- **Collapsible Sidebar**: 280px → 64px with animation
- **Quick Prompts**: 6 cards with icons and hover effects
- **Data Source Status**: Real-time connection indicators
- **Message Bubbles**: User (blue/right), AI (gray/left), Slack (purple/left)
- **Input Area**: Multi-line textarea with Send button
- **Responsive Design**: Mobile-friendly with drawer mode

### Component Library
- 20+ shadcn/ui components integrated
- Custom theme with blue-purple gradient
- Dark mode with smooth transitions
- Consistent spacing and typography

## 📝 Code Patterns

### API Routes
```typescript
// Zod validation ✅
// Error handling ✅
// Mock/Real mode switching ✅
```

### Component Pattern
```typescript
// 'use client' directives ✅
// cn() utility for className merging ✅
// TypeScript interfaces ✅
```

### i18n Pattern
```typescript
// useLanguage() hook ✅
// Language persistence in localStorage ✅
// Complete zh/en translations ✅
```

## 🔧 Development Commands

```bash
npm run dev          # Start development
npm run build        # Build production
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm run format       # Prettier format
```

## 📋 Next Priority Tasks

### 1. Complete Slack Integration
- [ ] Implement webhook event receiver
- [ ] Test real-time message sync
- [ ] Add message persistence to database

### 2. Activate Supabase
- [ ] Configure database connection
- [ ] Run migration scripts
- [ ] Switch from mock to real auth

### 3. Implement RAG System
- [ ] Set up vector database
- [ ] Implement embedding generation
- [ ] Add semantic search

### 4. Production Deployment
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Deploy and test

## 🐛 Known Issues

1. **Slack Webhook** - URL verification not fully tested
2. **Message Persistence** - Currently only in-memory
3. **Real-time Sync** - Supabase Realtime not connected
4. **OAuth Callback** - Redirect URLs need production config

## 💡 Development Tips

1. **Mock Mode First** - Develop features using mock data
2. **Type Safety** - Use TypeScript strictly
3. **Component Reuse** - Leverage existing UI components
4. **i18n Always** - Add translations for new features
5. **Error Boundaries** - Handle failures gracefully

## 🎯 Success Metrics

- ✅ Page load < 1s
- ✅ TypeScript coverage 100%
- ✅ Responsive design
- ✅ Bilingual support
- ⏳ API response < 200ms (depends on external APIs)
- ⏳ Real-time sync < 3s (pending implementation)

---

**Current Focus**: The project has a solid foundation with excellent UI/UX. Priority should be on completing Slack integration and activating the database layer for production readiness.
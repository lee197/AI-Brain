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

## 🏗️ Message Flow Architecture

### 📨 Core Message Flow Principles

**重要架构原则 (Critical Architecture Principles):**

1. **消息源 → 数据库 → UI展示 (Message Source → Database → UI Display)**
   - 所有消息源（Slack, Jira, GitHub等）发送的消息必须实时进入数据库
   - 消息不可以直接实时进入AI聊天界面
   - 每个数据源都有独立的实时消息展示界面

2. **分离的界面系统 (Separated Interface System)**
   - **AI聊天界面**: `/contexts/[id]/page.tsx` - 仅用于用户查找insights，不显示实时消息
   - **实时消息界面**: `/contexts/[id]/[source]/messages/page.tsx` - 专门显示各数据源的实时消息流

3. **数据流向 (Data Flow)**
   ```
   Webhook → Database Storage → Real-time UI Display
                 ↓
            AI Context Reading (on-demand)
   ```

### 🔄 Message Processing Pipeline

```typescript
// 1. Webhook接收消息
POST /api/webhooks/slack
  ↓
// 2. 存储到数据库
storeSlackMessage(contextId, message)
  ↓ 
// 3. 广播到实时界面（非AI界面）
broadcast to /contexts/[id]/slack/messages
  ↓
// 4. AI按需读取上下文
loadSlackMessages(contextId) // when user asks AI
```

### 📱 Interface Separation

1. **AI Chat Interface** (`/contexts/[id]/page.tsx`)
   - 用途：用户与AI对话，查找insights
   - 特点：不显示实时消息流
   - 数据源：按需从数据库读取上下文

2. **Real-time Message Interfaces** (`/contexts/[id]/slack/messages/page.tsx`)
   - 用途：实时显示各数据源的消息流
   - 特点：实时订阅数据库变化
   - 数据源：Supabase Realtime订阅

### 🎯 Implementation Guidelines

- **Webhook处理器**: 只负责存储到数据库，不直接推送到AI界面
- **实时订阅**: 仅在数据源专属界面中使用Supabase Realtime
- **AI上下文**: 通过数据库查询按需获取，不依赖实时推送
- **用户体验**: 用户在实时界面查看消息，在AI界面分析insights

## 📊 Data Source Implementation Pattern

### 🔧 Slack 数据源实现架构分析

基于当前 Slack 集成的完整实现，为后续数据源（Jira、GitHub、Google、Notion等）提供标准化开发模式。

### 🏗️ 架构层次结构

#### 1. **API Client Layer** (`lib/[source]/api-client.ts`)
```typescript
export class SlackWebApi {
  private client: WebClient | null
  private botToken: string
  
  // 核心方法
  async getUserInfo(userId: string)
  async getChannelInfo(channelId: string) 
  async getChannelList()
  async sendMessage(options)
  async verifyConnection()
  
  // Mock模式支持
  private getMockUserInfo(userId: string)
  private getMockChannelList()
}
```

**关键特性:**
- **开发时双模式**: 开发阶段支持真实API + Mock模式
- **生产环境单一模式**: 生产环境只使用真实API，移除所有Mock代码
- **明确错误处理**: API失败时抛出错误，由UI层显示错误界面
- **连接验证**: 提供连接状态检测
- **统一接口**: 标准化的方法命名和参数

#### 2. **Database Storage Layer** (`lib/[source]/database-storage.ts`)
```typescript
// 数据存储接口
export async function store[Source]Message(contextId: string, message: Message): Promise<boolean>
export async function load[Source]Messages(contextId: string, options?): Promise<{messages: [], totalCount: number}>
export async function get[Source]Stats(contextId: string): Promise<Stats>

// 批量操作
export async function importMessagesToDatabase(contextId: string, messages: Message[]): Promise<{success: number, failed: number}>
```

**核心原则:**
- **纯数据库存储**: 完全替代文件存储
- **Service Client**: 使用 `createServiceClient()` 绕过RLS策略
- **Upsert策略**: 防止重复数据，支持更新
- **关联管理**: 自动维护用户、频道、消息的关联关系

#### 3. **Event Processing Layer** (`lib/[source]/event-processor.ts`)
```typescript
export async function process[Source]Event(event: SourceEvent) {
  // 1. 事件类型分发
  switch (event.type) {
    case 'message': await handleMessage(event)
    case 'channel_created': await handleChannelCreated(event)
    // ...
  }
}

// 消息处理流程
async function handleMessage(event: MessageEvent) {
  // 1. 验证频道权限
  // 2. 获取用户/频道信息
  // 3. 构建消息对象
  // 4. 存储到数据库
  // 5. (可选) 实时广播
}
```

**处理特性:**
- **Context映射**: 根据频道ID查找对应的contextId
- **权限过滤**: 只处理用户选择的频道消息
- **API降级**: Slack API失败时使用默认值
- **异步处理**: 不阻塞webhook响应

#### 4. **Webhook Handler** (`app/api/webhooks/[source]/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  // 1. 解析请求体
  const body = await req.text()
  const event = JSON.parse(body)
  
  // 2. URL验证挑战
  if (event.type === 'url_verification') {
    return NextResponse.json({ challenge: event.challenge })
  }
  
  // 3. 签名验证
  if (!verifySignature(body, signature, timestamp)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 4. 事件处理
  if (event.type === 'event_callback') {
    await processSourceEvent(event.event)
  }
  
  return NextResponse.json({ ok: true })
}
```

#### 5. **Database Schema** 
```sql
-- 主表结构模式
CREATE TABLE [source]_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [source]_user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,  -- 或 workspace_id/org_id
  username TEXT NOT NULL,
  display_name TEXT,
  real_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE([source]_user_id, team_id)
);

CREATE TABLE [source]_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [source]_message_id TEXT NOT NULL,
  [source]_channel_id TEXT NOT NULL,
  [source]_user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  context_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE([source]_message_id, team_id)
);
```

#### 6. **API Endpoints** (`app/api/[source]/`)
```typescript
// 标准API端点结构
/api/[source]/status          - 连接状态检查
/api/[source]/channels        - 获取频道/项目列表
/api/[source]/messages        - 获取消息历史
/api/[source]/send-message    - 发送消息
/api/[source]/configure       - 配置管理
/api/[source]/disconnect      - 断开连接
```

#### 7. **UI Components** (`components/[source]/`)
```typescript
// 标准组件模式
[Source]ConnectionToggle      - 连接状态切换
[Source]SendMessage          - 消息发送对话框
[Source]ChannelSelector      - 频道/项目选择器
[Source]IntegrationManager   - 配置管理界面
Add[Source]Button           - 连接授权按钮
```

#### 8. **Real-time Display** (`app/contexts/[id]/[source]/messages/page.tsx`)
```typescript
// 实时消息展示界面
- 统计卡片显示
- 搜索和过滤功能
- 时间线消息列表
- 自动刷新功能
- 响应式设计
```

### 🎯 标准化模式要点

#### **技术栈统一**
- **API Client**: 对应的官方SDK (如 @slack/web-api, jira.js, octokit等)
- **Database**: Supabase with Service Client
- **UI**: shadcn/ui components + Tailwind
- **State**: React hooks + local state
- **Validation**: Zod schemas

#### **开发模式**
- **Mock优先开发**: 先实现Mock模式进行开发，完成后移除Mock代码
- **生产环境纯净**: 生产环境不保留Mock代码，API错误直接显示错误界面
- **渐进增强**: 基础功能 → 高级功能 → 优化
- **明确错误处理**: API失败时显示错误状态，不使用Mock数据误导用户
- **日志详细**: 完整的操作日志记录

#### **数据流模式**
```
外部Webhook → 事件处理器 → 数据库存储 → 实时界面显示
                                ↓
                            AI按需读取上下文
```

#### **配置管理**
- **环境变量**: 敏感信息通过环境变量配置
- **Context绑定**: 每个数据源与特定Context关联
- **权限控制**: 用户可选择监听的频道/项目
- **状态持久化**: 配置信息存储在文件系统

#### **安全考虑**
- **签名验证**: 验证webhook请求来源
- **Token管理**: 安全存储和使用API tokens
- **权限隔离**: 不同Context的数据相互隔离
- **输入验证**: 所有外部输入都进行验证

### 🔄 后续数据源开发流程

1. **复制Slack架构**: 按照上述层次创建对应文件
2. **替换API Client**: 使用对应数据源的官方SDK  
3. **适配数据模型**: 根据数据源特点调整数据库schema
4. **实现Mock模式**: 优先实现Mock数据进行开发
5. **配置Webhook**: 设置对应的webhook endpoint
6. **测试集成**: 完整测试数据流和UI显示
7. **移除Mock代码**: 开发完成后删除所有Mock相关代码
8. **错误界面**: 确保API失败时显示合适的错误界面
9. **AI集成**: 在chat-gemini中添加对应的上下文读取

### ⚠️ 生产环境准则

**Mock代码清理清单:**
- [ ] 删除所有 `getMock*()` 方法
- [ ] 移除 `if (!this.client)` 的Mock逻辑分支
- [ ] 确保API失败时直接抛出错误
- [ ] UI层实现完整的错误状态显示
- [ ] 验证所有错误路径都有对应的用户界面

**错误处理原则:**
- 🚫 **禁止**: 在生产环境中使用Mock数据误导用户
- ✅ **正确**: API失败时显示明确的错误信息和重试选项
- ✅ **正确**: 提供用户友好的错误界面和故障排除指引

这个模式确保了所有数据源的实现保持一致性和可维护性，同时在生产环境中保证数据的真实性和错误的透明性。

---

**Current Focus**: The project has a solid foundation with excellent UI/UX. Priority should be on completing Slack integration and activating the database layer for production readiness.
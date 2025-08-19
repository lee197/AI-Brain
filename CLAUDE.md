# AI Brain - Claude Code Development Guide

## 🎯 Project Overview

AI Brain is an intelligent workplace assistant that integrates with enterprise tools (Slack, Jira, GitHub, Google Workspace) to centralize knowledge, automate workflows, and provide AI-powered assistance to teams.

**Core Value**: Save 8-10 hours per week by enabling AI-human pairing as the default working style.

## 📋 Project Context

### Key Features
1. Multi-tool integration (Slack, Jira, GitHub, Google Workspace, etc.)
2. Natural language queries across all connected tools
3. Automated task execution
4. Context-aware AI assistant with project/team/company knowledge
5. Human-in-the-loop validation and learning
6. Real-time data synchronization
7. Role-based access control

### Target Users
- Development teams
- Project managers  
- Enterprise employees
- Executives

## 🛠 Technology Stack

### Core Stack (MUST USE)
```yaml
Framework: Next.js 14+ (App Router)
Language: TypeScript (strict mode)
Database: Supabase (PostgreSQL + Realtime + Auth)
UI: shadcn/ui + Tailwind CSS
AI: Vercel AI SDK + OpenAI/Anthropic APIs
Deployment: Vercel
```

### Required Dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest",
    "ai": "latest",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/anthropic": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "date-fns": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

### Integration SDKs
```yaml
Slack: "@slack/web-api"
GitHub: "octokit"
Jira: "jira.js"
Google: "googleapis"
Notion: "@notionhq/client"
```

## 📁 Project Structure

```
ai-brain/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx       # 登录页面
│   │   ├── signup/page.tsx      # 注册页面
│   │   └── layout.tsx           # 认证布局
│   ├── (dashboard)/
│   │   └── page.tsx             # 对话式Dashboard (简化版)
│   ├── contexts/
│   │   ├── page.tsx             # Context选择/管理页面
│   │   └── new/page.tsx         # Context创建页面
│   ├── dashboard/page.tsx       # 主Dashboard工作空间
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts    # AI聊天API (智能路由)
│   │   │   └── analyze/route.ts # 数据分析API
│   │   └── contexts/
│   │       ├── route.ts         # Context CRUD
│   │       └── [id]/
│   │           ├── route.ts     # 单个Context操作
│   │           └── members/route.ts # 成员管理
│   ├── page.tsx                 # 公共首页
│   └── layout.tsx               # 根布局
├── components/
│   ├── ui/                      # shadcn/ui组件
│   │   ├── markdown.tsx         # ✨ Markdown渲染组件
│   │   ├── alert-dialog.tsx     # 确认对话框
│   │   ├── tabs.tsx             # 标签页组件
│   │   └── separator.tsx        # 分割线
│   ├── create-context-dialog.tsx # Context创建对话框
│   ├── delete-context-dialog.tsx # Context删除确认
│   ├── data-source-selector.tsx  # 数据源选择器
│   └── data-source-config-modal.tsx # 数据源配置
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # 浏览器端客户端
│   │   └── server.ts            # 服务端客户端
│   ├── ai/
│   │   └── data-analyzer.ts     # ✨ 智能数据分析引擎
│   ├── mock-auth.ts             # ✨ 模拟认证系统
│   ├── auth-actions.ts          # 认证操作
│   ├── context-utils.ts         # Context工具函数
│   ├── mock-storage.ts          # 本地存储模拟
│   ├── i18n/
│   │   └── translations.ts      # ✨ 国际化翻译系统
│   └── utils.ts                 # 通用工具函数
├── types/
│   ├── database.ts              # Supabase数据库类型
│   └── context.ts               # Context类型定义
├── docs/
│   └── ai-architecture.md       # ✨ AI系统架构文档
└── middleware.ts                # 路由中间件
```

### 🆕 新增核心文件说明

- **✨ 标记的文件** 为新实现的核心功能
- **模拟认证系统** (`lib/mock-auth.ts`) - 开发环境快速测试
- **AI数据分析引擎** (`lib/ai/data-analyzer.ts`) - 自主智能分析
- **国际化系统** (`lib/i18n/translations.ts`) - 中英文双语支持
- **Context管理** (`app/contexts/`) - 工作空间管理系统
- **Markdown渲染** (`components/ui/markdown.tsx`) - AI消息格式化

## 🎨 UI/UX Guidelines

### Design System
- **ALWAYS** use shadcn/ui components
- **NEVER** install additional UI libraries
- Copy components from: https://ui.shadcn.com/
- Use Tailwind CSS for all styling
- Dark mode support required

### Component Creation
```tsx
// ALWAYS use this pattern for components
import { cn } from "@/lib/utils"

interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn("default-classes", className)}>
      {children}
    </div>
  )
}
```

### Color Palette
```css
/* Use CSS variables from globals.css */
--primary: AI Brain brand color (blue/purple gradient)
--secondary: Supporting color
--success: Green for successful actions
--warning: Yellow for warnings
--danger: Red for errors
```

## 🔧 Development Patterns

### 1. API Route Pattern
```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Input validation schema
const requestSchema = z.object({
  field: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await req.json()
    const validated = requestSchema.parse(body)

    // 3. Business logic
    const result = await processRequest(validated)

    // 4. Return response
    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 2. Database Pattern
```typescript
// Always use Supabase with proper types
import { Database } from '@/types/database'

const supabase = createClient<Database>()

// Fetch with error handling
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)

if (error) throw error
```

### 3. AI Integration Pattern
```typescript
// lib/ai/tools.ts
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'

export async function processAIRequest(prompt: string) {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [{ role: 'user', content: prompt }],
    tools: {
      createJiraTicket: tool({
        description: 'Create a Jira ticket',
        parameters: z.object({
          title: z.string(),
          description: z.string(),
        }),
        execute: async ({ title, description }) => {
          // Integration logic
          return await createJiraTicket({ title, description })
        },
      }),
    },
  })
  
  return result
}
```

### 4. Real-time Updates
```typescript
// Use Supabase Realtime for live updates
useEffect(() => {
  const channel = supabase
    .channel('room1')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      // Handle new message
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## 📊 Database Schema

### Core Tables
```sql
-- Users (handled by Supabase Auth)

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Organizations
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member',
  PRIMARY KEY (user_id, organization_id)
);

-- Contexts (Workspaces)
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PROJECT', 'TEAM', 'DEPARTMENT', 'CLIENT', 'PERSONAL')),
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  settings JSONB DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members (Context members)
CREATE TABLE team_members (
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (context_id, user_id)
);

-- Data Sources (Integration configurations)
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'jira', 'github', 'google', 'notion')),
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- encrypted configuration
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'syncing')),
  last_sync_at TIMESTAMPTZ,
  sync_frequency INTEGER DEFAULT 300, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations (Legacy - for backward compatibility)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL, -- 'slack', 'jira', 'github', etc.
  config JSONB NOT NULL, -- encrypted tokens/settings
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  context_id UUID REFERENCES contexts(id),
  organization_id UUID REFERENCES organizations(id),
  title TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'create_ticket', 'send_message', etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  integration_id UUID REFERENCES integrations(id),
  data_source_id UUID REFERENCES data_sources(id),
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Knowledge Base (Vector storage for RAG)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  source_id UUID REFERENCES data_sources(id),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings dimension
  metadata JSONB DEFAULT '{}',
  source_type TEXT CHECK (source_type IN ('document', 'message', 'code', 'ticket', 'meeting', 'email')),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX knowledge_base_embedding_idx ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Workflows (Automation)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'schedule', 'event', 'webhook')),
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL, -- workflow steps
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Runs (Execution history)
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB,
  execution_log JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

-- Audit Logs (Security and compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  context_id UUID REFERENCES contexts(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_actions_message ON actions(message_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_knowledge_base_context ON knowledge_base(context_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_data_sources_context ON data_sources(context_id);
```

## 🚀 Implementation Priorities

### Phase 1: Core MVP (Weeks 1-2)
1. ✅ Next.js setup with TypeScript
2. ✅ Supabase authentication
3. ✅ Basic chat interface
4. ✅ OpenAI/Claude integration
5. ✅ Message persistence

### Phase 2: First Integration (Week 3)
1. ✅ Slack integration
2. ✅ Webhook handling
3. ✅ Real-time message sync
4. ✅ Basic action execution

### Phase 3: Multi-tool Support (Week 4)
1. ✅ Jira integration
2. ✅ GitHub integration
3. ✅ Cross-tool queries
4. ✅ Unified search

### Phase 4: Intelligence Layer (Week 5)
1. ✅ Context management
2. ✅ RAG implementation
3. ✅ Smart suggestions
4. ✅ Learning from feedback

### Phase 5: Polish & Deploy (Week 6)
1. ✅ UI/UX refinement
2. ✅ Performance optimization
3. ✅ Security audit
4. ✅ Production deployment

## ⚡ Quick Commands

### Setup New Feature
```bash
# Create new page
mkdir -p app/(dashboard)/feature-name
touch app/(dashboard)/feature-name/page.tsx

# Create API route
mkdir -p app/api/feature-name
touch app/api/feature-name/route.ts

# Add component
touch components/feature-name/component.tsx
```

### Common Patterns
```bash
# Install shadcn component
npx shadcn-ui@latest add [component-name]

# Generate Supabase types
npx supabase gen types typescript --project-id [project-id] > types/database.ts

# Run development
npm run dev

# Build for production
npm run build
```

## 🔒 Security Requirements

1. **NEVER** commit API keys or secrets
2. Use environment variables for all credentials
3. Implement Row Level Security (RLS) in Supabase
4. Validate all user inputs with Zod
5. Use HTTPS for all external API calls
6. Implement rate limiting for API routes
7. Sanitize data before storing in database

## 📝 Code Style Rules

1. **TypeScript**: Always use strict mode
2. **Async/Await**: No callbacks, use modern async patterns
3. **Error Handling**: Always use try-catch blocks
4. **Imports**: Use absolute imports (@/)
5. **Components**: Functional components with hooks only
6. **State Management**: Use React hooks + Zustand for complex state
7. **API Calls**: Always use fetch or SDK methods
8. **Comments**: Add JSDoc comments for complex functions

## 🌐 多语言要求 (Internationalization Requirements)

**重要**: 所有生成的网站内容必须支持中文和英文两种语言。

### 实现要求：
1. **UI 文本**: 所有用户界面文本必须同时提供中文和英文版本
2. **默认语言**: 中文为主要语言，英文为辅助语言
3. **切换功能**: 提供语言切换按钮，允许用户在中英文之间切换
4. **本地存储**: 记住用户的语言偏好设置

## 🤖 AI模型集成指南

### 支持的AI模型

AI Brain支持多种主流AI模型，可根据需求和预算灵活选择：

#### 1. **Google Gemini** 🟢 推荐（免费额度充足）
```env
# 获取地址：https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key

# 免费额度
- 每分钟：60次请求
- 每天：1,500次请求  
- 每月：100万tokens
- 适合：个人项目、开发测试、小型团队
```

#### 2. **OpenAI GPT** 🟡 经典选择
```env
# 获取地址：https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key

# 费用说明
- 新用户：$5免费额度（3个月有效）
- GPT-3.5-turbo：$0.0015/1K tokens（约￥0.01/次对话）
- GPT-4：$0.03/1K tokens（约￥0.20/次对话）
- GPT-4-turbo：$0.01/1K tokens（约￥0.07/次对话）
- 适合：生产环境、商业应用
```

#### 3. **Anthropic Claude** 🔴 高级选择
```env
# 获取地址：https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# 费用说明（无免费额度）
- Claude 3 Haiku：$0.00025/1K tokens（最快）
- Claude 3 Sonnet：$0.003/1K tokens（平衡）
- Claude 3 Opus：$0.015/1K tokens（最强）
- 适合：企业级应用、复杂任务
```

#### 4. **百度文心一言** 🟢 国内选择
```env
# 获取地址：https://console.bce.baidu.com/qianfan/
ERNIE_API_KEY=your-ernie-api-key
ERNIE_SECRET_KEY=your-ernie-secret-key

# 免费额度
- 新用户：200万tokens免费额度
- ERNIE-Bot：￥0.012/千tokens
- ERNIE-Bot-turbo：￥0.008/千tokens
- 适合：国内用户、中文场景
```

#### 5. **阿里通义千问** 🟢 国内选择
```env
# 获取地址：https://dashscope.console.aliyun.com/
QWEN_API_KEY=your-qwen-api-key

# 免费额度
- 新用户：100万tokens免费额度
- Qwen-Max：￥0.02/千tokens
- Qwen-Plus：￥0.008/千tokens
- 适合：国内用户、多模态任务
```

#### 6. **讯飞星火** 🟢 国内选择
```env
# 获取地址：https://console.xfyun.cn/
SPARK_APP_ID=your-spark-app-id
SPARK_API_KEY=your-spark-api-key
SPARK_API_SECRET=your-spark-api-secret

# 免费额度
- 新用户：200万tokens免费额度
- Spark-Lite：免费版本
- Spark-Pro：￥0.018/千tokens
- 适合：国内用户、教育场景
```

#### 7. **Cohere** 🟢 开发者友好
```env
# 获取地址：https://cohere.com/
COHERE_API_KEY=your-cohere-api-key

# 免费额度
- 免费：1000次API调用/月
- Command：$0.0015/1K tokens
- 适合：小型项目、原型开发
```

#### 8. **Hugging Face** 🟢 开源生态
```env
# 获取地址：https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your-hf-api-key

# 免费额度
- 开源模型：完全免费
- 推理API：有速率限制
- 专用端点：按需付费
- 适合：研究项目、开源爱好者
```

### AI模型选择建议

| 使用场景 | 推荐模型 | 理由 |
|---------|---------|------|
| **个人开发测试** | Google Gemini | 免费额度充足，性能优秀 |
| **国内商业应用** | 文心一言/通义千问 | 合规性好，中文优化 |
| **国际商业应用** | OpenAI GPT-4 | 生态完善，性能稳定 |
| **企业级应用** | Claude 3 | 上下文长，推理能力强 |
| **低成本方案** | Gemini + 讯飞星火 | 结合使用免费额度 |
| **开源项目** | Hugging Face | 模型选择多，社区活跃 |

### 配置优先级

系统会按以下优先级选择可用的AI模型：

```typescript
// lib/ai/model-selector.ts
const AI_MODEL_PRIORITY = [
  'GEMINI_API_KEY',      // 优先使用Gemini（免费）
  'OPENAI_API_KEY',       // 其次OpenAI（主流）
  'QWEN_API_KEY',         // 国内通义千问
  'ERNIE_API_KEY',        // 国内文心一言
  'ANTHROPIC_API_KEY',    // Claude（高级）
  'COHERE_API_KEY',       // Cohere（备选）
  'HUGGINGFACE_API_KEY',  // HuggingFace（开源）
]
```

### 快速开始

1. **零配置启动**（使用智能模拟回复）
```bash
npm run dev
# 系统自动使用内置的智能回复系统
```

2. **配置免费模型**（推荐）
```bash
# 1. 获取Gemini API密钥
# 访问：https://makersuite.google.com/app/apikey

# 2. 更新.env.local
GEMINI_API_KEY=你的实际密钥

# 3. 重启服务
npm run dev
```

3. **配置多个模型**（高级）
```bash
# 配置多个API密钥，系统自动切换
GEMINI_API_KEY=xxx
OPENAI_API_KEY=xxx
QWEN_API_KEY=xxx
```

### API调用示例

```typescript
// 前端调用
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '用户消息',
    contextId: 'workspace-id',
    preferredModel: 'gemini', // 可选：指定优先使用的模型
  }),
})

// 后端智能路由
// 系统会自动选择可用的最佳模型
// 如果所有API都不可用，降级到智能模拟回复
```

### 成本控制建议

1. **开发阶段**：使用Gemini免费额度或智能模拟
2. **测试阶段**：混合使用多个免费额度
3. **生产阶段**：根据实际需求选择付费模型
4. **成本优化**：
   - 实现响应缓存
   - 使用流式输出减少token消耗
   - 根据任务复杂度动态选择模型

### 文本示例格式：
```typescript
// 使用 i18n 对象存储多语言文本
const i18n = {
  zh: {
    welcome: "欢迎使用 AI Brain",
    login: "登录",
    signup: "注册",
    dashboard: "仪表板",
  },
  en: {
    welcome: "Welcome to AI Brain",
    login: "Login",
    signup: "Sign Up",
    dashboard: "Dashboard",
  }
}

// 组件中使用
<h1>{i18n[currentLang].welcome}</h1>
```

### 内容生成规则：
- **按钮文本**: 简洁明了，中英文对应准确
- **提示信息**: 友好清晰，符合各自语言习惯
- **错误消息**: 准确描述问题，提供解决建议
- **帮助文档**: 完整的双语文档支持

### 注意事项：
- 避免硬编码文本，所有文本应从语言配置文件中读取
- 确保翻译准确、自然，符合语言习惯
- 界面布局应适应不同语言的文本长度差异
- 日期、时间、数字格式应根据语言环境适配

## 🧪 Testing Strategy

```typescript
// Use these patterns for testing
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright
- API tests: Supertest
```

## 🔌 Slack集成架构 - Events API方案

### 实时消息接收实现方案

AI Brain采用**Slack Events API (HTTP Webhook)**方案实现Slack消息的实时接收和处理。

#### 🏗️ 技术架构

```
Slack Workspace → Events API → AI Brain Webhook → Supabase → 前端实时更新
     (消息)        (HTTP POST)     (处理&存储)      (Realtime)    (用户界面)
```

#### 📡 Webhook接收端点

```typescript
// app/api/webhooks/slack/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-slack-signature')
  
  // 1. 验证Slack请求签名
  if (!verifySlackSignature(body, signature)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  // 2. 处理URL验证挑战
  if (event.type === 'url_verification') {
    return NextResponse.json({ challenge: event.challenge })
  }
  
  // 3. 处理实际事件
  if (event.type === 'event_callback') {
    await processSlackEvent(event.event)
  }
  
  return NextResponse.json({ ok: true })
}
```

#### 🔐 签名验证机制

```typescript
// lib/slack/signature-verification.ts
import crypto from 'crypto'

export function verifySlackSignature(body: string, signature: string): boolean {
  const timestamp = Date.now() / 1000
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  
  // 防重放攻击 - 请求不能超过5分钟
  if (Math.abs(timestamp - parseInt(req.headers.get('x-slack-request-timestamp')!)) > 300) {
    return false
  }
  
  // 生成预期签名
  const baseString = `v0:${timestamp}:${body}`
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`
  
  return crypto.timingSafeEqual(
    Buffer.from(signature), 
    Buffer.from(expectedSignature)
  )
}
```

#### 📝 事件处理逻辑

```typescript
// lib/slack/event-processor.ts
export async function processSlackEvent(event: SlackEvent) {
  switch (event.type) {
    case 'message':
      if (!event.bot_id && event.text) {
        await handleSlackMessage(event)
      }
      break
      
    case 'channel_created':
      await handleChannelCreated(event)
      break
      
    case 'member_joined_channel':
      await handleMemberJoined(event)
      break
  }
}

async function handleSlackMessage(event: SlackMessageEvent) {
  // 1. 获取用户和频道信息
  const [userInfo, channelInfo] = await Promise.all([
    getSlackUserInfo(event.user),
    getSlackChannelInfo(event.channel)
  ])
  
  // 2. 存储到Supabase
  const { data: message } = await supabase
    .from('slack_messages')
    .insert({
      message_id: event.ts,
      channel_id: event.channel,
      channel_name: channelInfo.name,
      user_id: event.user,
      user_name: userInfo.name,
      user_avatar: userInfo.profile.image_72,
      text: event.text,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      context_id: await getContextIdByChannel(event.channel)
    })
    .select()
    .single()
  
  // 3. 实时广播给前端
  await supabase
    .channel(`context-${message.context_id}`)
    .send({
      type: 'broadcast',
      event: 'slack_message_received',
      payload: message
    })
}
```

#### 🗄️ 数据库Schema扩展

```sql
-- Slack消息表
CREATE TABLE slack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE NOT NULL, -- Slack timestamp作为唯一ID
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  user_id TEXT NOT NULL, -- Slack用户ID
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  thread_ts TEXT, -- 线程消息
  reply_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack频道映射表
CREATE TABLE slack_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  topic TEXT,
  purpose TEXT,
  member_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack用户缓存表
CREATE TABLE slack_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL, -- Slack用户ID
  real_name TEXT,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  timezone TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_slack_messages_context ON slack_messages(context_id);
CREATE INDEX idx_slack_messages_channel ON slack_messages(channel_id);
CREATE INDEX idx_slack_messages_timestamp ON slack_messages(timestamp DESC);
CREATE INDEX idx_slack_channels_context ON slack_channels(context_id);
```

#### 🎯 前端实时订阅

```typescript
// 在聊天界面订阅Slack消息
useEffect(() => {
  const channel = supabase
    .channel(`context-${contextId}`)
    .on('broadcast', { event: 'slack_message_received' }, (payload) => {
      const slackMessage = payload.payload
      
      // 添加到消息列表
      setMessages(prev => [...prev, {
        id: slackMessage.id,
        content: slackMessage.text,
        source: 'slack',
        author: {
          name: slackMessage.user_name,
          avatar: slackMessage.user_avatar
        },
        channel: slackMessage.channel_name,
        timestamp: new Date(slackMessage.timestamp),
        metadata: {
          channelId: slackMessage.channel_id,
          messageId: slackMessage.message_id
        }
      }])
      
      // 滚动到最新消息
      scrollToBottom()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [contextId])
```

#### ⚙️ Slack App配置要求

```yaml
# Slack App配置清单

OAuth & Permissions:
  Bot Token Scopes:
    - channels:read      # 读取公开频道信息
    - groups:read        # 读取私有频道信息  
    - users:read         # 读取用户信息
    - chat:write         # 发送消息(可选)
    - files:read         # 读取文件(可选)

Event Subscriptions:
  Request URL: https://your-domain.com/api/webhooks/slack
  Subscribe to Bot Events:
    - message.channels   # 公开频道消息
    - message.groups     # 私有频道消息
    - channel_created    # 频道创建
    - member_joined_channel # 成员加入

App-Level Tokens:
  - connections:write  # Socket Mode (备用)
```

#### 🔧 环境变量配置

```env
# Slack Events API 配置
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret

# Webhook配置
SLACK_WEBHOOK_URL=https://your-domain.com/api/webhooks/slack
```

#### 🚀 部署注意事项

1. **HTTPS要求**: Slack仅支持HTTPS webhook
2. **响应时间**: Webhook必须在3秒内响应
3. **重试机制**: Slack会重试失败的请求
4. **速率限制**: 注意Slack API调用频率限制
5. **错误处理**: 记录所有错误日志便于调试

#### 📊 性能优化策略

```typescript
// 批量处理优化
const MESSAGE_BATCH_SIZE = 10
const MESSAGE_BATCH_TIMEOUT = 1000 // 1秒

class SlackMessageProcessor {
  private messageQueue: SlackMessage[] = []
  private batchTimer?: NodeJS.Timeout
  
  async queueMessage(message: SlackMessage) {
    this.messageQueue.push(message)
    
    if (this.messageQueue.length >= MESSAGE_BATCH_SIZE) {
      await this.processBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), MESSAGE_BATCH_TIMEOUT)
    }
  }
  
  private async processBatch() {
    if (this.messageQueue.length === 0) return
    
    const batch = this.messageQueue.splice(0, MESSAGE_BATCH_SIZE)
    
    // 批量插入数据库
    await supabase
      .from('slack_messages')
      .insert(batch)
    
    // 批量广播
    await this.broadcastBatch(batch)
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }
  }
}
```

#### 🎯 集成优势

- ✅ **真实时**: 1-3秒延迟接收Slack消息
- ✅ **高可靠**: HTTP协议稳定，易于调试
- ✅ **可扩展**: Vercel原生支持，自动扩容
- ✅ **低成本**: 无持久连接开销
- ✅ **易维护**: 标准REST API模式

这套架构确保AI Brain能够实时接收和处理Slack消息，为用户提供无缝的跨平台协作体验。

## 📚 Key Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Slack Events API](https://api.slack.com/events-api)

## 🔑 Development Credentials

### GitHub Repository
- **Repository URL**: https://github.com/lee197/AI-Brain.git
- **Personal Access Token**: `[STORED_LOCALLY_IN_GIT_CREDENTIALS]`
- **Remote Setup**: 
  ```bash
  # Set up with your personal access token
  git remote add origin https://YOUR_TOKEN@github.com/lee197/AI-Brain.git
  
  # Or configure git credential helper to store token securely
  git config credential.helper store
  ```

### Token Security Notes
- 🔒 Personal access tokens should NEVER be committed to repositories
- 💾 Store tokens locally in `~/.git-credentials` or use credential managers
- 🔄 Tokens can be regenerated if compromised
- ⏰ Set appropriate expiration dates for security

### Demo Authentication Credentials
- **Admin Account**: admin@aibrain.com / admin123
- **Demo Account**: demo@aibrain.com / demo123

### Environment Variables Template
```env
# Mock Authentication (for development)
NEXT_PUBLIC_USE_MOCK_AUTH=true

# Supabase (for production)
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🔧 Supabase设置指南

### 1. 创建Supabase项目
```bash
# 1. 访问 https://supabase.com 创建新项目
# 2. 记录项目URL和API密钥
# 3. 在 SQL编辑器 中执行以下步骤
```

### 2. 启用必要扩展
```sql
-- 启用向量存储扩展 (用于RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 启用UUID生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. 创建数据库表
```bash
# 在Supabase SQL编辑器中执行 CLAUDE.md 中的完整Schema
# 包含所有表: organizations, contexts, messages, 等
```

### 4. 配置环境变量
```env
# 复制到 .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. 生成TypeScript类型
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

## 🎭 模拟认证系统

### 开发环境快速测试
```env
# 启用模拟认证 (跳过Supabase Auth)
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### 测试账户
```typescript
// 内置测试账户 (lib/mock-auth.ts)
{
  email: "admin@aibrain.com",
  password: "admin123",
  name: "系统管理员"
},
{
  email: "demo@aibrain.com", 
  password: "demo123",
  name: "演示用户"
}
```

### 切换到生产认证
```env
# 禁用模拟认证，使用真实Supabase
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

## 🌐 Context工作空间系统

### Context类型
```typescript
type ContextType = 
  | 'PROJECT'    // 项目工作空间
  | 'TEAM'       // 团队工作空间  
  | 'DEPARTMENT' // 部门工作空间
  | 'CLIENT'     // 客户工作空间
  | 'PERSONAL'   // 个人工作空间
```

### 权限级别
```typescript
type Role = 
  | 'owner'   // 拥有者 - 完全控制
  | 'admin'   // 管理员 - 管理成员和设置
  | 'member'  // 成员 - 正常使用功能
  | 'viewer'  // 查看者 - 只读权限
```

### 数据源集成
- Slack - 团队沟通数据
- Jira - 项目管理数据
- GitHub - 代码仓库数据
- Google Workspace - 文档和日历
- Notion - 知识库文档

## 🌍 国际化系统

### 支持语言
- 🇨🇳 中文 (默认)
- 🇺🇸 English

### 添加新翻译
```typescript
// lib/i18n/translations.ts
export const translations = {
  zh: {
    newKey: "中文翻译"
  },
  en: {
    newKey: "English Translation"  
  }
}
```

### 组件中使用
```tsx
import { useLanguage } from '@/lib/i18n/translations'

function Component() {
  const { t } = useLanguage()
  return <div>{t.newKey}</div>
}
```

## 🤖 AI智能系统架构

### 三层智能架构
```
Layer 3: 外部AI APIs (OpenAI/Anthropic)
    ↓ (如果有API Key)
Layer 2: 智能响应生成 (generateSmartResponse)  
    ↓ (降级机制)
Layer 1: 基础关键词匹配 (默认响应)
```

### 智能路由
```typescript
// 关键词 → 功能路由
"数据源" → 数据源健康分析
"任务"   → 任务管理洞察  
"团队"   → 团队表现分析
"工作"   → 项目状态评估
```

### 数据分析引擎
```typescript
// lib/ai/data-analyzer.ts
class DataAnalyzer {
  analyzeTeamPerformance()     // 团队表现
  analyzeProjectStatus()       // 项目状态
  analyzeDataSourceHealth()    // 数据源健康
  analyzeTaskManagement()      // 任务分析
  analyzeMeetingSchedule()     // 会议优化
}
```

## 📋 部署检查清单

### 环境变量配置
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已设置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已设置
- [ ] `OPENAI_API_KEY` 已设置 (可选)
- [ ] `ANTHROPIC_API_KEY` 已设置 (可选)
- [ ] `NEXT_PUBLIC_USE_MOCK_AUTH=false` (生产环境)

### 数据库配置
- [ ] 所有表已创建
- [ ] pgvector扩展已启用
- [ ] RLS策略已配置
- [ ] 索引已创建

### 安全检查
- [ ] API路由有认证保护
- [ ] 敏感数据已加密存储
- [ ] CORS策略已配置
- [ ] 错误信息不泄露敏感信息

### 性能优化
- [ ] 图片已优化
- [ ] 数据库查询已优化
- [ ] 客户端组件最小化
- [ ] 缓存策略已实施

## 🔧 开发工作流

### 启动开发环境
```bash
# 1. 克隆项目
git clone https://github.com/lee197/AI-Brain.git

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入真实配置

# 4. 启动开发服务器
npm run dev
```

### 常用命令
```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run type-check   # TypeScript类型检查
npm run lint         # 代码风格检查

# 测试
npm run test         # 运行测试
npm run test:e2e     # E2E测试

# 数据库
npx supabase gen types typescript --project-id [ID] > types/database.ts
```

### Git工作流
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/new-feature

# 创建Pull Request
```

## 🎨 ChatGPT风格界面设计规范

### 界面布局要求
AI Brain的对话界面必须采用ChatGPT风格的设计模式：

#### 左侧边栏 (Sidebar) - 宽度280px-320px
```typescript
// 必须包含以下组件：
1. 顶部品牌区域
   - AI Brain Logo + Context名称
   - 可折叠按钮

2. 快速提示词区域 (Quick Prompts)
   - 6-8个常用提示词卡片
   - 每个卡片包含：图标 + 标题 + 提示内容
   - 点击后自动填充到输入框
   - 示例提示词：
     * "今日安排" - 查看会议和待办事项
     * "创建任务" - 创建Jira任务
     * "项目状态" - 生成进度报告
     * "团队协作" - 通知团队成员
     * "代码审查" - 检查Pull Request
     * "数据分析" - 分析团队表现

3. 数据源状态指示器 (Data Source Status)
   - 显示集成工具的连接状态
   - 支持的数据源：
     * Slack (聊天数据)
     * Jira (任务管理)
     * GitHub (代码仓库) 
     * Google Workspace (文档/日历)
     * Notion (知识库)
   - 状态类型：
     * 已连接 (绿色CheckCircle图标)
     * 同步中 (黄色Clock图标)
     * 连接错误 (红色AlertCircle图标)

4. 底部用户信息
   - 用户头像 + 姓名 + 邮箱
   - 设置按钮
```

#### 主对话区域 (Main Chat Area)
```typescript
// 布局结构：
1. 顶部标题栏
   - Context图标 + 名称 + 描述
   - 搜索按钮 + 语言切换 + 用户菜单

2. 对话内容区域 (可滚动)
   - AI消息：左对齐，圆形头像，灰色背景气泡
   - 用户消息：右对齐，用户头像，蓝色背景气泡
   - 时间戳显示在消息下方

3. 底部输入区域
   - 多行文本框 (支持Shift+Enter换行)
   - 发送按钮 (Enter键发送)
   - 快速开始标签 (显示3个热门提示词)
```

### 设计系统要求

#### 颜色方案
```css
/* 主色调 */
--primary-blue: #2563eb
--primary-purple: #7c3aed
--gradient-primary: linear-gradient(to right, #2563eb, #7c3aed)

/* 背景色 */
--bg-sidebar: #ffffff (light) / #1f2937 (dark)
--bg-main: #f9fafb (light) / #111827 (dark)
--bg-message-ai: #f3f4f6 (light) / #374151 (dark)
--bg-message-user: #dbeafe (light) / #1e3a8a (dark)

/* 边框色 */
--border-sidebar: #e5e7eb (light) / #374151 (dark)
--border-main: #e5e7eb (light) / #374151 (dark)
```

#### 间距规范
```css
/* 侧边栏内边距 */
padding: 1rem (16px)

/* 消息间距 */
margin-bottom: 1.5rem (24px)

/* 组件圆角 */
border-radius: 0.75rem (12px) - 消息气泡
border-radius: 0.5rem (8px) - 按钮和卡片
```

#### 响应式设计
```typescript
// 断点处理
- Desktop (≥1024px): 侧边栏正常显示
- Tablet (768px-1023px): 侧边栏可折叠
- Mobile (<768px): 侧边栏作为抽屉模式
```

### 交互行为规范

#### 侧边栏交互
```typescript
1. 折叠/展开
   - 点击折叠按钮切换状态
   - 折叠时宽度变为64px，只显示图标
   - 展开动画时长300ms

2. 快速提示词
   - 鼠标悬停显示阴影效果
   - 点击后内容填充到输入框
   - 支持键盘导航 (Tab键)

3. 数据源状态
   - 鼠标悬停显示详细状态信息
   - 点击可打开配置对话框
```

#### 主对话区交互
```typescript
1. 消息发送
   - Enter键发送消息
   - Shift+Enter换行
   - 发送按钮在有内容时激活

2. 滚动行为
   - 新消息自动滚动到底部
   - 平滑滚动动画
   - 支持鼠标滚轮和触摸滚动
```

### 实现要点

#### 必须使用的组件
```typescript
// shadcn/ui组件
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator' 
import { Badge } from '@/components/ui/badge'

// Lucide图标
import { 
  MessageSquare, BarChart3, FileText, Zap, Plus, Send,
  Settings, Github, Slack, CheckCircle, AlertCircle, Clock,
  Search, MoreHorizontal 
} from 'lucide-react'
```

#### 状态管理
```typescript
// 必须的状态
const [message, setMessage] = useState('')
const [isCollapsed, setIsCollapsed] = useState(false)
const [conversations, setConversations] = useState([])

// 数据源状态
const dataSources = [
  { name: 'Slack', icon: Slack, status: 'connected', color: 'text-green-500' },
  { name: 'Jira', icon: FileText, status: 'syncing', color: 'text-yellow-500' },
  // ...
]
```

### 可访问性要求
```typescript
// ARIA标签
aria-label="发送消息"
aria-expanded="true" // 侧边栏状态
role="button" // 交互元素
tabIndex={0} // 键盘导航

// 键盘支持
- Tab键在界面元素间导航
- Enter键发送消息/激活按钮
- Escape键关闭模态框
```

## 💡 AI Assistant Instructions

When generating code for this project:
1. ALWAYS use the specified tech stack
2. ALWAYS follow the file structure
3. ALWAYS include proper TypeScript types
4. ALWAYS handle errors appropriately
5. ALWAYS use shadcn/ui for UI components
6. NEVER install unnecessary packages
7. NEVER use deprecated patterns
8. PREFER server components in app/ directory
9. USE 'use client' directive only when needed
10. IMPLEMENT loading and error states
11. FOLLOW the Context-aware development pattern
12. USE the mock authentication for development
13. IMPLEMENT bilingual support (Chinese/English)
14. LEVERAGE the AI intelligence system architecture
15. **ALWAYS follow the ChatGPT-style interface design specifications above**

## 🎯 Success Metrics

- Page load time < 1s
- API response time < 200ms
- 99.9% uptime
- Zero security vulnerabilities
- 100% TypeScript coverage
- Responsive on all devices

---

**Remember**: This is an AI-first product. Every feature should enhance the AI-human collaboration experience. Keep the interface clean, intuitive, and powerful.
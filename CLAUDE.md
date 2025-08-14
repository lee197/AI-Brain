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
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Main app layout with sidebar
│   │   ├── page.tsx             # Dashboard home
│   │   ├── chat/page.tsx        # AI chat interface
│   │   ├── integrations/
│   │   │   ├── page.tsx         # Integration list
│   │   │   └── [tool]/page.tsx  # Tool-specific settings
│   │   ├── insights/page.tsx    # Analytics & insights
│   │   ├── tasks/page.tsx       # Task management
│   │   └── settings/page.tsx    # User settings
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   ├── analyze/route.ts
│   │   │   └── actions/route.ts
│   │   ├── integrations/
│   │   │   ├── slack/
│   │   │   │   ├── route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── jira/
│   │   │   ├── github/
│   │   │   └── google/
│   │   └── webhooks/
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   ├── message-list.tsx
│   │   └── message-input.tsx
│   ├── integrations/
│   │   ├── integration-card.tsx
│   │   └── integration-setup.tsx
│   └── layout/
│       ├── sidebar.tsx
│       └── header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── client.ts
│   │   ├── prompts.ts
│   │   └── tools.ts
│   ├── integrations/
│   │   ├── slack.ts
│   │   ├── jira.ts
│   │   └── github.ts
│   └── utils.ts
├── types/
│   ├── database.ts              # Supabase types
│   ├── integrations.ts
│   └── ai.ts
├── hooks/
│   ├── use-chat.ts
│   ├── use-integrations.ts
│   └── use-supabase.ts
└── middleware.ts                # Auth middleware
```

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

-- Integrations
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
  organization_id UUID REFERENCES organizations(id),
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  type TEXT NOT NULL, -- 'create_ticket', 'send_message', etc.
  status TEXT DEFAULT 'pending',
  integration_id UUID REFERENCES integrations(id),
  payload JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
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

## 📚 Key Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

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

## 🎯 Success Metrics

- Page load time < 1s
- API response time < 200ms
- 99.9% uptime
- Zero security vulnerabilities
- 100% TypeScript coverage
- Responsive on all devices

---

**Remember**: This is an AI-first product. Every feature should enhance the AI-human collaboration experience. Keep the interface clean, intuitive, and powerful.
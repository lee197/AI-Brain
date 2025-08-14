# AI Brain 项目设置指南

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.local` 文件中的模板内容，并根据以下步骤获取真实的 API 密钥：

#### Supabase 配置
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 进入 Settings > API
4. 复制 `Project URL` 和 `anon/public` key
5. 更新 `.env.local` 中的：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### OpenAI API 配置
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新的 API key
3. 更新 `OPENAI_API_KEY`

#### Anthropic API 配置
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建新的 API key
3. 更新 `ANTHROPIC_API_KEY`

### 3. 启动开发服务器
```bash
npm run dev
```

项目将在 http://localhost:3000 启动

## 📁 项目结构

```
ai-brain/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 主应用页面
│   └── api/               # API 路由
├── components/            # React 组件
├── lib/                   # 工具库和配置
├── types/                 # TypeScript 类型定义
├── hooks/                 # 自定义 React Hooks
└── middleware.ts          # 中间件配置
```

## 🛠 开发命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 检查并自动修复
- `npm run format` - 格式化代码
- `npm run type-check` - TypeScript 类型检查

## 📝 注意事项

1. **环境变量**: 确保 `.env.local` 文件包含所有必需的 API 密钥
2. **Supabase**: 项目依赖 Supabase 进行认证和数据存储
3. **AI 集成**: 支持 OpenAI 和 Anthropic API
4. **代码质量**: 项目配置了 ESLint、Prettier 和 TypeScript 严格模式

## 🔐 安全要求

- 永不提交 API 密钥到版本控制
- 所有敏感信息存储在环境变量中
- 生产环境使用适当的环境变量配置
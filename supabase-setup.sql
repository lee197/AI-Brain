-- AI Brain - Supabase数据库初始化脚本
-- 在Supabase SQL编辑器中执行此脚本

-- =============================================
-- 第1步: 启用必要扩展
-- =============================================

-- 启用向量存储扩展 (用于RAG功能)
CREATE EXTENSION IF NOT EXISTS vector;

-- 启用UUID生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 验证扩展已安装
SELECT 'Extensions installed successfully' as status;

-- =============================================
-- 第2步: 创建核心表
-- =============================================

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

-- =============================================
-- 第3步: 创建性能索引
-- =============================================

-- Messages索引
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Actions索引
CREATE INDEX idx_actions_message ON actions(message_id);

-- Audit logs索引
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Knowledge base索引
CREATE INDEX idx_knowledge_base_context ON knowledge_base(context_id);

-- 向量相似性搜索索引
CREATE INDEX knowledge_base_embedding_idx ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Team members索引
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Data sources索引
CREATE INDEX idx_data_sources_context ON data_sources(context_id);

-- =============================================
-- 第4步: 插入测试数据
-- =============================================

-- 创建默认组织
INSERT INTO organizations (name, settings) VALUES 
('AI Brain Demo Organization', '{"theme": "dark", "timezone": "Asia/Shanghai"}');

-- 验证所有表已创建
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'organizations', 'user_organizations', 'contexts', 'team_members', 
    'data_sources', 'integrations', 'conversations', 'messages', 
    'actions', 'knowledge_base', 'workflows', 'workflow_runs', 'audit_logs'
)
ORDER BY tablename;

SELECT 'AI Brain database setup completed successfully!' as status;
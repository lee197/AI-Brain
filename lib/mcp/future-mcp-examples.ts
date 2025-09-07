/**
 * 未来MCP服务器扩展示例
 * 展示如何基于我们的通用架构轻松集成更多MCP服务器
 */

import { BaseMCPClient, MCPServerRegistry } from './base-mcp-client'
import { OAuthProvider } from '@/types/oauth-tokens'

// ============= Slack MCP 客户端示例 =============
export class SlackMCPClient extends BaseMCPClient {
  constructor(baseUrl: string = 'http://localhost:8001/mcp') {
    const config = {
      name: 'slack',
      baseUrl,
      provider: 'slack' as OAuthProvider,
      capabilities: ['messages', 'channels', 'users', 'files'],
      description: 'Slack workspace integration via MCP',
      version: '1.0.0'
    }
    
    MCPServerRegistry.register(config)
    super(config)
  }

  async getServiceContext(userMessage: string, userId: string, contextId: string): Promise<any> {
    // 并行获取Slack数据
    const [channels, messages, users] = await Promise.allSettled([
      this.getChannels(userId, contextId),
      this.getRecentMessages(userId, contextId, userMessage),
      this.getUsers(userId, contextId)
    ])

    return {
      channels: channels.status === 'fulfilled' ? channels.value : [],
      messages: messages.status === 'fulfilled' ? messages.value : [],
      users: users.status === 'fulfilled' ? users.value : []
    }
  }

  buildContextString(context: any): string {
    const sections = []
    
    if (context.messages?.length > 0) {
      const messagesContext = context.messages.map((msg: any) => 
        `[${msg.timestamp}] ${msg.user}: ${msg.text}`
      ).join('\n')
      sections.push(`## 💬 Slack 消息 (${context.messages.length}条)\n${messagesContext}`)
    }
    
    if (context.channels?.length > 0) {
      const channelsContext = context.channels.map((ch: any) => 
        `#${ch.name} (${ch.members} members)`
      ).join('\n')
      sections.push(`## 📺 频道列表 (${context.channels.length}个)\n${channelsContext}`)
    }

    return sections.join('\n\n')
  }

  // Slack特定方法
  async getChannels(userId: string, contextId: string) {
    return this.invokeTool('list_channels', {}, userId, contextId)
  }

  async getRecentMessages(userId: string, contextId: string, query?: string) {
    return this.invokeTool('search_messages', { 
      query: query || '',
      limit: 20 
    }, userId, contextId)
  }

  async getUsers(userId: string, contextId: string) {
    return this.invokeTool('list_users', {}, userId, contextId)
  }

  async sendMessage(userId: string, contextId: string, channel: string, text: string) {
    return this.invokeTool('send_message', { channel, text }, userId, contextId)
  }
}

// ============= Jira MCP 客户端示例 =============
export class JiraMCPClient extends BaseMCPClient {
  constructor(baseUrl: string = 'http://localhost:8002/mcp') {
    const config = {
      name: 'jira',
      baseUrl,
      provider: 'jira' as OAuthProvider, // 需要在types中添加
      capabilities: ['issues', 'projects', 'sprints', 'boards'],
      description: 'Jira project management via MCP',
      version: '1.0.0'
    }
    
    MCPServerRegistry.register(config)
    super(config)
  }

  async getServiceContext(userMessage: string, userId: string, contextId: string): Promise<any> {
    const [issues, projects, sprints] = await Promise.allSettled([
      this.getMyIssues(userId, contextId),
      this.getProjects(userId, contextId),
      this.getActiveSprints(userId, contextId)
    ])

    return {
      issues: issues.status === 'fulfilled' ? issues.value : [],
      projects: projects.status === 'fulfilled' ? projects.value : [],
      sprints: sprints.status === 'fulfilled' ? sprints.value : []
    }
  }

  buildContextString(context: any): string {
    const sections = []
    
    if (context.issues?.length > 0) {
      const issuesContext = context.issues.map((issue: any) => 
        `${issue.key}: ${issue.summary} (${issue.status})`
      ).join('\n')
      sections.push(`## 🎫 我的工单 (${context.issues.length}个)\n${issuesContext}`)
    }

    if (context.sprints?.length > 0) {
      const sprintsContext = context.sprints.map((sprint: any) => 
        `${sprint.name} (${sprint.state}) - ${sprint.issues.length} issues`
      ).join('\n')
      sections.push(`## 🏃‍♂️ 活跃Sprint (${context.sprints.length}个)\n${sprintsContext}`)
    }

    return sections.join('\n\n')
  }

  // Jira特定方法
  async getMyIssues(userId: string, contextId: string) {
    return this.invokeTool('search_issues', { 
      jql: 'assignee = currentUser() AND resolution = Unresolved' 
    }, userId, contextId)
  }

  async getProjects(userId: string, contextId: string) {
    return this.invokeTool('list_projects', {}, userId, contextId)
  }

  async getActiveSprints(userId: string, contextId: string) {
    return this.invokeTool('list_active_sprints', {}, userId, contextId)
  }

  async createIssue(userId: string, contextId: string, issueData: any) {
    return this.invokeTool('create_issue', issueData, userId, contextId)
  }
}

// ============= GitHub MCP 客户端示例 =============
export class GitHubMCPClient extends BaseMCPClient {
  constructor(baseUrl: string = 'http://localhost:8003/mcp') {
    const config = {
      name: 'github',
      baseUrl,
      provider: 'github' as OAuthProvider, // 需要在types中添加
      capabilities: ['repositories', 'issues', 'pull-requests', 'commits'],
      description: 'GitHub code management via MCP',
      version: '1.0.0'
    }
    
    MCPServerRegistry.register(config)
    super(config)
  }

  async getServiceContext(userMessage: string, userId: string, contextId: string): Promise<any> {
    const [repos, issues, prs] = await Promise.allSettled([
      this.getRepositories(userId, contextId),
      this.getMyIssues(userId, contextId),
      this.getMyPRs(userId, contextId)
    ])

    return {
      repositories: repos.status === 'fulfilled' ? repos.value : [],
      issues: issues.status === 'fulfilled' ? issues.value : [],
      pullRequests: prs.status === 'fulfilled' ? prs.value : []
    }
  }

  buildContextString(context: any): string {
    const sections = []
    
    if (context.issues?.length > 0) {
      const issuesContext = context.issues.map((issue: any) => 
        `#${issue.number}: ${issue.title} (${issue.state})`
      ).join('\n')
      sections.push(`## 🐛 GitHub Issues (${context.issues.length}个)\n${issuesContext}`)
    }

    if (context.pullRequests?.length > 0) {
      const prsContext = context.pullRequests.map((pr: any) => 
        `#${pr.number}: ${pr.title} (${pr.state})`
      ).join('\n')
      sections.push(`## 🔀 Pull Requests (${context.pullRequests.length}个)\n${prsContext}`)
    }

    return sections.join('\n\n')
  }

  // GitHub特定方法
  async getRepositories(userId: string, contextId: string) {
    return this.invokeTool('list_repositories', { type: 'owner' }, userId, contextId)
  }

  async getMyIssues(userId: string, contextId: string) {
    return this.invokeTool('search_issues', { 
      q: 'is:issue author:@me state:open' 
    }, userId, contextId)
  }

  async getMyPRs(userId: string, contextId: string) {
    return this.invokeTool('search_pull_requests', { 
      q: 'is:pr author:@me state:open' 
    }, userId, contextId)
  }

  async createIssue(userId: string, contextId: string, repo: string, issueData: any) {
    return this.invokeTool('create_issue', { repo, ...issueData }, userId, contextId)
  }
}

// ============= Notion MCP 客户端示例 =============
export class NotionMCPClient extends BaseMCPClient {
  constructor(baseUrl: string = 'http://localhost:8004/mcp') {
    const config = {
      name: 'notion',
      baseUrl,
      provider: 'notion' as OAuthProvider, // 需要在types中添加
      capabilities: ['databases', 'pages', 'blocks', 'search'],
      description: 'Notion knowledge base via MCP',
      version: '1.0.0'
    }
    
    MCPServerRegistry.register(config)
    super(config)
  }

  async getServiceContext(userMessage: string, userId: string, contextId: string): Promise<any> {
    const [databases, pages, searchResults] = await Promise.allSettled([
      this.getDatabases(userId, contextId),
      this.getRecentPages(userId, contextId),
      this.searchContent(userMessage, userId, contextId)
    ])

    return {
      databases: databases.status === 'fulfilled' ? databases.value : [],
      pages: pages.status === 'fulfilled' ? pages.value : [],
      searchResults: searchResults.status === 'fulfilled' ? searchResults.value : []
    }
  }

  buildContextString(context: any): string {
    const sections = []
    
    if (context.searchResults?.length > 0) {
      const searchContext = context.searchResults.map((result: any) => 
        `📄 ${result.title}: ${result.excerpt}`
      ).join('\n')
      sections.push(`## 🔍 Notion 搜索结果 (${context.searchResults.length}个)\n${searchContext}`)
    }

    if (context.pages?.length > 0) {
      const pagesContext = context.pages.map((page: any) => 
        `📝 ${page.title} (${new Date(page.last_edited_time).toLocaleDateString()})`
      ).join('\n')
      sections.push(`## 📚 最近页面 (${context.pages.length}个)\n${pagesContext}`)
    }

    return sections.join('\n\n')
  }

  // Notion特定方法
  async getDatabases(userId: string, contextId: string) {
    return this.invokeTool('list_databases', {}, userId, contextId)
  }

  async getRecentPages(userId: string, contextId: string) {
    return this.invokeTool('list_pages', { 
      sort: { timestamp: 'last_edited_time', direction: 'descending' },
      page_size: 10
    }, userId, contextId)
  }

  async searchContent(query: string, userId: string, contextId: string) {
    return this.invokeTool('search', { query }, userId, contextId)
  }

  async createPage(userId: string, contextId: string, pageData: any) {
    return this.invokeTool('create_page', pageData, userId, contextId)
  }
}

// ============= 统一MCP客户端管理器 =============
export class UnifiedMCPManager {
  private clients: Map<string, BaseMCPClient> = new Map()

  constructor() {
    // 注册所有MCP客户端
    this.clients.set('google-workspace', new GoogleWorkspaceMCPClientV2())
    // 未来启用时取消注释：
    // this.clients.set('slack', new SlackMCPClient())
    // this.clients.set('jira', new JiraMCPClient())
    // this.clients.set('github', new GitHubMCPClient())
    // this.clients.set('notion', new NotionMCPClient())
  }

  /**
   * 获取所有可用的MCP服务
   */
  getAvailableServices(): string[] {
    return Array.from(this.clients.keys())
  }

  /**
   * 获取特定MCP客户端
   */
  getClient(serviceName: string): BaseMCPClient | undefined {
    return this.clients.get(serviceName)
  }

  /**
   * 并行获取所有服务的上下文
   */
  async getAllContexts(
    userMessage: string,
    userId: string,
    contextId: string,
    enabledServices?: string[]
  ): Promise<Record<string, any>> {
    const servicesToQuery = enabledServices || this.getAvailableServices()
    const contexts: Record<string, any> = {}

    const promises = servicesToQuery.map(async (serviceName) => {
      const client = this.clients.get(serviceName)
      if (!client) return { serviceName, context: null, error: 'Client not found' }

      try {
        const { context, error } = await client.getSafeContext(userMessage, userId, contextId)
        return { serviceName, context, error }
      } catch (error) {
        return { serviceName, context: null, error }
      }
    })

    const results = await Promise.allSettled(promises)
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { serviceName, context, error } = result.value
        contexts[serviceName] = { context, error }
      }
    })

    return contexts
  }

  /**
   * 构建多服务综合上下文字符串
   */
  buildUnifiedContextString(allContexts: Record<string, any>): string {
    const sections = []

    Object.entries(allContexts).forEach(([serviceName, { context, error }]) => {
      if (error) {
        sections.push(`## ⚠️ ${serviceName.toUpperCase()} 服务暂不可用\n错误: ${error.message}`)
        return
      }

      if (context) {
        const client = this.clients.get(serviceName)
        if (client) {
          const contextString = client.buildContextString(context)
          if (contextString) {
            sections.push(contextString)
          }
        }
      }
    })

    return sections.join('\n\n')
  }
}

// 导出单例实例
export const unifiedMCPManager = new UnifiedMCPManager()

/**
 * 使用示例：
 * 
 * // 1. 获取单个服务上下文
 * const slackClient = unifiedMCPManager.getClient('slack')
 * const slackContext = await slackClient?.getSafeContext(message, userId, contextId)
 * 
 * // 2. 获取所有服务上下文
 * const allContexts = await unifiedMCPManager.getAllContexts(message, userId, contextId)
 * const unifiedContext = unifiedMCPManager.buildUnifiedContextString(allContexts)
 * 
 * // 3. 选择性启用服务
 * const contexts = await unifiedMCPManager.getAllContexts(
 *   message, userId, contextId, 
 *   ['google-workspace', 'slack', 'jira'] // 只启用这些服务
 * )
 */
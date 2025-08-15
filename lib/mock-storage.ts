// 模拟数据存储 - 在实际项目中应使用数据库
import { Context, ROLE_PERMISSIONS } from '@/types/context'

// 全局mock数据存储
export const mockStorage = {
  contexts: [
    {
      id: 'ctx_1',
      type: 'PROJECT' as const,
      name: 'AI Brain MVP 开发',
      description: '开发AI Brain的最小可行产品，实现核心功能和Context概念验证',
      ownerId: 'user_admin',
      members: [
        {
          userId: 'user_admin',
          contextId: 'ctx_1',
          role: 'OWNER' as const,
          permissions: ROLE_PERMISSIONS.OWNER,
          joinedAt: new Date(),
        }
      ],
      lifecycle: 'TEMPORARY' as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
      settings: {
        isPublic: false,
        allowInvites: true,
        dataSources: [
          {
            id: 'ds_1',
            type: 'SLACK' as const,
            config: { channelId: 'C123456', teamId: 'T123456' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          },
          {
            id: 'ds_2',
            type: 'JIRA' as const,
            config: { projectKey: 'AIBRAIN', serverUrl: 'https://company.atlassian.net' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          }
        ],
        aiEnabled: true,
        notifications: {
          emailNotifications: true,
          slackNotifications: true,
          pushNotifications: false,
          weeklyDigest: true
        },
        customFields: {}
      },
      metadata: {
        priority: 'HIGH',
        estimatedDuration: '3个月',
        budget: 100000,
        technologies: ['Next.js', 'TypeScript', 'Supabase']
      }
    },
    {
      id: 'ctx_2',
      type: 'DEPARTMENT' as const,
      name: '产品研发部',
      description: '负责产品开发和技术创新的核心部门',
      ownerId: 'user_admin',
      members: [
        {
          userId: 'user_admin',
          contextId: 'ctx_2',
          role: 'OWNER' as const,
          permissions: ROLE_PERMISSIONS.OWNER,
          joinedAt: new Date(),
        },
        {
          userId: 'user_demo',
          contextId: 'ctx_2',
          role: 'MEMBER' as const,
          permissions: ROLE_PERMISSIONS.MEMBER,
          joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }
      ],
      lifecycle: 'PERMANENT' as const,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
      settings: {
        isPublic: false,
        allowInvites: true,
        dataSources: [
          {
            id: 'ds_3',
            type: 'SLACK' as const,
            config: { channelId: 'C789012', teamId: 'T123456' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          },
          {
            id: 'ds_4',
            type: 'GITHUB' as const,
            config: { organization: 'company', repositories: ['ai-brain', 'shared-libs'] },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          }
        ],
        aiEnabled: true,
        notifications: {
          emailNotifications: true,
          slackNotifications: true,
          pushNotifications: false,
          weeklyDigest: true
        },
        customFields: {}
      },
      metadata: {
        department: 'R&D',
        teamSize: 15,
        location: '上海总部',
        budget: 2000000
      }
    },
    {
      id: 'ctx_3',
      type: 'PERSONAL' as const,
      name: '我的个人工作空间',
      description: '个人任务、学习笔记和私人项目管理',
      ownerId: 'user_admin',
      members: [
        {
          userId: 'user_admin',
          contextId: 'ctx_3',
          role: 'OWNER' as const,
          permissions: ROLE_PERMISSIONS.OWNER,
          joinedAt: new Date(),
        }
      ],
      lifecycle: 'PERMANENT' as const,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      settings: {
        isPublic: false,
        allowInvites: false,
        dataSources: [
          {
            id: 'ds_5',
            type: 'NOTION' as const,
            config: { workspaceId: 'personal-workspace' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          }
        ],
        aiEnabled: true,
        notifications: {
          emailNotifications: false,
          slackNotifications: false,
          pushNotifications: true,
          weeklyDigest: false
        },
        customFields: {}
      },
      metadata: {
        personalGoals: ['学习AI技术', '完成个人项目', '提升技能'],
        privacyLevel: 'HIGH'
      }
    },
    {
      id: 'ctx_4',
      type: 'TEAM' as const,
      name: '前端开发小组',
      description: '专注于用户界面和用户体验的敏捷开发团队',
      ownerId: 'user_admin',
      members: [
        {
          userId: 'user_admin',
          contextId: 'ctx_4',
          role: 'ADMIN' as const,
          permissions: ROLE_PERMISSIONS.ADMIN,
          joinedAt: new Date(),
        },
        {
          userId: 'user_demo',
          contextId: 'ctx_4',
          role: 'MEMBER' as const,
          permissions: ROLE_PERMISSIONS.MEMBER,
          joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        }
      ],
      lifecycle: 'TEMPORARY' as const,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
      settings: {
        isPublic: true,
        allowInvites: true,
        dataSources: [
          {
            id: 'ds_6',
            type: 'GITHUB' as const,
            config: { organization: 'company', repositories: ['frontend-components', 'ui-library'] },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          }
        ],
        aiEnabled: true,
        notifications: {
          emailNotifications: true,
          slackNotifications: true,
          pushNotifications: true,
          weeklyDigest: true
        },
        customFields: {}
      },
      metadata: {
        methodology: 'Scrum',
        sprintDuration: 14,
        focusAreas: ['React', 'TypeScript', 'Design System']
      }
    },
    {
      id: 'ctx_5',
      type: 'CLIENT' as const,
      name: '阿里云合作项目',
      description: '与阿里云的战略合作项目，包括多个子项目和服务集成',
      ownerId: 'user_admin',
      members: [
        {
          userId: 'user_admin',
          contextId: 'ctx_5',
          role: 'OWNER' as const,
          permissions: ROLE_PERMISSIONS.OWNER,
          joinedAt: new Date(),
        }
      ],
      lifecycle: 'PERMANENT' as const,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60天前
      settings: {
        isPublic: false,
        allowInvites: true,
        dataSources: [
          {
            id: 'ds_7',
            type: 'SLACK' as const,
            config: { channelId: 'C_ALIBABA', teamId: 'T123456' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          },
          {
            id: 'ds_8',
            type: 'JIRA' as const,
            config: { projectKey: 'ALICLOUD', serverUrl: 'https://company.atlassian.net' },
            connectedAt: new Date(),
            status: 'CONNECTED' as const
          }
        ],
        aiEnabled: true,
        notifications: {
          emailNotifications: true,
          slackNotifications: true,
          pushNotifications: false,
          weeklyDigest: true
        },
        customFields: {
          contractValue: 5000000,
          renewalDate: '2025-12-31',
          primaryContact: '张经理'
        }
      },
      metadata: {
        clientType: 'Enterprise',
        industry: 'Cloud Computing',
        region: 'China',
        projects: ['AI服务集成', '数据分析平台', '企业应用迁移']
      }
    }
  ] as Context[]
}

// 工具函数
export function getContextById(id: string): Context | undefined {
  return mockStorage.contexts.find(ctx => ctx.id === id)
}

export function addContext(context: Context): void {
  mockStorage.contexts.push(context)
}

export function updateContextById(id: string, updates: Partial<Context>): Context | null {
  const index = mockStorage.contexts.findIndex(ctx => ctx.id === id)
  if (index === -1) return null
  
  mockStorage.contexts[index] = { ...mockStorage.contexts[index], ...updates }
  return mockStorage.contexts[index]
}

export function removeContextById(id: string): boolean {
  const index = mockStorage.contexts.findIndex(ctx => ctx.id === id)
  if (index === -1) return false
  
  // 软删除 - 标记为归档
  mockStorage.contexts[index].archivedAt = new Date()
  return true
}

export function getUserContexts(userId: string, includeArchived = false): Context[] {
  return mockStorage.contexts.filter(context => {
    // 检查用户是否是该Context的成员
    const isMember = context.members.some(member => member.userId === userId)
    if (!isMember) return false
    
    // 检查是否包含归档的Context
    if (!includeArchived && context.archivedAt) return false
    
    return true
  })
}

// 生成唯一ID
export function generateContextId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
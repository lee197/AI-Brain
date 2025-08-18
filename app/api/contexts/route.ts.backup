import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  Context, 
  CreateContextRequest, 
  ContextQuery, 
  ContextType, 
  LifecycleType,
  DataSourceType,
  DataSourceConfig,
  ROLE_PERMISSIONS,
  MemberRole
} from '@/types/context'
import { getContextTypeInfo } from '@/lib/context-utils'
import { 
  mockStorage, 
  getUserContexts, 
  addContext, 
  generateContextId 
} from '@/lib/mock-storage'

// 创建数据源配置
function createDataSourceConfigs(selectedTypes: DataSourceType[]): DataSourceConfig[] {
  return selectedTypes.map(type => ({
    id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    config: {
      // 初始空配置，将在用户完成OAuth后填充
      connected: false,
      setupRequired: true
    },
    connectedAt: new Date(),
    status: 'DISCONNECTED' as const
  }))
}

// 验证schema
const createContextSchema = z.object({
  type: z.enum(['PROJECT', 'DEPARTMENT', 'TEAM', 'CLIENT', 'PERSONAL']),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  lifecycle: z.enum(['TEMPORARY', 'PERMANENT', 'TRIGGERED']).optional(),
  selectedDataSources: z.array(z.enum(['SLACK', 'JIRA', 'GITHUB', 'GOOGLE', 'NOTION'])).optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowInvites: z.boolean().optional(),
    aiEnabled: z.boolean().optional(),
  }).optional(),
  initialMembers: z.array(z.string()).optional(),
})

const querySchema = z.object({
  type: z.enum(['PROJECT', 'DEPARTMENT', 'TEAM', 'CLIENT', 'PERSONAL']).optional(),
  ownerId: z.string().optional(),
  memberId: z.string().optional(),
  archived: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

// 获取当前用户ID（Mock实现）
function getCurrentUserId(request: NextRequest): string {
  // 实际项目中应该从JWT token或session中获取
  const authCookie = request.cookies.get('ai-brain-auth')?.value
  
  // 检查cookie中的JSON数据
  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie)
      if (authData.email === 'admin@aibrain.com') {
        return 'user_admin'
      } else if (authData.email === 'demo@aibrain.com') {
        return 'user_demo'
      }
    } catch (e) {
      // 如果不是JSON，直接比较字符串
      if (authCookie === 'admin@aibrain.com') {
        return 'user_admin'
      } else if (authCookie === 'demo@aibrain.com') {
        return 'user_demo'
      }
    }
  }
  
  // 开发环境下，如果没有cookie，默认返回admin用户
  if (process.env.NODE_ENV === 'development') {
    return 'user_admin'
  }
  
  throw new Error('Unauthorized')
}

// 检查用户是否有访问Context的权限
function hasContextAccess(context: Context, userId: string): boolean {
  return context.members.some(member => member.userId === userId)
}

// GET /api/contexts - 获取用户的Context列表
export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const queryParams: any = {
      memberId: userId, // 默认查询当前用户的Context
    }
    
    // 只添加存在的参数
    const type = searchParams.get('type')
    if (type) queryParams.type = type
    
    const ownerId = searchParams.get('ownerId')
    if (ownerId) queryParams.ownerId = ownerId
    
    const memberIdParam = searchParams.get('memberId')
    if (memberIdParam) queryParams.memberId = memberIdParam
    
    const archived = searchParams.get('archived')
    if (archived !== null) queryParams.archived = archived === 'true'
    
    const limit = searchParams.get('limit')
    if (limit) queryParams.limit = parseInt(limit)
    
    const offset = searchParams.get('offset')
    if (offset) queryParams.offset = parseInt(offset)

    const validated = querySchema.parse(queryParams)

    // 获取用户的Contexts
    let filteredContexts = getUserContexts(userId, validated.archived)
    
    // 按类型过滤
    if (validated.type) {
      filteredContexts = filteredContexts.filter(ctx => ctx.type === validated.type)
    }
    
    // 按所有者过滤
    if (validated.ownerId) {
      filteredContexts = filteredContexts.filter(ctx => ctx.ownerId === validated.ownerId)
    }

    // 分页
    const total = filteredContexts.length
    filteredContexts = filteredContexts.slice(
      validated.offset || 0, 
      (validated.offset || 0) + (validated.limit || 50)
    )

    return NextResponse.json({
      contexts: filteredContexts,
      pagination: {
        total,
        limit: validated.limit || 50,
        offset: validated.offset || 0,
        hasMore: (validated.offset || 0) + (validated.limit || 50) < total
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('GET /api/contexts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/contexts - 创建新的Context
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    const body = await request.json()
    const validated = createContextSchema.parse(body)

    // 创建新Context
    const newContext: Context = {
      id: generateContextId(),
      type: validated.type,
      name: validated.name,
      description: validated.description || '',
      ownerId: userId,
      members: [
        {
          userId: userId,
          contextId: '', // 将在下面设置
          role: 'OWNER' as MemberRole,
          permissions: ROLE_PERMISSIONS.OWNER,
          joinedAt: new Date(),
        }
      ],
      lifecycle: validated.lifecycle || getContextTypeInfo(validated.type, 'zh').defaultLifecycle,
      createdAt: new Date(),
      settings: {
        isPublic: validated.settings?.isPublic ?? false,
        allowInvites: validated.settings?.allowInvites ?? true,
        dataSources: createDataSourceConfigs(validated.selectedDataSources || []),
        aiEnabled: validated.settings?.aiEnabled ?? true,
        notifications: {
          emailNotifications: true,
          slackNotifications: false,
          pushNotifications: false,
          weeklyDigest: true
        },
        customFields: {}
      },
      metadata: {}
    }

    // 设置成员的contextId
    newContext.members[0].contextId = newContext.id

    // 添加初始成员
    if (validated.initialMembers && validated.initialMembers.length > 0) {
      for (const memberId of validated.initialMembers) {
        if (memberId !== userId) { // 避免重复添加owner
          newContext.members.push({
            userId: memberId,
            contextId: newContext.id,
            role: 'MEMBER',
            permissions: ROLE_PERMISSIONS.MEMBER,
            joinedAt: new Date(),
          })
        }
      }
    }

    // 保存到mock存储
    addContext(newContext)

    return NextResponse.json({ context: newContext }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/contexts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
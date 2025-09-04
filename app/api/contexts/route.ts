import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { 
  Context, 
  ContextType, 
  LifecycleType,
  DataSourceType,
  DataSourceConfig,
  ROLE_PERMISSIONS,
  MemberRole
} from '@/types/context'
import { getContextTypeInfo } from '@/lib/context-utils'

// 创建数据源配置
function createDataSourceConfigs(selectedTypes: DataSourceType[]): DataSourceConfig[] {
  return selectedTypes.map(type => ({
    id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    config: {
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

// 获取当前用户ID
async function getCurrentUserId(request: NextRequest): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user.id
}

// GET /api/contexts - 获取用户的Context列表
export async function GET(request: NextRequest) {
  try {
    let userId: string
    
    try {
      userId = await getCurrentUserId(request)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please login to access contexts'
      }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const queryParams: any = {}
    
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

    // 创建Supabase客户端
    const supabase = await createClient()

    // 构建查询 - 简化查询避免关系错误
    let query = supabase
      .from('contexts')
      .select('*')

    // 按类型过滤
    if (validated.type) {
      query = query.eq('type', validated.type)
    }
    
    // 按所有者过滤
    if (validated.ownerId) {
      query = query.eq('owner_id', validated.ownerId)
    }

    // 分页
    const startRange = validated.offset || 0
    const endRange = startRange + (validated.limit || 50) - 1
    query = query.range(startRange, endRange)
    
    // 执行查询
    const { data: contexts, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    // 获取team_members信息
    const formattedContexts = []
    if (contexts && contexts.length > 0) {
      for (const ctx of contexts) {
        // 获取该Context的成员信息
        const { data: members } = await supabase
          .from('team_members')
          .select('*')
          .eq('context_id', ctx.id)

        // 检查当前用户是否是成员
        const isMember = members?.some(m => m.user_id === userId)
        
        // 只返回用户有权访问的Context
        if (isMember) {
          formattedContexts.push({
            id: ctx.id,
            type: ctx.type,
            name: ctx.name,
            description: ctx.description,
            ownerId: ctx.owner_id,
            members: members?.map((member: any) => ({
              userId: member.user_id,
              contextId: ctx.id,
              role: member.role.toUpperCase(),
              permissions: member.permissions || ROLE_PERMISSIONS[member.role.toUpperCase() as MemberRole],
              joinedAt: member.joined_at
            })) || [],
            lifecycle: ctx.settings?.lifecycle || 'PERMANENT',
            createdAt: ctx.created_at,
            settings: {
              ...ctx.settings,
              dataSources: []
            },
            metadata: ctx.settings?.metadata || {}
          })
        }
      }
    }

    return NextResponse.json({
      contexts: formattedContexts,
      pagination: {
        total: count || 0,
        limit: validated.limit || 50,
        offset: validated.offset || 0,
        hasMore: (validated.offset || 0) + (validated.limit || 50) < (count || 0)
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
    const userId = await getCurrentUserId(request)
    const body = await request.json()
    const validated = createContextSchema.parse(body)

    // 创建Supabase客户端
    const supabase = await createClient()

    // 获取默认组织ID（如果没有则创建）
    let organizationId = null
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
    
    if (orgs && orgs.length > 0) {
      organizationId = orgs[0].id
    }

    // 准备Context数据 - 暂时不设置owner_id避免外键约束
    const contextData = {
      type: validated.type,
      name: validated.name,
      description: validated.description || '',
      owner_id: null, // 暂时设为null，避免外键约束问题
      organization_id: organizationId,
      settings: {
        isPublic: validated.settings?.isPublic ?? false,
        allowInvites: validated.settings?.allowInvites ?? true,
        aiEnabled: validated.settings?.aiEnabled ?? true,
        lifecycle: validated.lifecycle || getContextTypeInfo(validated.type, 'zh').defaultLifecycle,
        notifications: {
          emailNotifications: true,
          slackNotifications: false,
          pushNotifications: false,
          weeklyDigest: true
        },
        customFields: {},
        metadata: {}
      },
      avatar_url: null
    }

    // 插入Context
    const { data: newContext, error: contextError } = await supabase
      .from('contexts')
      .insert(contextData)
      .select()
      .single()

    if (contextError) {
      console.error('Context creation error:', contextError)
      throw contextError
    }

    // 添加创建者为OWNER - 使用模拟用户ID
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        context_id: newContext.id,
        user_id: userId,
        role: 'owner',
        permissions: ROLE_PERMISSIONS.OWNER,
        invited_by: null // 避免外键约束
      })

    if (memberError) {
      console.error('Team member creation error:', memberError)
      // 如果添加成员失败，删除创建的Context
      await supabase.from('contexts').delete().eq('id', newContext.id)
      throw memberError
    }

    // 添加数据源配置（如果有）
    if (validated.selectedDataSources && validated.selectedDataSources.length > 0) {
      const dataSourcesData = validated.selectedDataSources.map(type => ({
        context_id: newContext.id,
        type: type.toLowerCase(),
        name: `${type} Integration`,
        config: {
          connected: false,
          setupRequired: true
        },
        status: 'pending'
      }))

      const { error: dsError } = await supabase
        .from('data_sources')
        .insert(dataSourcesData)

      if (dsError) {
        console.error('Data sources creation error:', dsError)
        // 不影响Context创建，只记录错误
      }
    }

    // 格式化返回数据
    const formattedContext: Context = {
      id: newContext.id,
      type: newContext.type as ContextType,
      name: newContext.name,
      description: newContext.description,
      ownerId: newContext.owner_id,
      members: [{
        userId: userId,
        contextId: newContext.id,
        role: 'OWNER' as MemberRole,
        permissions: ROLE_PERMISSIONS.OWNER,
        joinedAt: new Date()
      }],
      lifecycle: newContext.settings?.lifecycle || 'PERMANENT',
      createdAt: new Date(newContext.created_at),
      settings: {
        ...newContext.settings,
        dataSources: createDataSourceConfigs(validated.selectedDataSources || [])
      },
      metadata: newContext.settings?.metadata || {}
    }

    return NextResponse.json({ context: formattedContext }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/contexts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
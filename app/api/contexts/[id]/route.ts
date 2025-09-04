import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { Context, UpdateContextRequest, CONTEXT_PERMISSIONS } from '@/types/context'

// 验证schema
const updateContextSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowInvites: z.boolean().optional(),
    aiEnabled: z.boolean().optional(),
    notifications: z.object({
      emailNotifications: z.boolean().optional(),
      slackNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
    }).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
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

// 检查用户是否有特定权限
async function hasPermission(
  supabase: any,
  contextId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const { data: member } = await supabase
    .from('team_members')
    .select('permissions')
    .eq('context_id', contextId)
    .eq('user_id', userId)
    .single()

  if (!member) return false
  
  const permissions = member.permissions || []
  return permissions.includes(permission)
}

// GET /api/contexts/[id] - 获取特定Context详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request)
    const resolvedParams = await params
    const contextId = resolvedParams.id
    const supabase = await createClient()

    // 获取Context详情
    const { data: context, error } = await supabase
      .from('contexts')
      .select(`
        *,
        team_members(
          user_id,
          role,
          permissions,
          joined_at
        ),
        data_sources(
          id,
          type,
          name,
          config,
          status,
          created_at
        )
      `)
      .eq('id', contextId)
      .single()

    if (error || !context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查读取权限
    const canRead = await hasPermission(supabase, contextId, userId, CONTEXT_PERMISSIONS.READ)
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 格式化返回数据
    const formattedContext: Context = {
      id: context.id,
      type: context.type,
      name: context.name,
      description: context.description,
      ownerId: context.owner_id,
      members: context.team_members?.map((member: any) => ({
        userId: member.user_id,
        contextId: context.id,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joined_at
      })) || [],
      lifecycle: context.settings?.lifecycle || 'PERMANENT',
      createdAt: context.created_at,
      settings: {
        ...context.settings,
        dataSources: context.data_sources || []
      },
      metadata: context.settings?.metadata || {}
    }

    return NextResponse.json({ context: formattedContext })

  } catch (error) {
    console.error('GET /api/contexts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/contexts/[id] - 更新Context
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request)
    const contextId = params.id
    const body = await request.json()
    const validated = updateContextSchema.parse(body)
    const supabase = await createClient()

    // 检查写入权限
    const canWrite = await hasPermission(supabase, contextId, userId, CONTEXT_PERMISSIONS.WRITE)
    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 准备更新数据
    const updateData: any = {}
    if (validated.name) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    
    if (validated.settings || validated.metadata) {
      // 获取当前settings
      const { data: current } = await supabase
        .from('contexts')
        .select('settings')
        .eq('id', contextId)
        .single()

      updateData.settings = {
        ...(current?.settings || {}),
        ...(validated.settings || {}),
        metadata: validated.metadata || current?.settings?.metadata || {}
      }
    }

    updateData.updated_at = new Date().toISOString()

    // 更新Context
    const { data: updatedContext, error } = await supabase
      .from('contexts')
      .update(updateData)
      .eq('id', contextId)
      .select()
      .single()

    if (error) {
      console.error('Context update error:', error)
      throw error
    }

    return NextResponse.json({ context: updatedContext })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('PUT /api/contexts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/contexts/[id] - 删除Context
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request)
    const contextId = params.id
    const supabase = await createClient()

    // 检查删除权限
    const canDelete = await hasPermission(supabase, contextId, userId, CONTEXT_PERMISSIONS.DELETE)
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 删除Context（级联删除会自动删除相关的team_members和data_sources）
    const { error } = await supabase
      .from('contexts')
      .delete()
      .eq('id', contextId)

    if (error) {
      console.error('Context deletion error:', error)
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/contexts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
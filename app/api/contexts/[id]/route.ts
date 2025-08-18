import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Context, UpdateContextRequest, CONTEXT_PERMISSIONS } from '@/types/context'
import { getContextById, updateContextById, removeContextById } from '@/lib/mock-storage'

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


// 获取当前用户ID（Mock实现）
function getCurrentUserId(request: NextRequest): string {
  const authCookie = request.cookies.get('ai-brain-auth')?.value
  
  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie)
      if (authData.email === 'admin@aibrain.com') {
        return 'user_admin'
      } else if (authData.email === 'demo@aibrain.com') {
        return 'user_demo'
      }
    } catch (e) {
      if (authCookie === 'admin@aibrain.com') {
        return 'user_admin'
      } else if (authCookie === 'demo@aibrain.com') {
        return 'user_demo'
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'user_admin'
  }
  
  throw new Error('Unauthorized')
}

// 检查用户是否有特定权限
function hasPermission(context: Context, userId: string, permission: string): boolean {
  const member = context.members.find(m => m.userId === userId)
  return member ? member.permissions.includes(permission) : false
}


// GET /api/contexts/[id] - 获取特定Context详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const contextId = params.id

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查读取权限
    if (!hasPermission(context, userId, CONTEXT_PERMISSIONS.READ)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ context })

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
    const userId = getCurrentUserId(request)
    const contextId = params.id
    const body = await request.json()
    const validated = updateContextSchema.parse(body)

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查写入权限
    if (!hasPermission(context, userId, CONTEXT_PERMISSIONS.WRITE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 准备更新数据
    const updates: Partial<Context> = {}
    
    if (validated.name !== undefined) {
      updates.name = validated.name
    }
    
    if (validated.description !== undefined) {
      updates.description = validated.description
    }

    if (validated.settings) {
      // 检查管理设置权限
      if (!hasPermission(context, userId, CONTEXT_PERMISSIONS.MANAGE_SETTINGS)) {
        return NextResponse.json({ error: 'Insufficient permissions for settings' }, { status: 403 })
      }
      
      updates.settings = {
        ...context.settings,
        ...validated.settings,
        notifications: validated.settings.notifications 
          ? { ...context.settings.notifications, ...validated.settings.notifications }
          : context.settings.notifications
      }
    }

    if (validated.metadata) {
      updates.metadata = { ...context.metadata, ...validated.metadata }
    }

    // 更新Context
    const updatedContext = updateContextById(contextId, updates)
    if (!updatedContext) {
      return NextResponse.json({ error: 'Failed to update context' }, { status: 500 })
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

// Deletion confirmation schema
const deleteSchema = z.object({
  confirmText: z.string(),
  permanent: z.boolean().optional().default(false),
})

// DELETE /api/contexts/[id] - 删除Context（支持软删除和硬删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const contextId = params.id
    const body = await request.json()
    const { confirmText, permanent } = deleteSchema.parse(body)

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查删除权限（只有Owner可以删除Context）
    if (!hasPermission(context, userId, CONTEXT_PERMISSIONS.DELETE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 如果是永久删除，验证确认文本
    if (permanent) {
      if (confirmText !== '永久删除' && confirmText !== 'DELETE FOREVER') {
        return NextResponse.json(
          { error: 'Invalid confirmation text for permanent deletion' },
          { status: 400 }
        )
      }

      // 模拟永久删除操作
      console.log(`Permanently deleting context: ${contextId}`)
      console.log('- Removing AI training data and conversation history')
      console.log('- Clearing vector database content and knowledge graphs')
      console.log('- Disconnecting data source integrations:', context.dataSources)
      console.log('- Deleting uploaded documents and generated reports')
      console.log('- Removing member access permissions for', context.members.length, 'members')

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 800))

      // 执行永久删除
      const success = removeContextById(contextId)
      if (!success) {
        return NextResponse.json({ error: 'Failed to permanently delete context' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Context permanently deleted',
        permanent: true
      })
    } else {
      // 软删除（归档）
      const success = removeContextById(contextId)
      if (!success) {
        return NextResponse.json({ error: 'Failed to archive context' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Context archived successfully',
        permanent: false
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('DELETE /api/contexts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
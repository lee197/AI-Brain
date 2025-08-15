import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Context, ContextMember, MemberRole, CONTEXT_PERMISSIONS, ROLE_PERMISSIONS } from '@/types/context'
import { getContextById, updateContextById } from '@/lib/mock-storage'

// 验证schema
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER', 'GUEST']),
  permissions: z.array(z.string()).optional(),
})

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER', 'GUEST']).optional(),
  permissions: z.array(z.string()).optional(),
})


// 获取当前用户ID
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

// 检查用户权限
function hasPermission(context: Context, userId: string, permission: string): boolean {
  const member = context.members.find(m => m.userId === userId)
  return member ? member.permissions.includes(permission) : false
}


// GET /api/contexts/[id]/members - 获取Context成员列表
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

    // 获取成员信息（不返回敏感的permissions数组，只返回role）
    const members = context.members.map(member => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      invitedBy: member.invitedBy,
    }))

    return NextResponse.json({ members })

  } catch (error) {
    console.error('GET /api/contexts/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/contexts/[id]/members - 添加成员到Context
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const contextId = params.id
    const body = await request.json()
    const validated = addMemberSchema.parse(body)

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查邀请成员权限
    if (!hasPermission(context, userId, CONTEXT_PERMISSIONS.INVITE_MEMBERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 检查是否已经是成员
    const existingMember = context.members.find(m => m.userId === validated.userId)
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // 检查Context设置是否允许邀请
    if (!context.settings.allowInvites) {
      return NextResponse.json({ error: 'Invitations are disabled for this context' }, { status: 400 })
    }

    // 创建新成员
    const newMember: ContextMember = {
      userId: validated.userId,
      contextId: contextId,
      role: validated.role,
      permissions: validated.permissions || ROLE_PERMISSIONS[validated.role],
      joinedAt: new Date(),
      invitedBy: userId,
    }

    // 添加到Context
    const updatedMembers = [...context.members, newMember]
    const updatedContext = updateContextById(contextId, { members: updatedMembers })
    
    if (!updatedContext) {
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Member added successfully',
      member: {
        userId: newMember.userId,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
        invitedBy: newMember.invitedBy,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/contexts/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/contexts/[id]/members/[userId] - 更新成员角色和权限
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getCurrentUserId(request)
    const contextId = params.id
    const body = await request.json()
    const { targetUserId, ...updateData } = body
    const validated = updateMemberSchema.parse(updateData)

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 检查管理角色权限
    if (!hasPermission(context, currentUserId, CONTEXT_PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 找到目标成员
    const targetMember = context.members.find(m => m.userId === targetUserId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // 不能修改Owner的角色
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify owner role' }, { status: 400 })
    }

    // 不能将其他人设置为Owner
    if (validated.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot assign owner role' }, { status: 400 })
    }

    // 更新成员信息
    const updatedMembers = context.members.map(member => {
      if (member.userId === targetUserId) {
        const updatedMember = { ...member }
        if (validated.role) {
          updatedMember.role = validated.role
          updatedMember.permissions = validated.permissions || ROLE_PERMISSIONS[validated.role]
        } else if (validated.permissions) {
          updatedMember.permissions = validated.permissions
        }
        return updatedMember
      }
      return member
    })
    
    const updatedContext = updateContextById(contextId, { members: updatedMembers })
    if (!updatedContext) {
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }
    
    const updatedMember = updatedContext.members.find(m => m.userId === targetUserId)!

    return NextResponse.json({ 
      message: 'Member updated successfully',
      member: {
        userId: updatedMember.userId,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt,
        invitedBy: updatedMember.invitedBy,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('PUT /api/contexts/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/contexts/[id]/members/[userId] - 移除成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getCurrentUserId(request)
    const contextId = params.id
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }

    const context = getContextById(contextId)
    if (!context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // 找到目标成员
    const targetMember = context.members.find(m => m.userId === targetUserId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // 不能移除Owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })
    }

    // 检查权限：管理员可以移除成员，或者用户可以移除自己
    const canRemove = 
      hasPermission(context, currentUserId, CONTEXT_PERMISSIONS.REMOVE_MEMBERS) ||
      currentUserId === targetUserId

    if (!canRemove) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 移除成员
    const updatedMembers = context.members.filter(m => m.userId !== targetUserId)
    const updatedContext = updateContextById(contextId, { members: updatedMembers })
    
    if (!updatedContext) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Member removed successfully' 
    })

  } catch (error) {
    console.error('DELETE /api/contexts/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// 模拟认证系统 - 用于开发和演示
// Mock Authentication System - For development and demo purposes

// 默认演示用户
export const DEMO_USERS = {
  admin: {
    email: 'admin@aibrain.com',
    password: 'admin123',
    name: '管理员 Admin',
    id: 'mock-user-admin',
    avatar: '👨‍💼',
    role: 'admin'
  },
  demo: {
    email: 'demo@aibrain.com', 
    password: 'demo123',
    name: '演示用户 Demo User',
    id: 'mock-user-demo',
    avatar: '👤',
    role: 'user'
  },
  test: {
    email: 'test@aibrain.com',
    password: 'test123',
    name: '测试用户 Test User',
    id: 'mock-user-test',
    avatar: '🧪',
    role: 'user'
  }
}

// 模拟用户 session
export interface MockUser {
  id: string
  email: string
  name: string
  avatar: string
  role: string
  createdAt: string
}

// 检查是否在模拟模式
export function isMockMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project.supabase.co' ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' ||
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-supabase-anon-key' ||
         process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
}

// 模拟登录
export async function mockLogin(email: string, password: string): Promise<{ user?: MockUser, error?: string }> {
  // 查找匹配的用户
  const user = Object.values(DEMO_USERS).find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )

  if (!user) {
    // 检查是否只是密码错误
    const userExists = Object.values(DEMO_USERS).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    )
    
    if (userExists) {
      return { error: '密码错误 / Incorrect password' }
    }
    
    return { error: '用户不存在 / User not found' }
  }

  // 创建模拟用户会话
  const mockUser: MockUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    createdAt: new Date().toISOString()
  }

  return { user: mockUser }
}

// 模拟注册
export async function mockSignup(email: string, password: string, name: string): Promise<{ user?: MockUser, error?: string }> {
  // 检查邮箱是否已存在
  const exists = Object.values(DEMO_USERS).find(
    u => u.email.toLowerCase() === email.toLowerCase()
  )

  if (exists) {
    return { error: '邮箱已被注册 / Email already registered' }
  }

  // 创建新用户（仅在内存中，不持久化）
  const mockUser: MockUser = {
    id: `mock-user-${Date.now()}`,
    email: email,
    name: name,
    avatar: '👤',
    role: 'user',
    createdAt: new Date().toISOString()
  }

  return { user: mockUser }
}

// 模拟登出
export async function mockLogout() {
  clearMockUserClient()
}

// 获取当前模拟用户 (服务端)
export async function getMockUser(): Promise<MockUser | null> {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('mock-auth-user')
    
    if (!userCookie) {
      return null
    }

    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}

// 获取当前模拟用户 (客户端)
export function getMockUserClient(): MockUser | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const stored = localStorage.getItem('mock-auth-user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// OAuth 模拟登录
export async function mockOAuthLogin(provider: 'google' | 'github'): Promise<{ user?: MockUser, error?: string }> {
  // 模拟 OAuth 登录，使用预设的演示用户
  const mockUser: MockUser = {
    id: `mock-oauth-${provider}-${Date.now()}`,
    email: `user@${provider}.com`,
    name: `${provider === 'google' ? 'Google' : 'GitHub'} User`,
    avatar: provider === 'google' ? '🔵' : '⚫',
    role: 'user',
    createdAt: new Date().toISOString()
  }

  return { user: mockUser }
}

// 客户端登录辅助函数
export function setMockUserClient(user: MockUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock-auth-user', JSON.stringify(user))
  }
}

// 客户端登出辅助函数
export function clearMockUserClient() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock-auth-user')
  }
}
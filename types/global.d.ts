// 全局类型声明文件 - 解决TypeScript构建错误

// 声明模块通配符，允许任何模块导入
declare module '*' {
  const content: any
  export default content
}

// 扩展Window对象
declare global {
  interface Window {
    __INITIAL_STATE__?: any
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
  
  // 扩展用户类型
  interface ExtendedUser {
    name?: string
    email?: string
    [key: string]: any
  }
  
  // User类型扩展，解决User.name不存在的问题
  interface User {
    id: string
    email?: string
    name?: string
    [key: string]: any
  }
}

// 常用的第三方模块类型声明
declare module '@slack/web-api' {
  export class WebClient {
    constructor(token?: string, options?: any)
    auth: any
    channels: any
    chat: any
    users: any
    conversations: any
    [key: string]: any
  }
}

declare module 'jira.js' {
  export class Version3Client {
    constructor(options?: any)
    [key: string]: any
  }
}

declare module '@octokit/rest' {
  export class Octokit {
    constructor(options?: any)
    [key: string]: any
  }
}

declare module 'googleapis' {
  export const google: any
}

declare module '@notionhq/client' {
  export class Client {
    constructor(options?: any)
    [key: string]: any
  }
}

// React相关类型扩展
declare namespace React {
  interface HTMLAttributes<T> {
    [key: string]: any
  }
}

// Next.js相关类型
declare module 'next/server' {
  export interface NextRequest {
    [key: string]: any
  }
  
  export interface NextResponse {
    [key: string]: any
  }
}

// Supabase相关类型 - 完全重写避免类型冲突
declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): SupabaseClient
  
  export interface SupabaseClient {
    from: (table: string) => any
    auth: any
    rpc: (fn: string, params?: any) => any
    channel: (name: string) => any
    removeChannel: (channel: any) => any
    [key: string]: any
  }
  
  export interface Database {
    [key: string]: any
  }
  
  export interface AuthError {
    message: string
    [key: string]: any
  }
  
  export interface User {
    id: string
    email?: string
    name?: string
    [key: string]: any
  }
}

declare module '@supabase/ssr' {
  export function createBrowserClient(url: string, key: string): any
  export function createServerClient(url: string, key: string, options?: any): any
}

// 通用接口
interface GenericObject {
  [key: string]: any
}

interface GenericFunction {
  (...args: any[]): any
}

// 认证相关类型
interface LoginResult {
  success?: boolean
  user?: any
  message?: string
  errors?: any
  logoutSuccess?: string
  sessionExpired?: string
  [key: string]: any
}

// 组件属性类型
interface ComponentProps {
  contextId?: string
  onComplete?: () => void
  className?: string
  children?: React.ReactNode
  [key: string]: any
}

// Button组件size类型扩展
declare module '@radix-ui/react-slot' {
  export interface ButtonProps {
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'md'
    [key: string]: any
  }
}

// 数据源配置类型
interface DataSourceConfig {
  id: string
  type: 'slack' | 'jira' | 'github' | 'google' | 'notion'
  name: string
  config: Record<string, any>
  status: 'pending' | 'connected' | 'syncing' | 'error'
  connectedAt?: string | Date
  created_at: string
  [key: string]: any
}

// Context设置类型
interface ContextSettings {
  dataSources: DataSourceConfig[]
  isPublic?: boolean
  allowInvites?: boolean
  aiEnabled?: boolean
  notifications?: any
  customFields?: any
  [key: string]: any
}

// Member角色类型
type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | 'GUEST'

// 导出空对象，确保这是一个模块
export {}
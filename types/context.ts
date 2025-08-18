// Context types and interfaces based on design document

export type ContextType = 'PROJECT' | 'DEPARTMENT' | 'TEAM' | 'CLIENT' | 'PERSONAL'

export type LifecycleType = 'TEMPORARY' | 'PERMANENT' | 'TRIGGERED'

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | 'GUEST'

export interface Context {
  // 基础属性
  id: string
  type: ContextType
  name: string
  description: string
  
  // 组织属性
  ownerId: string
  members: ContextMember[]
  
  // 生命周期
  lifecycle: LifecycleType
  createdAt: Date
  archivedAt?: Date
  
  // 配置
  settings: ContextSettings
  metadata: Record<string, any>
}

export interface ContextMember {
  userId: string
  contextId: string
  role: MemberRole
  permissions: string[]
  joinedAt: Date
  invitedBy?: string
}

export interface ContextSettings {
  // 可见性设置
  isPublic: boolean
  allowInvites: boolean
  
  // 数据源设置
  dataSources: DataSourceConfig[]
  
  // AI设置
  aiEnabled: boolean
  aiModel?: string
  
  // 通知设置
  notifications: NotificationSettings
  
  // 自定义字段
  customFields: Record<string, any>
}

export interface DataSourceConfig {
  id: string
  type: 'SLACK' | 'JIRA' | 'GITHUB' | 'GOOGLE' | 'NOTION'
  config: Record<string, any>
  connectedAt: Date
  lastSync?: Date
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING'
}

export interface NotificationSettings {
  emailNotifications: boolean
  slackNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
}

// Context创建请求
export interface CreateContextRequest {
  type: ContextType
  name: string
  description?: string
  lifecycle?: LifecycleType
  settings?: Partial<ContextSettings>
  initialMembers?: string[] // user IDs
  selectedDataSources?: DataSourceType[] // 选择的数据源类型
}

// 数据源类型
export type DataSourceType = 'SLACK' | 'JIRA' | 'GITHUB' | 'GOOGLE' | 'NOTION'

// Context更新请求
export interface UpdateContextRequest {
  name?: string
  description?: string
  settings?: Partial<ContextSettings>
}

// Context查询参数
export interface ContextQuery {
  type?: ContextType
  ownerId?: string
  memberId?: string
  archived?: boolean
  limit?: number
  offset?: number
}

// Context权限定义
export const CONTEXT_PERMISSIONS = {
  // 基础权限
  READ: 'context:read',
  WRITE: 'context:write',
  DELETE: 'context:delete',
  
  // 成员管理
  INVITE_MEMBERS: 'members:invite',
  REMOVE_MEMBERS: 'members:remove',
  MANAGE_ROLES: 'members:manage_roles',
  
  // 配置管理
  MANAGE_SETTINGS: 'settings:manage',
  MANAGE_INTEGRATIONS: 'integrations:manage',
  
  // 数据操作
  VIEW_DATA: 'data:view',
  EXPORT_DATA: 'data:export',
  
  // AI功能
  USE_AI: 'ai:use',
  CONFIGURE_AI: 'ai:configure',
} as const

// 角色默认权限映射
export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  OWNER: Object.values(CONTEXT_PERMISSIONS),
  ADMIN: [
    CONTEXT_PERMISSIONS.READ,
    CONTEXT_PERMISSIONS.WRITE,
    CONTEXT_PERMISSIONS.INVITE_MEMBERS,
    CONTEXT_PERMISSIONS.REMOVE_MEMBERS,
    CONTEXT_PERMISSIONS.MANAGE_ROLES,
    CONTEXT_PERMISSIONS.MANAGE_SETTINGS,
    CONTEXT_PERMISSIONS.MANAGE_INTEGRATIONS,
    CONTEXT_PERMISSIONS.VIEW_DATA,
    CONTEXT_PERMISSIONS.EXPORT_DATA,
    CONTEXT_PERMISSIONS.USE_AI,
    CONTEXT_PERMISSIONS.CONFIGURE_AI,
  ],
  MEMBER: [
    CONTEXT_PERMISSIONS.READ,
    CONTEXT_PERMISSIONS.WRITE,
    CONTEXT_PERMISSIONS.VIEW_DATA,
    CONTEXT_PERMISSIONS.USE_AI,
  ],
  VIEWER: [
    CONTEXT_PERMISSIONS.READ,
    CONTEXT_PERMISSIONS.VIEW_DATA,
  ],
  GUEST: [
    CONTEXT_PERMISSIONS.READ,
  ],
}

// Context类型描述
export const CONTEXT_TYPE_INFO: Record<ContextType, {
  title: string
  description: string
  icon: string
  defaultLifecycle: LifecycleType
  suggestedDuration?: string
}> = {
  PROJECT: {
    title: '项目',
    description: '有明确起止时间、目标导向、跨部门协作',
    icon: '🚀',
    defaultLifecycle: 'TEMPORARY',
    suggestedDuration: '3-12个月'
  },
  DEPARTMENT: {
    title: '部门',
    description: '持续运营、职能导向、固定团队',
    icon: '🏢',
    defaultLifecycle: 'PERMANENT'
  },
  TEAM: {
    title: '团队',
    description: '小组协作、专项任务、灵活组建',
    icon: '👥',
    defaultLifecycle: 'TEMPORARY',
    suggestedDuration: '1-6个月'
  },
  CLIENT: {
    title: '客户',
    description: '客户中心、关系管理、项目集合',
    icon: '💼',
    defaultLifecycle: 'PERMANENT'
  },
  PERSONAL: {
    title: '个人',
    description: '私人空间、个人任务、学习记录',
    icon: '📝',
    defaultLifecycle: 'PERMANENT'
  }
}

// Context状态枚举
export enum ContextStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT'
}

// Context活动日志
export interface ContextActivity {
  id: string
  contextId: string
  userId: string
  action: string
  details: Record<string, any>
  timestamp: Date
}

// Context统计信息
export interface ContextStats {
  contextId: string
  memberCount: number
  messageCount: number
  taskCount: number
  lastActivity: Date
  dataSourceCount: number
}
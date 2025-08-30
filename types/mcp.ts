/**
 * MCP (Model Context Protocol) 相关类型定义
 */

// MCP 基础协议类型
export interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: MCPError
}

export interface MCPError {
  code: number
  message: string
  data?: any
}

// MCP 工具相关类型
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolCall {
  name: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

// Google Workspace 相关类型
export interface GoogleWorkspaceContext {
  gmail: GmailMessage[]
  calendar: CalendarEvent[]
  drive: DriveFile[]
  totalItems: number
  lastUpdated: string
}

export interface GmailMessage {
  id: string
  threadId?: string
  subject: string
  from: string
  to: string
  cc?: string
  bcc?: string
  date: string
  snippet: string
  body?: string
  isRead: boolean
  isImportant: boolean
  isStarred?: boolean
  labels: string[]
  attachments?: GmailAttachment[]
}

export interface GmailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: string
  end: string
  isAllDay?: boolean
  attendees: CalendarAttendee[]
  location?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  visibility?: 'default' | 'public' | 'private' | 'confidential'
  recurrence?: string[]
  reminders?: CalendarReminder[]
}

export interface CalendarAttendee {
  email: string
  displayName?: string
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  organizer?: boolean
}

export interface CalendarReminder {
  method: 'email' | 'popup'
  minutes: number
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  createdTime?: string
  webViewLink: string
  webContentLink?: string
  ownedByMe: boolean
  owners?: DriveUser[]
  lastModifyingUser?: DriveUser
  shared?: boolean
  permissions?: DrivePermission[]
  parents?: string[]
  version?: string
}

export interface DriveUser {
  displayName: string
  emailAddress: string
  photoLink?: string
}

export interface DrivePermission {
  id: string
  type: 'user' | 'group' | 'domain' | 'anyone'
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'
  emailAddress?: string
  displayName?: string
}

// MCP 客户端配置
export interface MCPClientConfig {
  baseUrl: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

// MCP 连接状态
export interface MCPConnectionStatus {
  connected: boolean
  serverVersion?: string
  capabilities?: string[]
  availableTools?: string[]
  lastError?: string
  lastUpdated: string
}

// 搜索和过滤参数
export interface GmailSearchParams {
  query: string
  maxResults?: number
  labelIds?: string[]
  includeSpamTrash?: boolean
}

export interface CalendarSearchParams {
  timeMin?: string
  timeMax?: string
  maxResults?: number
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
}

export interface DriveSearchParams {
  query?: string
  pageSize?: number
  fields?: string
  orderBy?: string
  spaces?: 'drive' | 'appDataFolder'
}

// AI 上下文构建相关
export interface AIContextOptions {
  includeGmail?: boolean
  includeCalendar?: boolean
  includeDrive?: boolean
  maxGmailMessages?: number
  maxCalendarEvents?: number
  maxDriveFiles?: number
  timeRangeHours?: number
}

export interface AIContextResult {
  context: GoogleWorkspaceContext
  contextString: string
  tokensUsed: number
  processingTime: number
}
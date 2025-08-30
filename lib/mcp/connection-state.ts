/**
 * MCP Connection State Manager
 * 管理 MCP 连接的应用层状态
 */

import { promises as fs } from 'fs'
import path from 'path'

const STATE_DIR = path.join(process.cwd(), '.mcp-state')
const CONNECTIONS_FILE = path.join(STATE_DIR, 'connections.json')

interface MCPConnectionState {
  contextId: string
  sourceType: 'google-workspace-mcp' | 'slack-mcp' | 'jira-mcp'
  connected: boolean
  connectedAt?: string
  disconnectedAt?: string
  lastActivity?: string
}

interface ConnectionsState {
  connections: MCPConnectionState[]
}

/**
 * 确保状态目录存在
 */
async function ensureStateDir(): Promise<void> {
  try {
    await fs.mkdir(STATE_DIR, { recursive: true })
  } catch (error) {
    // Directory already exists, ignore
  }
}

/**
 * 读取连接状态
 */
async function readConnectionsState(): Promise<ConnectionsState> {
  try {
    await ensureStateDir()
    const data = await fs.readFile(CONNECTIONS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return default state
    return { connections: [] }
  }
}

/**
 * 写入连接状态
 */
async function writeConnectionsState(state: ConnectionsState): Promise<void> {
  await ensureStateDir()
  await fs.writeFile(CONNECTIONS_FILE, JSON.stringify(state, null, 2))
}

/**
 * 标记连接为已连接
 */
export async function markConnected(contextId: string, sourceType: 'google-workspace-mcp' | 'slack-mcp' | 'jira-mcp'): Promise<void> {
  const state = await readConnectionsState()
  
  // 找到现有连接或创建新的
  let connection = state.connections.find(c => c.contextId === contextId && c.sourceType === sourceType)
  
  if (connection) {
    connection.connected = true
    connection.connectedAt = new Date().toISOString()
    connection.lastActivity = new Date().toISOString()
    connection.disconnectedAt = undefined
  } else {
    connection = {
      contextId,
      sourceType,
      connected: true,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }
    state.connections.push(connection)
  }
  
  await writeConnectionsState(state)
  console.log(`✅ MCP connection marked as connected: ${sourceType} for context ${contextId}`)
}

/**
 * 标记连接为已断开
 */
export async function markDisconnected(contextId: string, sourceType: 'google-workspace-mcp' | 'slack-mcp' | 'jira-mcp'): Promise<void> {
  const state = await readConnectionsState()
  
  // 找到连接并标记为断开
  const connection = state.connections.find(c => c.contextId === contextId && c.sourceType === sourceType)
  
  if (connection) {
    connection.connected = false
    connection.disconnectedAt = new Date().toISOString()
    connection.lastActivity = new Date().toISOString()
  } else {
    // 创建一个已断开状态的记录
    state.connections.push({
      contextId,
      sourceType,
      connected: false,
      disconnectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    })
  }
  
  await writeConnectionsState(state)
  console.log(`🔌 MCP connection marked as disconnected: ${sourceType} for context ${contextId}`)
}

/**
 * 检查连接状态
 */
export async function isConnected(contextId: string, sourceType: 'google-workspace-mcp' | 'slack-mcp' | 'jira-mcp'): Promise<boolean> {
  const state = await readConnectionsState()
  const connection = state.connections.find(c => c.contextId === contextId && c.sourceType === sourceType)
  
  return connection?.connected ?? false
}

/**
 * 获取连接详情
 */
export async function getConnectionDetails(contextId: string, sourceType: 'google-workspace-mcp' | 'slack-mcp' | 'jira-mcp'): Promise<MCPConnectionState | null> {
  const state = await readConnectionsState()
  const connection = state.connections.find(c => c.contextId === contextId && c.sourceType === sourceType)
  
  if (connection) {
    // 更新最后活动时间
    connection.lastActivity = new Date().toISOString()
    await writeConnectionsState(state)
  }
  
  return connection || null
}

/**
 * 清理过期连接 (24小时无活动)
 */
export async function cleanupExpiredConnections(): Promise<void> {
  const state = await readConnectionsState()
  const now = new Date()
  const expiredThreshold = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  
  const activeConnections = state.connections.filter(connection => {
    if (!connection.lastActivity) return false
    
    const lastActivity = new Date(connection.lastActivity)
    const timeSinceActivity = now.getTime() - lastActivity.getTime()
    
    return timeSinceActivity < expiredThreshold
  })
  
  if (activeConnections.length !== state.connections.length) {
    state.connections = activeConnections
    await writeConnectionsState(state)
    console.log(`🧹 Cleaned up expired MCP connections`)
  }
}
// Slack消息发送历史管理
// 暂时使用localStorage存储，后续可以迁移到数据库

export interface SlackMessageHistory {
  id: string
  content: string
  channelId: string
  channelName: string
  sentAt: number
  messageTs?: string
  permalink?: string
  status: 'success' | 'failed'
  error?: string
}

const STORAGE_KEY = 'slack_message_history'
const MAX_HISTORY_COUNT = 100 // 最大保存100条历史记录

/**
 * 获取消息发送历史
 * @param contextId Context ID
 * @returns 消息历史记录
 */
export function getMessageHistory(contextId: string): SlackMessageHistory[] {
  if (typeof window === 'undefined') {
    return [] // 服务端返回空数组
  }
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${contextId}`)
    if (!stored) return []
    
    const history: SlackMessageHistory[] = JSON.parse(stored)
    
    // 按时间倒序排列
    return history.sort((a, b) => b.sentAt - a.sentAt)
  } catch (error) {
    console.error('Error reading message history:', error)
    return []
  }
}

/**
 * 保存消息发送记录
 * @param contextId Context ID
 * @param record 消息记录
 */
export function saveMessageHistory(contextId: string, record: Omit<SlackMessageHistory, 'id'>): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${contextId}`)
    let history: SlackMessageHistory[] = stored ? JSON.parse(stored) : []
    
    // 添加新记录
    const newRecord: SlackMessageHistory = {
      id: Date.now().toString(),
      ...record
    }
    
    history.unshift(newRecord) // 添加到开头
    
    // 限制历史记录数量
    if (history.length > MAX_HISTORY_COUNT) {
      history = history.slice(0, MAX_HISTORY_COUNT)
    }
    
    localStorage.setItem(`${STORAGE_KEY}_${contextId}`, JSON.stringify(history))
    
    console.log(`✅ 消息历史已保存 (Context: ${contextId}, 总数: ${history.length})`)
  } catch (error) {
    console.error('Error saving message history:', error)
  }
}

/**
 * 删除特定消息记录
 * @param contextId Context ID
 * @param messageId 消息ID
 */
export function removeMessageHistory(contextId: string, messageId: string): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${contextId}`)
    if (!stored) return
    
    let history: SlackMessageHistory[] = JSON.parse(stored)
    history = history.filter(record => record.id !== messageId)
    
    localStorage.setItem(`${STORAGE_KEY}_${contextId}`, JSON.stringify(history))
    
    console.log(`🗑️ 消息历史已删除 (ID: ${messageId})`)
  } catch (error) {
    console.error('Error removing message history:', error)
  }
}

/**
 * 清空消息历史
 * @param contextId Context ID
 */
export function clearMessageHistory(contextId: string): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${contextId}`)
    console.log(`🗑️ 消息历史已清空 (Context: ${contextId})`)
  } catch (error) {
    console.error('Error clearing message history:', error)
  }
}

/**
 * 获取消息历史统计信息
 * @param contextId Context ID
 */
export function getMessageHistoryStats(contextId: string) {
  const history = getMessageHistory(contextId)
  
  const total = history.length
  const successful = history.filter(record => record.status === 'success').length
  const failed = history.filter(record => record.status === 'failed').length
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const todayCount = history.filter(record => record.sentAt >= todayStart).length
  
  // 按频道统计
  const channelStats = history.reduce((stats, record) => {
    const channel = record.channelName
    if (!stats[channel]) {
      stats[channel] = { count: 0, success: 0, failed: 0 }
    }
    stats[channel].count++
    if (record.status === 'success') {
      stats[channel].success++
    } else {
      stats[channel].failed++
    }
    return stats
  }, {} as Record<string, { count: number; success: number; failed: number }>)
  
  return {
    total,
    successful,
    failed,
    todayCount,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    channelStats,
    recentMessages: history.slice(0, 5) // 最近5条消息
  }
}

/**
 * 导出消息历史为JSON
 * @param contextId Context ID
 */
export function exportMessageHistory(contextId: string): string {
  const history = getMessageHistory(contextId)
  const stats = getMessageHistoryStats(contextId)
  
  const exportData = {
    exportTime: new Date().toISOString(),
    contextId,
    stats,
    messages: history.map(record => ({
      ...record,
      sentAtFormatted: new Date(record.sentAt).toISOString()
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * 获取失败消息列表（用于重试）
 * @param contextId Context ID
 */
export function getFailedMessages(contextId: string): SlackMessageHistory[] {
  const history = getMessageHistory(contextId)
  return history.filter(record => record.status === 'failed')
}

/**
 * 更新消息状态（重试后）
 * @param contextId Context ID
 * @param messageId 消息ID
 * @param updates 更新内容
 */
export function updateMessageHistory(
  contextId: string, 
  messageId: string, 
  updates: Partial<SlackMessageHistory>
): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${contextId}`)
    if (!stored) return
    
    let history: SlackMessageHistory[] = JSON.parse(stored)
    const index = history.findIndex(record => record.id === messageId)
    
    if (index >= 0) {
      history[index] = { ...history[index], ...updates }
      localStorage.setItem(`${STORAGE_KEY}_${contextId}`, JSON.stringify(history))
      console.log(`✅ 消息历史已更新 (ID: ${messageId})`)
    }
  } catch (error) {
    console.error('Error updating message history:', error)
  }
}
// 频道配置管理
// 暂时使用localStorage存储，后续可以迁移到数据库

export interface ChannelConfig {
  contextId: string
  selectedChannels: string[]
  lastUpdated: number
}

const STORAGE_KEY = 'slack_channel_config'

/**
 * 获取频道配置
 * @param contextId Context ID
 * @returns 频道配置
 */
export function getChannelConfig(contextId: string): string[] {
  if (typeof window === 'undefined') {
    return [] // 服务端返回空数组
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const configs: ChannelConfig[] = JSON.parse(stored)
    const config = configs.find(c => c.contextId === contextId)
    
    return config?.selectedChannels || []
  } catch (error) {
    console.error('Error reading channel config:', error)
    return []
  }
}

/**
 * 保存频道配置
 * @param contextId Context ID
 * @param selectedChannels 选择的频道ID列表
 */
export function saveChannelConfig(contextId: string, selectedChannels: string[]): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const configs: ChannelConfig[] = stored ? JSON.parse(stored) : []
    
    // 更新或添加配置
    const existingIndex = configs.findIndex(c => c.contextId === contextId)
    const newConfig: ChannelConfig = {
      contextId,
      selectedChannels,
      lastUpdated: Date.now()
    }
    
    if (existingIndex >= 0) {
      configs[existingIndex] = newConfig
    } else {
      configs.push(newConfig)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    
    console.log(`✅ 频道配置已保存 (Context: ${contextId}, 频道数: ${selectedChannels.length})`)
  } catch (error) {
    console.error('Error saving channel config:', error)
  }
}

/**
 * 删除频道配置
 * @param contextId Context ID
 */
export function removeChannelConfig(contextId: string): void {
  if (typeof window === 'undefined') {
    return // 服务端不执行
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    
    let configs: ChannelConfig[] = JSON.parse(stored)
    configs = configs.filter(c => c.contextId !== contextId)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    
    console.log(`🗑️ 频道配置已删除 (Context: ${contextId})`)
  } catch (error) {
    console.error('Error removing channel config:', error)
  }
}

/**
 * 检查频道是否被选择
 * @param contextId Context ID
 * @param channelId 频道ID
 * @returns 是否被选择
 */
export function isChannelSelected(contextId: string, channelId: string): boolean {
  const selectedChannels = getChannelConfig(contextId)
  return selectedChannels.includes(channelId)
}

/**
 * 获取所有配置的统计信息
 */
export function getConfigStats() {
  if (typeof window === 'undefined') {
    return { totalContexts: 0, totalChannels: 0 }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { totalContexts: 0, totalChannels: 0 }
    
    const configs: ChannelConfig[] = JSON.parse(stored)
    const totalChannels = configs.reduce((sum, config) => sum + config.selectedChannels.length, 0)
    
    return {
      totalContexts: configs.length,
      totalChannels
    }
  } catch (error) {
    console.error('Error getting config stats:', error)
    return { totalContexts: 0, totalChannels: 0 }
  }
}
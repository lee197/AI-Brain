/**
 * 数据源状态缓存管理
 * 避免重复的API调用，提升用户体验
 */

interface CachedStatus {
  status: any
  timestamp: number
  expiry: number
}

class StatusCacheManager {
  private cache = new Map<string, CachedStatus>()
  private readonly DEFAULT_TTL = 30 * 1000 // 30秒缓存

  /**
   * 生成缓存键
   */
  private getCacheKey(dataSource: string, contextId: string): string {
    return `${dataSource}:${contextId}`
  }

  /**
   * 获取缓存的状态
   */
  get(dataSource: string, contextId: string): any | null {
    const key = this.getCacheKey(dataSource, contextId)
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return cached.status
  }

  /**
   * 设置缓存状态
   */
  set(dataSource: string, contextId: string, status: any, ttl?: number): void {
    const key = this.getCacheKey(dataSource, contextId)
    const cacheTTL = ttl || this.DEFAULT_TTL
    
    this.cache.set(key, {
      status,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTTL
    })
  }

  /**
   * 删除指定的缓存
   */
  delete(dataSource: string, contextId: string): void {
    const key = this.getCacheKey(dataSource, contextId)
    this.cache.delete(key)
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { totalEntries: number; validEntries: number } {
    const totalEntries = this.cache.size
    const now = Date.now()
    let validEntries = 0
    
    for (const cached of this.cache.values()) {
      if (now <= cached.expiry) {
        validEntries++
      }
    }
    
    return { totalEntries, validEntries }
  }
}

// 全局单例
export const statusCache = new StatusCacheManager()

// 定期清理过期缓存
if (typeof window === 'undefined') {
  // 只在服务端运行
  setInterval(() => {
    statusCache.cleanup()
  }, 60 * 1000) // 每分钟清理一次
}
/**
 * 应用初始化器 - 在服务器启动时运行
 * 确保所有关键系统组件正确初始化
 */

import { initializeDNS, getDNSStatus } from './dns-manager'

/**
 * 初始化应用程序的所有必要组件
 * 这个函数在服务器启动时被调用
 */
export async function initializeApp(): Promise<void> {
  console.log('🚀 开始初始化 AI Brain 应用程序...')
  
  try {
    // 1. 初始化DNS配置（最高优先级）
    console.log('📡 初始化DNS配置...')
    await initializeDNS()
    
    // 2. 验证关键连接
    console.log('🔗 验证关键服务连接...')
    await verifyKeyConnections()
    
    // 3. 显示初始化状态
    displayInitializationStatus()
    
    console.log('✅ AI Brain 应用程序初始化完成\n')
    
  } catch (error) {
    console.error('❌ 应用程序初始化失败:', error)
    // 不要抛出错误，让应用继续启动，但记录问题
    console.log('⚠️ 应用将在降级模式下运行')
  }
}

/**
 * 验证关键服务连接
 */
async function verifyKeyConnections(): Promise<void> {
  const verifications = [
    verifySupabaseConnection(),
    // 未来可以添加其他关键服务验证
  ]
  
  const results = await Promise.allSettled(verifications)
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.log(`⚠️ 服务 ${index + 1} 连接验证失败:`, result.reason?.message)
    }
  })
}

/**
 * 验证Supabase连接
 */
async function verifySupabaseConnection(): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase URL未配置')
    }
    
    // 使用fetch测试连接，这会使用我们配置的DNS
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      // 设置超时
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      console.log('✅ Supabase连接正常')
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
  } catch (error: any) {
    console.log('❌ Supabase连接失败:', error.message)
    throw error
  }
}

/**
 * 显示初始化状态摘要
 */
function displayInitializationStatus(): void {
  const dnsStatus = getDNSStatus()
  
  console.log('\n📊 系统初始化状态摘要:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🌐 DNS配置: ${dnsStatus.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}`)
  console.log(`📡 DNS服务器: ${dnsStatus.currentServers.join(', ')}`)
  console.log(`⏰ 健康检查: ${dnsStatus.lastHealthCheck ? '✅ 完成' : '⏳ 等待中'}`)
  console.log(`🔒 环境: ${process.env.NODE_ENV || 'development'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

/**
 * 优雅关闭处理
 */
export function setupGracefulShutdown(): void {
  const cleanup = () => {
    console.log('\n🛑 正在优雅关闭应用程序...')
    
    // 清理DNS管理器
    const { dnsManager } = require('./dns-manager')
    dnsManager.destroy()
    
    console.log('✅ 清理完成')
    process.exit(0)
  }
  
  // 监听关闭信号
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGUSR2', cleanup) // nodemon重启
}
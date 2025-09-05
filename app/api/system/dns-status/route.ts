/**
 * DNS状态监控API端点
 * GET /api/system/dns-status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDNSStatus, safeDNSResolve } from '@/lib/dns-manager'
import * as dns from 'dns'

export async function GET(request: NextRequest) {
  try {
    // 获取基本DNS状态
    const dnsStatus = getDNSStatus()
    
    // 测试关键域名解析
    const testResults = await Promise.allSettled([
      testDomainResolution('ewwewswxjyuxfbwzdirx.supabase.co'),
      testDomainResolution('google.com'),
      testDomainResolution('github.com'),
    ])
    
    // 获取系统DNS配置
    const systemDNS = dns.getServers()
    
    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      dns: {
        isInitialized: dnsStatus.isInitialized,
        currentServers: dnsStatus.currentServers,
        systemServers: systemDNS,
        lastHealthCheck: dnsStatus.lastHealthCheck,
        healthCheckAge: dnsStatus.healthCheckAge,
      },
      tests: {
        supabase: testResults[0],
        google: testResults[1],
        github: testResults[2],
      },
      recommendations: generateRecommendations(dnsStatus, testResults)
    }
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function testDomainResolution(domain: string): Promise<{
  domain: string
  status: 'success' | 'failed'
  addresses?: string[]
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const addresses = await safeDNSResolve(domain)
    const responseTime = Date.now() - startTime
    
    return {
      domain,
      status: 'success',
      addresses,
      responseTime
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return {
      domain,
      status: 'failed',
      responseTime,
      error: error.message
    }
  }
}

function generateRecommendations(
  dnsStatus: ReturnType<typeof getDNSStatus>,
  testResults: PromiseSettledResult<any>[]
): string[] {
  const recommendations: string[] = []
  
  // DNS未初始化
  if (!dnsStatus.isInitialized) {
    recommendations.push('DNS管理器未初始化，请重启应用程序')
  }
  
  // 健康检查过期
  if (dnsStatus.healthCheckAge > 300000) { // 5分钟
    recommendations.push('DNS健康检查已过期，建议触发新的健康检查')
  }
  
  // 测试失败过多
  const failedTests = testResults.filter(r => r.status === 'rejected').length
  if (failedTests > 1) {
    recommendations.push('多个域名解析失败，建议检查网络连接或重新配置DNS')
  }
  
  // DNS服务器为空
  if (dnsStatus.currentServers.length === 0) {
    recommendations.push('没有配置DNS服务器，请检查DNS管理器配置')
  }
  
  // 如果一切正常
  if (recommendations.length === 0) {
    recommendations.push('DNS配置正常，系统运行良好')
  }
  
  return recommendations
}
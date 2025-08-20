import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 获取Slack频道配置信息
 * 返回已配置的频道数量和详细信息
 */

// 使用文件存储作为临时解决方案
const getConfigPath = (contextId: string) => {
  const configDir = path.join(process.cwd(), '.slack-configs')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  return path.join(configDir, `${contextId}.json`)
}

const saveConfig = (contextId: string, config: any) => {
  const configPath = getConfigPath(contextId)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

const loadConfig = (contextId: string) => {
  const configPath = getConfigPath(contextId)
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading config:', error)
      return null
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: '缺少contextId参数'
      }, { status: 400 })
    }

    // 从文件存储获取配置
    const savedConfig = loadConfig(contextId)
    
    if (savedConfig) {
      console.log('🔍 找到已保存的频道配置:', { contextId, channelCount: savedConfig.configuredChannels.length })
      
      // 获取总频道数量
      let totalAvailableChannels = 12 // 默认值
      try {
        const channelsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/slack/channels`)
        const channelsData = await channelsResponse.json()
        if (channelsData.success) {
          totalAvailableChannels = channelsData.channels?.length || 12
        }
      } catch (error) {
        console.log('⚠️ 获取频道总数失败，使用默认值')
      }
      
      return NextResponse.json({
        success: true,
        data: {
          contextId,
          configuredChannels: savedConfig.configuredChannels,
          lastConfigured: savedConfig.lastConfigured,
          totalAvailableChannels
        },
        stats: {
          configuredCount: savedConfig.configuredChannels.length,
          totalCount: totalAvailableChannels,
          lastConfigured: savedConfig.lastConfigured
        }
      })
    } else {
      console.log('🔍 未找到已保存的频道配置，返回空配置')
      return NextResponse.json({
        success: true,
        data: {
          contextId,
          configuredChannels: [],
          lastConfigured: null,
          totalAvailableChannels: 12
        },
        stats: {
          configuredCount: 0,
          totalCount: 12,
          lastConfigured: null
        }
      })
    }

  } catch (error) {
    console.error('获取Slack频道配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 })
  }
}

/**
 * 更新Slack频道配置
 * 保存用户选择的频道列表
 */
export async function POST(req: NextRequest) {
  try {
    const { contextId, selectedChannels } = await req.json()
    
    if (!contextId || !Array.isArray(selectedChannels)) {
      return NextResponse.json({
        success: false,
        error: '参数无效'
      }, { status: 400 })
    }

    console.log('💾 更新频道配置:', { contextId, channelCount: selectedChannels.length })

    // 保存到文件存储
    const now = new Date().toISOString()
    const configData = {
      configuredChannels: selectedChannels,
      lastConfigured: now
    }
    
    saveConfig(contextId, configData)
    console.log('✅ 频道配置已保存到文件:', configData)

    return NextResponse.json({
      success: true,
      message: '频道配置已更新',
      data: {
        contextId,
        configuredChannels: selectedChannels,
        updatedAt: now
      }
    })

  } catch (error) {
    console.error('更新频道配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新配置失败'
    }, { status: 500 })
  }
}
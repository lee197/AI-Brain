import { NextRequest, NextResponse } from 'next/server'
import { SlackWebApi } from '@/lib/slack/api-client'
import { setServerChannelConfig } from '@/lib/slack/event-processor'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: '缺少contextId参数',
        channels: []
      }, { status: 400 })
    }

    const slackApi = new SlackWebApi(contextId)
    
    // 获取所有可访问的频道和Bot已加入的频道
    const [allChannels, botChannels] = await Promise.all([
      slackApi.getChannelList(), // 所有频道
      slackApi.getBotChannels()   // Bot已加入的频道
    ])

    // 创建Bot频道ID集合，用于快速查找
    const botChannelIds = new Set(botChannels.map(channel => channel.id))

    // 格式化频道数据
    const formattedChannels = (allChannels || []).map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private || false,
      memberCount: channel.num_members || 0,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
      isArchived: channel.is_archived || false,
      isBotMember: botChannelIds.has(channel.id), // Bot是否已加入
      canReceiveMessages: botChannelIds.has(channel.id) // 只有Bot加入的频道才能接收消息
    }))

    // 过滤掉已归档的频道，按名称排序
    const activeChannels = formattedChannels
      .filter(channel => !channel.isArchived)
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      channels: activeChannels,
      total: activeChannels.length
    })

  } catch (error) {
    console.error('获取Slack频道失败:', error)
    return NextResponse.json({ 
      error: '获取频道列表失败',
      details: error instanceof Error ? error.message : '未知错误',
      channels: []
    }, { status: 500 })
  }
}

// 更新频道选择配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { selectedChannels, contextId } = body

    if (!Array.isArray(selectedChannels)) {
      return NextResponse.json({ 
        error: '选择的频道列表格式错误' 
      }, { status: 400 })
    }

    // 同步配置到服务端，用于消息过滤
    setServerChannelConfig(contextId, selectedChannels)
    
    console.log('✅ 频道配置已更新:', {
      contextId,
      channelCount: selectedChannels.length,
      channels: selectedChannels
    })

    return NextResponse.json({
      success: true,
      message: `已选择 ${selectedChannels.length} 个频道`,
      selectedChannels
    })

  } catch (error) {
    console.error('保存频道配置失败:', error)
    return NextResponse.json({ 
      error: '保存配置失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
import { WebClient } from '@slack/web-api'

/**
 * Slack API客户端
 * 用于调用Slack Web API获取用户和频道信息
 */
export class SlackWebApi {
  private client: WebClient | null
  private botToken: string

  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN || ''
    if (this.botToken) {
      this.client = new WebClient(this.botToken)
    } else {
      this.client = null
      console.warn('SLACK_BOT_TOKEN not configured, using mock data')
    }
  }

  /**
   * 获取用户信息
   * @param userId Slack用户ID
   * @returns 用户信息
   */
  async getUserInfo(userId: string) {
    if (!this.client) {
      return this.getMockUserInfo(userId)
    }

    try {
      const result = await this.client.users.info({
        user: userId
      })
      
      if (!result.ok || !result.user) {
        console.error('Slack API error:', result.error)
        return this.getMockUserInfo(userId)
      }

      return result.user
    } catch (error) {
      console.error('Error fetching user info:', error)
      return this.getMockUserInfo(userId)
    }
  }

  /**
   * 获取频道信息
   * @param channelId Slack频道ID
   * @returns 频道信息
   */
  async getChannelInfo(channelId: string) {
    if (!this.client) {
      return this.getMockChannelInfo(channelId)
    }

    try {
      const result = await this.client.conversations.info({
        channel: channelId
      })
      
      if (!result.ok || !result.channel) {
        console.error('Slack API error:', result.error)
        return this.getMockChannelInfo(channelId)
      }

      return result.channel
    } catch (error) {
      console.error('Error fetching channel info:', error)
      return this.getMockChannelInfo(channelId)
    }
  }

  /**
   * 获取频道列表
   * @returns 频道列表
   */
  async getChannelList() {
    if (!this.client) {
      return this.getMockChannelList()
    }

    try {
      const result = await this.client.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      })
      
      if (!result.ok || !result.channels) {
        console.error('Slack API error:', result.error)
        return this.getMockChannelList()
      }

      return result.channels
    } catch (error) {
      console.error('Error fetching channel list:', error)
      return this.getMockChannelList()
    }
  }

  /**
   * 发送消息到Slack频道 (扩展版本)
   * @param options 发送选项
   * @returns 发送结果
   */
  async sendMessage(options: {
    channel: string
    text?: string
    blocks?: any[]
    attachments?: any[]
    thread_ts?: string
    unfurl_links?: boolean
    unfurl_media?: boolean
  }) {
    if (!this.client) {
      console.log('Mock: Sending message to', options.channel, ':', options.text || '[富文本消息]')
      return { 
        ok: true, 
        ts: Date.now().toString(),
        message: {
          text: options.text,
          permalink: `https://mock-workspace.slack.com/archives/${options.channel}/p${Date.now()}`
        }
      }
    }

    try {
      const result = await this.client.chat.postMessage({
        channel: options.channel,
        text: options.text || '消息', // 备用文本
        blocks: options.blocks,
        attachments: options.attachments,
        thread_ts: options.thread_ts,
        unfurl_links: options.unfurl_links ?? false,
        unfurl_media: options.unfurl_media ?? false
      })
      
      if (!result.ok) {
        console.error('Slack API error:', result.error)
        throw new Error(result.error || 'Unknown Slack API error')
      }

      return {
        ok: true,
        ts: result.ts,
        message: result.message
      }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * 发送简单文本消息 (兼容性方法)
   * @param channelId 频道ID
   * @param text 消息内容
   * @returns 发送结果
   */
  async sendTextMessage(channelId: string, text: string) {
    return this.sendMessage({
      channel: channelId,
      text: text
    })
  }

  /**
   * 获取Bot加入的频道列表
   * @returns Bot已加入的频道列表
   */
  async getBotChannels() {
    if (!this.client) {
      return this.getMockBotChannels()
    }

    try {
      // 先获取Bot的用户ID
      const authTest = await this.client.auth.test()
      if (!authTest.ok || !authTest.user_id) {
        return []
      }

      // 获取Bot参与的对话
      const result = await this.client.users.conversations({
        user: authTest.user_id,
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 200
      })
      
      if (!result.ok || !result.channels) {
        console.error('Slack API error:', result.error)
        return this.getMockBotChannels()
      }

      return result.channels
    } catch (error) {
      console.error('Error fetching bot channels:', error)
      return this.getMockBotChannels()
    }
  }

  /**
   * 检查Bot是否在特定频道中
   * @param channelId 频道ID
   * @returns 是否在频道中
   */
  async isBotInChannel(channelId: string): Promise<boolean> {
    if (!this.client) {
      return true // 模拟环境默认返回true
    }

    try {
      const botChannels = await this.getBotChannels()
      return botChannels.some(channel => channel.id === channelId)
    } catch (error) {
      console.error('Error checking bot channel membership:', error)
      return false
    }
  }

  /**
   * 验证Bot Token是否有效
   * @returns 验证结果
   */
  async verifyConnection() {
    if (!this.client) {
      return { ok: false, error: 'No bot token configured' }
    }

    try {
      const result = await this.client.auth.test()
      return {
        ok: result.ok,
        user: result.user,
        user_id: result.user_id,
        team: result.team,
        team_id: result.team_id
      }
    } catch (error) {
      console.error('Error verifying Slack connection:', error)
      return { ok: false, error: error }
    }
  }

  /**
   * 模拟用户信息 (开发环境使用)
   */
  private getMockUserInfo(userId: string) {
    return {
      id: userId,
      real_name: `User ${userId.slice(-4)}`,
      display_name: `user${userId.slice(-4)}`,
      profile: {
        image_72: `https://ui-avatars.com/api/?name=User+${userId.slice(-4)}&size=72&background=random`
      }
    }
  }

  /**
   * 模拟频道信息 (开发环境使用)
   */
  private getMockChannelInfo(channelId: string) {
    return {
      id: channelId,
      name: `channel-${channelId.slice(-4)}`,
      is_private: false,
      topic: {
        value: `Mock channel ${channelId.slice(-4)}`
      },
      purpose: {
        value: `Development channel for testing`
      }
    }
  }

  /**
   * 模拟频道列表 (开发环境使用)
   */
  private getMockChannelList() {
    return [
      {
        id: 'C1234567890',
        name: 'general',
        is_private: false,
        topic: { value: 'General discussion' },
        num_members: 45,
        purpose: { value: 'Company-wide announcements and general discussion' }
      },
      {
        id: 'C0987654321',
        name: 'development',
        is_private: false,
        topic: { value: 'Development discussion' },
        num_members: 12,
        purpose: { value: 'Development team coordination' }
      },
      {
        id: 'C5555555555',
        name: 'ai-brain',
        is_private: false,
        topic: { value: 'AI Brain project discussion' },
        num_members: 8,
        purpose: { value: 'AI Brain project development and testing' }
      },
      {
        id: 'C6666666666',
        name: 'marketing',
        is_private: false,
        topic: { value: 'Marketing campaigns and strategy' },
        num_members: 15,
        purpose: { value: 'Marketing team collaboration' }
      },
      {
        id: 'G7777777777',
        name: 'private-team',
        is_private: true,
        topic: { value: 'Private team discussions' },
        num_members: 5,
        purpose: { value: 'Leadership team private discussions' }
      }
    ]
  }

  /**
   * 模拟Bot频道列表 (开发环境使用)
   */
  private getMockBotChannels() {
    return [
      {
        id: 'C5555555555',
        name: 'ai-brain',
        is_private: false,
        topic: { value: 'AI Brain project discussion' },
        num_members: 8
      },
      {
        id: 'C0987654321', 
        name: 'development',
        is_private: false,
        topic: { value: 'Development discussion' },
        num_members: 12
      }
    ]
  }
}
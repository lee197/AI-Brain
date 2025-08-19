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
   * 发送消息到Slack频道
   * @param channelId 频道ID
   * @param text 消息内容
   * @returns 发送结果
   */
  async sendMessage(channelId: string, text: string) {
    if (!this.client) {
      console.log('Mock: Sending message to', channelId, ':', text)
      return { ok: true, ts: Date.now().toString() }
    }

    try {
      const result = await this.client.chat.postMessage({
        channel: channelId,
        text: text
      })
      
      if (!result.ok) {
        console.error('Slack API error:', result.error)
        return { ok: false, error: result.error }
      }

      return {
        ok: true,
        ts: result.ts,
        message: result.message
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return { ok: false, error: error }
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
        topic: { value: 'General discussion' }
      },
      {
        id: 'C0987654321',
        name: 'development',
        is_private: false,
        topic: { value: 'Development discussion' }
      },
      {
        id: 'C5555555555',
        name: 'ai-brain',
        is_private: false,
        topic: { value: 'AI Brain project discussion' }
      }
    ]
  }
}
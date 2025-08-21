import { WebClient } from '@slack/web-api'

/**
 * Slack API客户端
 * 用于调用Slack Web API获取用户和频道信息
 */
export class SlackWebApi {
  private client: WebClient
  private botToken: string

  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN || ''
    if (!this.botToken) {
      throw new Error('SLACK_BOT_TOKEN is required but not configured')
    }
    this.client = new WebClient(this.botToken)
  }

  /**
   * 获取用户信息
   * @param userId Slack用户ID
   * @returns 用户信息
   */
  async getUserInfo(userId: string) {
    try {
      const result = await this.client.users.info({
        user: userId
      })
      
      if (!result.ok || !result.user) {
        throw new Error(`Slack API error: ${result.error}`)
      }

      return result.user
    } catch (error) {
      console.error('Error fetching user info:', error)
      throw error
    }
  }

  /**
   * 获取频道信息
   * @param channelId Slack频道ID
   * @returns 频道信息
   */
  async getChannelInfo(channelId: string) {
    try {
      const result = await this.client.conversations.info({
        channel: channelId
      })
      
      if (!result.ok || !result.channel) {
        throw new Error(`Slack API error: ${result.error}`)
      }

      return result.channel
    } catch (error) {
      console.error('Error fetching channel info:', error)
      throw error
    }
  }

  /**
   * 获取频道列表
   * @returns 频道列表
   */
  async getChannelList() {
    try {
      const result = await this.client.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      })
      
      if (!result.ok || !result.channels) {
        throw new Error(`Slack API error: ${result.error}`)
      }

      return result.channels
    } catch (error) {
      console.error('Error fetching channel list:', error)
      throw error
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
    try {
      // 先获取Bot的用户ID
      const authTest = await this.client.auth.test()
      if (!authTest.ok || !authTest.user_id) {
        throw new Error('Failed to get bot user ID')
      }

      // 获取Bot参与的对话
      const result = await this.client.users.conversations({
        user: authTest.user_id,
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 200
      })
      
      if (!result.ok || !result.channels) {
        throw new Error(`Slack API error: ${result.error}`)
      }

      return result.channels
    } catch (error) {
      console.error('Error fetching bot channels:', error)
      throw error
    }
  }

  /**
   * 检查Bot是否在特定频道中
   * @param channelId 频道ID
   * @returns 是否在频道中
   */
  async isBotInChannel(channelId: string): Promise<boolean> {
    try {
      const botChannels = await this.getBotChannels()
      return botChannels.some(channel => channel.id === channelId)
    } catch (error) {
      console.error('Error checking bot channel membership:', error)
      throw error
    }
  }

  /**
   * 验证Bot Token是否有效
   * @returns 验证结果
   */
  async verifyConnection() {
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
      throw error
    }
  }

}
/**
 * Google Workspace OAuth认证管理器
 * 处理OAuth 2.0流程和token管理
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GoogleCredentials } from './types'

export class GoogleAuthClient {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  /**
   * 生成授权URL
   */
  generateAuthUrl(state?: string, service: 'gmail' | 'drive' | 'calendar' = 'gmail'): string {
    // 根据服务类型选择不同的scopes
    const scopeMap = {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      drive: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    }

    const scopes = scopeMap[service]

    // 根据服务类型选择不同的回调URL
    const redirectUriMap = {
      gmail: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gmail/callback`,
      drive: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-drive/callback`,
      calendar: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-calendar/callback`
    }
    
    const redirectUri = redirectUriMap[service]

    // 创建临时OAuth客户端以支持不同的回调URL
    const tempOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    return tempOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // 强制显示同意页面以获取refresh_token
      include_granted_scopes: true // 包含之前已授权的范围
    })
  }

  /**
   * 交换授权码获取tokens
   */
  async exchangeCodeForTokens(code: string, service: 'gmail' | 'drive' | 'calendar' = 'gmail'): Promise<{
    success: boolean
    tokens?: GoogleCredentials
    error?: string
  }> {
    try {
      // 根据服务类型选择对应的回调URL
      const redirectUriMap = {
        gmail: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gmail/callback`,
        drive: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-drive/callback`,
        calendar: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-calendar/callback`
      }
      
      const redirectUri = redirectUriMap[service]

      // 创建临时OAuth客户端
      const tempOAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      )

      const { tokens } = await tempOAuth2Client.getToken(code)
      
      if (!tokens.access_token) {
        throw new Error('未获取到access_token')
      }

      return {
        success: true,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          scope: tokens.scope || '',
          token_type: tokens.token_type || 'Bearer',
          expiry_date: tokens.expiry_date || Date.now() + 3600000
        }
      }
    } catch (error) {
      console.error('Google OAuth - 交换授权码失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '交换授权码失败'
      }
    }
  }

  /**
   * 刷新access token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleCredentials | null> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      return {
        access_token: credentials.access_token || '',
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope || '',
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date || Date.now() + 3600000
      }
    } catch (error) {
      console.error('Google OAuth - 刷新token失败:', error)
      return null
    }
  }

  /**
   * 验证token是否有效
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      })

      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken)
      return !!tokenInfo.email
    } catch (error) {
      console.error('Google OAuth - 验证token失败:', error)
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(credentials: GoogleCredentials): Promise<{
    success: boolean
    userInfo?: {
      email: string
      name: string
      picture?: string
      id: string
    }
    error?: string
  }> {
    try {
      // 创建临时OAuth客户端
      const tempOAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )

      tempOAuth2Client.setCredentials({
        access_token: credentials.access_token
      })

      const oauth2 = google.oauth2({ version: 'v2', auth: tempOAuth2Client })
      const response = await oauth2.userinfo.get()

      return {
        success: true,
        userInfo: {
          id: response.data.id || '',
          email: response.data.email || '',
          name: response.data.name || '',
          picture: response.data.picture
        }
      }
    } catch (error) {
      console.error('Google OAuth - 获取用户信息失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败'
      }
    }
  }

  /**
   * 撤销token
   */
  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      await this.oauth2Client.revokeToken(accessToken)
      return true
    } catch (error) {
      console.error('Google OAuth - 撤销token失败:', error)
      return false
    }
  }

  /**
   * 检查token是否即将过期
   */
  isTokenExpiringSoon(expiryDate: number, bufferMinutes: number = 10): boolean {
    const bufferMs = bufferMinutes * 60 * 1000
    return Date.now() > (expiryDate - bufferMs)
  }

  /**
   * 自动刷新token（如果需要）
   */
  async ensureValidToken(credentials: GoogleCredentials): Promise<GoogleCredentials | null> {
    // 检查token是否即将过期
    if (this.isTokenExpiringSoon(credentials.expiry_date)) {
      if (credentials.refresh_token) {
        console.log('Google OAuth - Token即将过期，自动刷新中...')
        return await this.refreshAccessToken(credentials.refresh_token)
      } else {
        console.warn('Google OAuth - Token即将过期，但没有refresh_token')
        return null
      }
    }

    return credentials
  }
}

// 单例实例
export const googleAuthClient = new GoogleAuthClient()
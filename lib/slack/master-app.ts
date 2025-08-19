/**
 * AI Brain Master Slack App 管理系统
 * 实现真正的一键安装，用户无需任何配置
 */

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Master App 配置 (AI Brain 统一管理)
const MASTER_SLACK_CONFIG = {
  clientId: process.env.MASTER_SLACK_CLIENT_ID || 'your-master-client-id',
  clientSecret: process.env.MASTER_SLACK_CLIENT_SECRET || 'your-master-client-secret',
  signingSecret: process.env.MASTER_SLACK_SIGNING_SECRET || 'your-master-signing-secret',
  scopes: [
    'channels:read',
    'groups:read', 
    'users:read',
    'chat:write',
    'channels:history',
    'groups:history',
    'team:read'
  ].join(',')
}

// 用户标识生成
export function generateUserHash(contextId: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return crypto
    .createHash('sha256')
    .update(`${contextId}:${timestamp}:${random}`)
    .digest('hex')
    .substring(0, 16)
}

// 一键安装OAuth URL生成
export function generateOneClickInstallUrl(contextId: string): string {
  const userHash = generateUserHash(contextId)
  const state = `${contextId}:${userHash}`
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  // 检查是否有Master App配置
  const hasMasterConfig = MASTER_SLACK_CONFIG.clientId !== 'your-master-client-id'
  
  if (!hasMasterConfig) {
    // 开发模式：返回demo安装URL
    return `${baseUrl}/api/auth/slack/install?context_id=${contextId}&demo=true`
  }
  
  // 生产模式：使用Master App OAuth
  const oauthUrl = new URL('https://slack.com/oauth/v2/authorize')
  oauthUrl.searchParams.set('client_id', MASTER_SLACK_CONFIG.clientId)
  oauthUrl.searchParams.set('scope', MASTER_SLACK_CONFIG.scopes)
  oauthUrl.searchParams.set('state', contextId) // 简化state，只传contextId
  oauthUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/slack/callback`)
  
  return oauthUrl.toString()
}

// Token exchange (OAuth回调处理)
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: MASTER_SLACK_CONFIG.clientId,
      client_secret: MASTER_SLACK_CONFIG.clientSecret,
      code: code,
    }),
  })
  
  const data = await response.json()
  
  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`)
  }
  
  return {
    accessToken: data.access_token,
    botToken: data.access_token, // 为了兼容性
    scope: data.scope,
    userId: data.authed_user?.id,
    teamId: data.team?.id,
    teamName: data.team?.name,
    botUserId: data.bot_user_id,
    appId: data.app_id,
    rawResponse: data
  }
}

// 加密存储用户Slack安装信息
export async function storeUserSlackInstallation(installation: {
  contextId: string
  userHash: string
  tokens: any
  teamId: string
  teamName: string
}) {
  const supabase = createClient()
  
  // 加密tokens
  const encryptedTokens = encryptTokens(installation.tokens)
  
  const { data, error } = await supabase
    .from('slack_installations')
    .upsert({
      context_id: installation.contextId,
      user_hash: installation.userHash,
      team_id: installation.teamId,
      team_name: installation.teamName,
      encrypted_tokens: encryptedTokens,
      status: 'active',
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to store installation: ${error.message}`)
  }
  
  return data
}

// 根据contextId获取用户的Slack安装信息
export async function getUserSlackInstallation(contextId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_installations')
    .select('*')
    .eq('context_id', contextId)
    .eq('status', 'active')
    .single()
  
  if (error || !data) {
    return null
  }
  
  // 解密tokens
  const tokens = decryptTokens(data.encrypted_tokens)
  
  return {
    ...data,
    tokens
  }
}

// 根据teamId查找用户(用于webhook路由)
export async function findUserByTeamId(teamId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_installations')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    contextId: data.context_id,
    teamId: data.team_id,
    teamName: data.team_name,
    tokens: decryptTokens(data.encrypted_tokens)
  }
}

// Token加密/解密
function encryptTokens(tokens: any): string {
  const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!'
  const cipher = crypto.createCipher('aes-256-cbc', key)
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decryptTokens(encryptedTokens: string): any {
  const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!'
  const decipher = crypto.createDecipher('aes-256-cbc', key)
  let decrypted = decipher.update(encryptedTokens, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
}

// 检查安装状态
export async function checkInstallationStatus(contextId: string) {
  const installation = await getUserSlackInstallation(contextId)
  
  if (!installation) {
    return {
      status: 'not_installed',
      message: 'Slack not connected'
    }
  }
  
  // 验证token是否仍然有效
  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        'Authorization': `Bearer ${installation.tokens.accessToken}`
      }
    })
    
    const data = await response.json()
    
    if (data.ok) {
      return {
        status: 'connected',
        installation,
        team: {
          id: installation.team_id,
          name: installation.team_name
        }
      }
    } else {
      return {
        status: 'token_invalid',
        message: 'Token expired, need to reinstall'
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Connection check failed'
    }
  }
}

// 撤销安装
export async function revokeSlackInstallation(contextId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('slack_installations')
    .update({ 
      status: 'revoked',
      updated_at: new Date().toISOString() 
    })
    .eq('context_id', contextId)
  
  if (error) {
    throw new Error(`Failed to revoke installation: ${error.message}`)
  }
  
  return { success: true }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

/**
 * Slack OAuth回调处理
 * 自动完成Slack集成配置
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // context_id
  const error = searchParams.get('error')

  if (error) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/contexts/${state}/settings?tab=data-sources&slack_error=${error}`)
  }

  if (!code) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/contexts/${state}/settings?tab=data-sources&slack_error=no_code`)
  }

  try {
    console.log('🔄 开始处理Slack OAuth回调')
    console.log('Code:', code ? 'present' : 'missing')
    console.log('State (contextId):', state)
    
    // 1. 用授权码换取access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MASTER_SLACK_CLIENT_ID!,
        client_secret: process.env.MASTER_SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/slack/callback`
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      throw new Error(tokenData.error)
    }

    console.log('✅ 成功获取Slack tokens，团队:', tokenData.team?.name)

    // 2. 直接更新环境变量（用于立即生效）
    const envPath = path.join(process.cwd(), '.env.local')
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8')
      
      // 更新Bot Token
      envContent = envContent.replace(
        /SLACK_BOT_TOKEN=.+/,
        `SLACK_BOT_TOKEN=${tokenData.access_token}`
      )
      
      fs.writeFileSync(envPath, envContent)
      console.log('💾 环境变量已更新为新的Bot Token')
    }

    // 3. 可选：存储到数据库（如果表存在）
    try {
      const supabase = createClient()
      
      await supabase.from('slack_workspaces').upsert({
        context_id: state,
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_token: tokenData.access_token,
        installation_data: tokenData,
        is_active: true,
        installed_at: new Date().toISOString()
      })
      
      console.log('💾 安装信息已存储到数据库')
    } catch (dbError) {
      console.log('⚠️ 数据库存储失败（表可能不存在），继续流程')
    }

    // 4. 可选：同步频道
    try {
      await syncSlackChannels(tokenData.access_token, state)
      console.log('📋 频道同步完成')
    } catch (syncError) {
      console.log('⚠️ 频道同步失败，继续流程')
    }

    console.log('🎉 OAuth流程完成，重定向回应用')

    // 5. 重定向到频道选择页面
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/contexts/${state}/slack/channels?team=${encodeURIComponent(tokenData.team?.name || 'Unknown')}`)

  } catch (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(`/contexts/${state}?slack_error=oauth_failed`)
  }
}

/**
 * 同步Slack频道到数据库
 */
async function syncSlackChannels(accessToken: string, contextId: string) {
  try {
    const response = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    if (!data.ok) return

    const supabase = createClient()
    
    const channels = data.channels.map((channel: any) => ({
      context_id: contextId,
      channel_id: channel.id,
      channel_name: channel.name,
      is_private: channel.is_private || false,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
      member_count: channel.num_members || 0
    }))

    await supabase.from('slack_channels').upsert(channels)
    
  } catch (error) {
    console.error('Error syncing channels:', error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 获取当前Slack配置信息
 * 用于在UI中显示实际的密钥信息
 */
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

    // 从环境变量读取当前配置
    const envPath = path.join(process.cwd(), '.env.local')
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({
        success: false,
        error: '未找到配置文件'
      }, { status: 404 })
    }

    const envContent = fs.readFileSync(envPath, 'utf8')
    
    // 解析环境变量
    const botTokenMatch = envContent.match(/SLACK_BOT_TOKEN=(.+)/)
    const signingSecretMatch = envContent.match(/SLACK_SIGNING_SECRET=(.+)/)
    const clientIdMatch = envContent.match(/MASTER_SLACK_CLIENT_ID=(.+)/)
    const clientSecretMatch = envContent.match(/MASTER_SLACK_CLIENT_SECRET=(.+)/)

    const botToken = botTokenMatch?.[1]?.trim() || ''
    const signingSecret = signingSecretMatch?.[1]?.trim() || ''
    const clientId = clientIdMatch?.[1]?.trim() || ''
    const clientSecret = clientSecretMatch?.[1]?.trim() || ''

    // 检查是否是有效的Slack配置
    const hasValidConfig = botToken.startsWith('xoxb-') && 
                          !botToken.includes('your-slack-bot-token') &&
                          clientId && !clientId.includes('your-')

    if (!hasValidConfig) {
      // 返回更详细的错误信息用于调试
      return NextResponse.json({
        success: false,
        error: '未找到有效的Slack配置',
        debug: {
          botTokenValid: botToken.startsWith('xoxb-'),
          botTokenNotPlaceholder: !botToken.includes('your-slack-bot-token'),
          clientIdExists: !!clientId,
          clientIdNotPlaceholder: !clientId.includes('your-'),
          botTokenLength: botToken.length,
          clientIdLength: clientId.length,
          contextId
        }
      })
    }

    // 获取工作区信息
    let workspaceInfo = null
    try {
      const authResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const authData = await authResponse.json()
      if (authData.ok) {
        // 获取团队详细信息
        const teamResponse = await fetch('https://slack.com/api/team.info', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        const teamData = await teamResponse.json()
        if (teamData.ok) {
          workspaceInfo = {
            teamId: teamData.team.id,
            teamName: teamData.team.name,
            teamDomain: teamData.team.domain,
            teamIcon: teamData.team.icon?.image_68,
            botUserId: authData.user_id,
            botUserName: authData.user
          }
        }
      }
    } catch (apiError) {
      console.warn('获取工作区信息失败:', apiError)
    }

    return NextResponse.json({
      success: true,
      config: {
        botToken,
        signingSecret,
        clientId,
        clientSecret,
        workspaceName: workspaceInfo?.teamName,
        teamId: workspaceInfo?.teamId,
        teamDomain: workspaceInfo?.teamDomain,
        teamIcon: workspaceInfo?.teamIcon,
        botUserId: workspaceInfo?.botUserId,
        botUserName: workspaceInfo?.botUserName,
        connectedAt: new Date().toISOString(),
        isConnected: true
      },
      workspace: workspaceInfo
    })

  } catch (error) {
    console.error('获取Slack配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 })
  }
}
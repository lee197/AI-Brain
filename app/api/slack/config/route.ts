import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 获取当前Slack配置信息
 * 读取通过OAuth保存的Slack配置
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

    // 读取保存的 Slack 配置文件
    const configDir = path.join(process.cwd(), 'data', 'contexts', contextId)
    const configFile = path.join(configDir, 'slack-config.json')
    
    if (!fs.existsSync(configFile)) {
      return NextResponse.json({
        success: false,
        config: null,
        error: 'Slack 尚未连接'
      })
    }

    // 读取配置文件
    const configContent = fs.readFileSync(configFile, 'utf8')
    const config = JSON.parse(configContent)

    // 检查是否已连接
    const hasValidConfig = config.isConnected && config.accessToken && config.teamId

    if (!hasValidConfig) {
      return NextResponse.json({
        success: false,
        config: null,
        error: 'Slack 配置无效'
      })
    }

    // 获取工作区信息
    let workspaceInfo = null
    try {
      const authResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const authData = await authResponse.json()
      if (authData.ok) {
        // 获取团队详细信息
        const teamResponse = await fetch('https://slack.com/api/team.info', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
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
        accessToken: config.accessToken,
        teamId: config.teamId,
        teamName: config.teamName,
        botUserId: config.botUserId,
        scope: config.scope,
        appId: config.appId,
        connectedAt: config.connectedAt,
        isConnected: config.isConnected,
        // 添加从 API 获取的工作区信息
        workspaceName: workspaceInfo?.teamName || config.teamName,
        teamDomain: workspaceInfo?.teamDomain,
        teamIcon: workspaceInfo?.teamIcon,
        botUserName: workspaceInfo?.botUserName
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
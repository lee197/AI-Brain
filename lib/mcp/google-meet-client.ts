/**
 * Google Meet MCP客户端
 * 连接到Google Meet MCP服务器 (端口8007)
 * 处理会议transcript、summary和增强分析功能
 */

export interface MeetingRecord {
  conferenceRecordId: string
  startTime: string
  endTime: string
  participantCount: number
  meetingCode?: string
  hasTranscript: boolean
  hasSummary: boolean
}

export interface TranscriptEntry {
  participant: string
  text: string
  startTime: string
  languageCode: string
}

export interface MeetingTranscript {
  fullText: string
  entries: TranscriptEntry[]
  entryCount: number
  language: string
  state: string
}

export interface MeetingParticipant {
  email?: string
  displayName: string
  joinTime?: string
  leaveTime?: string
  type?: 'user' | 'phone'
}

export interface MeetingInfo {
  startTime: string
  endTime: string
  durationSeconds: number
  durationFormatted: string
  meetingCode: string
  meetingUri: string
}

export interface EnhancedSummary {
  conferenceRecordId: string
  basicInfo: {
    duration: string
    participantCount: number
    startTime: string
    endTime: string
  }
  keyDiscussions: Array<{
    topic: string
    duration: string
  }>
  actionItems: Array<{
    text: string
    priority: string
    assignee: string
    dueDate: string
  }>
  keyDecisions: string[]
  participants: string[]
  nextSteps: string[]
  meetingEfficiency: {
    durationMinutes: number
    wordCount: number
    wordsPerMinute: number
    efficiencyScore: string
  }
  generatedAt: string
}

export class GoogleMeetMCPClient {
  private serverUrl: string
  private timeout: number

  constructor() {
    this.serverUrl = 'http://localhost:8001/mcp'
    this.timeout = 10000 // 10秒超时
  }

  /**
   * 检查MCP服务器连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.callMCPTool('health_check', {})
      return response.success !== false && response.status === 'healthy'
    } catch (error) {
      console.log('Google Meet MCP服务器未连接:', error instanceof Error ? error.message : error)
      return false
    }
  }

  /**
   * 获取最近的会议记录
   */
  async listRecentMeetings(limit: number = 10): Promise<{
    success: boolean
    meetings: MeetingRecord[]
    total: number
    error?: string
  }> {
    try {
      const response = await this.callMCPTool('list_recent_meetings', { limit })
      
      if (response.success) {
        return {
          success: true,
          meetings: response.meetings,
          total: response.total
        }
      } else {
        return {
          success: false,
          meetings: response.mock_data || [],
          total: 0,
          error: response.error
        }
      }
    } catch (error) {
      return {
        success: false,
        meetings: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取会议转录文本
   */
  async getMeetingTranscript(conferenceRecordId: string): Promise<{
    success: boolean
    transcript?: MeetingTranscript
    metadata?: any
    error?: string
  }> {
    try {
      const response = await this.callMCPTool('get_meeting_transcript', {
        conference_record_id: conferenceRecordId
      })

      if (response.success) {
        return {
          success: true,
          transcript: response.transcript,
          metadata: response.metadata
        }
      } else {
        return {
          success: false,
          error: response.error,
          transcript: response.mock_data ? {
            fullText: response.mock_data.transcript,
            entries: response.mock_data.entries || [],
            entryCount: response.mock_data.entries?.length || 0,
            language: 'en',
            state: 'mock'
          } : undefined
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取会议总结信息
   */
  async getMeetingSummary(conferenceRecordId: string): Promise<{
    success: boolean
    meetingInfo?: MeetingInfo
    participants?: {
      total: number
      details: MeetingParticipant[]
    }
    summary?: string
    hasTranscript?: boolean
    hasRecording?: boolean
    error?: string
  }> {
    try {
      const response = await this.callMCPTool('get_meeting_summary', {
        conference_record_id: conferenceRecordId
      })

      if (response.success) {
        return {
          success: true,
          meetingInfo: response.meetingInfo,
          participants: response.participants,
          summary: response.summary,
          hasTranscript: response.hasTranscript,
          hasRecording: response.hasRecording
        }
      } else {
        return {
          success: false,
          error: response.error
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 按日期搜索会议
   */
  async searchMeetingsByDate(startDate: string, endDate?: string): Promise<{
    success: boolean
    meetings: MeetingRecord[]
    dateRange: string
    total: number
    error?: string
  }> {
    try {
      const response = await this.callMCPTool('search_meetings_by_date', {
        start_date: startDate,
        end_date: endDate
      })

      if (response.success) {
        return {
          success: true,
          meetings: response.meetings,
          dateRange: response.dateRange,
          total: response.total
        }
      } else {
        return {
          success: false,
          meetings: [],
          dateRange: `${startDate} to ${endDate || startDate}`,
          total: 0,
          error: response.error
        }
      }
    } catch (error) {
      return {
        success: false,
        meetings: [],
        dateRange: `${startDate} to ${endDate || startDate}`,
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 生成增强版会议总结
   */
  async generateEnhancedSummary(conferenceRecordId: string): Promise<{
    success: boolean
    summary?: EnhancedSummary
    error?: string
  }> {
    try {
      const response = await this.callMCPTool('generate_enhanced_summary', {
        conference_record_id: conferenceRecordId
      })

      if (response.success) {
        return {
          success: true,
          summary: response as EnhancedSummary
        }
      } else {
        return {
          success: false,
          error: response.error
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取会议上下文 (用于AI聊天增强)
   */
  async getMeetingContext(query: string): Promise<string> {
    try {
      // 获取最近3天的会议
      const today = new Date()
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
      
      const startDate = threeDaysAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]
      
      const meetingsResult = await this.searchMeetingsByDate(startDate, endDate)
      
      if (!meetingsResult.success || meetingsResult.meetings.length === 0) {
        return `最近3天内没有找到Google Meet会议记录。`
      }

      // 为每个会议获取基础信息
      let context = `## 最近的Google Meet会议 (${meetingsResult.dateRange})\n\n`
      
      for (const meeting of meetingsResult.meetings.slice(0, 5)) { // 最多5个会议
        const summaryResult = await this.getMeetingSummary(meeting.conferenceRecordId)
        
        if (summaryResult.success) {
          context += `### 会议 ${meeting.meetingCode || meeting.conferenceRecordId}\n`
          context += `- 时间: ${new Date(meeting.startTime).toLocaleString('zh-CN')}\n`
          context += `- 时长: ${summaryResult.meetingInfo?.durationFormatted || 'Unknown'}\n`
          context += `- 参与者: ${summaryResult.participants?.total || 0}人\n`
          
          if (summaryResult.summary) {
            context += `- 总结: ${summaryResult.summary}\n`
          }
          
          if (summaryResult.hasTranscript) {
            context += `- 状态: 有完整转录文本可用\n`
          }
          
          context += '\n'
        }
      }

      return context
    } catch (error) {
      console.error('获取会议上下文失败:', error)
      return `获取Google Meet会议上下文时出现错误: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * 格式化会议总结为邮件内容
   */
  formatMeetingSummaryForEmail(summary: EnhancedSummary): string {
    const { basicInfo, keyDiscussions, actionItems, keyDecisions, participants, nextSteps, meetingEfficiency } = summary

    return `
# 📋 会议总结报告

## 基本信息
- **时长**: ${basicInfo.duration}
- **参与者**: ${basicInfo.participantCount}人 (${participants.join(', ')})
- **开始时间**: ${new Date(basicInfo.startTime).toLocaleString('zh-CN')}
- **结束时间**: ${new Date(basicInfo.endTime).toLocaleString('zh-CN')}

## 🎯 主要讨论话题
${keyDiscussions.map(topic => `- **${topic.topic}** (${topic.duration})`).join('\n')}

## ✅ 行动项 (Action Items)
${actionItems.map(item => `- [ ] **${item.assignee}** - ${item.text} (截止: ${item.dueDate})`).join('\n')}

## 🔑 关键决策
${keyDecisions.map(decision => `- ${decision}`).join('\n')}

## 📅 下一步计划
${nextSteps.map(step => `- ${step}`).join('\n')}

## 📊 会议效率分析
- 会议时长: ${meetingEfficiency.durationMinutes}分钟
- 发言统计: ${meetingEfficiency.wordCount}字 (${meetingEfficiency.wordsPerMinute}字/分钟)
- 效率评分: ${meetingEfficiency.efficiencyScore}

---
*本总结由AI Brain自动生成 - ${new Date(summary.generatedAt).toLocaleString('zh-CN')}*
*如有疑问，请联系会议组织者*
    `.trim()
  }

  /**
   * 调用MCP工具的底层方法
   */
  private async callMCPTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: parameters
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message}`)
      }

      return data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Google Meet MCP服务器响应超时 (${this.timeout}ms)`)
      }
      
      throw error
    }
  }
}

// 导出单例实例
export const googleMeetMCPClient = new GoogleMeetMCPClient()
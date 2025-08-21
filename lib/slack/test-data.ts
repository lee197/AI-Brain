import { addSlackMessage, SlackMessage } from './message-storage'

/**
 * 添加测试Slack消息数据
 * 用于演示和测试真实消息存储系统
 */
export function addTestSlackMessages(contextId: string): void {
  const testMessages: SlackMessage[] = [
    {
      id: '1703845200.001',
      channel: { id: 'C09AHKG46HM', name: 'ai-brain-test' },
      user: { 
        id: 'U1234567890', 
        name: 'Alice Chen', 
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face',
        real_name: 'Alice Chen'
      },
      text: 'Hey team! Just integrated AI Brain with our Slack workspace. This is amazing! 🚀',
      timestamp: new Date('2024-08-20T15:30:00Z'),
      reactions: [
        { name: '+1', count: 3, users: ['Bob', 'Carol', 'David'] },
        { name: 'rocket', count: 2, users: ['Bob', 'Carol'] }
      ],
      thread_count: 0,
      metadata: {
        context_id: contextId,
        team_id: 'T12345',
        event_ts: '1703845200.001'
      }
    },
    {
      id: '1703845320.002',
      channel: { id: 'C09AHKG46HM', name: 'ai-brain-test' },
      user: { 
        id: 'U2345678901', 
        name: 'Bob Wang', 
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        real_name: 'Bob Wang'
      },
      text: 'This is incredible! The AI can actually understand our workflow and help with tasks.',
      timestamp: new Date('2024-08-20T15:32:00Z'),
      reactions: [
        { name: 'fire', count: 2, users: ['Alice', 'Carol'] }
      ],
      thread_count: 0,
      metadata: {
        context_id: contextId,
        team_id: 'T12345',
        event_ts: '1703845320.002'
      }
    },
    {
      id: '1703845440.003',
      channel: { id: 'C09AHKG46HM', name: 'ai-brain-test' },
      user: { 
        id: 'U3456789012', 
        name: 'Carol Li', 
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        real_name: 'Carol Li'
      },
      text: 'I just tested the channel selection feature. Works perfectly! The bot only listens to the channels we choose.',
      timestamp: new Date('2024-08-20T15:35:00Z'),
      reactions: [
        { name: 'eyes', count: 1, users: ['David'] },
        { name: '+1', count: 4, users: ['Alice', 'Bob', 'David', 'Eva'] }
      ],
      thread_count: 1,
      metadata: {
        context_id: contextId,
        team_id: 'T12345',
        event_ts: '1703845440.003'
      }
    },
    {
      id: '1703845560.004',
      channel: { id: 'C09AHKG46HM', name: 'ai-brain-test' },
      user: { 
        id: 'U4567890123', 
        name: 'David Zhang', 
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        real_name: 'David Zhang'
      },
      text: 'The real-time message processing is impressive. No more switching between multiple tools! 💪',
      timestamp: new Date('2024-08-20T15:38:00Z'),
      reactions: [
        { name: 'muscle', count: 3, users: ['Alice', 'Bob', 'Carol'] },
        { name: 'tada', count: 2, users: ['Alice', 'Eva'] }
      ],
      thread_count: 0,
      metadata: {
        context_id: contextId,
        team_id: 'T12345',
        event_ts: '1703845560.004'
      }
    },
    {
      id: '1703845680.005',
      channel: { id: 'C09AHKG46HM', name: 'ai-brain-test' },
      user: { 
        id: 'U5678901234', 
        name: 'Eva Liu', 
        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=32&h=32&fit=crop&crop=face',
        real_name: 'Eva Liu'
      },
      text: 'This is exactly what our team needed. AI Brain saves us hours every week! 🎯',
      timestamp: new Date('2024-08-20T15:40:00Z'),
      reactions: [
        { name: 'dart', count: 5, users: ['Alice', 'Bob', 'Carol', 'David', 'Frank'] },
        { name: 'heart', count: 3, users: ['Alice', 'Carol', 'David'] }
      ],
      thread_count: 2,
      metadata: {
        context_id: contextId,
        team_id: 'T12345',
        event_ts: '1703845680.005'
      }
    }
  ]

  // 添加每条消息到存储系统
  testMessages.forEach(message => {
    addSlackMessage(contextId, message)
  })

  console.log(`✅ Added ${testMessages.length} test messages to context ${contextId}`)
}
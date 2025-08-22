/**
 * 企业工具数据源模拟数据生成器
 * 为十大流行企业工具生成真实的模拟数据
 */

export interface MockUser {
  id: string
  name: string
  email: string
  avatar: string
  department?: string
  role?: string
}

export interface MockProject {
  id: string
  name: string
  key: string
  description: string
  status: 'active' | 'completed' | 'archived'
  members: number
}

// 基础模拟用户池
const mockUsers: MockUser[] = [
  { id: 'user1', name: '张三', email: 'zhang.san@company.com', avatar: '', department: '开发部', role: '高级工程师' },
  { id: 'user2', name: '李四', email: 'li.si@company.com', avatar: '', department: '产品部', role: '产品经理' },
  { id: 'user3', name: 'John Smith', email: 'john.smith@company.com', avatar: '', department: 'Engineering', role: 'Tech Lead' },
  { id: 'user4', name: 'Sarah Chen', email: 'sarah.chen@company.com', avatar: '', department: 'Design', role: 'UI Designer' },
  { id: 'user5', name: '王五', email: 'wang.wu@company.com', avatar: '', department: '市场部', role: '市场专员' },
  { id: 'user6', name: 'Alex Johnson', email: 'alex.johnson@company.com', avatar: '', department: 'Sales', role: 'Sales Manager' },
  { id: 'user7', name: '赵六', email: 'zhao.liu@company.com', avatar: '', department: 'HR', role: 'HR经理' },
  { id: 'user8', name: 'Emma Wilson', email: 'emma.wilson@company.com', avatar: '', department: 'Marketing', role: 'Content Manager' }
]

// 基础项目池
const mockProjects: MockProject[] = [
  { id: 'proj1', name: 'AI Brain', key: 'AIB', description: '智能工作助手平台', status: 'active', members: 8 },
  { id: 'proj2', name: 'Marketing Website', key: 'MKT', description: '公司官网改版项目', status: 'active', members: 5 },
  { id: 'proj3', name: 'Mobile App', key: 'MOB', description: '移动端应用开发', status: 'active', members: 6 },
  { id: 'proj4', name: 'Data Analytics', key: 'DATA', description: '数据分析平台', status: 'completed', members: 4 },
  { id: 'proj5', name: 'Customer Portal', key: 'CUS', description: '客户服务门户', status: 'active', members: 7 }
]

/**
 * Google Workspace 模拟数据生成器
 */
export const generateGoogleWorkspaceData = () => {
  const emails = [
    {
      id: 'email1',
      subject: '项目进度周报 - AI Brain开发更新',
      sender: mockUsers[0],
      recipients: [mockUsers[1], mockUsers[2]],
      content: '本周完成了Slack集成功能的开发，下周将开始Jira集成...',
      timestamp: new Date('2024-01-21T10:30:00'),
      isRead: true,
      labels: ['工作', '项目']
    },
    {
      id: 'email2',
      subject: 'Meeting: Q1 Planning Session',
      sender: mockUsers[1],
      recipients: mockUsers.slice(0, 4),
      content: 'Let\'s discuss our Q1 roadmap and key milestones...',
      timestamp: new Date('2024-01-20T14:15:00'),
      isRead: false,
      labels: ['会议', '计划']
    }
  ]

  const documents = [
    {
      id: 'doc1',
      title: 'AI Brain产品需求文档',
      type: 'document',
      owner: mockUsers[1],
      lastModified: new Date('2024-01-21T16:45:00'),
      size: '2.3 MB',
      shared: true,
      collaborators: [mockUsers[0], mockUsers[2], mockUsers[3]]
    },
    {
      id: 'doc2',
      title: 'Q1市场营销策略',
      type: 'presentation',
      owner: mockUsers[4],
      lastModified: new Date('2024-01-20T11:20:00'),
      size: '8.7 MB',
      shared: true,
      collaborators: [mockUsers[1], mockUsers[7]]
    }
  ]

  const meetings = [
    {
      id: 'meeting1',
      title: '每日站会 - 开发团队',
      organizer: mockUsers[2],
      attendees: mockUsers.slice(0, 4),
      startTime: new Date('2024-01-22T09:00:00'),
      endTime: new Date('2024-01-22T09:30:00'),
      status: 'upcoming',
      location: '会议室A / Google Meet'
    },
    {
      id: 'meeting2',
      title: '产品评审会议',
      organizer: mockUsers[1],
      attendees: mockUsers.slice(1, 6),
      startTime: new Date('2024-01-19T15:00:00'),
      endTime: new Date('2024-01-19T16:30:00'),
      status: 'completed',
      location: 'Google Meet'
    }
  ]

  return {
    emails,
    documents,
    meetings,
    stats: {
      totalEmails: emails.length,
      unreadEmails: emails.filter(e => !e.isRead).length,
      totalDocuments: documents.length,
      sharedDocuments: documents.filter(d => d.shared).length,
      upcomingMeetings: meetings.filter(m => m.status === 'upcoming').length,
      totalCollaborators: new Set(documents.flatMap(d => d.collaborators.map(c => c.id))).size
    }
  }
}

/**
 * Microsoft 365 模拟数据生成器
 */
export const generateMicrosoft365Data = () => {
  const emails = [
    {
      id: 'outlook1',
      subject: 'Weekly Team Sync - Updates and Blockers',
      sender: mockUsers[2].name,
      content: 'Hi team, here are this week\'s updates and any blockers we need to address...',
      timestamp: '2024-01-21T11:45:00Z',
      status: 'read',
      priority: 'high',
      attachments: ['meeting-notes.docx']
    },
    {
      id: 'outlook2',
      subject: '客户反馈汇总 - 产品改进建议',
      sender: mockUsers[5].name,
      content: '根据本月收集的客户反馈，我们整理了以下改进建议，请查阅并提供意见...',
      timestamp: '2024-01-20T16:30:00Z',
      status: 'unread',
      priority: 'medium',
      attachments: ['feedback-summary.xlsx', 'customer-suggestions.pdf']
    },
    {
      id: 'outlook3',
      subject: 'Q1 Planning Meeting Invitation',
      sender: mockUsers[1].name,
      content: 'You are invited to join our Q1 planning session. Please review the agenda beforehand.',
      timestamp: '2024-01-19T14:20:00Z',
      status: 'read',
      priority: 'high',
      attachments: ['q1-agenda.docx']
    }
  ]

  const documents = [
    {
      id: 'doc1',
      name: 'Q1-Roadmap-Final.pptx',
      type: 'PowerPoint',
      author: mockUsers[1].name,
      size: '12.4 MB',
      version: '3.2',
      lastModified: '2024-01-21T17:30:00Z',
      content: 'Q1季度路线图，包含产品发布计划和里程碑时间表...'
    },
    {
      id: 'doc2',
      name: '技术架构设计文档.docx',
      type: 'Word',
      author: mockUsers[2].name,
      size: '3.8 MB',
      version: '2.1',
      lastModified: '2024-01-20T10:15:00Z',
      content: 'AI Brain系统的详细技术架构设计，包括微服务架构和数据流...'
    },
    {
      id: 'doc3',
      name: '产品需求分析表.xlsx',
      type: 'Excel',
      author: mockUsers[1].name,
      size: '2.1 MB',
      version: '1.5',
      lastModified: '2024-01-18T15:45:00Z',
      content: '详细的产品功能需求列表和优先级分析...'
    }
  ]

  const meetings = [
    {
      id: 'meeting1',
      title: '每日站会 - 开发团队',
      organizer: mockUsers[2].name,
      attendees: [mockUsers[0].name, mockUsers[2].name, mockUsers[3].name],
      startTime: '2024-01-22T09:00:00Z',
      duration: 30,
      status: 'scheduled',
      description: '团队日常同步会议，分享进度和讨论阻碍'
    },
    {
      id: 'meeting2',
      title: '产品评审会议',
      organizer: mockUsers[1].name,
      attendees: [mockUsers[1].name, mockUsers[2].name, mockUsers[4].name, mockUsers[5].name],
      startTime: '2024-01-19T15:00:00Z',
      duration: 90,
      status: 'completed',
      description: '新功能产品评审，讨论功能设计和用户体验'
    },
    {
      id: 'meeting3',
      title: 'Q1规划会议',
      organizer: mockUsers[1].name,
      attendees: [mockUsers[0].name, mockUsers[1].name, mockUsers[2].name, mockUsers[4].name],
      startTime: '2024-01-24T14:00:00Z',
      duration: 120,
      status: 'scheduled',
      description: '第一季度产品规划和资源分配讨论'
    }
  ]

  return {
    emails,
    documents,
    meetings,
    stats: {
      totalEmails: emails.length,
      unreadEmails: emails.filter(e => e.status === 'unread').length,
      totalDocuments: documents.length,
      totalMeetings: meetings.length,
      upcomingMeetings: meetings.filter(m => m.status === 'scheduled').length,
      totalAttachments: emails.reduce((sum, e) => sum + e.attachments.length, 0)
    }
  }
}

/**
 * Notion 模拟数据生成器
 */
export const generateNotionData = () => {
  const pages = [
    {
      id: 'page1',
      title: 'AI Brain 项目文档',
      type: 'document',
      author: mockUsers[1].name,
      status: 'published',
      lastModified: '2024-01-21T15:45:00Z',
      content: '这是AI Brain项目的完整技术文档，包含架构设计、API规范和部署指南...',
      tags: ['产品', '开发', '重要'],
      views: 156
    },
    {
      id: 'page2',
      title: '团队会议记录 - 2024年1月',
      type: 'page',
      author: mockUsers[0].name,
      status: 'published',
      lastModified: '2024-01-21T11:30:00Z',
      content: '本月团队会议记录汇总，包含重要决策和行动项...',
      tags: ['会议', '记录'],
      views: 89
    },
    {
      id: 'page3',
      title: '产品路线图 Q1-Q2',
      type: 'page',
      author: mockUsers[1].name,
      status: 'draft',
      lastModified: '2024-01-20T16:20:00Z',
      content: '2024年上半年产品发展路线图，包含功能规划和时间节点...',
      tags: ['产品', '规划', '路线图'],
      views: 45
    },
    {
      id: 'page4',
      title: 'API接口文档',
      type: 'document',
      author: mockUsers[2].name,
      status: 'published',
      lastModified: '2024-01-19T14:15:00Z',
      content: 'AI Brain系统完整的API接口文档，包含端点说明和示例代码...',
      tags: ['技术', 'API', '文档'],
      views: 234
    }
  ]

  const databases = [
    {
      id: 'db1',
      name: '任务跟踪数据库',
      type: 'Project Tracker',
      records: 23,
      views: 3,
      owner: mockUsers[2].name,
      lastModified: '2024-01-21T16:20:00Z',
      description: '团队任务管理和进度跟踪数据库',
      properties: ['标题', '负责人', '状态', '优先级', '截止日期']
    },
    {
      id: 'db2',
      name: '客户信息管理',
      type: 'CRM',
      records: 156,
      views: 5,
      owner: mockUsers[5].name,
      lastModified: '2024-01-20T14:10:00Z',
      description: '客户关系管理和销售跟踪数据库',
      properties: ['公司名称', '联系人', '状态', '合同金额', '跟进日期']
    },
    {
      id: 'db3',
      name: '知识库文章',
      type: 'Knowledge Base',
      records: 67,
      views: 4,
      owner: mockUsers[0].name,
      lastModified: '2024-01-18T11:45:00Z',
      description: '团队知识分享和技术文档数据库',
      properties: ['标题', '作者', '分类', '标签', '发布日期']
    }
  ]

  return {
    pages,
    databases,
    stats: {
      totalPages: pages.length,
      totalDatabases: databases.length,
      totalRecords: databases.reduce((sum, db) => sum + db.records, 0),
      totalViews: pages.reduce((sum, p) => sum + p.views, 0),
      publishedPages: pages.filter(p => p.status === 'published').length,
      draftPages: pages.filter(p => p.status === 'draft').length
    }
  }
}

/**
 * Salesforce 模拟数据生成器
 */
export const generateSalesforceData = () => {
  const leads = [
    {
      id: 'lead1',
      name: '李总监',
      company: '创新科技有限公司',
      email: 'li.director@innovation.com',
      phone: '+86 138-0013-8000',
      location: '北京市朝阳区',
      status: 'new',
      priority: 'high',
      createdDate: '2024-01-21T10:30:00Z'
    },
    {
      id: 'lead2',
      name: 'David Brown',
      company: 'Future Systems Ltd.',
      email: 'david.brown@future-sys.com',
      phone: '+1 555-0199',
      location: 'San Francisco, CA',
      status: 'qualified',
      priority: 'medium',
      createdDate: '2024-01-20T14:15:00Z'
    },
    {
      id: 'lead3',
      name: '王经理',
      company: '智慧物流科技',
      email: 'wang.manager@smart-logistics.com',
      phone: '+86 159-8888-9999',
      location: '上海市浦东新区',
      status: 'working',
      priority: 'high',
      createdDate: '2024-01-19T09:20:00Z'
    }
  ]

  const opportunities = [
    {
      id: 'opp1',
      name: 'AI Brain企业版 - 腾讯',
      account: '腾讯科技有限公司',
      amount: 2000000,
      stage: 'negotiation',
      probability: 75,
      closeDate: '2024-03-15T00:00:00Z',
      owner: mockUsers[5].name
    },
    {
      id: 'opp2',
      name: 'Enterprise Integration Package',
      account: 'Tech Solutions Inc.',
      amount: 800000,
      stage: 'proposal',
      probability: 40,
      closeDate: '2024-04-30T00:00:00Z',
      owner: mockUsers[5].name
    },
    {
      id: 'opp3',
      name: '智能分析平台升级',
      account: '智慧物流科技',
      amount: 1200000,
      stage: 'closed_won',
      probability: 100,
      closeDate: '2024-01-15T00:00:00Z',
      owner: mockUsers[5].name
    }
  ]

  const accounts = [
    {
      id: 'acc1',
      name: '腾讯科技有限公司',
      industry: '互联网科技',
      type: '大型企业',
      annualRevenue: 50000000,
      location: '深圳市南山区',
      owner: mockUsers[5].name
    },
    {
      id: 'acc2',
      name: 'Tech Solutions Inc.',
      industry: '技术服务',
      type: '中型企业',
      annualRevenue: 25000000,
      location: 'San Francisco, CA',
      owner: mockUsers[5].name
    },
    {
      id: 'acc3',
      name: '智慧物流科技',
      industry: '物流运输',
      type: '中型企业',
      annualRevenue: 15000000,
      location: '上海市浦东新区',
      owner: mockUsers[5].name
    }
  ]

  return {
    leads,
    opportunities,
    accounts,
    stats: {
      totalLeads: leads.length,
      totalOpportunities: opportunities.length,
      totalAccounts: accounts.length,
      totalRevenue: opportunities.reduce((sum, opp) => sum + opp.amount, 0),
      averageDealSize: opportunities.reduce((sum, opp) => sum + opp.amount, 0) / opportunities.length,
      winRate: 65
    }
  }
}

/**
 * Zoom 模拟数据生成器
 */
export const generateZoomData = () => {
  const meetings = [
    {
      id: 'zoom1',
      topic: 'AI Brain产品演示',
      host: mockUsers[1].name,
      meetingId: '123-456-789',
      password: '654321',
      participants: [
        { name: mockUsers[0].name, status: 'joined', duration: 85 },
        { name: mockUsers[1].name, status: 'joined', duration: 90 },
        { name: mockUsers[2].name, status: 'joined', duration: 90 },
        { name: mockUsers[3].name, status: 'joined', duration: 75 },
        { name: mockUsers[4].name, status: 'left', duration: 45 },
        { name: mockUsers[5].name, status: 'joined', duration: 90 }
      ],
      startTime: '2024-01-21T14:00:00Z',
      duration: 90,
      status: 'completed',
      hasRecording: true,
      hasChatLog: true
    },
    {
      id: 'zoom2',
      topic: '每周团队例会',
      host: mockUsers[2].name,
      meetingId: '987-654-321',
      password: '123456',
      participants: [
        { name: mockUsers[0].name, status: 'joined', duration: 30 },
        { name: mockUsers[2].name, status: 'joined', duration: 30 },
        { name: mockUsers[3].name, status: 'joined', duration: 25 }
      ],
      startTime: '2024-01-22T10:00:00Z',
      duration: 30,
      status: 'scheduled',
      hasRecording: false,
      hasChatLog: false
    },
    {
      id: 'zoom3',
      topic: '客户需求讨论',
      host: mockUsers[1].name,
      meetingId: '555-666-777',
      password: null,
      participants: [
        { name: mockUsers[1].name, status: 'joined', duration: 60 },
        { name: mockUsers[4].name, status: 'joined', duration: 60 },
        { name: mockUsers[5].name, status: 'joined', duration: 55 },
        { name: '客户代表', status: 'joined', duration: 60 }
      ],
      startTime: '2024-01-20T15:30:00Z',
      duration: 60,
      status: 'completed',
      hasRecording: true,
      hasChatLog: true
    },
    {
      id: 'zoom4',
      topic: '技术评审会议',
      host: mockUsers[2].name,
      meetingId: '111-222-333',
      password: 'tech2024',
      participants: [
        { name: mockUsers[0].name, status: 'joined', duration: 45 },
        { name: mockUsers[2].name, status: 'joined', duration: 45 },
        { name: mockUsers[3].name, status: 'left', duration: 30 }
      ],
      startTime: '2024-01-18T16:00:00Z',
      duration: 45,
      status: 'completed',
      hasRecording: false,
      hasChatLog: true
    }
  ]

  return {
    meetings,
    stats: {
      totalMeetings: meetings.length,
      completedMeetings: meetings.filter(m => m.status === 'completed').length,
      scheduledMeetings: meetings.filter(m => m.status === 'scheduled').length,
      totalParticipants: new Set(meetings.flatMap(m => m.participants.map(p => p.name))).size,
      totalHours: Math.round(meetings.reduce((sum, m) => sum + m.duration, 0) / 60 * 10) / 10,
      recordedMeetings: meetings.filter(m => m.hasRecording).length,
      meetingsWithChat: meetings.filter(m => m.hasChatLog).length
    }
  }
}

/**
 * Confluence 模拟数据生成器
 */
export const generateConfluenceData = () => {
  const pages = [
    {
      id: 'conf1',
      title: 'AI Brain 技术架构文档',
      author: mockUsers[2].name,
      space: '产品开发',
      content: '这是AI Brain的详细技术架构说明，包括微服务设计、数据库架构和API设计...',
      status: 'published',
      createdAt: '2024-01-21T10:30:00Z',
      lastModified: '2024-01-21T15:45:00Z',
      views: 234,
      comments: 12,
      likes: 8
    },
    {
      id: 'conf2',
      title: '产品需求规格说明书',
      author: mockUsers[1].name,
      space: '产品管理',
      content: '详细的产品功能需求说明，包括用户故事、验收标准和技术要求...',
      status: 'published',
      createdAt: '2024-01-20T14:20:00Z',
      lastModified: '2024-01-21T11:15:00Z',
      views: 189,
      comments: 8,
      likes: 15
    },
    {
      id: 'conf3',
      title: '团队协作指南',
      author: mockUsers[0].name,
      space: '团队管理',
      content: '团队协作流程、代码审查规范和项目管理最佳实践...',
      status: 'published',
      createdAt: '2024-01-19T09:45:00Z',
      lastModified: '2024-01-21T16:30:00Z',
      views: 156,
      comments: 6,
      likes: 12
    },
    {
      id: 'conf4',
      title: 'API接口设计草案',
      author: mockUsers[2].name,
      space: '产品开发',
      content: '新版本API接口的设计草案，包括端点定义、数据格式和错误处理...',
      status: 'draft',
      createdAt: '2024-01-21T13:20:00Z',
      lastModified: '2024-01-21T17:10:00Z',
      views: 45,
      comments: 3,
      likes: 2
    },
    {
      id: 'conf5',
      title: '市场竞争分析报告',
      author: mockUsers[4].name,
      space: '市场分析',
      content: '对竞争对手产品的详细分析，包括功能对比、定价策略和市场定位...',
      status: 'under_review',
      createdAt: '2024-01-18T11:00:00Z',
      lastModified: '2024-01-21T14:25:00Z',
      views: 78,
      comments: 5,
      likes: 6
    }
  ]

  return {
    pages,
    stats: {
      totalPages: pages.length,
      publishedPages: pages.filter(p => p.status === 'published').length,
      draftPages: pages.filter(p => p.status === 'draft').length,
      totalViews: pages.reduce((sum, p) => sum + p.views, 0),
      totalComments: pages.reduce((sum, p) => sum + p.comments, 0),
      totalLikes: pages.reduce((sum, p) => sum + p.likes, 0),
      activeSpaces: new Set(pages.map(p => p.space)).size
    }
  }
}

/**
 * Trello 模拟数据生成器
 */
export const generateTrelloData = () => {
  const cards = [
    {
      id: 'trello1',
      title: '实现Slack集成功能',
      description: '开发Slack Bot，实现消息同步和命令响应功能',
      board: 'AI Brain开发',
      list: '进行中',
      members: [mockUsers[0].name, mockUsers[2].name],
      labels: ['开发', '集成', '高优先级'],
      dueDate: '2024-01-25T18:00:00Z',
      priority: 'high',
      comments: 5,
      attachments: 2,
      checklist: {
        completed: 3,
        total: 5
      }
    },
    {
      id: 'trello2',
      title: '设计用户界面原型',
      description: '为新功能设计UI/UX原型，包括交互流程和视觉设计',
      board: 'AI Brain开发',
      list: '待办',
      members: [mockUsers[3].name],
      labels: ['设计', 'UI/UX'],
      dueDate: '2024-01-28T12:00:00Z',
      priority: 'medium',
      comments: 2,
      attachments: 1,
      checklist: {
        completed: 0,
        total: 3
      }
    },
    {
      id: 'trello3',
      title: '编写API文档',
      description: '为新开发的API端点编写详细的技术文档',
      board: 'AI Brain开发',
      list: '已完成',
      members: [mockUsers[2].name],
      labels: ['文档', '技术'],
      dueDate: '2024-01-20T17:00:00Z',
      priority: 'low',
      comments: 1,
      attachments: 0,
      checklist: {
        completed: 4,
        total: 4
      }
    },
    {
      id: 'trello4',
      title: '客户需求调研',
      description: '收集和分析客户对新功能的需求和反馈',
      board: '产品规划',
      list: '审核中',
      members: [mockUsers[1].name, mockUsers[4].name],
      labels: ['调研', '产品'],
      dueDate: '2024-01-30T15:00:00Z',
      priority: 'high',
      comments: 8,
      attachments: 3,
      checklist: {
        completed: 2,
        total: 6
      }
    },
    {
      id: 'trello5',
      title: '数据库性能优化',
      description: '优化查询性能，添加索引和缓存机制',
      board: '技术改进',
      list: '进行中',
      members: [mockUsers[0].name],
      labels: ['性能', '数据库', '优化'],
      dueDate: '2024-02-05T10:00:00Z',
      priority: 'medium',
      comments: 3,
      attachments: 1,
      checklist: {
        completed: 1,
        total: 4
      }
    },
    {
      id: 'trello6',
      title: '用户测试反馈整理',
      description: '整理用户测试结果，识别问题并提出改进建议',
      board: '产品规划',
      list: '待办',
      members: [mockUsers[1].name, mockUsers[3].name],
      labels: ['测试', '用户体验'],
      dueDate: '2024-01-24T14:00:00Z',
      priority: 'high',
      comments: 0,
      attachments: 0,
      checklist: {
        completed: 0,
        total: 5
      }
    }
  ]

  return {
    cards,
    stats: {
      totalCards: cards.length,
      totalBoards: new Set(cards.map(c => c.board)).size,
      totalMembers: new Set(cards.flatMap(c => c.members)).size,
      completedCards: cards.filter(c => c.list === '已完成').length,
      inProgressCards: cards.filter(c => c.list === '进行中').length,
      todoCards: cards.filter(c => c.list === '待办').length,
      overdueCards: cards.filter(c => c.dueDate && new Date(c.dueDate) < new Date()).length,
      totalComments: cards.reduce((sum, c) => sum + c.comments, 0),
      totalAttachments: cards.reduce((sum, c) => sum + c.attachments, 0)
    }
  }
}

/**
 * Tableau 模拟数据生成器
 */
export const generateTableauData = () => {
  const dashboards = [
    {
      id: 'dash1',
      name: '销售业绩仪表板',
      owner: mockUsers[5].name,
      project: '销售分析',
      type: 'dashboard',
      status: 'published',
      views: 1245,
      rating: 4.5,
      performance: 'excellent',
      lastModified: '2024-01-21T16:00:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      description: '实时销售数据和趋势分析，包括月度目标达成情况和销售漏斗分析',
      tags: ['销售', '业绩', 'KPI', '仪表板'],
      dataSources: ['Salesforce', 'Excel', 'MySQL']
    },
    {
      id: 'dash2',
      name: 'Product Usage Analytics',
      owner: mockUsers[1].name,
      project: '产品分析',
      type: 'dashboard',
      status: 'published',
      views: 892,
      rating: 4.2,
      performance: 'good',
      lastModified: '2024-01-20T11:30:00Z',
      createdAt: '2024-01-10T14:20:00Z',
      description: '产品使用情况和用户行为分析，包括用户留存率和功能使用统计',
      tags: ['产品', '分析', '用户', '行为'],
      dataSources: ['Google Analytics', 'PostgreSQL', 'JSON']
    },
    {
      id: 'dash3',
      name: '运营数据概览',
      owner: mockUsers[4].name,
      project: '运营分析',
      type: 'workbook',
      status: 'published',
      views: 567,
      rating: 4.0,
      performance: 'good',
      lastModified: '2024-01-19T15:45:00Z',
      createdAt: '2024-01-12T09:30:00Z',
      description: '公司整体运营指标监控，包括流量、转化率和收入指标',
      tags: ['运营', '监控', '指标'],
      dataSources: ['MySQL', 'Redis', 'Google Sheets']
    },
    {
      id: 'dash4',
      name: '财务报表分析',
      owner: mockUsers[6].name,
      project: '财务分析',
      type: 'dashboard',
      status: 'draft',
      views: 123,
      rating: 3.8,
      performance: 'average',
      lastModified: '2024-01-21T13:15:00Z',
      createdAt: '2024-01-18T11:00:00Z',
      description: '月度和季度财务数据分析，包括收入、支出和利润趋势',
      tags: ['财务', '报表', '分析'],
      dataSources: ['SAP', 'Oracle', 'Excel']
    },
    {
      id: 'dash5',
      name: '客户满意度调查',
      owner: mockUsers[5].name,
      project: '客户分析',
      type: 'view',
      status: 'published',
      views: 334,
      rating: 4.3,
      performance: 'good',
      lastModified: '2024-01-17T16:20:00Z',
      createdAt: '2024-01-08T13:45:00Z',
      description: '客户满意度调查结果可视化，包括NPS分数和反馈分析',
      tags: ['客户', '满意度', '调查', 'NPS'],
      dataSources: ['Survey Monkey', 'CSV', 'Google Forms']
    }
  ]

  return {
    dashboards,
    stats: {
      totalDashboards: dashboards.length,
      totalViews: dashboards.reduce((sum, d) => sum + d.views, 0),
      publishedDashboards: dashboards.filter(d => d.status === 'published').length,
      draftDashboards: dashboards.filter(d => d.status === 'draft').length,
      averageRating: dashboards.reduce((sum, d) => sum + d.rating, 0) / dashboards.length,
      totalProjects: new Set(dashboards.map(d => d.project)).size,
      totalDataSources: new Set(dashboards.flatMap(d => d.dataSources)).size
    }
  }
}

/**
 * 获取所有数据源的模拟数据
 */
export const getAllMockData = () => {
  return {
    'google-workspace': generateGoogleWorkspaceData(),
    'microsoft-365': generateMicrosoft365Data(),
    'notion': generateNotionData(),
    'confluence': generateConfluenceData(),
    'salesforce': generateSalesforceData(),
    'trello': generateTrelloData(),
    'zoom': generateZoomData(),
    'tableau': generateTableauData()
  }
}
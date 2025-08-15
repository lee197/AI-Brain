export const translations = {
  zh: {
    // 通用
    common: {
      welcome: "欢迎使用 AI Brain",
      loading: "加载中...",
      error: "错误",
      success: "成功",
      cancel: "取消",
      save: "保存",
      delete: "删除",
      edit: "编辑",
      search: "搜索",
      filter: "筛选",
      settings: "设置",
      logout: "退出登录",
      profile: "个人资料",
      help: "帮助",
      language: "语言",
      theme: "主题",
      or: "或者",
      back: "返回",
      change: "更改",
      create: "创建",
      creating: "创建中...",
    },
    // 认证相关
    auth: {
      login: "登录",
      signup: "注册",
      loginTitle: "登录您的智能工作助手",
      signupTitle: "创建您的智能工作助手账户",
      email: "邮箱地址",
      password: "密码",
      confirmPassword: "确认密码",
      name: "姓名",
      rememberMe: "记住我",
      forgotPassword: "忘记密码？",
      noAccount: "还没有账户？",
      hasAccount: "已有账户？",
      signupNow: "立即注册",
      loginNow: "立即登录",
      loginWithGoogle: "使用 Google 登录",
      loginWithGithub: "使用 GitHub 登录",
      signupWithGoogle: "使用 Google 注册",
      signupWithGithub: "使用 GitHub 注册",
      createAccount: "创建账户",
      authError: "认证失败",
      authErrorDesc: "登录过程中出现了问题",
      authErrorReasons: {
        expired: "认证链接已过期",
        used: "认证链接已被使用",
        network: "网络连接问题",
        config: "服务配置错误",
      },
      tryAgain: "重新登录",
      createNew: "创建新账户",
      notLoggedIn: "未登录",
      emailRequired: "请输入有效的邮箱地址",
      passwordRequired: "密码至少需要6位字符",
      nameRequired: "请输入姓名",
      passwordMismatch: "密码不匹配",
      loginFailed: "登录失败",
      signupFailed: "注册失败",
      checkEmail: "请检查邮箱并点击确认链接完成注册",
      demo: {
        title: "演示账号",
        subtitle: "使用以下账号快速体验",
        admin: {
          email: "admin@aibrain.com",
          password: "admin123",
          desc: "管理员账号"
        },
        user: {
          email: "demo@aibrain.com", 
          password: "demo123",
          desc: "普通用户账号"
        },
        clickToCopy: "点击复制"
      },
    },
    // 仪表板
    dashboard: {
      title: "AI Brain",
      subtitle: "您的智能工作助手，集成企业工具，自动化工作流，提供 AI 驱动的协助",
      badge: "企业级 AI 助手",
      dashboardBadge: "AI Brain Dashboard",
      workspace: "智能工作台",
      welcome: "欢迎回来",
      welcomeMessage: "今天是个高效的一天，让 AI Brain 帮助你完成更多任务",
      
      // AI 助手相关
      aiAssistant: "AI 助手",
      aiGreeting: "你好！我是你的 AI Brain 智能助手。我已经连接到您的企业工具，可以帮您：",
      capabilities: {
        taskManagement: "📋 **任务管理**：创建和跟踪 Jira 任务",
        teamCollaboration: "💬 **团队协作**：发送 Slack 消息，查看对话",
        codeManagement: "🔧 **代码管理**：查看 GitHub PR 状态，代码审查",
        meetingScheduling: "📅 **会议安排**：管理日历和会议",
        dataInsights: "📊 **数据洞察**：生成报告和分析",
      },
      todayFocus: "**今日重点关注**：",
      focusItems: {
        prPending: "有 3 个 PR 待审核",
        projectRisk: "项目进度存在风险预警", 
        teamOverload: "Sarah 团队负载过重需要调整",
      },
      howCanIHelp: "请告诉我您需要什么帮助？",
      inputPlaceholder: "描述您需要的帮助，如：创建关于API优化的Jira任务并通知团队...",
      aiThinking: "AI 正在思考中...",
      
      // 系统状态
      systemStatus: "系统状态",
      dataCollection: "数据收集",
      aiAnalysis: "AI 分析", 
      taskExecution: "任务执行",
      running: "运行中",
      processing: "处理中",
      ready: "待命",
      
      // 状态指示器
      syncing: "同步中",
      pending: "待审核",
      queued: "队列中",
      aiMode: "AI 模式",
      enhanced: "增强",
      
      // 数据源
      dataSources: "数据源",
      connected: "已连接",
      error: "错误",
      
      // 智能洞察
      insights: "智能洞察",
      projectRisk: "项目进度风险",
      projectRiskDesc: "API 开发落后 2 周，可能影响发布时间",
      resourceOptimization: "资源优化建议",
      resourceOptimizationDesc: "Sarah 有带宽，Tom 负载过重，建议任务重分配",
      codeQuality: "代码质量提升",
      codeQualityDesc: "PR 审查时间减少 40%，团队协作效率显著提升",
      takeAction: "采取行动",
      
      // 执行队列
      executionQueue: "执行队列",
      noTasks: "暂无执行任务",
      createJiraTask: "创建 Jira 任务",
      execute: "执行",
      start: "开始",
      pause: "暂停",
      
      // 快捷建议
      suggestions: {
        todayTasks: "分析今日待办事项",
        progressReport: "生成项目进度报告", 
        optimizeWorkload: "优化团队工作负载",
        urgentTask: "创建紧急任务提醒",
        scheduleMeeting: "安排明日会议",
        createTask: "创建任务",
        viewSchedule: "查看日程",
        sendMessage: "发送消息",
        generateReport: "生成报告",
      },
      
      // AI 响应示例
      aiResponse: "我正在处理您的请求，分析相关数据...\n\n基于当前项目状态，我建议：\n1. 优先处理高优先级任务\n2. 协调团队资源分配\n3. 设置进度里程碑提醒",
      
      // Context相关
      selectContext: "选择工作空间",
      searchContexts: "搜索工作空间...",
      noContextsFound: "未找到匹配的工作空间",
      createNewContext: "创建新工作空间",
      manageContexts: "管理工作空间",
      contextName: "工作空间名称",
      contextDescription: "描述",
      contextDescriptionPlaceholder: "简要描述这个工作空间的用途和目标...",
      selectContextType: "选择最适合您工作方式的空间类型",
      configureContext: "配置您的工作空间详细信息",
      lifecycle: "生命周期",
      advancedSettings: "高级设置",
      enableAI: "启用 AI 助手",
      enableAIDesc: "在此工作空间中使用 AI 功能",
      allowInvites: "允许邀请成员",
      allowInvitesDesc: "成员可以邀请其他人加入",
      publicAccess: "公开访问",
      publicAccessDesc: "允许组织内其他人发现此工作空间",
      today: "今天",
      yesterday: "昨天",
      unknown: "未知",
      // Context 页面专用翻译
      contexts: {
        title: "选择您的工作空间",
        welcomeBack: "欢迎回来",
        selectWorkspace: "选择一个工作空间开始您的 AI 驱动工作流程",
        searchWorkspaces: "搜索工作空间...",
        createNewWorkspace: "创建新工作空间",
        all: "全部",
        project: "项目",
        department: "部门", 
        team: "团队",
        client: "客户",
        personal: "个人",
        noWorkspaces: "暂无工作空间",
        noWorkspacesDesc: "创建您的第一个工作空间开始使用",
        noMatchingWorkspaces: "未找到匹配的工作空间",
        tryAdjustSearch: "尝试调整搜索条件",
        createWorkspace: "创建工作空间",
        members: "成员",
        monthsAgo: "个月前",
        weeksAgo: "周前",
        daysAgo: "天前",
        switch: "切换",
      },
      // Context 类型信息
      contextTypes: {
        PROJECT: {
          title: "项目",
          description: "有明确起止时间、目标导向、跨部门协作"
        },
        DEPARTMENT: {
          title: "部门",
          description: "组织架构单位，永久性团队，基于职能和专业领域"
        },
        TEAM: {
          title: "团队",
          description: "敏捷小组，短期任务导向，临时或半永久性"
        },
        CLIENT: {
          title: "客户",
          description: "外部合作项目，涉及客户服务、销售或合作伙伴"
        },
        PERSONAL: {
          title: "个人",
          description: "个人工作空间，私人任务、学习和职业发展"
        }
      },
      features: {
        multiTool: {
          title: "多工具集成",
          desc: "连接 Slack、Jira、GitHub、Google Workspace 等企业工具",
        },
        naturalLanguage: {
          title: "自然语言查询",
          desc: "跨所有连接工具进行自然语言查询和操作",
          badge: "AI 驱动",
        },
        automation: {
          title: "自动化工作流",
          desc: "自动执行任务，节省每周 8-10 小时工作时间",
          badge: "时间节省",
        },
        contextAware: {
          title: "上下文感知",
          desc: "理解项目、团队和公司知识的 AI 助手",
          badge: "智能助手",
        },
        realTimeSync: {
          title: "实时同步",
          desc: "所有集成工具的数据实时同步和更新",
          badge: "实时数据",
        },
        security: {
          title: "安全可靠",
          desc: "基于角色的访问控制，企业级安全保障",
          badge: "企业安全",
        },
      },
      actions: {
        startChat: "开始聊天 💬",
        manageIntegrations: "管理集成 🔧",
        viewComponents: "查看 UI 组件 🎨",
        startExperience: "开始您的 AI 驱动工作体验",
      },
      
      // Landing page 特定内容
      landing: {
        enterDashboard: "进入工作台",
        quickActions: {
          aiChat: "AI 聊天",
          integrations: "集成",
          insights: "洞察",
          tasks: "任务",
        },
        featureActions: {
          connectTools: "连接工具",
          startChat: "开始聊天", 
          createWorkflow: "创建工作流",
          viewInsights: "查看洞察",
          realTimeData: "实时数据",
          securitySettings: "安全设置",
        },
        cta: {
          title: "准备开始您的 AI 驱动工作流程？",
          description: "连接您的第一个工具，体验 AI Brain 如何改变您的工作方式。平均为团队节省每周 8-10 小时的时间。",
          connectFirstTool: "连接第一个工具",
          startAIChat: "开始 AI 对话",
        },
        footer: {
          viewUIComponents: "查看 UI 组件 🎨",
          settings: "设置",
          help: "帮助",
        },
      },
    },
    // UI 展示页
    uiDemo: {
      title: "AI Brain UI 组件",
      subtitle: "shadcn/ui 组件展示页面",
      components: {
        buttons: {
          title: "按钮组件",
          default: "默认按钮",
          secondary: "次要按钮",
          outline: "边框按钮",
          ghost: "幽灵按钮",
          destructive: "危险按钮",
          small: "小按钮",
          defaultSize: "默认大小",
          large: "大按钮",
        },
        input: {
          title: "输入框",
          placeholder: "请输入内容...",
          email: "电子邮箱",
          password: "密码",
        },
        badges: {
          title: "徽章组件",
          default: "默认",
          secondary: "次要",
          outline: "边框",
          destructive: "危险",
          aiAssistant: "AI 助手",
          online: "在线",
          beta: "Beta",
        },
        avatar: {
          title: "头像组件",
          user: "用户",
        },
        dropdown: {
          title: "下拉菜单",
          openMenu: "打开菜单",
          profile: "用户资料",
          settings: "设置",
          help: "帮助",
          logout: "登出",
        },
        dialog: {
          title: "对话框",
          openDialog: "打开对话框",
          dialogTitle: "AI Brain 设置",
          dialogContent: "这是一个示例对话框。",
          inputPlaceholder: "输入您的设置...",
          cancel: "取消",
          save: "保存",
        },
        theme: {
          title: "AI Brain 主题展示",
          brandColors: "品牌色彩",
          customStyles: "自定义样式",
          gradientText: "渐变文字效果",
          gradientBg: "渐变背景效果",
        },
      },
    },
    // 用户菜单
    userMenu: {
      profile: "个人资料",
      settings: "设置",
      logout: "退出登录",
      notLoggedIn: "未登录",
      login: "登录",
    },
  },
  en: {
    // Common
    common: {
      welcome: "Welcome to AI Brain",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      filter: "Filter",
      settings: "Settings",
      logout: "Logout",
      profile: "Profile",
      help: "Help",
      language: "Language",
      theme: "Theme",
      or: "Or",
      back: "Back",
      change: "Change",
      create: "Create",
      creating: "Creating...",
    },
    // Authentication
    auth: {
      login: "Login",
      signup: "Sign Up",
      loginTitle: "Login to your intelligent work assistant",
      signupTitle: "Create your intelligent work assistant account",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      name: "Name",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signupNow: "Sign up now",
      loginNow: "Login now",
      loginWithGoogle: "Login with Google",
      loginWithGithub: "Login with GitHub",
      signupWithGoogle: "Sign up with Google",
      signupWithGithub: "Sign up with GitHub",
      createAccount: "Create Account",
      authError: "Authentication Failed",
      authErrorDesc: "There was a problem during the login process",
      authErrorReasons: {
        expired: "Authentication link has expired",
        used: "Authentication link has been used",
        network: "Network connection issue",
        config: "Service configuration error",
      },
      tryAgain: "Try Login Again",
      createNew: "Create New Account",
      notLoggedIn: "Not logged in",
      emailRequired: "Please enter a valid email address",
      passwordRequired: "Password must be at least 6 characters",
      nameRequired: "Please enter your name",
      passwordMismatch: "Passwords do not match",
      loginFailed: "Login failed",
      signupFailed: "Signup failed",
      checkEmail: "Please check your email and click the confirmation link to complete registration",
      demo: {
        title: "Demo Accounts",
        subtitle: "Use these accounts to quickly try the platform",
        admin: {
          email: "admin@aibrain.com",
          password: "admin123",
          desc: "Administrator account"
        },
        user: {
          email: "demo@aibrain.com", 
          password: "demo123",
          desc: "Regular user account"
        },
        clickToCopy: "Click to copy"
      },
    },
    // Dashboard
    dashboard: {
      title: "AI Brain",
      subtitle: "Your intelligent work assistant that integrates enterprise tools, automates workflows, and provides AI-powered assistance",
      badge: "Enterprise AI Assistant",
      dashboardBadge: "AI Brain Dashboard",
      workspace: "Intelligent Workspace",
      welcome: "Welcome back",
      welcomeMessage: "Have a productive day with AI Brain helping you accomplish more tasks",
      
      // AI Assistant
      aiAssistant: "AI Assistant",
      aiGreeting: "Hello! I am your AI Brain intelligent assistant. I'm connected to your enterprise tools and can help you with:",
      capabilities: {
        taskManagement: "📋 **Task Management**: Create and track Jira tasks",
        teamCollaboration: "💬 **Team Collaboration**: Send Slack messages, view conversations",
        codeManagement: "🔧 **Code Management**: View GitHub PR status, code reviews",
        meetingScheduling: "📅 **Meeting Scheduling**: Manage calendar and meetings", 
        dataInsights: "📊 **Data Insights**: Generate reports and analytics",
      },
      todayFocus: "**Today's Focus**:",
      focusItems: {
        prPending: "3 PRs pending review",
        projectRisk: "Project progress risk alert",
        teamOverload: "Sarah's team overload needs adjustment",
      },
      howCanIHelp: "How can I help you?",
      inputPlaceholder: "Describe what you need help with, e.g.: Create a Jira task about API optimization and notify the team...",
      aiThinking: "AI is thinking...",
      
      // System Status
      systemStatus: "System Status",
      dataCollection: "Data Collection",
      aiAnalysis: "AI Analysis", 
      taskExecution: "Task Execution",
      running: "Running",
      processing: "Processing",
      ready: "Ready",
      
      // Status Indicators
      syncing: "Syncing",
      pending: "Pending",
      queued: "Queued",
      aiMode: "AI Mode",
      enhanced: "Enhanced",
      
      // Data Sources
      dataSources: "Data Sources",
      connected: "Connected",
      error: "Error",
      
      // Intelligent Insights
      insights: "Intelligent Insights",
      projectRisk: "Project Progress Risk",
      projectRiskDesc: "API development is 2 weeks behind, may affect release timeline",
      resourceOptimization: "Resource Optimization",
      resourceOptimizationDesc: "Sarah has bandwidth while Tom is overloaded, suggest task redistribution",
      codeQuality: "Code Quality Improvement",
      codeQualityDesc: "PR review time reduced by 40%, team collaboration efficiency significantly improved",
      takeAction: "Take Action",
      
      // Execution Queue
      executionQueue: "Execution Queue",
      noTasks: "No execution tasks",
      createJiraTask: "Create Jira Task",
      execute: "Execute",
      start: "Start",
      pause: "Pause",
      
      // Quick Suggestions
      suggestions: {
        todayTasks: "Analyze today's pending tasks",
        progressReport: "Generate project progress report", 
        optimizeWorkload: "Optimize team workload",
        urgentTask: "Create urgent task reminder",
        scheduleMeeting: "Schedule tomorrow's meeting",
        createTask: "Create Task",
        viewSchedule: "View Schedule",
        sendMessage: "Send Message",
        generateReport: "Generate Report",
      },
      
      // AI Response Example
      aiResponse: "I'm processing your request and analyzing relevant data...\n\nBased on current project status, I recommend:\n1. Prioritize high-priority tasks\n2. Coordinate team resource allocation\n3. Set progress milestone reminders",
      
      // Context related
      selectContext: "Select workspace",
      searchContexts: "Search workspaces...",
      noContextsFound: "No matching workspaces found",
      createNewContext: "Create new workspace",
      manageContexts: "Manage workspaces",
      contextName: "Workspace name",
      contextDescription: "Description",
      contextDescriptionPlaceholder: "Brief description of the purpose and goals of this workspace...",
      selectContextType: "Select the workspace type that best fits your working style",
      configureContext: "Configure your workspace details",
      lifecycle: "Lifecycle",
      advancedSettings: "Advanced settings",
      enableAI: "Enable AI assistant",
      enableAIDesc: "Use AI features in this workspace",
      allowInvites: "Allow member invitations",
      allowInvitesDesc: "Members can invite others to join",
      publicAccess: "Public access",
      publicAccessDesc: "Allow others in the organization to discover this workspace",
      today: "Today",
      yesterday: "Yesterday",
      unknown: "Unknown",
      // Context page specific translations
      contexts: {
        title: "Choose Your Workspace",
        welcomeBack: "Welcome back",
        selectWorkspace: "Select a workspace to start your AI-driven workflow",
        searchWorkspaces: "Search workspaces...",
        createNewWorkspace: "Create new workspace",
        all: "All",
        project: "Project",
        department: "Department", 
        team: "Team",
        client: "Client",
        personal: "Personal",
        noWorkspaces: "No workspaces",
        noWorkspacesDesc: "Create your first workspace to get started",
        noMatchingWorkspaces: "No matching workspaces found",
        tryAdjustSearch: "Try adjusting search criteria",
        createWorkspace: "Create workspace",
        members: "members",
        monthsAgo: "months ago",
        weeksAgo: "weeks ago",
        daysAgo: "days ago",
        switch: "Switch",
      },
      // Context type information
      contextTypes: {
        PROJECT: {
          title: "Project",
          description: "Goal-oriented with clear timelines, cross-departmental collaboration"
        },
        DEPARTMENT: {
          title: "Department",
          description: "Organizational unit, permanent team based on functions and expertise"
        },
        TEAM: {
          title: "Team",
          description: "Agile group, task-oriented, temporary or semi-permanent"
        },
        CLIENT: {
          title: "Client",
          description: "External collaboration projects involving client service, sales or partnerships"
        },
        PERSONAL: {
          title: "Personal",
          description: "Personal workspace for private tasks, learning and career development"
        }
      },
      features: {
        multiTool: {
          title: "Multi-tool Integration",
          desc: "Connect Slack, Jira, GitHub, Google Workspace and other enterprise tools",
        },
        naturalLanguage: {
          title: "Natural Language Queries",
          desc: "Natural language queries and operations across all connected tools",
          badge: "AI Powered",
        },
        automation: {
          title: "Workflow Automation",
          desc: "Automate tasks and save 8-10 hours per week",
          badge: "Time Saving",
        },
        contextAware: {
          title: "Context Aware",
          desc: "AI assistant that understands project, team and company knowledge",
          badge: "Smart Assistant",
        },
        realTimeSync: {
          title: "Real-time Sync",
          desc: "Real-time data synchronization and updates for all integrated tools",
          badge: "Real-time Data",
        },
        security: {
          title: "Secure & Reliable",
          desc: "Role-based access control with enterprise-grade security",
          badge: "Enterprise Security",
        },
      },
      actions: {
        startChat: "Start Chat 💬",
        manageIntegrations: "Manage Integrations 🔧",
        viewComponents: "View UI Components 🎨",
        startExperience: "Start your AI-powered work experience",
      },
      
      // Landing page specific content
      landing: {
        enterDashboard: "Dashboard",
        quickActions: {
          aiChat: "AI Chat",
          integrations: "Integrations",
          insights: "Insights",
          tasks: "Tasks",
        },
        featureActions: {
          connectTools: "Connect Tools",
          startChat: "Start Chat",
          createWorkflow: "Create Workflow", 
          viewInsights: "View Insights",
          realTimeData: "Real-time Data",
          securitySettings: "Security Settings",
        },
        cta: {
          title: "Ready to Start Your AI-Powered Workflow?",
          description: "Connect your first tool and experience how AI Brain transforms your workflow. Save 8-10 hours per week on average.",
          connectFirstTool: "Connect First Tool",
          startAIChat: "Start AI Chat",
        },
        footer: {
          viewUIComponents: "View UI Components 🎨",
          settings: "Settings", 
          help: "Help",
        },
      },
    },
    // UI Demo
    uiDemo: {
      title: "AI Brain UI Components",
      subtitle: "shadcn/ui component showcase",
      components: {
        buttons: {
          title: "Button Components",
          default: "Default Button",
          secondary: "Secondary",
          outline: "Outline",
          ghost: "Ghost",
          destructive: "Destructive",
          small: "Small",
          defaultSize: "Default Size",
          large: "Large",
        },
        input: {
          title: "Input Fields",
          placeholder: "Enter text...",
          email: "Email",
          password: "Password",
        },
        badges: {
          title: "Badge Components",
          default: "Default",
          secondary: "Secondary",
          outline: "Outline",
          destructive: "Destructive",
          aiAssistant: "AI Assistant",
          online: "Online",
          beta: "Beta",
        },
        avatar: {
          title: "Avatar Components",
          user: "User",
        },
        dropdown: {
          title: "Dropdown Menu",
          openMenu: "Open Menu",
          profile: "Profile",
          settings: "Settings",
          help: "Help",
          logout: "Logout",
        },
        dialog: {
          title: "Dialog",
          openDialog: "Open Dialog",
          dialogTitle: "AI Brain Settings",
          dialogContent: "This is a sample dialog.",
          inputPlaceholder: "Enter your settings...",
          cancel: "Cancel",
          save: "Save",
        },
        theme: {
          title: "AI Brain Theme Showcase",
          brandColors: "Brand Colors",
          customStyles: "Custom Styles",
          gradientText: "Gradient Text Effect",
          gradientBg: "Gradient Background Effect",
        },
      },
    },
    // User Menu
    userMenu: {
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      notLoggedIn: "Not logged in",
      login: "Login",
    },
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.zh
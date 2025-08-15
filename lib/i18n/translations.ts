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
// 全局类型声明

// 扩展process.env类型
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_USE_MOCK_AUTH?: string
    NEXT_PUBLIC_SITE_URL?: string
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    GEMINI_API_KEY?: string
    OPENAI_API_KEY?: string
    SLACK_BOT_TOKEN?: string
    SLACK_SIGNING_SECRET?: string
    SLACK_CLIENT_ID?: string
    SLACK_CLIENT_SECRET?: string
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    VERCEL_URL?: string
  }
}

// 扩展Window对象
declare global {
  interface Window {
    __INITIAL_STATE__?: any
  }
}

export {}
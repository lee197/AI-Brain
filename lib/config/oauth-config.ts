/**
 * 生产环境OAuth配置
 * 这些配置内置在应用中，客户无需配置
 */

export const OAUTH_CONFIG = {
  // AI Brain官方OAuth应用配置
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'aibrain-official.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'official-secret-key',
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/callback`,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },
  
  drive: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'aibrain-official.apps.googleusercontent.com', 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'official-secret-key',
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/google-drive/callback`,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }
}

// 生产环境配置（客户看不到这些）
// 只有AI Brain的服务器有这些环境变量
const PRODUCTION_CONFIG = {
  GOOGLE_CLIENT_ID: 'aibrain-12345.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'GOCSPX-xxxxxxxxxxxxxxxxxx',
  NEXT_PUBLIC_SITE_URL: 'https://app.aibrain.com'
}
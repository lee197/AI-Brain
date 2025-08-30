/**
 * 智能环境检测工具
 * 自动判断当前运行环境并返回正确的域名配置
 */

export interface EnvironmentConfig {
  isDevelopment: boolean
  isProduction: boolean
  baseUrl: string
  webhookUrl: string
  oauthRedirectUrl: string
}

export function getEnvironmentConfig(): EnvironmentConfig {
  // 检测运行环境
  const isVercel = process.env.VERCEL === '1'
  const isLocalhost = process.env.NODE_ENV === 'development'
  
  // Vercel 生产环境
  if (isVercel) {
    const vercelUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://aibraindeployment.vercel.app'
    
    return {
      isDevelopment: false,
      isProduction: true,
      baseUrl: vercelUrl,
      webhookUrl: `${vercelUrl}/api/webhooks/slack`,
      oauthRedirectUrl: `${vercelUrl}/api/slack/redirect`
    }
  }
  
  // 本地开发环境
  const ngrokUrl = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok-free.app'
  const useNgrok = process.env.USE_NGROK === 'true' && ngrokUrl.includes('ngrok')
  
  if (useNgrok) {
    return {
      isDevelopment: true,
      isProduction: false,
      baseUrl: ngrokUrl,
      webhookUrl: `${ngrokUrl}/api/webhooks/slack`,
      oauthRedirectUrl: `${ngrokUrl}/api/slack/redirect`
    }
  }
  
  // 默认 localhost
  return {
    isDevelopment: true,
    isProduction: false,
    baseUrl: 'http://localhost:3000',
    webhookUrl: 'http://localhost:3000/api/webhooks/slack',
    oauthRedirectUrl: 'http://localhost:3000/api/slack/redirect'
  }
}

export function getSlackRedirectUri(req?: Request): string {
  const config = getEnvironmentConfig()
  
  // 如果是通过请求头判断，优先使用
  if (req) {
    const host = req.headers.get?.('host') || (req as any).headers?.host
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : 'https'
      return `${protocol}://${host}/api/slack/redirect`
    }
  }
  
  return config.oauthRedirectUrl
}

/**
 * 开发模式快速切换工具
 */
export const ENV_COMMANDS = {
  // 设置为 ngrok 开发模式
  enableNgrok: 'export USE_NGROK=true && export NGROK_URL=https://your-ngrok-url.ngrok-free.app',
  
  // 设置为 localhost 开发模式  
  disableNgrok: 'export USE_NGROK=false',
  
  // 检查当前环境
  checkEnv: 'echo "NODE_ENV: $NODE_ENV, USE_NGROK: $USE_NGROK, NGROK_URL: $NGROK_URL"'
}
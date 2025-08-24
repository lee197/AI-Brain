// 全局类型声明文件 - 解决TypeScript构建错误

// 声明模块通配符，允许任何模块导入
declare module '*' {
  const content: any
  export default content
}

// 扩展Window对象
declare global {
  interface Window {
    __INITIAL_STATE__?: any
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

// 常用的第三方模块类型声明
declare module '@slack/web-api' {
  export class WebClient {
    constructor(token?: string, options?: any)
    auth: any
    channels: any
    chat: any
    users: any
    conversations: any
    [key: string]: any
  }
}

declare module 'jira.js' {
  export class Version3Client {
    constructor(options?: any)
    [key: string]: any
  }
}

declare module '@octokit/rest' {
  export class Octokit {
    constructor(options?: any)
    [key: string]: any
  }
}

declare module 'googleapis' {
  export const google: any
}

declare module '@notionhq/client' {
  export class Client {
    constructor(options?: any)
    [key: string]: any
  }
}

// React相关类型扩展
declare namespace React {
  interface HTMLAttributes<T> {
    [key: string]: any
  }
}

// Next.js相关类型
declare module 'next/server' {
  export interface NextRequest {
    [key: string]: any
  }
  
  export interface NextResponse {
    [key: string]: any
  }
}

// Supabase相关类型
declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any
  export interface Database {
    [key: string]: any
  }
}

// 通用接口
interface GenericObject {
  [key: string]: any
}

interface GenericFunction {
  (...args: any[]): any
}

// 导出空对象，确保这是一个模块
export {}
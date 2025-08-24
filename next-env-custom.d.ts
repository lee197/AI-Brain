/// <reference types="next" />
/// <reference types="next/image-types/global" />

// 临时的类型声明，用于修复构建错误
declare module '*'

// 扩展用户类型
declare global {
  interface ExtendedUser {
    name?: string
    [key: string]: any
  }
}

export {}
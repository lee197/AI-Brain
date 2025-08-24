import { redirect } from 'next/navigation'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // 直接重定向到contexts页面，避免客户端组件预渲染问题
  redirect('/contexts')
}
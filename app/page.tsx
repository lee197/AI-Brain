import { redirect } from 'next/navigation'

export default function HomePage() {
  // 直接重定向到contexts页面，避免客户端组件预渲染问题
  redirect('/contexts')
}
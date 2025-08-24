import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // 暂时忽略构建时的TypeScript错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 暂时忽略构建时的ESLint错误
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel部署优化配置
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
}

export default nextConfig

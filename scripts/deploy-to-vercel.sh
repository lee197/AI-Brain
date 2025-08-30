#!/bin/bash

# AI Brain - Vercel 一键部署脚本
# 这将为你提供固定的HTTPS域名，无需再使用ngrok

echo "🚀 开始部署 AI Brain 到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 登录 Vercel (如果尚未登录)
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "请先登录 Vercel:"
    vercel login
fi

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel --prod

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 接下来需要配置环境变量:"
echo "   1. 访问 Vercel Dashboard"
echo "   2. 进入项目设置 > Environment Variables" 
echo "   3. 添加以下环境变量:"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的值>"
echo "   SUPABASE_SERVICE_ROLE_KEY=<你的值>"
echo "   GEMINI_API_KEY=$GEMINI_API_KEY"
echo "   SLACK_BOT_TOKEN=<你的值>"
echo "   SLACK_SIGNING_SECRET=<你的值>"
echo "   SLACK_CLIENT_ID=<你的值>"
echo "   SLACK_CLIENT_SECRET=<你的值>"
echo "   GOOGLE_CLIENT_ID=<你的值>"
echo "   GOOGLE_CLIENT_SECRET=<你的值>"
echo "   NEXT_PUBLIC_USE_MOCK_AUTH=false"
echo ""
echo "📱 部署完成后，你的应用将有固定的HTTPS域名"
echo "   例如: https://ai-brain-xyz.vercel.app"
echo ""
echo "🔗 在Slack App中配置:"
echo "   OAuth Redirect URL: https://your-domain.vercel.app/api/slack/redirect"
echo "   Webhook URL: https://your-domain.vercel.app/api/webhooks/slack"
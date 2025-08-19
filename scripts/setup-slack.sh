#!/bin/bash

# 🚀 AI Brain Slack配置脚本
# 使用方法: ./scripts/setup-slack.sh

echo "🎯 AI Brain - Slack集成配置向导"
echo "=================================="
echo ""

# 检查.env.local文件
if [ ! -f ".env.local" ]; then
    echo "📝 创建.env.local文件..."
    touch .env.local
fi

echo "📋 请提供以下Slack配置信息："
echo "   (可从 https://api.slack.com/apps 获取)"
echo ""

# 获取配置信息
read -p "🔑 Slack Client ID: " SLACK_CLIENT_ID
read -p "🔐 Slack Client Secret: " SLACK_CLIENT_SECRET
read -p "✍️  Slack Signing Secret: " SLACK_SIGNING_SECRET
read -p "🤖 Slack Bot Token (xoxb-开头): " SLACK_BOT_TOKEN

echo ""
echo "🌐 配置部署域名："
read -p "🔗 网站域名 (如: https://your-app.vercel.app): " SITE_URL

# 验证必填项
if [ -z "$SLACK_CLIENT_ID" ] || [ -z "$SLACK_CLIENT_SECRET" ] || [ -z "$SLACK_SIGNING_SECRET" ] || [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "❌ 错误：所有Slack配置项都是必填的"
    exit 1
fi

# 备份现有.env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "💾 已备份现有配置到 .env.local.backup"
fi

# 写入配置
echo "⚙️  正在写入配置..."

# 移除现有Slack配置
sed -i '' '/^SLACK_/d' .env.local
sed -i '' '/^NEXT_PUBLIC_SITE_URL/d' .env.local  
sed -i '' '/^NEXTAUTH_URL/d' .env.local

# 添加新配置
cat >> .env.local << EOF

# Slack生产配置 (由setup-slack.sh生成)
SLACK_CLIENT_ID=$SLACK_CLIENT_ID
SLACK_CLIENT_SECRET=$SLACK_CLIENT_SECRET
SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET
SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN

# 站点配置
NEXT_PUBLIC_SITE_URL=$SITE_URL
NEXTAUTH_URL=$SITE_URL
EOF

echo ""
echo "✅ Slack配置已完成！"
echo ""
echo "📋 配置摘要："
echo "   Client ID: $SLACK_CLIENT_ID"
echo "   Bot Token: ${SLACK_BOT_TOKEN:0:20}..."
echo "   Site URL: $SITE_URL"
echo ""
echo "🔧 接下来的步骤："
echo "   1. 在Slack App中配置以下URL："
echo "      OAuth Redirect: $SITE_URL/api/auth/slack/callback"
echo "      Event Webhook: $SITE_URL/api/webhooks/slack"
echo ""
echo "   2. 重启开发服务器："
echo "      npm run dev"
echo ""
echo "   3. 测试一键安装功能"
echo ""
echo "🎉 配置完成！现在可以使用真实的Slack集成了！"
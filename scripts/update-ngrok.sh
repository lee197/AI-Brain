#!/bin/bash

# 快速更新 ngrok URL 脚本
# 用法: ./scripts/update-ngrok.sh

echo "🔍 检测当前 ngrok URL..."

# 获取当前运行的 ngrok URL
CURRENT_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['proto'] == 'https':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)

if [ -z "$CURRENT_URL" ]; then
    echo "❌ 未检测到运行中的 ngrok，请先启动 ngrok"
    echo "   运行: ngrok http 3000"
    exit 1
fi

echo "✅ 检测到 ngrok URL: $CURRENT_URL"

# 更新 .env.local 文件
if [ -f ".env.local" ]; then
    # 备份原文件
    cp .env.local .env.local.bak
    
    # 更新 NGROK_URL
    if grep -q "NGROK_URL=" .env.local; then
        sed -i.tmp "s|NGROK_URL=.*|NGROK_URL=$CURRENT_URL|g" .env.local
        rm .env.local.tmp
        echo "✅ 已更新 .env.local 中的 NGROK_URL"
    else
        echo "NGROK_URL=$CURRENT_URL" >> .env.local
        echo "✅ 已添加 NGROK_URL 到 .env.local"
    fi
else
    echo "❌ .env.local 文件不存在"
    exit 1
fi

echo ""
echo "🔗 请在 Slack App 中更新以下 URL:"
echo "   OAuth Redirect URL: $CURRENT_URL/api/slack/redirect"
echo "   Webhook URL: $CURRENT_URL/api/webhooks/slack"
echo ""
echo "📋 或者复制这些 URL:"
echo "   $CURRENT_URL/api/slack/redirect"
echo "   $CURRENT_URL/api/webhooks/slack"
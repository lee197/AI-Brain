#!/bin/bash

# AI Brain 开发环境启动脚本
# 自动启动 Next.js 开发服务器和 ngrok，并更新环境变量

set -e

echo "🚀 启动 AI Brain 开发环境..."

# 检查是否安装了 ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ 错误: 请先安装 ngrok (https://ngrok.com/download)"
    exit 1
fi

# 检查是否已经有 ngrok 进程在运行
if pgrep -f "ngrok.*3000" > /dev/null; then
    echo "⚠️  检测到 ngrok 已经在运行，正在终止..."
    pkill -f "ngrok.*3000"
    sleep 2
fi

# 检查是否已经有 Next.js 开发服务器在运行
if lsof -ti:3000 > /dev/null; then
    echo "⚠️  端口3000已被占用，正在释放..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# 启动 ngrok (后台运行)
echo "🌐 启动 ngrok 隧道..."
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# 等待 ngrok 启动
echo "⏳ 等待 ngrok 启动..."
sleep 5

# 获取 ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['proto'] == 'https':
            print(tunnel['public_url'])
            break
except:
    pass
")

if [ -z "$NGROK_URL" ]; then
    echo "❌ 错误: 无法获取 ngrok URL，请手动检查"
    kill $NGROK_PID
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"

# 更新 .env.local 文件中的 NGROK_URL
if [ -f ".env.local" ]; then
    # 使用 sed 替换现有的 NGROK_URL 行
    sed -i.bak "s|NGROK_URL=.*|NGROK_URL=$NGROK_URL|g" .env.local
    echo "✅ 已更新 .env.local 中的 NGROK_URL"
else
    echo "⚠️  .env.local 文件不存在，请手动设置 NGROK_URL=$NGROK_URL"
fi

# 启动 Next.js 开发服务器
echo "🖥️  启动 Next.js 开发服务器..."
npm run dev &
DEV_PID=$!

echo ""
echo "🎉 开发环境启动完成！"
echo "📱 本地地址: http://localhost:3000"
echo "🌐 公网地址: $NGROK_URL"
echo ""
echo "📋 Slack App 配置:"
echo "   OAuth Redirect URL: $NGROK_URL/api/slack/redirect"
echo "   Webhook URL: $NGROK_URL/api/webhooks/slack"
echo ""
echo "⏹️  按 Ctrl+C 停止所有服务"

# 创建清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $NGROK_PID 2>/dev/null || true
    kill $DEV_PID 2>/dev/null || true
    rm -f ngrok.log
    echo "✅ 清理完成"
    exit 0
}

# 捕获 Ctrl+C 信号
trap cleanup SIGINT SIGTERM

# 等待进程结束
wait $DEV_PID
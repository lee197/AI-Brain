#!/bin/bash

# AI Brain 开发环境设置脚本
# 快速在 ngrok 开发模式和本地模式间切换

echo "🚀 AI Brain 开发环境设置"
echo "=========================="

case "$1" in
  "ngrok")
    echo "🔗 启用 ngrok 开发模式"
    echo ""
    echo "请先启动 ngrok:"
    echo "  ngrok http 3000"
    echo ""
    echo "然后将生成的 URL 设置为环境变量:"
    echo "  export USE_NGROK=true"
    echo "  export NGROK_URL=https://your-ngrok-id.ngrok-free.app"
    echo ""
    echo "或者编辑 .env.local 文件添加:"
    echo "  USE_NGROK=true"
    echo "  NGROK_URL=https://your-ngrok-id.ngrok-free.app"
    echo ""
    echo "📝 Slack App 配置 (开发阶段):"
    echo "  OAuth Redirect URL: https://your-ngrok-id.ngrok-free.app/api/slack/redirect"
    echo "  Event Subscription URL: https://your-ngrok-id.ngrok-free.app/api/webhooks/slack"
    ;;

  "local")
    echo "🏠 启用本地开发模式"
    echo ""
    echo "设置环境变量:"
    echo "  export USE_NGROK=false"
    echo ""
    echo "或者编辑 .env.local 文件:"
    echo "  USE_NGROK=false"
    echo "  # NGROK_URL=（注释掉或删除）"
    echo ""
    echo "⚠️  注意: 本地模式无法接收 Slack webhooks"
    ;;

  "production")
    echo "🌐 生产环境信息"
    echo ""
    echo "Vercel 域名: https://aibraindeployment.vercel.app"
    echo ""
    echo "📝 Slack App 配置 (生产环境):"
    echo "  OAuth Redirect URLs:"
    echo "    - https://aibraindeployment.vercel.app/api/slack/redirect"
    echo "    - https://aibraindeployment-git-main-jasons-projects-76b6cdcf.vercel.app/api/slack/redirect"
    echo "    - https://aibraindeployment-9jeydxrg-jasons-projects-76b6cdcf.vercel.app/api/slack/redirect"
    echo ""
    echo "  Event Subscription URL:"
    echo "    - https://aibraindeployment.vercel.app/api/webhooks/slack"
    echo ""
    echo "部署命令:"
    echo "  git add . && git commit -m \"your message\" && git push origin main"
    ;;

  "check")
    echo "🔍 当前环境检查"
    echo ""
    echo "NODE_ENV: ${NODE_ENV:-not set}"
    echo "USE_NGROK: ${USE_NGROK:-not set}"
    echo "NGROK_URL: ${NGROK_URL:-not set}"
    echo "VERCEL: ${VERCEL:-not set}"
    echo "VERCEL_URL: ${VERCEL_URL:-not set}"
    echo ""
    
    if [ "$VERCEL" = "1" ]; then
      echo "🌐 当前运行在 Vercel 生产环境"
    elif [ "$USE_NGROK" = "true" ]; then
      echo "🔗 当前使用 ngrok 开发模式"
      echo "Webhook URL: ${NGROK_URL}/api/webhooks/slack"
    else
      echo "🏠 当前使用本地开发模式"
      echo "⚠️  Webhooks 在本地模式下不可用"
    fi
    ;;

  *)
    echo "用法:"
    echo "  $0 ngrok      - 设置 ngrok 开发模式"
    echo "  $0 local      - 设置本地开发模式"  
    echo "  $0 production - 显示生产环境信息"
    echo "  $0 check      - 检查当前环境状态"
    echo ""
    echo "工作流程:"
    echo "  1. 开发阶段: ./scripts/dev-setup.sh ngrok"
    echo "  2. 本地测试: ./scripts/dev-setup.sh local"
    echo "  3. 部署生产: git push origin main"
    echo "  4. 环境检查: ./scripts/dev-setup.sh check"
    ;;
esac

echo ""
echo "🎯 快速命令:"
echo "  npm run dev  - 启动开发服务器"
echo "  npm run build - 构建生产版本"
echo ""
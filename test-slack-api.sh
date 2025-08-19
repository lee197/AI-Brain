#!/bin/bash

echo "🧪 AI Brain Slack API 测试脚本"
echo "================================"

BASE_URL="http://localhost:3000"

echo ""
echo "1. 测试Slack连接状态..."
curl -s -X GET "$BASE_URL/api/slack/status" | jq '.'

echo ""
echo "2. 测试获取频道列表..."
curl -s -X GET "$BASE_URL/api/slack/channels" | jq '.'

echo ""
echo "3. 测试发送消息..."
curl -s -X POST "$BASE_URL/api/slack/send-message" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "C09AHKG46HM",
    "message": "🤖 测试消息：这是从AI Brain API直接发送的测试消息！\n\n✨ 功能测试正常",
    "contextId": "test-context-123"
  }' | jq '.'

echo ""
echo "✅ 测试完成！请检查Slack频道中是否收到消息。"
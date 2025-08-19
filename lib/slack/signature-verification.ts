import crypto from 'crypto'

/**
 * 验证Slack请求签名
 * @param body 请求体原始内容
 * @param signature 请求头中的签名
 * @param timestamp 请求头中的时间戳
 * @returns 验证是否通过
 */
export function verifySlackSignature(
  body: string, 
  signature: string, 
  timestamp: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET

  if (!signingSecret) {
    console.error('SLACK_SIGNING_SECRET not configured')
    return false
  }

  // 防重放攻击 - 请求不能超过5分钟
  const currentTime = Math.floor(Date.now() / 1000)
  const requestTime = parseInt(timestamp)
  
  if (Math.abs(currentTime - requestTime) > 300) {
    console.error('Request timestamp too old:', {
      currentTime,
      requestTime,
      diff: Math.abs(currentTime - requestTime)
    })
    return false
  }

  // 生成预期签名
  const baseString = `v0:${timestamp}:${body}`
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`

  // 使用时间安全的比较防止时序攻击
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Signature comparison error:', error)
    return false
  }
}

/**
 * 生成Slack签名 (用于测试)
 * @param body 请求体内容
 * @param timestamp 时间戳
 * @returns 生成的签名
 */
export function generateSlackSignature(body: string, timestamp: string): string {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  const baseString = `v0:${timestamp}:${body}`
  
  return `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`
}
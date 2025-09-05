/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting AI Brain E2E Test Suite...')
  
  // Ensure test directories exist
  const fs = require('fs')
  const path = require('path')
  
  const dirs = [
    'playwright/.auth',
    'test-results/artifacts',
    'test-results/html-report'
  ]
  
  dirs.forEach(dir => {
    const fullPath = path.resolve(dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  })
  
  // Validate environment
  const requiredEnvVars = []
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`)
  }
  
  console.log('✅ Global setup completed')
}

export default globalSetup
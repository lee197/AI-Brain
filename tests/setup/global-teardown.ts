/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */
import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after tests...')
  
  // Clean up any test artifacts if needed
  // For example, remove temporary files, reset database, etc.
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown
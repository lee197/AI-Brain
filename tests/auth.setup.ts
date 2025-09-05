/**
 * Authentication setup for AI Brain E2E tests
 * This runs once before all other tests to establish user session
 */
import { test as setup, expect } from '@playwright/test'
import { PageHelpers, TEST_CONFIG } from './utils/test-helpers'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const helpers = new PageHelpers(page)
  
  console.log('🔐 Setting up authentication for AI Brain tests...')
  
  try {
    // Navigate to login page
    await page.goto('/login')
    await helpers.waitForPageReady()
    
    console.log('📝 Filling login credentials...')
    
    // Use test helper for more reliable form filling
    await helpers.fillField('input[type="email"]', TEST_CONFIG.DEMO_USER.email)
    await helpers.fillField('input[type="password"]', TEST_CONFIG.DEMO_USER.password)
    
    // Click login button
    await helpers.clickButton('button[type="submit"]')
    
    console.log('⏳ Waiting for login to complete...')
    
    // Wait for successful login (redirect away from login page)
    await page.waitForURL(/\/(contexts|dashboard|home|\/)/, { 
      timeout: TEST_CONFIG.TIMEOUTS.LONG 
    })
    
    // Ensure page is fully loaded
    await helpers.waitForPageReady()
    await helpers.waitForLoadingComplete()
    
    // Verify authentication was successful
    if (!(await helpers.isAuthenticated())) {
      throw new Error('Authentication verification failed')
    }
    
    console.log('💾 Saving authentication state...')
    
    // Save authentication state for other tests
    await page.context().storageState({ path: authFile })
    
    console.log('✅ Authentication setup completed successfully')
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error)
    
    // Take screenshot for debugging
    await helpers.takeScreenshot('auth-setup-failure')
    
    throw error
  }
})
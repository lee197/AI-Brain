/**
 * Test constants and configuration for AI Brain E2E tests
 */

export const SELECTORS = {
  // Authentication
  AUTH: {
    EMAIL_INPUT: 'input[type="email"]',
    PASSWORD_INPUT: 'input[type="password"]',
    SUBMIT_BUTTON: 'button[type="submit"]',
    LOGIN_FORM: 'form',
    ERROR_MESSAGE: '.error-message, [role="alert"], .text-red-600'
  },
  
  // Chat interface - Updated to match actual HTML structure
  CHAT: {
    CONTAINER: '.flex.flex-col.h-full',
    MESSAGE_AREA: '.flex-1.overflow-y-auto.p-4',
    MESSAGE_INPUT: 'input.w-full.border.border-gray-300.rounded-lg',
    SEND_BUTTON: 'button[type="submit"].bg-blue-600',
    MESSAGE_BUBBLES: '.rounded-2xl.p-4',
    AI_MESSAGE: '.bg-gray-50, .dark\\:bg-gray-800',
    USER_MESSAGE: '.bg-blue-600.text-white',
    LOADING_INDICATOR: '.animate-spin, .loading'
  },
  
  // Navigation
  NAV: {
    SIDEBAR: '[data-testid="sidebar"], .sidebar, aside',
    SIDEBAR_TOGGLE: '[data-testid="sidebar-toggle"], .sidebar-toggle',
    USER_MENU: '[data-testid="user-menu"], .user-menu',
    LANGUAGE_SWITCHER: '[data-testid="language-switcher"], .language-switcher',
    THEME_TOGGLE: '[data-testid="theme-toggle"], .theme-toggle'
  },
  
  // Workspace
  WORKSPACE: {
    LIST: '[data-testid="workspace-list"], .workspace-list, .contexts-list',
    ITEM: '[data-testid="workspace-item"], .workspace-item',
    CREATE_BUTTON: 'button:has-text("创建"), button:has-text("Create"), button:has-text("新建")',
    NAME_INPUT: 'input[name*="name"], input[placeholder*="名称"]',
    DESCRIPTION_INPUT: 'textarea[name*="description"], textarea[placeholder*="描述"]',
    TYPE_SELECTOR: 'select[name*="type"], [data-testid="workspace-type"]'
  },
  
  // Data sources
  DATA_SOURCES: {
    STATUS_AREA: '[data-testid="data-sources-status"], .data-sources, .status-indicators',
    STATUS_ITEM: '.status-item, [data-testid*="status"]',
    SLACK_STATUS: '[data-testid="slack-status"]',
    GMAIL_STATUS: '[data-testid="gmail-status"]',
    CONFIG_BUTTON: '[data-testid="configure"], button:has-text("配置")'
  }
} as const

export const URLS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  CONTEXTS: '/contexts',
  CONTEXT_NEW: '/contexts/new',
  TEST_WORKSPACE: `/contexts/${TEST_CONFIG.TEST_WORKSPACE_ID}`,
  SETTINGS: (id: string) => `/contexts/${id}/settings`
} as const

export const MESSAGES = {
  SUCCESS: {
    LOGIN: ['登录成功', 'Login successful'],
    REGISTRATION: ['注册成功', 'Registration successful'],
    LOGOUT: ['已成功登出', 'Successfully logged out']
  },
  ERROR: {
    INVALID_CREDENTIALS: ['Invalid', '错误', 'incorrect', '无效'],
    NETWORK_ERROR: ['网络错误', 'Network error', 'Failed to fetch'],
    REQUIRED_FIELD: ['必填', 'Required', 'required']
  },
  LOADING: {
    INDICATORS: ['Loading...', '加载中...', 'Please wait', '请稍候']
  }
} as const

export const TIMEOUTS = {
  INSTANT: 0,
  VERY_SHORT: 500,
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  EXTRA_LONG: 30000,
  MAX: 60000
} as const

export const TEST_DATA = {
  VALID_PASSWORD: 'TestPassword123!',
  INVALID_EMAIL: 'invalid-email',
  INVALID_PASSWORD: '123',
  TEST_MESSAGE: 'Hello AI! This is a test message.',
  WORKSPACE_NAMES: [
    '测试项目工作空间',
    'Test Project Workspace',
    'AI Brain测试',
    'Development Team Space'
  ]
} as const

// Import TEST_CONFIG from test-helpers to avoid circular dependency
import { TEST_CONFIG } from './test-helpers'
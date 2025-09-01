import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

// AI 模型配置
export const AI_MODELS = {
  // Google Models
  'gemini-flash': google('gemini-1.5-flash'),
  'gemini-pro': google('gemini-1.5-pro'),
  
  // OpenAI Models
  'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
  'gpt-4': openai('gpt-4'),
  'gpt-4-turbo': openai('gpt-4-turbo'),
  
  // Anthropic Models
  'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'claude-3-haiku': anthropic('claude-3-haiku-20240307'),
} as const

export type AIModelType = keyof typeof AI_MODELS

// 获取可用的模型（基于环境变量）
export function getAvailableModels(): Record<AIModelType, boolean> {
  return {
    'gemini-flash': !!process.env.GEMINI_API_KEY,
    'gemini-pro': !!process.env.GEMINI_API_KEY,
    'gpt-3.5-turbo': !!process.env.OPENAI_API_KEY,
    'gpt-4': !!process.env.OPENAI_API_KEY,
    'gpt-4-turbo': !!process.env.OPENAI_API_KEY,
    'claude-3-5-sonnet': !!process.env.ANTHROPIC_API_KEY,
    'claude-3-haiku': !!process.env.ANTHROPIC_API_KEY,
  }
}

// 获取默认模型（优先顺序）
export function getDefaultModel(): AIModelType {
  const available = getAvailableModels()
  
  // 优先顺序：Gemini Flash > GPT-3.5 > Claude Haiku
  if (available['gemini-flash']) return 'gemini-flash'
  if (available['gpt-3.5-turbo']) return 'gpt-3.5-turbo'
  if (available['claude-3-haiku']) return 'claude-3-haiku'
  
  // 如果都没有，返回 Gemini Flash（将会在运行时出错，但提供更好的错误信息）
  return 'gemini-flash'
}

// 模型元数据
export const MODEL_METADATA = {
  'gemini-flash': {
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    maxTokens: 8192,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  'gemini-pro': {
    name: 'Gemini 1.5 Pro',
    provider: 'Google', 
    maxTokens: 8192,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    maxTokens: 4096,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  'gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    maxTokens: 8192,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    maxTokens: 4096,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    maxTokens: 4096,
    temperature: { min: 0, max: 1, default: 0.7 },
  },
  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    maxTokens: 4096,
    temperature: { min: 0, max: 1, default: 0.7 },
  },
} as const
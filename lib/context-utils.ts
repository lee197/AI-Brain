import { ContextType, LifecycleType } from '@/types/context'
import { translations, Language } from '@/lib/i18n/translations'

// 动态获取Context类型信息
export function getContextTypeInfo(type: ContextType, language: Language) {
  const t = translations[language]
  
  const baseInfo = {
    icon: {
      PROJECT: '🚀',
      DEPARTMENT: '🏢',
      TEAM: '👥',
      CLIENT: '🤝',
      PERSONAL: '📝'
    }[type],
    defaultLifecycle: {
      PROJECT: 'TEMPORARY',
      DEPARTMENT: 'PERMANENT', 
      TEAM: 'TEMPORARY',
      CLIENT: 'PERMANENT',
      PERSONAL: 'PERMANENT'
    }[type] as LifecycleType,
    suggestedDuration: {
      PROJECT: language === 'zh' ? '3-6个月' : '3-6 months',
      TEAM: language === 'zh' ? '2-4周' : '2-4 weeks'
    }[type]
  }

  return {
    ...baseInfo,
    title: t.dashboard.contextTypes[type].title,
    description: t.dashboard.contextTypes[type].description
  }
}

// 获取所有Context类型的信息
export function getAllContextTypeInfo(language: Language) {
  const types: ContextType[] = ['PROJECT', 'DEPARTMENT', 'TEAM', 'CLIENT', 'PERSONAL']
  
  return types.reduce((acc, type) => {
    acc[type] = getContextTypeInfo(type, language)
    return acc
  }, {} as Record<ContextType, ReturnType<typeof getContextTypeInfo>>)
}
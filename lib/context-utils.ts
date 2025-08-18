import { ContextType, LifecycleType, CONTEXT_TYPE_INFO } from '@/types/context'
import { translations, Language } from '@/lib/i18n/translations'

// 动态获取Context类型信息
export function getContextTypeInfo(type: ContextType, language: Language) {
  const t = translations[language]
  
  const baseInfo = CONTEXT_TYPE_INFO[type]
  
  // 防御性编程：确保baseInfo存在
  if (!baseInfo) {
    return {
      icon: '📁',
      title: type,
      description: `${type} workspace`,
      defaultLifecycle: 'PERMANENT' as LifecycleType,
      suggestedDuration: undefined,
      label: type
    }
  }
  
  // 如果翻译文件中有对应的翻译，优先使用翻译
  const translatedInfo = t.dashboard?.contextTypes?.[type]
  
  return {
    icon: baseInfo.icon,
    title: translatedInfo?.title || baseInfo.title,
    description: translatedInfo?.description || baseInfo.description,
    defaultLifecycle: baseInfo.defaultLifecycle,
    suggestedDuration: baseInfo.suggestedDuration,
    label: translatedInfo?.title || baseInfo.title
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
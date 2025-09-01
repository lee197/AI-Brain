/**
 * Browser-safe NLP analyzer
 * Compatible with both server and client environments
 */

export interface BrowserSafeAnalysisResult {
  sentiment: {
    score: number
    classification: 'positive' | 'negative' | 'neutral'
    confidence: number
    primaryEmotion: string
    emotions: Record<string, number>
  }
  tasks: Array<{
    title: string
    description: string
    priority: 'urgent' | 'high' | 'medium' | 'low'
    confidence: number
    assignee?: string
    deadline?: string
  }>
  languageInfo: {
    detectedLanguages: string[]
    primaryLanguage: string
    mixedLanguage: boolean
  }
  entities: Array<{
    text: string
    type: 'PERSON' | 'ORGANIZATION' | 'DATE' | 'PROJECT' | 'EMAIL'
    confidence: number
  }>
}

export class BrowserSafeNLP {
  private chineseSentimentDict: Map<string, number>
  private englishSentimentDict: Map<string, number>

  constructor() {
    // Initialize sentiment dictionaries
    this.chineseSentimentDict = new Map([
      // Positive words
      ['好', 1], ['棒', 1], ['赞', 1], ['优秀', 2], ['完美', 2], ['成功', 2], ['高兴', 1], ['开心', 1],
      ['满意', 1], ['喜欢', 1], ['爱', 2], ['支持', 1], ['同意', 1], ['有效', 1], ['顺利', 1],
      // Negative words  
      ['坏', -1], ['差', -1], ['糟', -1], ['失败', -2], ['困难', -1], ['问题', -1], ['错误', -2], ['担心', -1],
      ['不满', -1], ['反对', -1], ['拒绝', -1], ['无效', -1], ['延迟', -1], ['紧急', -1], ['严重', -2]
    ])

    this.englishSentimentDict = new Map([
      // Positive words
      ['good', 1], ['great', 2], ['excellent', 2], ['awesome', 2], ['perfect', 2], ['happy', 1], ['love', 2],
      ['success', 2], ['effective', 1], ['smooth', 1], ['support', 1], ['agree', 1], ['like', 1],
      // Negative words
      ['bad', -1], ['terrible', -2], ['awful', -2], ['fail', -2], ['problem', -1], ['error', -2], ['worry', -1],
      ['difficult', -1], ['urgent', -1], ['serious', -2], ['refuse', -1], ['disagree', -1], ['hate', -2]
    ])
  }

  /**
   * Perform comprehensive analysis on text
   */
  async analyzeComprehensive(text: string): Promise<BrowserSafeAnalysisResult> {
    const languageInfo = this.detectLanguage(text)
    
    let sentiment, tasks

    if (languageInfo.primaryLanguage === 'zh') {
      sentiment = this.analyzeChineseSentiment(text)
      tasks = this.extractChineseTasks(text)
    } else {
      sentiment = this.analyzeEnglishSentiment(text)
      tasks = this.extractEnglishTasks(text)
    }

    const entities = this.extractEntities(text)

    return {
      sentiment,
      tasks,
      languageInfo,
      entities
    }
  }

  private detectLanguage(text: string) {
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const totalChars = text.length
    const chineseRatio = chineseCharCount / totalChars

    let primaryLanguage: string
    let detectedLanguages: string[] = []

    if (chineseRatio > 0.3) {
      primaryLanguage = 'zh'
      detectedLanguages.push('zh')
      if (chineseRatio < 0.8) {
        detectedLanguages.push('en')
      }
    } else {
      primaryLanguage = 'en'
      detectedLanguages.push('en')
      if (chineseRatio > 0.1) {
        detectedLanguages.push('zh')
      }
    }

    return {
      detectedLanguages,
      primaryLanguage,
      mixedLanguage: detectedLanguages.length > 1
    }
  }

  private analyzeChineseSentiment(text: string) {
    // Simple word-based segmentation for browser environment
    const segments = text.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9]+/g) || []
    
    let score = 0
    let positiveCount = 0
    let negativeCount = 0
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 }

    for (const word of segments) {
      if (this.chineseSentimentDict.has(word)) {
        const wordScore = this.chineseSentimentDict.get(word)!
        score += wordScore
        if (wordScore > 0) {
          positiveCount++
          emotions.joy += wordScore
        } else {
          negativeCount++
          emotions.anger += Math.abs(wordScore)
        }
      }
    }

    // Normalize score
    const totalWords = segments.length
    const normalizedScore = totalWords > 0 ? score / totalWords : 0

    let classification: 'positive' | 'negative' | 'neutral'
    if (normalizedScore > 0.1) classification = 'positive'
    else if (normalizedScore < -0.1) classification = 'negative'
    else classification = 'neutral'

    const confidence = Math.min(0.95, Math.abs(normalizedScore) * 2 + 0.3)
    const primaryEmotion = emotions.joy > emotions.anger ? 'joy' : 
                          emotions.anger > 0 ? 'anger' : 'neutral'

    return {
      score: normalizedScore,
      classification,
      confidence,
      primaryEmotion,
      emotions
    }
  }

  private analyzeEnglishSentiment(text: string) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    
    let score = 0
    let positiveCount = 0
    let negativeCount = 0
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 }

    for (const word of words) {
      if (this.englishSentimentDict.has(word)) {
        const wordScore = this.englishSentimentDict.get(word)!
        score += wordScore
        if (wordScore > 0) {
          positiveCount++
          emotions.joy += wordScore
        } else {
          negativeCount++
          emotions.anger += Math.abs(wordScore)
        }
      }
    }

    const normalizedScore = words.length > 0 ? score / words.length : 0

    let classification: 'positive' | 'negative' | 'neutral'
    if (normalizedScore > 0.1) classification = 'positive'
    else if (normalizedScore < -0.1) classification = 'negative'
    else classification = 'neutral'

    const confidence = Math.min(0.95, Math.abs(normalizedScore) * 2 + 0.3)
    const primaryEmotion = emotions.joy > emotions.anger ? 'joy' : 
                          emotions.anger > 0 ? 'anger' : 'neutral'

    return {
      score: normalizedScore,
      classification,
      confidence,
      primaryEmotion,
      emotions
    }
  }

  private extractChineseTasks(text: string): Array<{
    title: string
    description: string
    priority: 'urgent' | 'high' | 'medium' | 'low'
    confidence: number
    assignee?: string
    deadline?: string
  }> {
    const tasks = []

    // Chinese task patterns
    const patterns = [
      { pattern: /需要([^。！？\n]{5,40})/g, priority: 'medium' as const },
      { pattern: /要([^。！？\n]{5,30})/g, priority: 'medium' as const },
      { pattern: /尽快([^。！？\n]{5,40})/g, priority: 'urgent' as const },
      { pattern: /紧急([^。！？\n]{5,40})/g, priority: 'urgent' as const },
      { pattern: /完成([^。！？\n]{5,40})/g, priority: 'high' as const },
    ]

    for (const { pattern, priority } of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const taskText = match[1].trim()
        if (taskText.length >= 3) {
          tasks.push({
            title: taskText.substring(0, 30),
            description: taskText,
            priority,
            confidence: 0.7,
            deadline: this.extractDeadline(text)
          })
        }
      }
    }

    return tasks.slice(0, 10) // Limit to 10 tasks
  }

  private extractEnglishTasks(text: string) {
    const tasks = []

    const patterns = [
      { pattern: /(?:need to|should|must|have to)\s+([^.!?\n]{5,50})/gi, priority: 'medium' as const },
      { pattern: /(?:urgent|asap|immediately)\s+([^.!?\n]{5,40})/gi, priority: 'urgent' as const },
      { pattern: /(?:complete|finish|do)\s+([^.!?\n]{5,40})/gi, priority: 'high' as const },
    ]

    for (const { pattern, priority } of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const taskText = match[1].trim()
        if (taskText.length >= 3) {
          tasks.push({
            title: taskText.substring(0, 30),
            description: taskText,
            priority,
            confidence: 0.7,
            deadline: this.extractDeadline(text)
          })
        }
      }
    }

    return tasks.slice(0, 10)
  }

  private extractDeadline(text: string): string | undefined {
    // Simple deadline extraction
    const deadlinePatterns = [
      /明天|tomorrow/i,
      /今天|today/i,
      /下周|next week/i,
      /本周|this week/i,
      /\d{1,2}[月/]\d{1,2}[日号]/,
      /\d{1,2}\/\d{1,2}/
    ]

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return undefined
  }

  private extractEntities(text: string) {
    const entities = []

    // Person names (simple patterns)
    const personPatterns = [
      /[A-Z][a-z]+\s[A-Z][a-z]+/g, // English names
      /[\u4e00-\u9fff]{2,3}(?=说|讲|认为|表示)/g // Chinese names before speech verbs
    ]

    for (const pattern of personPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'PERSON' as const,
          confidence: 0.6
        })
      }
    }

    // Email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    let emailMatch
    while ((emailMatch = emailPattern.exec(text)) !== null) {
      entities.push({
        text: emailMatch[0],
        type: 'EMAIL' as const,
        confidence: 0.9
      })
    }

    // Dates
    const datePatterns = [
      /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g,
      /\d{1,2}[月/]\d{1,2}[日号]/g
    ]

    for (const pattern of datePatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'DATE' as const,
          confidence: 0.8
        })
      }
    }

    return entities.slice(0, 20) // Limit entities
  }
}
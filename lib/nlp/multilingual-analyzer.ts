/**
 * 多语言NLP分析器 - 支持中英文混合文本分析
 * 集成 compromise(英文)、jieba(中文)、VADER sentiment、AFINN等
 */

// @ts-ignore
import nlp from 'compromise'
// @ts-ignore
import dates from 'compromise-dates'
// @ts-ignore  
const nodejieba = require('nodejieba')
// @ts-ignore
const vader = require('vader-sentiment')
// @ts-ignore
const Sentiment = require('wink-sentiment')
// @ts-ignore
const afinn = require('afinn-165')
// @ts-ignore
const franc = require('franc-min')

import { EnhancedSentimentResult, EnhancedTaskItem } from './enhanced-analyzer'

// 扩展compromise插件
nlp.extend(dates)

// 语言检测结果
export interface LanguageDetectionResult {
  language: 'zh' | 'en' | 'mixed'
  confidence: number
  zhRatio: number
  enRatio: number
  segments: {
    text: string
    language: 'zh' | 'en'
    start: number
    end: number
  }[]
}

// 多语言分析结果
export interface MultilingualAnalysisResult {
  languageDetection: LanguageDetectionResult
  sentiment: EnhancedSentimentResult
  entities: EntityResult[]
  tasks: EnhancedTaskItem[]
  temporalExpressions: TemporalExpression[]
  keyphrases: string[]
  processingTime: number
}

// 实体识别结果
export interface EntityResult {
  text: string
  type: 'PERSON' | 'ORG' | 'LOCATION' | 'DATE' | 'TIME' | 'MONEY' | 'EMAIL' | 'URL' | 'PHONE'
  confidence: number
  start: number
  end: number
  normalized?: string
}

// 时间表达式
export interface TemporalExpression {
  text: string
  normalized: string
  type: 'date' | 'time' | 'duration' | 'relative'
  start: number
  end: number
}

export class MultilingualNLP {
  private chineseNLP: any
  private englishNLP: any
  private sentimentAnalyzer: any
  private initialized = false
  
  // 中文情感词典
  private chineseSentimentDict: Map<string, number>
  
  // 英文任务关键词
  private englishTaskKeywords: Set<string>
  
  // 中文任务关键词
  private chineseTaskKeywords: Set<string>
  
  constructor() {
    this.initializeAsync()
  }

  private async initializeAsync() {
    if (this.initialized) return
    
    console.log('🌏 Initializing Multilingual NLP Analyzer...')
    
    try {
      // 初始化jieba中文分词
      nodejieba.load()
      
      // 初始化wink情感分析器
      this.sentimentAnalyzer = new Sentiment()
      
      // 初始化中文情感词典
      this.chineseSentimentDict = new Map([
        // 积极情感词汇
        ['好', 2], ['很好', 3], ['棒', 2], ['优秀', 3], ['完美', 3], ['满意', 2],
        ['高兴', 2], ['开心', 2], ['兴奋', 3], ['喜欢', 2], ['爱', 3], ['赞', 2],
        ['支持', 1], ['同意', 1], ['可以', 0.5], ['不错', 1.5], ['顺利', 2],
        ['成功', 3], ['胜利', 3], ['完成', 1], ['达成', 2], ['实现', 1.5],
        
        // 消极情感词汇  
        ['不好', -2], ['糟糕', -3], ['差', -2], ['失败', -3], ['错误', -2], ['问题', -2],
        ['困难', -1.5], ['麻烦', -1.5], ['复杂', -1], ['难', -1], ['烦', -2], ['恶心', -3],
        ['生气', -2], ['愤怒', -3], ['不满', -2], ['失望', -2], ['沮丧', -2], ['担心', -1.5],
        ['害怕', -2], ['恐惧', -3], ['紧张', -1.5], ['焦虑', -2], ['压力', -1.5], ['累', -1],
        
        // 紧急/时间相关
        ['紧急', -0.5], ['急', -0.5], ['赶紧', -0.5], ['快', -0.2], ['慢', -0.5],
        ['立即', 0], ['马上', 0], ['现在', 0], ['今天', 0], ['明天', 0]
      ])
      
      // 英文任务关键词
      this.englishTaskKeywords = new Set([
        'need', 'should', 'must', 'have to', 'required', 'complete', 'finish', 'do',
        'task', 'action', 'todo', 'assignment', 'work', 'project', 'deliverable',
        'deadline', 'due', 'asap', 'urgent', 'priority', 'important', 'critical'
      ])
      
      // 中文任务关键词
      this.chineseTaskKeywords = new Set([
        '需要', '应该', '必须', '要', '得', '完成', '做', '处理', '解决', '实现',
        '任务', '工作', '项目', '活动', '事情', '安排', '计划', '目标',
        '截止', '期限', '紧急', '重要', '优先', '关键', '马上', '立即', '尽快'
      ])
      
      this.initialized = true
      console.log('✅ Multilingual NLP Analyzer initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Multilingual NLP:', error)
      throw error
    }
  }

  /**
   * 智能语言检测
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    await this.initializeAsync()
    
    if (!text || text.trim().length === 0) {
      return {
        language: 'en',
        confidence: 0,
        zhRatio: 0,
        enRatio: 0,
        segments: []
      }
    }
    
    // 使用franc进行基础语言检测
    const francResult = franc(text)
    
    // 字符级分析
    const chineseRegex = /[\u4e00-\u9fff]/g
    const englishRegex = /[a-zA-Z]/g
    
    const chineseMatches = text.match(chineseRegex) || []
    const englishMatches = text.match(englishRegex) || []
    const totalChars = text.length
    
    const zhRatio = chineseMatches.length / totalChars
    const enRatio = englishMatches.length / totalChars
    
    // 文本分段 - 识别中英文混合
    const segments = this.segmentByLanguage(text)
    
    // 确定主要语言
    let language: 'zh' | 'en' | 'mixed'
    let confidence: number
    
    if (zhRatio > 0.3 && enRatio > 0.1) {
      language = 'mixed'
      confidence = Math.min(zhRatio + enRatio, 0.9)
    } else if (zhRatio > enRatio) {
      language = 'zh'  
      confidence = Math.min(zhRatio * 1.2, 0.95)
    } else {
      language = 'en'
      confidence = Math.min(enRatio * 1.2, 0.95)
    }
    
    return {
      language,
      confidence,
      zhRatio,
      enRatio,
      segments
    }
  }

  /**
   * 多语言情感分析
   */
  async analyzeMultilingualSentiment(text: string): Promise<EnhancedSentimentResult> {
    await this.initializeAsync()
    
    const langResult = await this.detectLanguage(text)
    
    let combinedResult: EnhancedSentimentResult = {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
      classification: 'neutral',
      confidence: 0,
      emotionBreakdown: { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 },
      contextualFactors: {
        hasNegation: false,
        intensifiers: [],
        emoticons: []
      }
    }
    
    if (langResult.language === 'mixed') {
      // 混合语言：分段分析后合并
      combinedResult = await this.analyzeMixedLanguageSentiment(text, langResult.segments)
    } else if (langResult.language === 'zh') {
      // 纯中文分析
      combinedResult = await this.analyzeChineseSentiment(text)
    } else {
      // 纯英文分析
      combinedResult = await this.analyzeEnglishSentiment(text)
    }
    
    return combinedResult
  }

  /**
   * 多语言任务提取
   */
  async extractMultilingualTasks(messages: any[]): Promise<EnhancedTaskItem[]> {
    await this.initializeAsync()
    
    const allTasks: EnhancedTaskItem[] = []
    
    for (const message of messages) {
      if (!message.text || message.text.trim().length === 0) continue
      
      const langResult = await this.detectLanguage(message.text)
      let messageTasks: EnhancedTaskItem[] = []
      
      if (langResult.language === 'mixed') {
        // 混合语言：分段提取
        messageTasks = await this.extractMixedLanguageTasks(message, langResult.segments)
      } else if (langResult.language === 'zh') {
        // 中文任务提取
        messageTasks = await this.extractChineseTasks(message)
      } else {
        // 英文任务提取
        messageTasks = await this.extractEnglishTasks(message)
      }
      
      allTasks.push(...messageTasks)
    }
    
    // 去重和排序
    return this.deduplicateTasks(allTasks)
  }

  /**
   * 实体识别
   */
  async extractEntities(text: string): Promise<EntityResult[]> {
    await this.initializeAsync()
    
    const entities: EntityResult[] = []
    const langResult = await this.detectLanguage(text)
    
    if (langResult.language === 'en' || langResult.language === 'mixed') {
      // 英文实体识别使用compromise
      const doc = nlp(text)
      
      // 人名
      const people = doc.people().out('array')
      people.forEach((person: string) => {
        const index = text.indexOf(person)
        if (index !== -1) {
          entities.push({
            text: person,
            type: 'PERSON',
            confidence: 0.8,
            start: index,
            end: index + person.length
          })
        }
      })
      
      // 地点
      const places = doc.places().out('array')
      places.forEach((place: string) => {
        const index = text.indexOf(place)
        if (index !== -1) {
          entities.push({
            text: place,
            type: 'LOCATION',
            confidence: 0.7,
            start: index,
            end: index + place.length
          })
        }
      })
      
      // 组织机构
      const orgs = doc.organizations().out('array')
      orgs.forEach((org: string) => {
        const index = text.indexOf(org)
        if (index !== -1) {
          entities.push({
            text: org,
            type: 'ORG',
            confidence: 0.7,
            start: index,
            end: index + org.length
          })
        }
      })
    }
    
    // 通用模式匹配（支持中英文）
    entities.push(...this.extractPatternBasedEntities(text))
    
    return entities.sort((a, b) => a.start - b.start)
  }

  /**
   * 时间表达式提取
   */
  async extractTemporalExpressions(text: string): Promise<TemporalExpression[]> {
    await this.initializeAsync()
    
    const temporalExpressions: TemporalExpression[] = []
    
    // 英文时间表达式（使用compromise-dates）
    const doc = nlp(text)
    const dates = doc.dates()
    
    dates.forEach((date: any) => {
      const dateText = date.text()
      const index = text.indexOf(dateText)
      
      if (index !== -1) {
        temporalExpressions.push({
          text: dateText,
          normalized: date.format('iso') || dateText,
          type: 'date',
          start: index,
          end: index + dateText.length
        })
      }
    })
    
    // 中文时间表达式
    const chineseTimePatterns = [
      { pattern: /今天|明天|后天|昨天|前天/g, type: 'relative' as const },
      { pattern: /本周|下周|上周|这周|那周/g, type: 'relative' as const },
      { pattern: /本月|下月|上月|这个月|下个月/g, type: 'relative' as const },
      { pattern: /\d{1,2}月\d{1,2}日/g, type: 'date' as const },
      { pattern: /\d{4}年\d{1,2}月\d{1,2}日/g, type: 'date' as const },
      { pattern: /\d{1,2}:\d{2}|\d{1,2}点\d{1,2}分?/g, type: 'time' as const },
      { pattern: /上午|下午|早上|晚上|中午|凌晨/g, type: 'time' as const }
    ]
    
    chineseTimePatterns.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        temporalExpressions.push({
          text: match[0],
          normalized: this.normalizeChineseTime(match[0]),
          type,
          start: match.index,
          end: match.index + match[0].length
        })
      }
    })
    
    return temporalExpressions.sort((a, b) => a.start - b.start)
  }

  /**
   * 关键短语提取
   */
  async extractKeyphrases(text: string): Promise<string[]> {
    await this.initializeAsync()
    
    const langResult = await this.detectLanguage(text)
    let keyphrases: string[] = []
    
    if (langResult.language === 'en' || langResult.language === 'mixed') {
      // 英文关键短语
      const doc = nlp(text)
      
      // 名词短语
      const nouns = doc.nouns().out('array')
      keyphrases.push(...nouns.filter(n => n.length > 3))
      
      // 动词短语
      const verbs = doc.verbs().out('array')
      keyphrases.push(...verbs.filter(v => v.length > 3))
    }
    
    if (langResult.language === 'zh' || langResult.language === 'mixed') {
      // 中文关键短语
      const segments = nodejieba.extract(text, 10) // 提取前10个关键词
      keyphrases.push(...segments.map((item: any) => item.word))
    }
    
    // 去重并按频率排序
    const phraseFreq = new Map<string, number>()
    keyphrases.forEach(phrase => {
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1)
    })
    
    return Array.from(phraseFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase)
  }

  /**
   * 综合多语言分析
   */
  async analyzeComprehensive(text: string): Promise<MultilingualAnalysisResult> {
    const startTime = Date.now()
    await this.initializeAsync()
    
    // 并行执行各种分析
    const [
      languageDetection,
      sentiment,
      entities,
      temporalExpressions,
      keyphrases
    ] = await Promise.all([
      this.detectLanguage(text),
      this.analyzeMultilingualSentiment(text),
      this.extractEntities(text),
      this.extractTemporalExpressions(text),
      this.extractKeyphrases(text)
    ])
    
    // 任务提取需要消息格式，这里传入模拟消息
    const mockMessage = {
      text,
      id: 'temp',
      user: { name: 'unknown' },
      channel: { name: 'unknown' },
      timestamp: new Date().toISOString()
    }
    
    const tasks = await this.extractMultilingualTasks([mockMessage])
    
    return {
      languageDetection,
      sentiment,
      entities,
      tasks,
      temporalExpressions,
      keyphrases,
      processingTime: Date.now() - startTime
    }
  }

  // ============= 私有辅助方法 =============

  private segmentByLanguage(text: string): LanguageDetectionResult['segments'] {
    const segments: LanguageDetectionResult['segments'] = []
    let currentSegment = ''
    let currentLang: 'zh' | 'en' | null = null
    let segmentStart = 0
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const isChineseChar = /[\u4e00-\u9fff]/.test(char)
      const isEnglishChar = /[a-zA-Z]/.test(char)
      
      let charLang: 'zh' | 'en' | null = null
      if (isChineseChar) charLang = 'zh'
      else if (isEnglishChar) charLang = 'en'
      
      if (charLang && charLang !== currentLang) {
        // 语言切换，保存当前段落
        if (currentSegment.trim() && currentLang) {
          segments.push({
            text: currentSegment.trim(),
            language: currentLang,
            start: segmentStart,
            end: i
          })
        }
        
        currentSegment = char
        currentLang = charLang
        segmentStart = i
      } else {
        currentSegment += char
      }
    }
    
    // 添加最后一个段落
    if (currentSegment.trim() && currentLang) {
      segments.push({
        text: currentSegment.trim(),
        language: currentLang,
        start: segmentStart,
        end: text.length
      })
    }
    
    return segments
  }

  private async analyzeMixedLanguageSentiment(
    text: string, 
    segments: LanguageDetectionResult['segments']
  ): Promise<EnhancedSentimentResult> {
    let totalScore = 0
    let totalComparative = 0
    let allPositive: string[] = []
    let allNegative: string[] = []
    let weightedConfidence = 0
    
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 }
    const contextualFactors = {
      hasNegation: false,
      intensifiers: [] as string[],
      emoticons: [] as string[]
    }
    
    for (const segment of segments) {
      let segmentResult: EnhancedSentimentResult
      
      if (segment.language === 'zh') {
        segmentResult = await this.analyzeChineseSentiment(segment.text)
      } else {
        segmentResult = await this.analyzeEnglishSentiment(segment.text)
      }
      
      const weight = segment.text.length / text.length
      totalScore += segmentResult.score * weight
      totalComparative += segmentResult.comparative * weight
      weightedConfidence += segmentResult.confidence * weight
      
      allPositive.push(...segmentResult.positive)
      allNegative.push(...segmentResult.negative)
      
      // 合并情感分解
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion as keyof typeof emotions] += 
          segmentResult.emotionBreakdown[emotion as keyof typeof emotions] * weight
      })
      
      // 合并上下文因子
      if (segmentResult.contextualFactors.hasNegation) {
        contextualFactors.hasNegation = true
      }
      contextualFactors.intensifiers.push(...segmentResult.contextualFactors.intensifiers)
      contextualFactors.emoticons.push(...segmentResult.contextualFactors.emoticons)
    }
    
    const classification: 'positive' | 'neutral' | 'negative' = 
      totalComparative > 0.1 ? 'positive' : 
      totalComparative < -0.1 ? 'negative' : 'neutral'
    
    return {
      score: totalScore,
      comparative: totalComparative,
      positive: [...new Set(allPositive)],
      negative: [...new Set(allNegative)],
      classification,
      confidence: weightedConfidence,
      emotionBreakdown: emotions,
      contextualFactors
    }
  }

  private async analyzeChineseSentiment(text: string): Promise<EnhancedSentimentResult> {
    const segments = nodejieba.cut(text)
    let score = 0
    let positive: string[] = []
    let negative: string[] = []
    
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 }
    const contextualFactors = {
      hasNegation: /不|没|未|非|无|别/.test(text),
      intensifiers: segments.filter((w: string) => ['很', '非常', '特别', '极其'].includes(w)),
      emoticons: text.match(/😀|😁|😂|😃|😄|😅|😆|😇|😈|😉|😊|😋|😌|😍|😎|😏|😐|😑|😒|😓|😔|😕|😖|😗|😘|😙|😚|😛|😜|😝|😞|😟|😠|😡|😢|😣|😤|😥|😦|😧|😨|😩|😪|😫|😬|😭|😮|😯|😰|😱|😲|😳|😴|😵|😶|😷|😸|😹|😺|😻|😼|😽|😾|😿|🙀|🙁|🙂|🙃|🙄|🙅|🙆|🙇|🙈|🙉|🙊|🙋|🙌|🙍|🙎|🙏/g) || []
    }
    
    for (const word of segments) {
      if (this.chineseSentimentDict.has(word)) {
        const wordScore = this.chineseSentimentDict.get(word)!
        score += wordScore
        
        if (wordScore > 0) {
          positive.push(word)
        } else if (wordScore < 0) {
          negative.push(word)
        }
      }
    }
    
    // 应用上下文修正
    if (contextualFactors.hasNegation) {
      score *= -0.5
    }
    if (contextualFactors.intensifiers.length > 0) {
      score *= (1 + contextualFactors.intensifiers.length * 0.2)
    }
    
    const comparative = segments.length > 0 ? score / segments.length : 0
    const classification: 'positive' | 'neutral' | 'negative' = 
      comparative > 0.1 ? 'positive' : 
      comparative < -0.1 ? 'negative' : 'neutral'
    
    return {
      score,
      comparative,
      positive,
      negative,
      classification,
      confidence: Math.min(Math.abs(comparative) * 3, 0.9),
      emotionBreakdown: emotions,
      contextualFactors
    }
  }

  private async analyzeEnglishSentiment(text: string): Promise<EnhancedSentimentResult> {
    // 使用VADER和wink-sentiment的组合
    const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text)
    const winkResult = this.sentimentAnalyzer.value(text)
    
    // 结合两种算法的结果
    const combinedScore = (vaderResult.compound * 0.6 + winkResult.normalizedScore * 0.4) * 5
    
    const classification: 'positive' | 'neutral' | 'negative' = 
      vaderResult.compound > 0.05 ? 'positive' : 
      vaderResult.compound < -0.05 ? 'negative' : 'neutral'
    
    const contextualFactors = {
      hasNegation: /\b(not|no|never|nothing|nobody|nowhere|neither|nor)\b/i.test(text),
      intensifiers: (text.match(/\b(very|extremely|really|quite|rather|pretty|fairly)\b/gi) || []),
      emoticons: text.match(/😀|😁|😂|😃|😄|😅|😆|😇|😈|😉|😊|😋|😌|😍|😎|😏|😐|😑|😒|😓|😔|😕|😖|😗|😘|😙|😚|😛|😜|😝|😞|😟|😠|😡|😢|😣|😤|😥|😦|😧|😨|😩|😪|😫|😬|😭|😮|😯|😰|😱|😲|😳|😴|😵|😶|😷|😸|😹|😺|😻|😼|😽|😾|😿|🙀|🙁|🙂|🙃|🙄|🙅|🙆|🙇|🙈|🙉|🙊|🙋|🙌|🙍|🙎|🙏|:\)|:\(|:D|:P|;-?\)|:-?\(/g) || []
    }
    
    return {
      score: combinedScore,
      comparative: vaderResult.compound,
      positive: winkResult.tokenizedPhrase.filter((t: any) => t.score > 0).map((t: any) => t.value),
      negative: winkResult.tokenizedPhrase.filter((t: any) => t.score < 0).map((t: any) => t.value),
      classification,
      confidence: Math.abs(vaderResult.compound) + 0.2,
      emotionBreakdown: {
        joy: vaderResult.pos * 3,
        anger: vaderResult.neg * 2, 
        fear: vaderResult.neg * 1.5,
        sadness: vaderResult.neg * 2,
        surprise: Math.abs(vaderResult.compound) > 0.5 ? 1 : 0
      },
      contextualFactors
    }
  }

  private async extractMixedLanguageTasks(
    message: any, 
    segments: LanguageDetectionResult['segments']
  ): Promise<EnhancedTaskItem[]> {
    const tasks: EnhancedTaskItem[] = []
    
    for (const segment of segments) {
      const segmentMessage = { ...message, text: segment.text }
      
      if (segment.language === 'zh') {
        tasks.push(...await this.extractChineseTasks(segmentMessage))
      } else {
        tasks.push(...await this.extractEnglishTasks(segmentMessage))
      }
    }
    
    return tasks
  }

  private async extractChineseTasks(message: any): Promise<EnhancedTaskItem[]> {
    const tasks: EnhancedTaskItem[] = []
    const text = message.text
    const segments = nodejieba.cut(text)
    
    // 中文任务识别模式
    const chineseTaskPatterns = [
      /(?:需要|要|应该|必须)([^。！？]{5,50})(?:完成|做|处理)/g,
      /(?:请|帮忙)([^。！？]{3,30})(?:一下|处理|解决)/g,
      /(?:今天|明天|本周)([^。！？]{3,40})(?:完成|交付)/g
    ]
    
    for (const pattern of chineseTaskPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const taskDesc = match[0].trim()
        if (taskDesc.length > 3) {
          tasks.push(await this.buildTaskFromMatch(taskDesc, message, 'zh'))
        }
      }
    }
    
    return tasks
  }

  private async extractEnglishTasks(message: any): Promise<EnhancedTaskItem[]> {
    const tasks: EnhancedTaskItem[] = []
    const text = message.text
    
    // 使用compromise进行英文任务识别
    const doc = nlp(text)
    
    // 识别命令式句子
    const imperatives = doc.sentences().filter((s: any) => {
      const firstWord = s.terms().first().out('text').toLowerCase()
      return ['please', 'need', 'should', 'must', 'have to', 'let'].includes(firstWord)
    })
    
    imperatives.forEach((sentence: any) => {
      const taskDesc = sentence.out('text').trim()
      if (taskDesc.length > 5) {
        tasks.push(this.buildTaskFromMatch(taskDesc, message, 'en'))
      }
    })
    
    // 模式匹配
    const englishTaskPatterns = [
      /(?:need to|should|must|have to)\s+([^.!?]{5,50})/gi,
      /(?:please|can you)\s+([^.!?]{5,40})/gi,
      /(?:todo|task|action):\s*([^.!?\n]{5,60})/gi
    ]
    
    for (const pattern of englishTaskPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const taskDesc = match[0].trim()
        if (taskDesc.length > 5) {
          tasks.push(await this.buildTaskFromMatch(taskDesc, message, 'en'))
        }
      }
    }
    
    return tasks
  }

  private async buildTaskFromMatch(taskDesc: string, message: any, language: 'zh' | 'en'): Promise<EnhancedTaskItem> {
    // 基础任务构建逻辑
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: taskDesc,
      taskType: 'action',
      priority: 'medium',
      status: 'mentioned',
      confidence: 0.7,
      urgencyIndicators: [],
      timeIndicators: [],
      stakeholders: [message.user?.name || 'unknown'],
      relatedTasks: [],
      complexity: 'moderate',
      sourceMessage: {
        id: message.id || 'unknown',
        user: message.user?.name || 'unknown', 
        channel: message.channel?.name || 'unknown',
        timestamp: message.timestamp || new Date().toISOString()
      }
    }
  }

  private extractPatternBasedEntities(text: string): EntityResult[] {
    const entities: EntityResult[] = []
    
    // 邮箱
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    let match
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'EMAIL',
        confidence: 0.95,
        start: match.index,
        end: match.index + match[0].length
      })
    }
    
    // URL
    const urlRegex = /https?:\/\/[^\s]+/g
    while ((match = urlRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'URL', 
        confidence: 0.9,
        start: match.index,
        end: match.index + match[0].length
      })
    }
    
    // 电话号码
    const phoneRegex = /(?:\+86)?[\s-]?1[3-9]\d{9}|\(\d{3}\)\s?\d{3}-\d{4}/g
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'PHONE',
        confidence: 0.85,
        start: match.index,
        end: match.index + match[0].length
      })
    }
    
    return entities
  }

  private normalizeChineseTime(timeExpr: string): string {
    const today = new Date()
    
    switch (timeExpr) {
      case '今天':
        return today.toISOString().split('T')[0]
      case '明天':
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      case '后天':
        const dayAfterTomorrow = new Date(today)
        dayAfterTomorrow.setDate(today.getDate() + 2)
        return dayAfterTomorrow.toISOString().split('T')[0]
      default:
        return timeExpr // 保持原样
    }
  }

  private deduplicateTasks(tasks: EnhancedTaskItem[]): EnhancedTaskItem[] {
    const unique: EnhancedTaskItem[] = []
    const seen = new Set<string>()
    
    for (const task of tasks) {
      const key = task.description.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(task)
      }
    }
    
    return unique.sort((a, b) => b.confidence - a.confidence)
  }
}
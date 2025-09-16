/**
 * 語音識別管理器
 * 基於Web Speech API實現語音命令識別和計時器控制
 */

// 語音識別結果類型
export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives: {
    transcript: string
    confidence: number
  }[]
}

// 語音命令類型
export interface VoiceCommand {
  command: string
  action: string
  parameters?: Record<string, any>
  confidence: number
  timestamp: number
}

// 語音識別配置
interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  grammars?: string[]
}

// 語音命令模式
interface CommandPattern {
  pattern: RegExp
  action: string
  parameters?: (matches: RegExpMatchArray) => Record<string, any>
  priority: number
  description: string
}

class SpeechRecognitionManager {
  private recognition: any = null
  private isSupported: boolean = false
  private isListening: boolean = false
  private config: SpeechRecognitionConfig
  private commandPatterns: CommandPattern[] = []
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map()
  
  // 默認配置
  private defaultConfig: SpeechRecognitionConfig = {
    language: 'zh-TW',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3
  }

  constructor(config?: Partial<SpeechRecognitionConfig>) {
    this.config = { ...this.defaultConfig, ...config }
    this.initializeSpeechRecognition()
    this.setupCommandPatterns()
  }

  /**
   * 初始化語音識別
   */
  private initializeSpeechRecognition(): void {
    // 檢查瀏覽器支持
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition ||
                             (window as any).mozSpeechRecognition ||
                             (window as any).msSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser')
      this.isSupported = false
      return
    }

    this.isSupported = true
    this.recognition = new SpeechRecognition()
    
    // 配置識別器
    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // 設置事件監聽器
    this.setupRecognitionEventListeners()
    
    console.log('Speech Recognition initialized successfully')
  }

  /**
   * 設置識別器事件監聽器
   */
  private setupRecognitionEventListeners(): void {
    if (!this.recognition) return

    // 開始識別
    this.recognition.onstart = () => {
      this.isListening = true
      this.emit('start', { timestamp: Date.now() })
    }

    // 識別結束
    this.recognition.onend = () => {
      this.isListening = false
      this.emit('end', { timestamp: Date.now() })
    }

    // 識別結果
    this.recognition.onresult = (event: any) => {
      const results: SpeechRecognitionResult[] = []
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const alternatives = []
        
        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence
          })
        }

        const recognitionResult: SpeechRecognitionResult = {
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives
        }

        results.push(recognitionResult)

        // 如果是最終結果，處理語音命令
        if (result.isFinal) {
          this.processVoiceCommand(recognitionResult)
        }
      }

      this.emit('result', { results, timestamp: Date.now() })
    }

    // 識別錯誤
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      this.emit('error', { 
        error: event.error, 
        message: this.getErrorMessage(event.error),
        timestamp: Date.now() 
      })
    }

    // 無聲音檢測
    this.recognition.onnomatch = () => {
      this.emit('nomatch', { timestamp: Date.now() })
    }

    // 音頻開始
    this.recognition.onaudiostart = () => {
      this.emit('audiostart', { timestamp: Date.now() })
    }

    // 音頻結束
    this.recognition.onaudioend = () => {
      this.emit('audioend', { timestamp: Date.now() })
    }
  }

  /**
   * 設置語音命令模式
   */
  private setupCommandPatterns(): void {
    this.commandPatterns = [
      // 計時器控制命令
      {
        pattern: /^(開始|啟動|start)\s*(計時|timer)?$/i,
        action: 'start_timer',
        priority: 10,
        description: '開始計時器'
      },
      {
        pattern: /^(停止|結束|stop)\s*(計時|timer)?$/i,
        action: 'stop_timer',
        priority: 10,
        description: '停止計時器'
      },
      {
        pattern: /^(暫停|pause)\s*(計時|timer)?$/i,
        action: 'pause_timer',
        priority: 10,
        description: '暫停計時器'
      },
      {
        pattern: /^(重新開始|restart|重啟)\s*(計時|timer)?$/i,
        action: 'restart_timer',
        priority: 10,
        description: '重新開始計時器'
      },

      // 時間設置命令
      {
        pattern: /^(設置|set)\s*(\d+)\s*(秒|second|seconds)$/i,
        action: 'set_duration',
        parameters: (matches) => ({ duration: parseInt(matches[2]) }),
        priority: 9,
        description: '設置計時時長（秒）'
      },
      {
        pattern: /^(設置|set)\s*(\d+)\s*(分鐘|minute|minutes)$/i,
        action: 'set_duration',
        parameters: (matches) => ({ duration: parseInt(matches[2]) * 60 }),
        priority: 9,
        description: '設置計時時長（分鐘）'
      },
      {
        pattern: /^(\d+)\s*(秒|second|seconds)\s*(計時|timer)?$/i,
        action: 'set_duration',
        parameters: (matches) => ({ duration: parseInt(matches[1]) }),
        priority: 8,
        description: '快速設置時長（秒）'
      },

      // 語音提醒控制
      {
        pattern: /^(開啟|啟用|enable)\s*(語音|voice)\s*(提醒|reminder)?$/i,
        action: 'enable_voice',
        priority: 7,
        description: '開啟語音提醒'
      },
      {
        pattern: /^(關閉|停用|disable)\s*(語音|voice)\s*(提醒|reminder)?$/i,
        action: 'disable_voice',
        priority: 7,
        description: '關閉語音提醒'
      },

      // 音量控制
      {
        pattern: /^(音量|volume)\s*(大|高|loud|high)$/i,
        action: 'volume_up',
        priority: 6,
        description: '增加音量'
      },
      {
        pattern: /^(音量|volume)\s*(小|低|quiet|low)$/i,
        action: 'volume_down',
        priority: 6,
        description: '降低音量'
      },

      // 應用控制
      {
        pattern: /^(幫助|help|說明)$/i,
        action: 'show_help',
        priority: 5,
        description: '顯示幫助信息'
      },
      {
        pattern: /^(清除|清空|clear)\s*(歷史|history)?$/i,
        action: 'clear_history',
        priority: 5,
        description: '清除歷史記錄'
      },

      // 通用確認和取消
      {
        pattern: /^(確認|確定|ok|yes|好)$/i,
        action: 'confirm',
        priority: 4,
        description: '確認操作'
      },
      {
        pattern: /^(取消|cancel|no|不)$/i,
        action: 'cancel',
        priority: 4,
        description: '取消操作'
      }
    ]

    // 按優先級排序
    this.commandPatterns.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 處理語音命令
   */
  private processVoiceCommand(result: SpeechRecognitionResult): void {
    const transcript = result.transcript.trim()
    let bestMatch: VoiceCommand | null = null

    // 遍歷所有命令模式
    for (const pattern of this.commandPatterns) {
      const matches = transcript.match(pattern.pattern)
      if (matches) {
        const command: VoiceCommand = {
          command: transcript,
          action: pattern.action,
          parameters: pattern.parameters ? pattern.parameters(matches) : {},
          confidence: result.confidence,
          timestamp: Date.now()
        }

        // 選擇最佳匹配（優先級高且信心度高）
        if (!bestMatch || 
            pattern.priority > this.getPatternPriority(bestMatch.action) ||
            (pattern.priority === this.getPatternPriority(bestMatch.action) && 
             result.confidence > bestMatch.confidence)) {
          bestMatch = command
        }
      }
    }

    if (bestMatch) {
      this.emit('command', bestMatch)
      console.log('Voice command recognized:', bestMatch)
    } else {
      this.emit('unrecognized', { 
        transcript, 
        confidence: result.confidence,
        timestamp: Date.now() 
      })
    }
  }

  /**
   * 獲取模式優先級
   */
  private getPatternPriority(action: string): number {
    const pattern = this.commandPatterns.find(p => p.action === action)
    return pattern ? pattern.priority : 0
  }

  /**
   * 獲取錯誤消息
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'network': '網絡連接錯誤，請檢查網絡設置',
      'not-allowed': '麥克風權限被拒絕，請允許麥克風訪問',
      'service-not-allowed': '語音識別服務不可用',
      'bad-grammar': '語法錯誤',
      'language-not-supported': '不支持的語言設置',
      'no-speech': '未檢測到語音輸入',
      'audio-capture': '音頻捕獲失敗，請檢查麥克風',
      'aborted': '語音識別被中止'
    }

    return errorMessages[error] || `語音識別錯誤: ${error}`
  }

  /**
   * 開始語音識別
   */
  async startListening(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('語音識別不支持')
    }

    if (this.isListening) {
      console.warn('Speech recognition is already active')
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      throw new Error('啟動語音識別失敗')
    }
  }

  /**
   * 停止語音識別
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
    }
  }

  /**
   * 中止語音識別
   */
  abortListening(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.abort()
    } catch (error) {
      console.error('Failed to abort speech recognition:', error)
    }
  }

  /**
   * 添加自定義命令模式
   */
  addCommandPattern(pattern: CommandPattern): void {
    this.commandPatterns.push(pattern)
    this.commandPatterns.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 移除命令模式
   */
  removeCommandPattern(action: string): void {
    this.commandPatterns = this.commandPatterns.filter(p => p.action !== action)
  }

  /**
   * 獲取所有命令模式
   */
  getCommandPatterns(): CommandPattern[] {
    return [...this.commandPatterns]
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (this.recognition) {
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.maxAlternatives = this.config.maxAlternatives
    }
  }

  /**
   * 檢查語音識別支持
   */
  isRecognitionSupported(): boolean {
    return this.isSupported
  }

  /**
   * 檢查是否正在監聽
   */
  isCurrentlyListening(): boolean {
    return this.isListening
  }

  /**
   * 獲取當前配置
   */
  getConfig(): SpeechRecognitionConfig {
    return { ...this.config }
  }

  /**
   * 添加事件監聽器
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  /**
   * 移除事件監聽器
   */
  removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 觸發事件
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * 獲取語音識別狀態信息
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      language: this.config.language,
      commandPatternsCount: this.commandPatterns.length,
      eventListenersCount: Array.from(this.eventListeners.values()).reduce((total, listeners) => total + listeners.length, 0)
    }
  }

  /**
   * 測試語音識別功能
   */
  async testRecognition(): Promise<{
    supported: boolean
    permissions: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let supported = this.isSupported
    let permissions = false

    if (!supported) {
      errors.push('瀏覽器不支持語音識別API')
      return { supported, permissions, errors }
    }

    try {
      // 測試麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      permissions = true
      stream.getTracks().forEach(track => track.stop()) // 停止音頻流
    } catch (error) {
      permissions = false
      if (error instanceof Error) {
        errors.push(`麥克風權限錯誤: ${error.message}`)
      } else {
        errors.push('無法訪問麥克風')
      }
    }

    return { supported, permissions, errors }
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    if (this.isListening) {
      this.abortListening()
    }
    
    this.eventListeners.clear()
    this.recognition = null
    
    console.log('Speech Recognition Manager cleaned up')
  }
}

// 導出單例
export const speechRecognitionManager = new SpeechRecognitionManager()

// 導出類型
export type {
  SpeechRecognitionConfig,
  CommandPattern,
}



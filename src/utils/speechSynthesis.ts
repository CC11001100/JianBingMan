/**
 * 语音合成模块
 * 使用Web Speech API实现语音提醒功能
 * 支持自定义提示语的预生成和缓存
 */

interface VoiceSettings {
  volume: number // 0-1
  rate: number // 0.1-10
  pitch: number // 0-2
  lang: string
  voiceURI?: string
}

interface CachedAudio {
  text: string
  audioBlob: Blob
  settings: VoiceSettings
  createdAt: number
}

class SpeechSynthesisManager {
  private audioCache = new Map<string, CachedAudio>()
  private defaultSettings: VoiceSettings = {
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    lang: 'zh-CN'
  }

  private isSupported = false
  private availableVoices: SpeechSynthesisVoice[] = []

  constructor() {
    this.init()
  }

  /**
   * 初始化语音合成
   */
  private init(): void {
    this.isSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

    if (this.isSupported) {
      // 等待语音列表加载
      this.loadVoices()
      
      // 监听语音列表变化（某些浏览器需要）
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          this.loadVoices()
        }
      }
    }
  }

  /**
   * 加载可用语音列表
   */
  private loadVoices(): void {
    this.availableVoices = speechSynthesis.getVoices()
    
    // 优先选择中文语音
    const chineseVoice = this.availableVoices.find(voice => 
      voice.lang.includes('zh') || voice.lang.includes('cmn')
    )
    
    if (chineseVoice) {
      this.defaultSettings.voiceURI = chineseVoice.voiceURI
    }
  }

  /**
   * 获取可用的中文语音列表
   */
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('cmn') ||
      voice.name.includes('Chinese') ||
      voice.name.includes('中文')
    )
  }

  /**
   * 检查是否支持语音合成
   */
  isSupported_(): boolean {
    return this.isSupported
  }

  /**
   * 直接播放语音（不缓存）
   */
  async speak(text: string, settings?: Partial<VoiceSettings>): Promise<void> {
    if (!this.isSupported) {
      console.warn('Speech synthesis not supported')
      return
    }

    const finalSettings = { ...this.defaultSettings, ...settings }

    return new Promise((resolve, reject) => {
      // 停止当前播放的语音
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置语音参数
      utterance.volume = finalSettings.volume
      utterance.rate = finalSettings.rate
      utterance.pitch = finalSettings.pitch
      utterance.lang = finalSettings.lang

      // 选择语音
      if (finalSettings.voiceURI) {
        const voice = this.availableVoices.find(v => v.voiceURI === finalSettings.voiceURI)
        if (voice) {
          utterance.voice = voice
        }
      }

      // 事件监听
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      // 播放语音
      speechSynthesis.speak(utterance)
    })
  }

  /**
   * 预生成并缓存语音
   * 注意：Web Speech API 不能直接生成音频文件，这里使用替代方案
   */
  async preGenerateAudio(text: string, settings?: Partial<VoiceSettings>): Promise<string> {
    const finalSettings = { ...this.defaultSettings, ...settings }
    const cacheKey = this.getCacheKey(text, finalSettings)

    // 检查缓存
    if (this.audioCache.has(cacheKey)) {
      const cached = this.audioCache.get(cacheKey)!
      
      // 检查缓存是否过期（24小时）
      if (Date.now() - cached.createdAt < 24 * 60 * 60 * 1000) {
        return cacheKey
      } else {
        this.audioCache.delete(cacheKey)
      }
    }

    // 由于Web Speech API限制，我们无法预生成真实的音频文件
    // 这里保存设置信息，实际播放时使用speak方法
    const cachedAudio: CachedAudio = {
      text,
      audioBlob: new Blob(), // 空blob，实际使用speak方法
      settings: finalSettings,
      createdAt: Date.now()
    }

    this.audioCache.set(cacheKey, cachedAudio)
    return cacheKey
  }

  /**
   * 播放缓存的语音
   */
  async playCachedAudio(cacheKey: string): Promise<void> {
    const cached = this.audioCache.get(cacheKey)
    
    if (!cached) {
      throw new Error('Cached audio not found')
    }

    // 检查缓存是否过期
    if (Date.now() - cached.createdAt >= 24 * 60 * 60 * 1000) {
      this.audioCache.delete(cacheKey)
      throw new Error('Cached audio expired')
    }

    // 使用speak方法播放
    await this.speak(cached.text, cached.settings)
  }

  /**
   * 快速语音提醒（用于计时器）
   */
  async quickAlert(text: string, volume = 0.8): Promise<void> {
    try {
      await this.speak(text, { 
        volume, 
        rate: 1.2, // 稍快一点
        pitch: 1.1 // 稍高一点，更醒目
      })
    } catch (error) {
      console.error('Quick alert failed:', error)
      
      // 语音失败时的备用方案：使用系统提示音 + 振动
      this.fallbackAlert()
    }
  }

  /**
   * 备用提醒方案（振动 + 系统提示）
   */
  private fallbackAlert(): void {
    // 振动提醒（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300])
    }

    // 系统提示音（通过创建短暂的音频上下文）
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('Fallback audio alert failed:', error)
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(text: string, settings: VoiceSettings): string {
    const key = `${text}_${settings.volume}_${settings.rate}_${settings.pitch}_${settings.lang}_${settings.voiceURI || ''}`
    return btoa(encodeURIComponent(key)).replace(/[+/=]/g, '_')
  }

  /**
   * 清理过期缓存
   */
  cleanupCache(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    for (const [key, cached] of this.audioCache.entries()) {
      if (now - cached.createdAt > maxAge) {
        this.audioCache.delete(key)
      }
    }
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.audioCache.size
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.audioCache.clear()
  }

  /**
   * 测试语音功能
   */
  async testSpeech(): Promise<boolean> {
    try {
      await this.speak('测试语音功能', { volume: 0.5 })
      return true
    } catch (error) {
      console.error('Speech test failed:', error)
      return false
    }
  }
}

// 导出单例
export const speechManager = new SpeechSynthesisManager()
export type { VoiceSettings }

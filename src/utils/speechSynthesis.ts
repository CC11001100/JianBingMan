/**
 * 语音合成模块
 * 使用Web Speech API实现语音提醒功能
 * 支持自定义提示语的预生成和缓存
 * 支持用户录制的自定义语音
 */

import { storageManager } from './storage'

interface VoiceSettings {
  volume: number // 0-1
  rate: number // 0.1-10
  pitch: number // 0-2
  lang: string
  voiceURI?: string
  customVoiceId?: string // 自定义语音ID
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
  private isSpeaking = false // 添加语音播放状态标志
  private currentAudio: HTMLAudioElement | null = null // 当前播放的音频元素

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
   * 根据语音类型选择最合适的声音
   */
  selectVoiceByType(voiceType: 'male' | 'female' | 'auto'): SpeechSynthesisVoice | null {
    const chineseVoices = this.getChineseVoices()
    
    if (chineseVoices.length === 0) {
      return null
    }

    if (voiceType === 'auto') {
      // 自动选择第一个可用的中文语音
      return chineseVoices[0]
    }

    // 尝试根据名称判断性别
    const isFemaleVoice = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase()
      return name.includes('female') || 
             name.includes('woman') || 
             name.includes('xiaoxiao') ||
             name.includes('xiaoyi') ||
             name.includes('xiaoyou') ||
             name.includes('沁文') ||
             name.includes('小雅') ||
             name.includes('小艺')
    }

    const isMaleVoice = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase()
      return name.includes('male') || 
             name.includes('man') ||
             name.includes('xiaoming') ||
             name.includes('kangkang') ||
             name.includes('小明') ||
             name.includes('康康')
    }

    if (voiceType === 'female') {
      const femaleVoice = chineseVoices.find(isFemaleVoice)
      return femaleVoice || chineseVoices[0]
    }

    if (voiceType === 'male') {
      const maleVoice = chineseVoices.find(isMaleVoice)
      return maleVoice || chineseVoices[0]
    }

    return chineseVoices[0]
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

    // 防止重复播放：如果当前正在播放，直接返回
    if (this.isSpeaking) {
      console.log('Speech already playing, skipping duplicate request')
      return
    }

    const finalSettings = { ...this.defaultSettings, ...settings }

    // 如果指定了自定义语音ID，使用自定义语音
    if (finalSettings.customVoiceId) {
      return this.playCustomVoice(finalSettings.customVoiceId, finalSettings.volume)
    }

    // 标记正在播放
    this.isSpeaking = true

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
      utterance.onend = () => {
        this.isSpeaking = false // 播放完成，重置状态
        resolve()
      }
      utterance.onerror = (event) => {
        this.isSpeaking = false // 播放出错，重置状态
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      // 播放语音
      speechSynthesis.speak(utterance)
    })
  }

  /**
   * 播放自定义录制的语音
   */
  async playCustomVoice(voiceId: string, volume = 0.8): Promise<void> {
    // 防止重复播放：如果当前正在播放，直接返回
    if (this.isSpeaking || this.currentAudio) {
      console.log('Audio already playing, skipping duplicate request')
      return
    }

    try {
      // 从IndexedDB获取自定义语音
      const voiceRecord = await storageManager.getCustomVoice(voiceId)
      
      if (!voiceRecord) {
        throw new Error('自定义语音不存在')
      }

      // 停止当前播放的语音
      speechSynthesis.cancel()
      if (this.currentAudio) {
        (this.currentAudio as HTMLAudioElement).pause()
        this.currentAudio = null
      }

      // 标记正在播放
      this.isSpeaking = true

      // 播放自定义语音文件
      await this.playAudioBlob(voiceRecord.audioBlob, volume)

      // 更新最后使用时间
      await storageManager.updateVoiceLastUsed(voiceId)
    } catch (error) {
      console.error('Failed to play custom voice:', error)
      this.isSpeaking = false // 出错时重置状态
      throw error
    }
  }

  /**
   * 播放音频Blob
   */
  private async playAudioBlob(audioBlob: Blob, volume = 0.8): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        
        // 保存当前音频引用
        this.currentAudio = audio
        
        audio.volume = Math.max(0, Math.min(1, volume))
        
        audio.onended = () => {
          URL.revokeObjectURL(url)
          this.currentAudio = null
          this.isSpeaking = false // 播放完成，重置状态
          resolve()
        }
        
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          this.currentAudio = null
          this.isSpeaking = false // 播放出错，重置状态
          reject(new Error('播放自定义语音失败'))
        }
        
        audio.play().catch((error) => {
          URL.revokeObjectURL(url)
          this.currentAudio = null
          this.isSpeaking = false // 播放出错，重置状态
          reject(error)
        })
      } catch (error) {
        this.isSpeaking = false // 出错时重置状态
        reject(error)
      }
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
   * 使用增强设置播放语音
   */
  async speakWithEnhancedSettings(
    text: string, 
    volume: number, 
    rate: number, 
    pitch: number,
    voiceType: 'male' | 'female' | 'auto'
  ): Promise<void> {
    if (!this.isSupported) {
      console.warn('Speech synthesis not supported')
      return
    }

    // 防止重复播放：如果当前正在播放，直接返回
    if (this.isSpeaking) {
      console.log('Speech already playing, skipping duplicate request')
      return
    }

    // 标记正在播放
    this.isSpeaking = true

    return new Promise((resolve, reject) => {
      // 停止当前播放的语音
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置基本语音参数
      utterance.volume = Math.max(0, Math.min(1, volume))
      utterance.rate = Math.max(0.1, Math.min(10, rate))
      utterance.pitch = Math.max(0, Math.min(2, pitch))
      utterance.lang = 'zh-CN'

      // 选择合适的语音
      const selectedVoice = this.selectVoiceByType(voiceType)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      // 事件监听
      utterance.onend = () => {
        this.isSpeaking = false // 播放完成，重置状态
        resolve()
      }
      utterance.onerror = (event) => {
        this.isSpeaking = false // 播放出错，重置状态
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      // 播放语音
      speechSynthesis.speak(utterance)
    })
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
   * 获取预设的语音风格
   */
  getVoiceStyles(): Array<{
    id: string
    name: string
    description: string
    settings: Partial<VoiceSettings>
  }> {
    return [
      {
        id: 'normal',
        name: '标准语音',
        description: '适合日常使用的标准设置',
        settings: { rate: 1.0, pitch: 1.0, volume: 0.8 }
      },
      {
        id: 'gentle',
        name: '温和语音',
        description: '温柔缓慢的语调，适合放松时使用',
        settings: { rate: 0.8, pitch: 0.9, volume: 0.7 }
      },
      {
        id: 'urgent',
        name: '紧急提醒',
        description: '快速高调的语音，适合紧急提醒',
        settings: { rate: 1.3, pitch: 1.2, volume: 0.9 }
      },
      {
        id: 'professional',
        name: '专业播报',
        description: '清晰标准的播报声，适合正式场合',
        settings: { rate: 1.1, pitch: 1.0, volume: 0.8 }
      },
      {
        id: 'cheerful',
        name: '活泼语音',
        description: '轻快活泼的语调，充满活力',
        settings: { rate: 1.2, pitch: 1.1, volume: 0.8 }
      },
      {
        id: 'calm',
        name: '冷静语音',
        description: '低沉稳重的语调，让人安心',
        settings: { rate: 0.9, pitch: 0.8, volume: 0.7 }
      }
    ]
  }

  /**
   * 使用预设风格播放语音
   */
  async speakWithStyle(
    text: string,
    styleId: string,
    voiceType: 'male' | 'female' | 'auto' = 'auto'
  ): Promise<void> {
    const styles = this.getVoiceStyles()
    const style = styles.find(s => s.id === styleId)
    
    if (!style) {
      throw new Error(`Unknown voice style: ${styleId}`)
    }

    return new Promise((resolve, reject) => {
      // 停止当前播放的语音
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 应用风格设置
      const settings = { ...this.defaultSettings, ...style.settings }
      utterance.volume = Math.max(0, Math.min(1, settings.volume || 0.8))
      utterance.rate = Math.max(0.1, Math.min(10, settings.rate || 1.0))
      utterance.pitch = Math.max(0, Math.min(2, settings.pitch || 1.0))
      utterance.lang = 'zh-CN'

      // 选择合适的语音
      const selectedVoice = this.selectVoiceByType(voiceType)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      // 事件监听
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      // 播放语音
      speechSynthesis.speak(utterance)
    })
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

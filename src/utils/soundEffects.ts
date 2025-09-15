/**
 * 音效管理模块
 * 使用Web Audio API生成各种提示音效
 */

type SoundEffectType = 'beep' | 'chime' | 'bell' | 'alarm'

interface SoundEffectOptions {
  volume?: number
  duration?: number
}

class SoundEffectsManager {
  private audioContext: AudioContext | null = null
  private isSupported = false

  constructor() {
    this.init()
  }

  /**
   * 初始化音效系统
   */
  private init(): void {
    try {
      // 创建音频上下文（需要用户交互才能启动）
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isSupported = true
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      this.isSupported = false
    }
  }

  /**
   * 检查是否支持音效
   */
  isSupported_(): boolean {
    return this.isSupported && this.audioContext !== null
  }

  /**
   * 确保音频上下文处于运行状态
   */
  private async ensureAudioContext(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not available')
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * 播放指定类型的音效
   */
  async playEffect(type: SoundEffectType, options: SoundEffectOptions = {}): Promise<void> {
    if (!this.isSupported_()) {
      console.warn('Sound effects not supported')
      return
    }

    try {
      await this.ensureAudioContext()

      const { volume = 0.3, duration = 0.5 } = options

      switch (type) {
        case 'beep':
          await this.playBeep(volume, duration)
          break
        case 'chime':
          await this.playChime(volume, duration)
          break
        case 'bell':
          await this.playBell(volume, duration)
          break
        case 'alarm':
          await this.playAlarm(volume, duration)
          break
        default:
          throw new Error(`Unknown sound effect type: ${type}`)
      }
    } catch (error) {
      console.error('Failed to play sound effect:', error)
    }
  }

  /**
   * 播放简单哔哔声
   */
  private async playBeep(volume: number, duration: number): Promise<void> {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)

    return new Promise(resolve => {
      oscillator.onended = () => resolve()
    })
  }

  /**
   * 播放优美的钟声
   */
  private async playChime(volume: number, duration: number): Promise<void> {
    if (!this.audioContext) return

    // 创建和弦效果（多个音符同时播放）
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
    const oscillators: OscillatorNode[] = []
    const gainNodes: GainNode[] = []

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator()
      const gainNode = this.audioContext!.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext!.destination)

      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime)
      oscillator.type = 'sine'

      const noteVolume = volume * (1 - index * 0.2) // 递减音量
      gainNode.gain.setValueAtTime(noteVolume, this.audioContext!.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration)

      oscillator.start(this.audioContext!.currentTime + index * 0.1)
      oscillator.stop(this.audioContext!.currentTime + duration)

      oscillators.push(oscillator)
      gainNodes.push(gainNode)
    })

    return new Promise(resolve => {
      oscillators[oscillators.length - 1].onended = () => resolve()
    })
  }

  /**
   * 播放铃声效果
   */
  private async playBell(volume: number, duration: number): Promise<void> {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 铃声特征：高频率，带有颤音效果
    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    oscillator.type = 'triangle'

    // 添加颤音效果
    const vibrato = this.audioContext.createOscillator()
    const vibratoGain = this.audioContext.createGain()
    vibratoGain.gain.setValueAtTime(20, this.audioContext.currentTime)
    vibrato.frequency.setValueAtTime(6, this.audioContext.currentTime)
    vibrato.connect(vibratoGain)
    vibratoGain.connect(oscillator.frequency)

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    vibrato.start(this.audioContext.currentTime)
    oscillator.start(this.audioContext.currentTime)
    
    vibrato.stop(this.audioContext.currentTime + duration)
    oscillator.stop(this.audioContext.currentTime + duration)

    return new Promise(resolve => {
      oscillator.onended = () => resolve()
    })
  }

  /**
   * 播放警报声
   */
  private async playAlarm(volume: number, duration: number): Promise<void> {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.type = 'sawtooth'

    // 警报声特征：频率快速变化
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime)
    oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + duration / 4)
    oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + duration / 2)
    oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + duration * 3 / 4)
    oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + duration)

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)

    return new Promise(resolve => {
      oscillator.onended = () => resolve()
    })
  }

  /**
   * 测试音效
   */
  async testEffect(type: SoundEffectType): Promise<boolean> {
    try {
      await this.playEffect(type, { volume: 0.3, duration: 0.5 })
      return true
    } catch (error) {
      console.error('Sound effect test failed:', error)
      return false
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // 关闭音频上下文会停止所有正在播放的音频
      // 但这里我们不关闭，因为可能还需要继续使用
      // 在实际应用中，可以维护一个活跃的音频节点列表进行管理
    }
  }

  /**
   * 获取音效类型的显示名称
   */
  getEffectName(type: SoundEffectType): string {
    const names = {
      beep: '哔哔声',
      chime: '钟声',
      bell: '铃声',
      alarm: '警报'
    }
    return names[type] || type
  }

  /**
   * 获取所有可用的音效类型
   */
  getAvailableEffects(): Array<{ type: SoundEffectType; name: string; description: string }> {
    return [
      { type: 'beep', name: '哔哔声', description: '简单的电子提示音' },
      { type: 'chime', name: '钟声', description: '优美的和弦钟声' },
      { type: 'bell', name: '铃声', description: '带颤音的清脆铃声' },
      { type: 'alarm', name: '警报', description: '紧急的警报提示音' }
    ]
  }
}

// 导出单例
export const soundEffectsManager = new SoundEffectsManager()
export type { SoundEffectType, SoundEffectOptions }

/**
 * 語音兼容性測試模組
 * 驗證語音功能在不同瀏覽器和設備上的兼容性表現
 */

interface TestResult {
  success: boolean
  message: string
  details?: any
  error?: string
}

interface BrowserInfo {
  name: string
  version: string
  engine: string
  os: string
  isMobile: boolean
}

interface VoiceCompatibilityReport {
  browserInfo: BrowserInfo
  timestamp: number
  webSpeechApi: TestResult
  mediaRecorderApi: TestResult
  webAudioApi: TestResult
  audioPlayback: TestResult
  voicesList: TestResult
  languageSupport: TestResult
  errorHandling: TestResult
  fallbackMechanisms: TestResult
  mobileTouchSupport: TestResult
  overallCompatibility: 'excellent' | 'good' | 'limited' | 'poor'
  recommendations: string[]
}

class VoiceCompatibilityTester {
  private testResults: VoiceCompatibilityReport | null = null

  /**
   * 獲取瀏覽器信息
   */
  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'
    let engine = 'Unknown'
    
    // 檢測瀏覽器
    if (userAgent.includes('Chrome')) {
      name = 'Chrome'
      const match = userAgent.match(/Chrome\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Blink'
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox'
      const match = userAgent.match(/Firefox\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Gecko'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari'
      const match = userAgent.match(/Version\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'WebKit'
    } else if (userAgent.includes('Edge')) {
      name = 'Edge'
      const match = userAgent.match(/Edge\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'EdgeHTML'
    } else if (userAgent.includes('Edg')) {
      name = 'Edge (Chromium)'
      const match = userAgent.match(/Edg\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Blink'
    }

    // 檢測操作系統
    let os = 'Unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

    return { name, version, engine, os, isMobile }
  }

  /**
   * 測試 Web Speech API 支持
   */
  private async testWebSpeechApi(): Promise<TestResult> {
    try {
      const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
      
      if (!supported) {
        return {
          success: false,
          message: 'Web Speech API 不支持',
          details: {
            speechSynthesis: 'speechSynthesis' in window,
            speechSynthesisUtterance: 'SpeechSynthesisUtterance' in window
          }
        }
      }

      // 測試語音合成功能
      const utterance = new SpeechSynthesisUtterance('測試')
      utterance.volume = 0 // 靜音測試
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            message: 'Web Speech API 響應超時',
            error: '語音合成初始化超過5秒'
          })
        }, 5000)

        utterance.onstart = () => {
          clearTimeout(timeout)
          speechSynthesis.cancel() // 立即停止
          resolve({
            success: true,
            message: 'Web Speech API 完全支持',
            details: {
              voicesCount: speechSynthesis.getVoices().length,
              speaking: speechSynthesis.speaking,
              pending: speechSynthesis.pending,
              paused: speechSynthesis.paused
            }
          })
        }

        utterance.onerror = (event) => {
          clearTimeout(timeout)
          resolve({
            success: false,
            message: 'Web Speech API 錯誤',
            error: event.error
          })
        }

        speechSynthesis.speak(utterance)
      })
    } catch (error) {
      return {
        success: false,
        message: 'Web Speech API 測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試 MediaRecorder API 支持
   */
  private async testMediaRecorderApi(): Promise<TestResult> {
    try {
      const supported = 'MediaRecorder' in window && 'mediaDevices' in navigator

      if (!supported) {
        return {
          success: false,
          message: 'MediaRecorder API 不支持',
          details: {
            mediaRecorder: 'MediaRecorder' in window,
            mediaDevices: 'mediaDevices' in navigator,
            getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices
          }
        }
      }

      // 檢測支持的 MIME 類型
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/wav'
      ].filter(type => MediaRecorder.isTypeSupported(type))

      if (supportedTypes.length === 0) {
        return {
          success: false,
          message: 'MediaRecorder API 不支持任何音頻格式',
          details: { supportedTypes }
        }
      }

      return {
        success: true,
        message: 'MediaRecorder API 完全支持',
        details: {
          supportedTypes,
          preferredType: supportedTypes[0]
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'MediaRecorder API 測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試 Web Audio API 支持
   */
  private async testWebAudioApi(): Promise<TestResult> {
    try {
      const supported = 'AudioContext' in window || 'webkitAudioContext' in window

      if (!supported) {
        return {
          success: false,
          message: 'Web Audio API 不支持'
        }
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()

      // 測試基本音頻功能
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      gainNode.gain.value = 0 // 靜音測試
      oscillator.frequency.value = 440
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)

      await audioContext.close()

      return {
        success: true,
        message: 'Web Audio API 完全支持',
        details: {
          sampleRate: audioContext.sampleRate,
          state: audioContext.state,
          maxChannelCount: audioContext.destination.maxChannelCount
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Web Audio API 測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試音頻播放功能
   */
  private async testAudioPlayback(): Promise<TestResult> {
    try {
      const audio = new Audio()
      
      // 測試音頻格式支持
      const supportedFormats = {
        mp3: audio.canPlayType('audio/mpeg'),
        wav: audio.canPlayType('audio/wav'),
        ogg: audio.canPlayType('audio/ogg'),
        webm: audio.canPlayType('audio/webm'),
        aac: audio.canPlayType('audio/aac')
      }

      const anySupportedFormat = Object.values(supportedFormats).some(support => support !== '')

      if (!anySupportedFormat) {
        return {
          success: false,
          message: '不支持任何音頻格式',
          details: supportedFormats
        }
      }

      // 測試音頻控制
      const controlsSupported = {
        volume: 'volume' in audio,
        playbackRate: 'playbackRate' in audio,
        currentTime: 'currentTime' in audio,
        duration: 'duration' in audio
      }

      return {
        success: true,
        message: '音頻播放功能完全支持',
        details: {
          supportedFormats,
          controlsSupported,
          autoplay: 'autoplay' in audio
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '音頻播放測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試語音列表和語言支持
   */
  private async testVoicesAndLanguage(): Promise<TestResult> {
    try {
      if (!('speechSynthesis' in window)) {
        return {
          success: false,
          message: '無法測試語音列表：Speech Synthesis 不支持'
        }
      }

      const voices = speechSynthesis.getVoices()
      
      // 等待語音列表加載（某些瀏覽器需要異步加載）
      if (voices.length === 0) {
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 2000) // 2秒超時
          speechSynthesis.onvoiceschanged = () => {
            clearTimeout(timeout)
            resolve(undefined)
          }
        })
      }

      const updatedVoices = speechSynthesis.getVoices()
      
      // 分析語音支持
      const chineseVoices = updatedVoices.filter(voice => 
        voice.lang.includes('zh') || 
        voice.lang.includes('cmn') ||
        voice.name.includes('Chinese') ||
        voice.name.includes('中文')
      )

      const languageSupport = {
        totalVoices: updatedVoices.length,
        chineseVoices: chineseVoices.length,
        languages: [...new Set(updatedVoices.map(v => v.lang))],
        localVoices: updatedVoices.filter(v => v.localService).length,
        remoteVoices: updatedVoices.filter(v => !v.localService).length
      }

      if (updatedVoices.length === 0) {
        return {
          success: false,
          message: '沒有可用的語音',
          details: languageSupport
        }
      }

      return {
        success: true,
        message: `找到 ${updatedVoices.length} 個語音，其中 ${chineseVoices.length} 個中文語音`,
        details: languageSupport
      }
    } catch (error) {
      return {
        success: false,
        message: '語音列表測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試錯誤處理機制
   */
  private async testErrorHandling(): Promise<TestResult> {
    try {
      const errorTests = []

      // 測試語音合成錯誤處理
      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance('')
          utterance.volume = -1 // 無效值
          speechSynthesis.speak(utterance)
          errorTests.push({ test: '語音合成錯誤處理', result: '通過' })
        } catch (error) {
          errorTests.push({ test: '語音合成錯誤處理', result: '通過（捕獲錯誤）' })
        }
      }

      // 測試音頻錯誤處理
      try {
        const audio = new Audio('invalid-url')
        audio.volume = 2 // 無效值，應該被限制在 0-1
        errorTests.push({ 
          test: '音頻錯誤處理', 
          result: audio.volume <= 1 ? '通過' : '失敗' 
        })
      } catch (error) {
        errorTests.push({ test: '音頻錯誤處理', result: '通過（捕獲錯誤）' })
      }

      return {
        success: true,
        message: '錯誤處理機制測試完成',
        details: errorTests
      }
    } catch (error) {
      return {
        success: false,
        message: '錯誤處理測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試備用機制
   */
  private async testFallbackMechanisms(): Promise<TestResult> {
    try {
      const fallbackTests = []

      // 振動支持
      const vibrationSupported = 'vibrate' in navigator
      fallbackTests.push({
        mechanism: '振動提醒',
        supported: vibrationSupported,
        description: vibrationSupported ? '支持振動API' : '不支持振動API'
      })

      // 桌面通知支持
      const notificationSupported = 'Notification' in window
      fallbackTests.push({
        mechanism: '桌面通知',
        supported: notificationSupported,
        description: notificationSupported ? '支持桌面通知' : '不支持桌面通知'
      })

      // 頁面可見性 API
      const visibilitySupported = 'visibilityState' in document
      fallbackTests.push({
        mechanism: '頁面可見性檢測',
        supported: visibilitySupported,
        description: visibilitySupported ? '支持頁面可見性API' : '不支持頁面可見性API'
      })

      // Wake Lock API
      const wakeLockSupported = 'wakeLock' in navigator
      fallbackTests.push({
        mechanism: '屏幕常亮',
        supported: wakeLockSupported,
        description: wakeLockSupported ? '支持Wake Lock API' : '不支持Wake Lock API'
      })

      const supportedCount = fallbackTests.filter(test => test.supported).length

      return {
        success: supportedCount > 0,
        message: `${supportedCount}/${fallbackTests.length} 個備用機制可用`,
        details: fallbackTests
      }
    } catch (error) {
      return {
        success: false,
        message: '備用機制測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 測試移動端觸摸支持
   */
  private async testMobileTouchSupport(): Promise<TestResult> {
    try {
      const touchTests = []

      // 觸摸事件支持
      const touchSupported = 'ontouchstart' in window
      touchTests.push({
        feature: '觸摸事件',
        supported: touchSupported,
        description: touchSupported ? '支持觸摸事件' : '不支持觸摸事件'
      })

      // 設備方向支持
      const orientationSupported = 'orientation' in window || 'onorientationchange' in window
      touchTests.push({
        feature: '設備方向',
        supported: orientationSupported,
        description: orientationSupported ? '支持設備方向檢測' : '不支持設備方向檢測'
      })

      // 視窗尺寸檢測
      const viewportSupported = 'innerWidth' in window && 'innerHeight' in window
      touchTests.push({
        feature: '視窗尺寸',
        supported: viewportSupported,
        description: viewportSupported ? '支持視窗尺寸檢測' : '不支持視窗尺寸檢測'
      })

      return {
        success: true,
        message: '移動端觸摸支持測試完成',
        details: touchTests
      }
    } catch (error) {
      return {
        success: false,
        message: '移動端觸摸支持測試失敗',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 評估整體兼容性
   */
  private evaluateOverallCompatibility(report: Partial<VoiceCompatibilityReport>): {
    rating: 'excellent' | 'good' | 'limited' | 'poor'
    recommendations: string[]
  } {
    const recommendations: string[] = []
    let score = 0

    // 核心功能評分
    if (report.webSpeechApi?.success) score += 30
    else recommendations.push('瀏覽器不支持Web Speech API，建議使用Chrome、Firefox或Safari最新版本')

    if (report.mediaRecorderApi?.success) score += 20
    else recommendations.push('瀏覽器不支持MediaRecorder API，無法錄製自定義語音')

    if (report.webAudioApi?.success) score += 20
    else recommendations.push('瀏覽器不支持Web Audio API，音效功能可能受限')

    if (report.audioPlayback?.success) score += 15
    else recommendations.push('音頻播放功能受限，建議檢查瀏覽器音頻設置')

    if (report.voicesList?.success) score += 10
    else recommendations.push('沒有可用的語音，語音提醒功能將不可用')

    if (report.fallbackMechanisms?.success) score += 5
    else recommendations.push('備用提醒機制不足，建議在支持完整功能的設備上使用')

    // 根據分數評定等級
    let rating: 'excellent' | 'good' | 'limited' | 'poor'
    if (score >= 90) rating = 'excellent'
    else if (score >= 70) rating = 'good'
    else if (score >= 40) rating = 'limited'
    else rating = 'poor'

    // 添加通用建議
    if (report.browserInfo?.isMobile) {
      recommendations.push('移動端設備建議啟用通知權限以獲得最佳體驗')
    }

    if (report.browserInfo?.name === 'Safari') {
      recommendations.push('Safari用戶可能需要手動啟用語音合成功能')
    }

    return { rating, recommendations }
  }

  /**
   * 執行完整的兼容性測試
   */
  async runCompleteTest(): Promise<VoiceCompatibilityReport> {
    console.log('開始執行語音兼容性測試...')

    const report: Partial<VoiceCompatibilityReport> = {
      browserInfo: this.getBrowserInfo(),
      timestamp: Date.now()
    }

    try {
      // 並行執行多個測試
      const [
        webSpeechResult,
        mediaRecorderResult,
        webAudioResult,
        audioPlaybackResult,
        voicesResult,
        errorHandlingResult,
        fallbackResult,
        touchResult
      ] = await Promise.all([
        this.testWebSpeechApi(),
        this.testMediaRecorderApi(),
        this.testWebAudioApi(),
        this.testAudioPlayback(),
        this.testVoicesAndLanguage(),
        this.testErrorHandling(),
        this.testFallbackMechanisms(),
        this.testMobileTouchSupport()
      ])

      report.webSpeechApi = webSpeechResult
      report.mediaRecorderApi = mediaRecorderResult
      report.webAudioApi = webAudioResult
      report.audioPlayback = audioPlaybackResult
      report.voicesList = voicesResult
      report.languageSupport = voicesResult // 語言支持包含在語音列表測試中
      report.errorHandling = errorHandlingResult
      report.fallbackMechanisms = fallbackResult
      report.mobileTouchSupport = touchResult

      // 評估整體兼容性
      const evaluation = this.evaluateOverallCompatibility(report)
      report.overallCompatibility = evaluation.rating
      report.recommendations = evaluation.recommendations

      this.testResults = report as VoiceCompatibilityReport
      console.log('語音兼容性測試完成', this.testResults)

      return this.testResults
    } catch (error) {
      console.error('語音兼容性測試執行失敗:', error)
      throw error
    }
  }

  /**
   * 獲取測試結果
   */
  getTestResults(): VoiceCompatibilityReport | null {
    return this.testResults
  }

  /**
   * 生成測試報告摘要
   */
  generateSummary(): string {
    if (!this.testResults) {
      return '尚未執行測試'
    }

    const { browserInfo, overallCompatibility, recommendations } = this.testResults
    
    let summary = `\n=== 語音兼容性測試報告 ===\n`
    summary += `瀏覽器: ${browserInfo.name} ${browserInfo.version} (${browserInfo.engine})\n`
    summary += `操作系統: ${browserInfo.os}\n`
    summary += `設備類型: ${browserInfo.isMobile ? '移動設備' : '桌面設備'}\n`
    summary += `整體兼容性: ${this.getCompatibilityText(overallCompatibility)}\n\n`

    summary += `=== 功能支持詳情 ===\n`
    summary += `語音合成: ${this.testResults.webSpeechApi.success ? '✅' : '❌'} ${this.testResults.webSpeechApi.message}\n`
    summary += `語音錄製: ${this.testResults.mediaRecorderApi.success ? '✅' : '❌'} ${this.testResults.mediaRecorderApi.message}\n`
    summary += `音效播放: ${this.testResults.webAudioApi.success ? '✅' : '❌'} ${this.testResults.webAudioApi.message}\n`
    summary += `音頻播放: ${this.testResults.audioPlayback.success ? '✅' : '❌'} ${this.testResults.audioPlayback.message}\n`
    summary += `語音列表: ${this.testResults.voicesList.success ? '✅' : '❌'} ${this.testResults.voicesList.message}\n`
    summary += `備用機制: ${this.testResults.fallbackMechanisms.success ? '✅' : '❌'} ${this.testResults.fallbackMechanisms.message}\n`

    if (recommendations.length > 0) {
      summary += `\n=== 優化建議 ===\n`
      recommendations.forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`
      })
    }

    return summary
  }

  private getCompatibilityText(rating: string): string {
    switch (rating) {
      case 'excellent': return '優秀 - 所有功能完全支持'
      case 'good': return '良好 - 大部分功能支持'
      case 'limited': return '有限 - 部分功能支持'
      case 'poor': return '較差 - 功能支持不足'
      default: return '未知'
    }
  }
}

// 導出單例
export const voiceCompatibilityTester = new VoiceCompatibilityTester()
export type { VoiceCompatibilityReport, TestResult, BrowserInfo }



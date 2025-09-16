/**
 * 動畫性能測試工具
 * 用於測試和分析CSS動畫的性能表現
 */

export interface PerformanceMetrics {
  fps: number
  avgFrameTime: number
  minFrameTime: number
  maxFrameTime: number
  totalFrames: number
  droppedFrames: number
  jankFrames: number // 超過16.67ms的幀
  renderTime: number
  memoryUsage?: MemoryUsage
  animationDuration: number
  cpuUsage?: number
  gpuMemory?: number
}

export interface MemoryUsage {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  heapRatio: number
}

export interface AnimationTestConfig {
  name: string
  description: string
  duration: number // 測試持續時間(ms)
  setupAnimation: () => void
  cleanupAnimation: () => void
  target?: HTMLElement
  expectedFPS?: number
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  hardwareConcurrency: number
  deviceMemory?: number
  pixelRatio: number
  screenSize: { width: number; height: number }
  colorDepth: number
  isLowEndDevice: boolean
  isRetina: boolean
  supportsGPU: boolean
}

export interface PerformanceReport {
  testName: string
  deviceInfo: DeviceInfo
  metrics: PerformanceMetrics
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  issues: string[]
  recommendations: string[]
  timestamp: number
}

export interface CompositeLayerInfo {
  element: HTMLElement
  reasons: string[]
  hasCompositeLayer: boolean
  willChangeProperty: string | null
  transform3d: boolean
}

class AnimationPerformanceTester {
  private observers: PerformanceObserver[] = []
  private rafId: number | null = null
  private frameStart: number = 0
  private frameTimes: number[] = []
  private paintTimes: number[] = []
  private isTestRunning: boolean = false
  private testStartTime: number = 0
  private memorySnapshots: MemoryUsage[] = []
  
  constructor() {
    this.setupPerformanceObservers()
  }

  /**
   * 設置性能觀察器
   */
  private setupPerformanceObservers(): void {
    // 監測繪製性能
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.entryType === 'paint') {
              this.paintTimes.push(entry.startTime)
            }
          })
        })
        
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)
      } catch (e) {
        console.warn('Paint timing not supported:', e)
      }

      // 監測長任務
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.duration > 50) { // 長任務閾值 50ms
              console.warn(`Long task detected: ${entry.duration}ms`)
            }
          })
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        console.warn('Long task timing not supported:', e)
      }
    }
  }

  /**
   * 獲取設備信息
   */
  public getDeviceInfo(): DeviceInfo {
    const nav = navigator as any
    const screen = window.screen
    
    const hardwareConcurrency = nav.hardwareConcurrency || 1
    const deviceMemory = nav.deviceMemory
    const pixelRatio = window.devicePixelRatio || 1
    
    // 判斷是否為低端設備
    const isLowEndDevice = hardwareConcurrency <= 2 || 
                          (deviceMemory && deviceMemory <= 4) ||
                          pixelRatio < 2

    // 檢測GPU支持
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const supportsGPU = !!gl
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency,
      deviceMemory,
      pixelRatio,
      screenSize: {
        width: screen.width,
        height: screen.height
      },
      colorDepth: screen.colorDepth,
      isLowEndDevice,
      isRetina: pixelRatio >= 2,
      supportsGPU
    }
  }

  /**
   * 獲取內存使用情況
   */
  private getMemoryUsage(): MemoryUsage | undefined {
    const performance = (window as any).performance
    if (performance && performance.memory) {
      const memory = performance.memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        heapRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }
    }
    return undefined
  }

  /**
   * 分析合成層
   */
  public analyzeCompositeLayers(container: HTMLElement = document.body): CompositeLayerInfo[] {
    const elements = container.querySelectorAll('*')
    const results: CompositeLayerInfo[] = []

    elements.forEach(element => {
      const computedStyle = getComputedStyle(element as HTMLElement)
      const willChange = computedStyle.willChange
      const transform = computedStyle.transform
      const opacity = computedStyle.opacity
      const filter = computedStyle.filter
      const position = computedStyle.position
      
      const reasons: string[] = []
      let hasCompositeLayer = false
      
      // 檢查會創建合成層的屬性
      if (willChange && willChange !== 'auto') {
        reasons.push(`will-change: ${willChange}`)
        hasCompositeLayer = true
      }
      
      if (transform && transform !== 'none') {
        reasons.push(`transform: ${transform}`)
        if (transform.includes('3d') || transform.includes('translateZ')) {
          hasCompositeLayer = true
        }
      }
      
      if (opacity !== '1' && parseFloat(opacity) !== 1) {
        reasons.push(`opacity: ${opacity}`)
      }
      
      if (filter && filter !== 'none') {
        reasons.push(`filter: ${filter}`)
        hasCompositeLayer = true
      }
      
      if (position === 'fixed' || position === 'sticky') {
        reasons.push(`position: ${position}`)
        hasCompositeLayer = true
      }

      if (reasons.length > 0) {
        results.push({
          element: element as HTMLElement,
          reasons,
          hasCompositeLayer,
          willChangeProperty: willChange !== 'auto' ? willChange : null,
          transform3d: transform.includes('3d') || transform.includes('translateZ')
        })
      }
    })

    return results
  }

  /**
   * 運行動畫性能測試
   */
  public async runTest(config: AnimationTestConfig): Promise<PerformanceReport> {
    return new Promise((resolve) => {
      this.resetMetrics()
      this.isTestRunning = true
      this.testStartTime = performance.now()

      // 設置動畫
      config.setupAnimation()

      // 開始監測幀率
      const startFPSMeasurement = () => {
        this.frameStart = performance.now()
        const measureFrame = () => {
          if (!this.isTestRunning) return

          const now = performance.now()
          const frameTime = now - this.frameStart
          this.frameTimes.push(frameTime)
          this.frameStart = now

          // 記錄內存使用情況
          const memoryUsage = this.getMemoryUsage()
          if (memoryUsage) {
            this.memorySnapshots.push(memoryUsage)
          }

          this.rafId = requestAnimationFrame(measureFrame)
        }
        
        this.rafId = requestAnimationFrame(measureFrame)
      }

      startFPSMeasurement()

      // 測試完成後處理結果
      setTimeout(() => {
        this.isTestRunning = false
        if (this.rafId) {
          cancelAnimationFrame(this.rafId)
        }

        // 清理動畫
        config.cleanupAnimation()

        const testEndTime = performance.now()
        const metrics = this.calculateMetrics(testEndTime - this.testStartTime)
        const deviceInfo = this.getDeviceInfo()
        const grade = this.calculateGrade(metrics, config.expectedFPS)
        const issues = this.analyzeIssues(metrics)
        const recommendations = this.generateRecommendations(metrics, deviceInfo)

        resolve({
          testName: config.name,
          deviceInfo,
          metrics,
          grade,
          issues,
          recommendations,
          timestamp: Date.now()
        })
      }, config.duration)
    })
  }

  /**
   * 重置測量數據
   */
  private resetMetrics(): void {
    this.frameTimes = []
    this.paintTimes = []
    this.memorySnapshots = []
  }

  /**
   * 計算性能指標
   */
  private calculateMetrics(testDuration: number): PerformanceMetrics {
    const totalFrames = this.frameTimes.length
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / totalFrames
    const minFrameTime = Math.min(...this.frameTimes)
    const maxFrameTime = Math.max(...this.frameTimes)
    
    // 計算FPS（基於平均幀時間）
    const fps = totalFrames > 0 ? 1000 / avgFrameTime : 0
    
    // 計算丟幀和卡頓幀
    const targetFrameTime = 1000 / 60 // 60FPS目標
    const droppedFrames = this.frameTimes.filter(time => time > targetFrameTime * 1.5).length
    const jankFrames = this.frameTimes.filter(time => time > 16.67).length // 超過16.67ms的幀
    
    // 計算渲染時間（基於paint timing）
    const renderTime = this.paintTimes.length > 0 ? 
      Math.max(...this.paintTimes) - Math.min(...this.paintTimes) : 0

    // 內存使用情況
    const memoryUsage = this.memorySnapshots.length > 0 ? 
      this.memorySnapshots[this.memorySnapshots.length - 1] : undefined

    return {
      fps: Math.round(fps * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      minFrameTime: Math.round(minFrameTime * 100) / 100,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      totalFrames,
      droppedFrames,
      jankFrames,
      renderTime: Math.round(renderTime * 100) / 100,
      memoryUsage,
      animationDuration: testDuration
    }
  }

  /**
   * 計算性能等級
   */
  private calculateGrade(metrics: PerformanceMetrics, expectedFPS?: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const targetFPS = expectedFPS || 60
    const fpsRatio = metrics.fps / targetFPS
    const jankRatio = metrics.jankFrames / metrics.totalFrames
    
    if (fpsRatio >= 0.95 && jankRatio <= 0.05) return 'A'
    if (fpsRatio >= 0.85 && jankRatio <= 0.10) return 'B'
    if (fpsRatio >= 0.70 && jankRatio <= 0.20) return 'C'
    if (fpsRatio >= 0.50 && jankRatio <= 0.35) return 'D'
    return 'F'
  }

  /**
   * 分析性能問題
   */
  private analyzeIssues(metrics: PerformanceMetrics): string[] {
    const issues: string[] = []

    if (metrics.fps < 30) {
      issues.push('幀率過低，動畫不流暢')
    }

    if (metrics.jankFrames / metrics.totalFrames > 0.1) {
      issues.push('卡頓幀過多，用戶體驗較差')
    }

    if (metrics.maxFrameTime > 100) {
      issues.push('存在極長的幀時間，可能導致明顯卡頓')
    }

    if (metrics.memoryUsage && metrics.memoryUsage.heapRatio > 0.8) {
      issues.push('內存使用率過高，可能影響性能')
    }

    return issues
  }

  /**
   * 生成優化建議
   */
  private generateRecommendations(metrics: PerformanceMetrics, deviceInfo: DeviceInfo): string[] {
    const recommendations: string[] = []

    if (metrics.fps < 30) {
      recommendations.push('使用 transform 和 opacity 屬性進行動畫，避免觸發重排')
      recommendations.push('考慮使用 will-change 屬性提升動畫到合成層')
    }

    if (deviceInfo.isLowEndDevice) {
      recommendations.push('在低端設備上減少動畫複雜度或使用媒體查詢禁用動畫')
    }

    if (metrics.jankFrames > metrics.totalFrames * 0.1) {
      recommendations.push('優化動畫緩動函數，避免複雜的計算')
      recommendations.push('考慮使用 CSS animation 替代 JavaScript 動畫')
    }

    if (!deviceInfo.supportsGPU) {
      recommendations.push('設備不支持硬件加速，建議簡化動畫效果')
    }

    return recommendations
  }

  /**
   * 運行批量測試
   */
  public async runBatchTests(configs: AnimationTestConfig[]): Promise<PerformanceReport[]> {
    const results: PerformanceReport[] = []
    
    for (const config of configs) {
      const result = await this.runTest(config)
      results.push(result)
      
      // 測試間隔，讓瀏覽器恢復
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }

  /**
   * 生成性能報告
   */
  public generateReport(results: PerformanceReport[]): string {
    const deviceInfo = results[0]?.deviceInfo
    const timestamp = new Date().toLocaleString('zh-TW')
    
    let report = `# 動畫性能測試報告\n\n`
    report += `**測試時間**: ${timestamp}\n\n`
    
    if (deviceInfo) {
      report += `## 設備信息\n`
      report += `- **用戶代理**: ${deviceInfo.userAgent}\n`
      report += `- **平台**: ${deviceInfo.platform}\n`
      report += `- **CPU核心**: ${deviceInfo.hardwareConcurrency}\n`
      report += `- **內存**: ${deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory}GB` : '未知'}\n`
      report += `- **像素比**: ${deviceInfo.pixelRatio}\n`
      report += `- **屏幕尺寸**: ${deviceInfo.screenSize.width}x${deviceInfo.screenSize.height}\n`
      report += `- **低端設備**: ${deviceInfo.isLowEndDevice ? '是' : '否'}\n`
      report += `- **GPU支持**: ${deviceInfo.supportsGPU ? '是' : '否'}\n\n`
    }
    
    report += `## 測試結果\n\n`
    
    results.forEach(result => {
      report += `### ${result.testName}\n`
      report += `- **等級**: ${result.grade}\n`
      report += `- **FPS**: ${result.metrics.fps}\n`
      report += `- **平均幀時間**: ${result.metrics.avgFrameTime}ms\n`
      report += `- **卡頓幀數**: ${result.metrics.jankFrames}/${result.metrics.totalFrames}\n`
      
      if (result.issues.length > 0) {
        report += `- **問題**: ${result.issues.join(', ')}\n`
      }
      
      if (result.recommendations.length > 0) {
        report += `- **建議**: ${result.recommendations.join('; ')}\n`
      }
      
      report += `\n`
    })
    
    return report
  }

  /**
   * 清理資源
   */
  public cleanup(): void {
    this.isTestRunning = false
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    
    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers = []
  }
}

export const animationPerformanceTester = new AnimationPerformanceTester()



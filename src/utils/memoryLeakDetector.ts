/**
 * 內存泄漏檢測工具
 * 檢測應用程序中的內存泄漏問題，包括事件監聽器、定時器、DOM節點等
 */

export interface MemorySnapshot {
  timestamp: number
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  heapRatio: number
  eventListenerCount?: number
  nodeCount: number
  activeTimers?: number
  sessionDuration: number
}

export interface MemoryLeakReport {
  testName: string
  duration: number
  snapshots: MemorySnapshot[]
  startMemory: MemorySnapshot
  endMemory: MemorySnapshot
  peakMemory: MemorySnapshot
  memoryGrowth: number
  memoryGrowthRate: number // MB/minute
  suspectedLeaks: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  eventListenerLeaks: EventListenerLeak[]
  timerLeaks: TimerLeak[]
  domLeaks: DOMLeakInfo[]
  timestamp: number
}

export interface EventListenerLeak {
  target: string
  type: string
  count: number
  addedDuring: boolean
  removedDuring: boolean
}

export interface TimerLeak {
  type: 'timeout' | 'interval'
  id: number
  duration?: number
  cleared: boolean
  createdAt: number
}

export interface DOMLeakInfo {
  nodeType: string
  tagName?: string
  count: number
  growth: number
}

export interface LeakTestConfig {
  name: string
  description: string
  duration: number // 測試持續時間(ms)
  snapshotInterval: number // 快照間隔(ms)
  setupTest: () => void
  runTest?: () => Promise<void> | void
  cleanupTest: () => void
  stressTest?: boolean // 是否為壓力測試
  iterations?: number // 重複執行次數
}

interface TrackedTimer {
  id: number
  type: 'timeout' | 'interval'
  createdAt: number
  duration?: number
  cleared: boolean
  callback: string
}

interface TrackedEventListener {
  target: EventTarget
  type: string
  listener: EventListener
  options?: any
  addedAt: number
  removed: boolean
}

class MemoryLeakDetector {
  private isRunning: boolean = false
  private snapshots: MemorySnapshot[] = []
  private testStartTime: number = 0
  private snapshotTimer: number | null = null
  
  // 追蹤資源
  private trackedTimers: Map<number, TrackedTimer> = new Map()
  private trackedEventListeners: TrackedEventListener[] = []
  private originalSetTimeout: typeof setTimeout
  private originalSetInterval: typeof setInterval
  private originalClearTimeout: typeof clearTimeout
  private originalClearInterval: typeof clearInterval
  private originalAddEventListener: typeof EventTarget.prototype.addEventListener
  private originalRemoveEventListener: typeof EventTarget.prototype.removeEventListener
  
  // 計數器
  private observingResources: boolean = false

  constructor() {
    this.originalSetTimeout = window.setTimeout.bind(window)
    this.originalSetInterval = window.setInterval.bind(window)
    this.originalClearTimeout = window.clearTimeout.bind(window)
    this.originalClearInterval = window.clearInterval.bind(window)
    this.originalAddEventListener = EventTarget.prototype.addEventListener.bind(EventTarget.prototype)
    this.originalRemoveEventListener = EventTarget.prototype.removeEventListener.bind(EventTarget.prototype)
  }

  /**
   * 開始資源監控
   */
  private startResourceMonitoring(): void {
    if (this.observingResources) return
    this.observingResources = true

    // 攔截setTimeout
    window.setTimeout = (callback: any, delay?: number, ...args: any[]): any => {
      const id = this.originalSetTimeout(callback, delay, ...args)
      this.trackedTimers.set(id, {
        id,
        type: 'timeout',
        createdAt: Date.now(),
        duration: delay,
        cleared: false,
        callback: callback.toString().substring(0, 100)
      })
      return id
    }

    // 攔截setInterval
    window.setInterval = (callback: any, delay?: number, ...args: any[]): any => {
      const id = this.originalSetInterval(callback, delay, ...args)
      this.trackedTimers.set(id, {
        id,
        type: 'interval',
        createdAt: Date.now(),
        duration: delay,
        cleared: false,
        callback: callback.toString().substring(0, 100)
      })
      return id
    }

    // 攔截clearTimeout
    window.clearTimeout = (id?: any): void => {
      this.originalClearTimeout(id)
      const timer = this.trackedTimers.get(id)
      if (timer) {
        timer.cleared = true
      }
    }

    // 攔截clearInterval
    window.clearInterval = (id?: any): void => {
      this.originalClearInterval(id)
      const timer = this.trackedTimers.get(id)
      if (timer) {
        timer.cleared = true
      }
    }

    // 攔截addEventListener
    EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any) {
      const detector = MemoryLeakDetector.getInstance()
      detector.trackedEventListeners.push({
        target: this,
        type,
        listener,
        options,
        addedAt: Date.now(),
        removed: false
      })
      return detector.originalAddEventListener.call(this, type, listener, options)
    }

    // 攔截removeEventListener
    EventTarget.prototype.removeEventListener = function(type: string, listener: any, options?: any) {
      const detector = MemoryLeakDetector.getInstance()
      const tracked = detector.trackedEventListeners.find(t => 
        t.target === this && t.type === type && t.listener === listener
      )
      if (tracked) {
        tracked.removed = true
      }
      return detector.originalRemoveEventListener.call(this, type, listener, options)
    }
  }

  /**
   * 停止資源監控
   */
  private stopResourceMonitoring(): void {
    if (!this.observingResources) return
    this.observingResources = false

    // 恢復原始函數
    window.setTimeout = this.originalSetTimeout
    window.setInterval = this.originalSetInterval
    window.clearTimeout = this.originalClearTimeout
    window.clearInterval = this.originalClearInterval
    EventTarget.prototype.addEventListener = this.originalAddEventListener
    EventTarget.prototype.removeEventListener = this.originalRemoveEventListener
  }

  /**
   * 獲取當前內存快照
   */
  private getMemorySnapshot(): MemorySnapshot {
    const now = Date.now()
    const sessionDuration = this.testStartTime ? now - this.testStartTime : 0

    let memoryInfo = {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      heapRatio: 0
    }

    // 嘗試獲取內存信息
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        heapRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }
    }

    return {
      timestamp: now,
      ...memoryInfo,
      eventListenerCount: this.trackedEventListeners.filter(l => !l.removed).length,
      nodeCount: document.querySelectorAll('*').length,
      activeTimers: Array.from(this.trackedTimers.values()).filter(t => !t.cleared).length,
      sessionDuration
    }
  }

  /**
   * 分析事件監聽器洩漏
   */
  private analyzeEventListenerLeaks(): EventListenerLeak[] {
    const leaks: EventListenerLeak[] = []
    const listenerMap = new Map<string, { added: number; removed: number }>()

    this.trackedEventListeners.forEach(listener => {
      const key = `${listener.target.constructor.name}-${listener.type}`
      if (!listenerMap.has(key)) {
        listenerMap.set(key, { added: 0, removed: 0 })
      }
      const stats = listenerMap.get(key)!
      stats.added++
      if (listener.removed) {
        stats.removed++
      }
    })

    listenerMap.forEach((stats, key) => {
      if (stats.added > stats.removed) {
        const [target, type] = key.split('-')
        leaks.push({
          target,
          type,
          count: stats.added - stats.removed,
          addedDuring: stats.added > 0,
          removedDuring: stats.removed > 0
        })
      }
    })

    return leaks
  }

  /**
   * 分析定時器洩漏
   */
  private analyzeTimerLeaks(): TimerLeak[] {
    const leaks: TimerLeak[] = []
    
    this.trackedTimers.forEach(timer => {
      if (!timer.cleared) {
        leaks.push({
          type: timer.type,
          id: timer.id,
          duration: timer.duration,
          cleared: timer.cleared,
          createdAt: timer.createdAt
        })
      }
    })

    return leaks
  }

  /**
   * 分析DOM節點洩漏
   */
  private analyzeDOMLeaks(startSnapshot: MemorySnapshot, endSnapshot: MemorySnapshot): DOMLeakInfo[] {
    const leaks: DOMLeakInfo[] = []
    const nodeGrowth = endSnapshot.nodeCount - startSnapshot.nodeCount

    if (nodeGrowth > 50) { // 超過50個節點增長被認為可能有問題
      leaks.push({
        nodeType: 'DOM Element',
        count: endSnapshot.nodeCount,
        growth: nodeGrowth
      })
    }

    return leaks
  }

  /**
   * 運行內存洩漏測試
   */
  public async runTest(config: LeakTestConfig): Promise<MemoryLeakReport> {
    return new Promise((resolve, reject) => {
      try {
        this.isRunning = true
        // this.currentTest = config.name
        this.snapshots = []
        this.testStartTime = Date.now()
        this.trackedTimers.clear()
        this.trackedEventListeners.length = 0

        // 開始資源監控
        this.startResourceMonitoring()

        // 垃圾回收（如果可用）
        if ((window as any).gc) {
          (window as any).gc()
        }

        // 初始快照
        const startSnapshot = this.getMemorySnapshot()
        this.snapshots.push(startSnapshot)

        // 設置測試
        config.setupTest()

        // 開始快照收集
        this.snapshotTimer = window.setInterval(() => {
          if (this.isRunning) {
            this.snapshots.push(this.getMemorySnapshot())
          }
        }, config.snapshotInterval)

        // 運行測試邏輯
        const runTestLogic = async () => {
          if (config.runTest) {
            if (config.iterations && config.iterations > 1) {
              // 重複測試
              for (let i = 0; i < config.iterations; i++) {
                await Promise.resolve(config.runTest())
                // 測試間隔
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            } else {
              await Promise.resolve(config.runTest())
            }
          }
        }

        runTestLogic()

        // 測試完成處理
        setTimeout(() => {
          try {
            this.isRunning = false
            
            // 停止快照收集
            if (this.snapshotTimer) {
              clearInterval(this.snapshotTimer)
              this.snapshotTimer = null
            }

            // 最終快照
            const endSnapshot = this.getMemorySnapshot()
            this.snapshots.push(endSnapshot)

            // 清理測試
            config.cleanupTest()

            // 停止資源監控
            this.stopResourceMonitoring()

            // 分析結果
            const report = this.generateReport(config, startSnapshot, endSnapshot)
            resolve(report)
          } catch (error) {
            reject(error)
          }
        }, config.duration)

      } catch (error) {
        this.isRunning = false
        this.stopResourceMonitoring()
        reject(error)
      }
    })
  }

  /**
   * 生成測試報告
   */
  private generateReport(config: LeakTestConfig, startSnapshot: MemorySnapshot, endSnapshot: MemorySnapshot): MemoryLeakReport {
    const duration = endSnapshot.timestamp - startSnapshot.timestamp
    const memoryGrowth = (endSnapshot.usedJSHeapSize - startSnapshot.usedJSHeapSize) / (1024 * 1024) // MB
    const memoryGrowthRate = (memoryGrowth / duration) * 60000 // MB/minute
    
    const peakMemory = this.snapshots.reduce((peak, snapshot) => 
      snapshot.usedJSHeapSize > peak.usedJSHeapSize ? snapshot : peak
    )

    const eventListenerLeaks = this.analyzeEventListenerLeaks()
    const timerLeaks = this.analyzeTimerLeaks()
    const domLeaks = this.analyzeDOMLeaks(startSnapshot, endSnapshot)

    const suspectedLeaks: string[] = []
    const recommendations: string[] = []

    // 分析內存增長
    if (memoryGrowth > 10) { // 超過10MB
      suspectedLeaks.push(`內存增長過大: ${memoryGrowth.toFixed(2)}MB`)
      recommendations.push('檢查是否有大量對象未被垃圾回收')
    }

    // 分析事件監聽器
    if (eventListenerLeaks.length > 0) {
      suspectedLeaks.push(`未清理的事件監聽器: ${eventListenerLeaks.length}個`)
      recommendations.push('確保所有添加的事件監聽器都在適當時機被移除')
    }

    // 分析定時器
    if (timerLeaks.length > 0) {
      suspectedLeaks.push(`未清理的定時器: ${timerLeaks.length}個`)
      recommendations.push('確保所有setTimeout和setInterval都被正確清理')
    }

    // 分析DOM節點
    if (domLeaks.length > 0) {
      suspectedLeaks.push(`DOM節點增長異常: ${domLeaks[0].growth}個`)
      recommendations.push('檢查是否有DOM節點未被正確移除')
    }

    // 確定嚴重程度
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (memoryGrowth > 50 || timerLeaks.length > 10 || eventListenerLeaks.length > 20) {
      severity = 'critical'
    } else if (memoryGrowth > 20 || timerLeaks.length > 5 || eventListenerLeaks.length > 10) {
      severity = 'high'
    } else if (memoryGrowth > 5 || timerLeaks.length > 2 || eventListenerLeaks.length > 5) {
      severity = 'medium'
    }

    return {
      testName: config.name,
      duration,
      snapshots: this.snapshots,
      startMemory: startSnapshot,
      endMemory: endSnapshot,
      peakMemory,
      memoryGrowth,
      memoryGrowthRate,
      suspectedLeaks,
      severity,
      recommendations,
      eventListenerLeaks,
      timerLeaks,
      domLeaks,
      timestamp: Date.now()
    }
  }

  /**
   * 運行批量測試
   */
  public async runBatchTests(configs: LeakTestConfig[]): Promise<MemoryLeakReport[]> {
    const results: MemoryLeakReport[] = []
    
    for (const config of configs) {
      try {
        const result = await this.runTest(config)
        results.push(result)
        
        // 測試間隔，讓瀏覽器恢復
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 強制垃圾回收（如果可用）
        if ((window as any).gc) {
          (window as any).gc()
        }
      } catch (error) {
        console.error(`Test ${config.name} failed:`, error)
      }
    }
    
    return results
  }

  /**
   * 停止當前測試
   */
  public stopTest(): void {
    this.isRunning = false
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer)
      this.snapshotTimer = null
    }
    this.stopResourceMonitoring()
  }

  /**
   * 生成測試報告
   */
  public generateTestReport(reports: MemoryLeakReport[]): string {
    const timestamp = new Date().toLocaleString('zh-TW')
    
    let report = `# 內存泄漏檢測報告\n\n`
    report += `**測試時間**: ${timestamp}\n\n`
    
    // 總體統計
    const totalLeaks = reports.reduce((sum, r) => sum + r.suspectedLeaks.length, 0)
    const criticalTests = reports.filter(r => r.severity === 'critical').length
    const avgMemoryGrowth = reports.reduce((sum, r) => sum + r.memoryGrowth, 0) / reports.length
    
    report += `## 總體統計\n`
    report += `- **測試數量**: ${reports.length}\n`
    report += `- **發現問題**: ${totalLeaks}個\n`
    report += `- **嚴重測試**: ${criticalTests}個\n`
    report += `- **平均內存增長**: ${avgMemoryGrowth.toFixed(2)}MB\n\n`
    
    report += `## 測試結果\n\n`
    
    reports.forEach(result => {
      const severityIcon = {
        'low': '✅',
        'medium': '⚠️',
        'high': '❌', 
        'critical': '🚨'
      }[result.severity]
      
      report += `### ${severityIcon} ${result.testName}\n`
      report += `- **嚴重程度**: ${result.severity.toUpperCase()}\n`
      report += `- **測試時長**: ${Math.round(result.duration / 1000)}秒\n`
      report += `- **內存增長**: ${result.memoryGrowth.toFixed(2)}MB\n`
      report += `- **增長速率**: ${result.memoryGrowthRate.toFixed(2)}MB/分鐘\n`
      
      if (result.eventListenerLeaks.length > 0) {
        report += `- **事件監聽器洩漏**: ${result.eventListenerLeaks.length}個\n`
      }
      
      if (result.timerLeaks.length > 0) {
        report += `- **定時器洩漏**: ${result.timerLeaks.length}個\n`
      }
      
      if (result.suspectedLeaks.length > 0) {
        report += `- **可疑問題**: ${result.suspectedLeaks.join('; ')}\n`
      }
      
      if (result.recommendations.length > 0) {
        report += `- **優化建議**: ${result.recommendations.join('; ')}\n`
      }
      
      report += `\n`
    })
    
    return report
  }

  /**
   * 清理資源
   */
  public cleanup(): void {
    this.stopTest()
    this.trackedTimers.clear()
    this.trackedEventListeners.length = 0
  }

  // 單例模式
  private static instance: MemoryLeakDetector
  public static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector()
    }
    return MemoryLeakDetector.instance
  }
}

export const memoryLeakDetector = MemoryLeakDetector.getInstance()



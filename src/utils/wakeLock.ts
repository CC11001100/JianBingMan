/**
 * Screen Wake Lock 管理模块
 * 使用 Wake Lock API 防止屏幕锁定，确保计时器运行时屏幕保持常亮
 */

interface WakeLockSentinel {
  readonly released: boolean;
  readonly type: string;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: (this: WakeLockSentinel, ev: Event) => void): void;
  removeEventListener(type: 'release', listener: (this: WakeLockSentinel, ev: Event) => void): void;
}

// 定义Wake Lock API类型，兼容不同浏览器环境
interface CustomWakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface NavigatorWithCustomWakeLock {
  wakeLock?: CustomWakeLock;
}

class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null
  private isSupported = false
  private isActive = false
  private retryCount = 0
  private readonly maxRetries = 3

  constructor() {
    this.init()
  }

  /**
   * 初始化Wake Lock支持检测
   */
  private init(): void {
    const nav = navigator as any as NavigatorWithCustomWakeLock
    this.isSupported = 'wakeLock' in nav && !!nav.wakeLock && 'request' in nav.wakeLock
    
    if (this.isSupported) {
      // 监听页面可见性变化，在页面重新可见时重新请求Wake Lock
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.isActive && !this.wakeLock) {
      // 页面重新可见且应该保持屏幕常亮时，重新请求Wake Lock
      this.requestWakeLock()
    }
  }

  /**
   * 检查是否支持Wake Lock API
   */
  isSupported_(): boolean {
    return this.isSupported
  }

  /**
   * 检查Wake Lock是否处于活跃状态
   */
  isActive_(): boolean {
    return this.isActive && this.wakeLock != null && !this.wakeLock.released
  }

  /**
   * 请求屏幕常亮
   */
  async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Wake Lock API not supported')
      return false
    }

    try {
      const nav = navigator as any as NavigatorWithCustomWakeLock
      this.wakeLock = await nav.wakeLock!.request('screen')
      this.isActive = true
      this.retryCount = 0

      // 监听Wake Lock释放事件
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released')
        this.wakeLock = null
        
        // 如果仍然需要保持常亮，尝试重新请求
        if (this.isActive && this.retryCount < this.maxRetries) {
          this.retryCount++
          setTimeout(() => this.requestWakeLock(), 1000 * this.retryCount)
        }
      })

      console.log('Screen Wake Lock is active')
      return true
    } catch (error) {
      console.error('Failed to request Wake Lock:', error)
      this.isActive = false
      return false
    }
  }

  /**
   * 释放屏幕常亮
   */
  async releaseWakeLock(): Promise<void> {
    this.isActive = false
    this.retryCount = 0

    if (this.wakeLock && !this.wakeLock.released) {
      try {
        await this.wakeLock.release()
        console.log('Wake Lock released manually')
      } catch (error) {
        console.error('Failed to release Wake Lock:', error)
      }
    }

    this.wakeLock = null
  }

  /**
   * 切换屏幕常亮状态
   */
  async toggle(): Promise<boolean> {
    if (this.isActive_()) {
      await this.releaseWakeLock()
      return false
    } else {
      return await this.requestWakeLock()
    }
  }

  /**
   * 获取当前状态信息
   */
  getStatus(): {
    supported: boolean
    active: boolean
    released: boolean | null
  } {
    return {
      supported: this.isSupported,
      active: this.isActive,
      released: this.wakeLock ? this.wakeLock.released : null
    }
  }

  /**
   * 销毁管理器，清理资源
   */
  destroy(): void {
    this.releaseWakeLock()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }
}

// 导出单例
export const wakeLockManager = new WakeLockManager()
export type { WakeLockSentinel }

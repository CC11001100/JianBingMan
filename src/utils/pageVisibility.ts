/**
 * 页面可见性管理器
 * 处理页面切换时的状态管理和性能优化
 */

import React from 'react'

export interface PageVisibilityState {
  isVisible: boolean
  isHidden: boolean
  visibilityState: DocumentVisibilityState
}

export type VisibilityChangeCallback = (state: PageVisibilityState) => void

export class PageVisibilityManager {
  private static instance: PageVisibilityManager
  private callbacks: Set<VisibilityChangeCallback> = new Set()
  private currentState: PageVisibilityState

  private constructor() {
    this.currentState = this.getCurrentState()
    this.setupEventListeners()
  }

  static getInstance(): PageVisibilityManager {
    if (!PageVisibilityManager.instance) {
      PageVisibilityManager.instance = new PageVisibilityManager()
    }
    return PageVisibilityManager.instance
  }

  /**
   * 检查浏览器是否支持页面可见性API
   */
  isSupported(): boolean {
    return typeof document !== 'undefined' && 
           typeof document.visibilityState !== 'undefined'
  }

  /**
   * 获取当前页面可见性状态
   */
  getCurrentState(): PageVisibilityState {
    if (!this.isSupported()) {
      return {
        isVisible: true,
        isHidden: false,
        visibilityState: 'visible'
      }
    }

    const visibilityState = document.visibilityState
    return {
      isVisible: visibilityState === 'visible',
      isHidden: visibilityState === 'hidden',
      visibilityState
    }
  }

  /**
   * 获取当前状态
   */
  getState(): PageVisibilityState {
    return { ...this.currentState }
  }

  /**
   * 页面是否可见
   */
  isVisible(): boolean {
    return this.currentState.isVisible
  }

  /**
   * 页面是否隐藏
   */
  isHidden(): boolean {
    return this.currentState.isHidden
  }

  /**
   * 添加可见性变化监听器
   */
  addListener(callback: VisibilityChangeCallback): void {
    this.callbacks.add(callback)
  }

  /**
   * 移除可见性变化监听器
   */
  removeListener(callback: VisibilityChangeCallback): void {
    this.callbacks.delete(callback)
  }

  /**
   * 移除所有监听器
   */
  clearListeners(): void {
    this.callbacks.clear()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.isSupported()) {
      console.warn('Page Visibility API not supported')
      return
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // 兼容性处理：监听其他相关事件
    window.addEventListener('focus', this.handleFocus.bind(this))
    window.addEventListener('blur', this.handleBlur.bind(this))
    window.addEventListener('pageshow', this.handlePageShow.bind(this))
    window.addEventListener('pagehide', this.handlePageHide.bind(this))
  }

  /**
   * 处理可见性变化
   */
  private handleVisibilityChange(): void {
    const newState = this.getCurrentState()
    const previousState = this.currentState
    
    // 更新状态
    this.currentState = newState

    // 只有状态真正改变时才触发回调
    if (previousState.visibilityState !== newState.visibilityState) {
      this.notifyListeners(newState)
    }
  }

  /**
   * 处理窗口获得焦点
   */
  private handleFocus(): void {
    // 某些情况下 visibilitychange 可能不会触发，focus 事件作为补充
    if (this.currentState.isHidden) {
      this.handleVisibilityChange()
    }
  }

  /**
   * 处理窗口失去焦点
   */
  private handleBlur(): void {
    // blur 事件作为 visibilitychange 的补充
    if (this.currentState.isVisible) {
      setTimeout(() => {
        // 延迟检查，避免临时的 blur 事件（如弹出菜单）
        this.handleVisibilityChange()
      }, 100)
    }
  }

  /**
   * 处理页面显示（从缓存中恢复）
   */
  private handlePageShow(event: PageTransitionEvent): void {
    // 从 bfcache 恢复时确保状态正确
    if (event.persisted) {
      this.handleVisibilityChange()
    }
  }

  /**
   * 处理页面隐藏（进入缓存）
   */
  private handlePageHide(): void {
    // 页面即将进入 bfcache 或被卸载
    const hiddenState: PageVisibilityState = {
      isVisible: false,
      isHidden: true,
      visibilityState: 'hidden'
    }
    this.currentState = hiddenState
    this.notifyListeners(hiddenState)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(state: PageVisibilityState): void {
    this.callbacks.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        console.error('Error in visibility change callback:', error)
      }
    })
  }

  /**
   * 销毁管理器，清理资源
   */
  destroy(): void {
    if (this.isSupported()) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
      window.removeEventListener('focus', this.handleFocus.bind(this))
      window.removeEventListener('blur', this.handleBlur.bind(this))
      window.removeEventListener('pageshow', this.handlePageShow.bind(this))
      window.removeEventListener('pagehide', this.handlePageHide.bind(this))
    }
    this.clearListeners()
  }
}

// 导出单例实例
export const pageVisibilityManager = PageVisibilityManager.getInstance()

/**
 * React Hook for page visibility
 */
export function usePageVisibility(): PageVisibilityState {
  const [state, setState] = React.useState<PageVisibilityState>(() => 
    pageVisibilityManager.getCurrentState()
  )

  React.useEffect(() => {
    const handleChange = (newState: PageVisibilityState) => {
      setState(newState)
    }

    pageVisibilityManager.addListener(handleChange)

    return () => {
      pageVisibilityManager.removeListener(handleChange)
    }
  }, [])

  return state
}


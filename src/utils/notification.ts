/**
 * 浏览器桌面通知管理器
 * 提供跨浏览器的桌面通知功能
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  actions?: NotificationAction[]
}

export class NotificationManager {
  private static instance: NotificationManager
  private permissionStatus: NotificationPermission = 'default'

  private constructor() {
    this.permissionStatus = this.getCurrentPermission()
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  /**
   * 检查浏览器是否支持通知
   */
  isSupported(): boolean {
    return 'Notification' in window && 
           typeof Notification.requestPermission === 'function'
  }

  /**
   * 获取当前通知权限状态
   */
  getCurrentPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied'
    }
    return Notification.permission as NotificationPermission
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser does not support notifications')
      return 'denied'
    }

    if (this.permissionStatus === 'granted') {
      return 'granted'
    }

    try {
      const permission = await Notification.requestPermission()
      this.permissionStatus = permission as NotificationPermission
      return this.permissionStatus
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      this.permissionStatus = 'denied'
      return 'denied'
    }
  }

  /**
   * 显示桌面通知
   */
  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Browser does not support notifications')
      return false
    }

    // 检查权限状态
    if (this.permissionStatus !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return false
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        tag: options.tag || 'pancake-timer',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        actions: options.actions
      })

      // 自动关闭通知（如果不需要交互）
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000) // 5秒后自动关闭
      }

      // 点击通知时聚焦到应用
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }

  /**
   * 显示煎饼翻面提醒通知
   */
  async showFlipReminder(message: string = '该翻面了！'): Promise<boolean> {
    return this.showNotification({
      title: '🥞 煎饼侠提醒',
      body: message,
      icon: '/pwa-192x192.png',
      tag: 'flip-reminder',
      requireInteraction: true, // 需要用户交互才关闭
      actions: [
        {
          action: 'flip',
          title: '已翻面',
          icon: '/pwa-192x192.png'
        },
        {
          action: 'snooze',
          title: '稍后提醒',
          icon: '/pwa-192x192.png'
        }
      ]
    })
  }

  /**
   * 显示简单通知
   */
  async showSimpleNotification(title: string, body?: string): Promise<boolean> {
    return this.showNotification({
      title,
      body,
      requireInteraction: false
    })
  }

  /**
   * 检查权限状态并提供用户友好的描述
   */
  getPermissionStatus(): {
    status: NotificationPermission
    description: string
    canRequest: boolean
  } {
    const status = this.getCurrentPermission()
    
    let description: string
    let canRequest: boolean

    switch (status) {
      case 'granted':
        description = '已授权桌面通知'
        canRequest = false
        break
      case 'denied':
        description = '桌面通知已被拒绝，请在浏览器设置中手动开启'
        canRequest = false
        break
      case 'default':
        description = '尚未设置桌面通知权限'
        canRequest = true
        break
      default:
        description = '桌面通知状态未知'
        canRequest = false
    }

    return {
      status,
      description,
      canRequest
    }
  }

  /**
   * 测试通知功能
   */
  async testNotification(): Promise<boolean> {
    return this.showSimpleNotification(
      '🧪 通知测试',
      '如果您看到这条通知，说明桌面通知功能正常工作！'
    )
  }
}

// 导出单例实例
export const notificationManager = NotificationManager.getInstance()

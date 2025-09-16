/**
 * 多實例協調管理器
 * 處理多個瀏覽器標籤頁同時運行應用的協調工作
 */

// 實例狀態類型
export interface InstanceState {
  id: string
  timestamp: number
  isActive: boolean
  timerRunning: boolean
  timerState: {
    isRunning: boolean
    startTime: number | null
    duration: number
    progress: number
  }
  lastHeartbeat: number
}

// 多實例事件類型
export type MultiInstanceEventType = 
  | 'instance_registered'
  | 'instance_removed'
  | 'timer_started'
  | 'timer_stopped'
  | 'timer_paused'
  | 'settings_changed'
  | 'data_updated'
  | 'focus_changed'
  | 'resource_conflict'

export interface MultiInstanceEvent {
  type: MultiInstanceEventType
  instanceId: string
  timestamp: number
  data?: any
}

// 多實例管理器配置
interface MultiInstanceConfig {
  heartbeatInterval: number
  instanceTimeout: number
  maxInstances: number
  enableResourceLock: boolean
  enableDataSync: boolean
}

// 資源鎖定狀態
interface ResourceLock {
  resource: string
  instanceId: string
  timestamp: number
  expires: number
}

class MultiInstanceManager {
  private instanceId: string
  private isActive: boolean = false
  private instances: Map<string, InstanceState> = new Map()
  private eventListeners: Map<MultiInstanceEventType, ((event: MultiInstanceEvent) => void)[]> = new Map()
  private broadcastChannel: BroadcastChannel | null = null
  private heartbeatInterval: number | null = null
  private resourceLocks: Map<string, ResourceLock> = new Map()
  
  private config: MultiInstanceConfig = {
    heartbeatInterval: 5000,    // 5秒心跳
    instanceTimeout: 15000,     // 15秒無響應則認為實例失效
    maxInstances: 10,           // 最多支持10個實例
    enableResourceLock: true,   // 啟用資源鎖定
    enableDataSync: true        // 啟用數據同步
  }

  constructor(config?: Partial<MultiInstanceConfig>) {
    this.instanceId = this.generateInstanceId()
    
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // 初始化BroadcastChannel
    this.initializeBroadcastChannel()
    
    // 註冊實例
    this.registerInstance()
    
    // 開始心跳
    this.startHeartbeat()
    
    // 監聽頁面可見性變化
    this.setupVisibilityListener()
    
    // 監聽頁面關閉
    this.setupBeforeUnloadListener()
    
    console.log(`多實例管理器初始化完成，實例ID: ${this.instanceId}`)
  }

  /**
   * 生成唯一實例ID
   */
  private generateInstanceId(): string {
    return `pancake-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 初始化廣播通道
   */
  private initializeBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported, multi-instance coordination disabled')
      return
    }

    try {
      this.broadcastChannel = new BroadcastChannel('pancake-timer-coordination')
      
      this.broadcastChannel.addEventListener('message', (event) => {
        this.handleBroadcastMessage(event.data as MultiInstanceEvent)
      })
      
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error)
    }
  }

  /**
   * 註冊實例
   */
  private registerInstance(): void {
    const instanceState: InstanceState = {
      id: this.instanceId,
      timestamp: Date.now(),
      isActive: document.visibilityState === 'visible',
      timerRunning: false,
      timerState: {
        isRunning: false,
        startTime: null,
        duration: 0,
        progress: 0
      },
      lastHeartbeat: Date.now()
    }

    this.instances.set(this.instanceId, instanceState)
    this.isActive = instanceState.isActive

    // 通知其他實例
    this.broadcastEvent({
      type: 'instance_registered',
      instanceId: this.instanceId,
      timestamp: Date.now(),
      data: instanceState
    })
  }

  /**
   * 開始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat()
      this.checkInstanceHealth()
    }, this.config.heartbeatInterval)
  }

  /**
   * 發送心跳
   */
  private sendHeartbeat(): void {
    const instance = this.instances.get(this.instanceId)
    if (instance) {
      instance.lastHeartbeat = Date.now()
      instance.isActive = document.visibilityState === 'visible'
    }
  }

  /**
   * 檢查實例健康狀態
   */
  private checkInstanceHealth(): void {
    const now = Date.now()
    const expiredInstances: string[] = []

    for (const [id, instance] of this.instances) {
      if (id !== this.instanceId && now - instance.lastHeartbeat > this.config.instanceTimeout) {
        expiredInstances.push(id)
      }
    }

    // 清理過期實例
    expiredInstances.forEach(id => {
      this.instances.delete(id)
      this.cleanupInstanceResources(id)
      
      this.broadcastEvent({
        type: 'instance_removed',
        instanceId: id,
        timestamp: now,
        data: { reason: 'timeout' }
      })
    })
  }

  /**
   * 清理實例資源
   */
  private cleanupInstanceResources(instanceId: string): void {
    // 釋放該實例持有的所有資源鎖
    for (const [resource, lock] of this.resourceLocks) {
      if (lock.instanceId === instanceId) {
        this.resourceLocks.delete(resource)
        console.log(`Released resource lock '${resource}' from expired instance ${instanceId}`)
      }
    }
  }

  /**
   * 設置頁面可見性監聽器
   */
  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      const instance = this.instances.get(this.instanceId)
      if (instance) {
        instance.isActive = document.visibilityState === 'visible'
        
        this.broadcastEvent({
          type: 'focus_changed',
          instanceId: this.instanceId,
          timestamp: Date.now(),
          data: { isActive: instance.isActive }
        })
      }
    })
  }

  /**
   * 設置頁面關閉監聽器
   */
  private setupBeforeUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })
  }

  /**
   * 處理廣播消息
   */
  private handleBroadcastMessage(event: MultiInstanceEvent): void {
    // 忽略自己發送的消息
    if (event.instanceId === this.instanceId) return

    switch (event.type) {
      case 'instance_registered':
        this.instances.set(event.instanceId, event.data as InstanceState)
        break
      
      case 'instance_removed':
        this.instances.delete(event.instanceId)
        this.cleanupInstanceResources(event.instanceId)
        break
      
      case 'timer_started':
        this.handleTimerConflict(event)
        break
      
      case 'settings_changed':
        this.handleSettingsSync(event)
        break
      
      case 'data_updated':
        this.handleDataSync(event)
        break
    }

    // 觸發事件監聽器
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
  }

  /**
   * 處理計時器衝突
   */
  private handleTimerConflict(event: MultiInstanceEvent): void {
    const currentInstance = this.instances.get(this.instanceId)
    if (currentInstance?.timerRunning) {
      // 如果當前實例也在運行計時器，發出衝突警告
      this.broadcastEvent({
        type: 'resource_conflict',
        instanceId: this.instanceId,
        timestamp: Date.now(),
        data: {
          resource: 'timer',
          conflictWith: event.instanceId,
          resolution: 'warn'
        }
      })
    }
  }

  /**
   * 處理設置同步
   */
  private handleSettingsSync(event: MultiInstanceEvent): void {
    if (this.config.enableDataSync) {
      // 觸發設置重新載入
      const customEvent = new CustomEvent('multi-instance-settings-updated', {
        detail: event.data
      })
      window.dispatchEvent(customEvent)
    }
  }

  /**
   * 處理數據同步
   */
  private handleDataSync(event: MultiInstanceEvent): void {
    if (this.config.enableDataSync) {
      // 觸發數據重新載入
      const customEvent = new CustomEvent('multi-instance-data-updated', {
        detail: event.data
      })
      window.dispatchEvent(customEvent)
    }
  }

  /**
   * 廣播事件
   */
  private broadcastEvent(event: MultiInstanceEvent): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event)
      } catch (error) {
        console.error('Failed to broadcast event:', error)
      }
    }
  }

  /**
   * 獲取資源鎖
   */
  async acquireResourceLock(resource: string, timeout: number = 10000): Promise<boolean> {
    if (!this.config.enableResourceLock) return true

    // 檢查是否已有鎖
    const existingLock = this.resourceLocks.get(resource)
    const now = Date.now()

    if (existingLock) {
      // 檢查鎖是否已過期
      if (now > existingLock.expires) {
        this.resourceLocks.delete(resource)
      } else if (existingLock.instanceId !== this.instanceId) {
        // 其他實例持有鎖
        return false
      } else {
        // 當前實例已持有鎖
        return true
      }
    }

    // 創建新鎖
    const lock: ResourceLock = {
      resource,
      instanceId: this.instanceId,
      timestamp: now,
      expires: now + timeout
    }

    this.resourceLocks.set(resource, lock)
    
    // 通知其他實例
    this.broadcastEvent({
      type: 'resource_conflict',
      instanceId: this.instanceId,
      timestamp: now,
      data: {
        resource,
        action: 'lock_acquired',
        expires: lock.expires
      }
    })

    return true
  }

  /**
   * 釋放資源鎖
   */
  releaseResourceLock(resource: string): void {
    const lock = this.resourceLocks.get(resource)
    if (lock && lock.instanceId === this.instanceId) {
      this.resourceLocks.delete(resource)
      
      this.broadcastEvent({
        type: 'resource_conflict',
        instanceId: this.instanceId,
        timestamp: Date.now(),
        data: {
          resource,
          action: 'lock_released'
        }
      })
    }
  }

  /**
   * 通知計時器狀態變化
   */
  notifyTimerStateChange(state: 'started' | 'stopped' | 'paused', data: any = {}): void {
    const instance = this.instances.get(this.instanceId)
    if (instance) {
      instance.timerRunning = state === 'started'
      instance.timerState = {
        isRunning: state === 'started',
        startTime: state === 'started' ? Date.now() : null,
        duration: data.duration || 0,
        progress: data.progress || 0
      }
    }

    this.broadcastEvent({
      type: state === 'started' ? 'timer_started' : 
            state === 'stopped' ? 'timer_stopped' : 'timer_paused',
      instanceId: this.instanceId,
      timestamp: Date.now(),
      data: { ...data, timerState: instance?.timerState }
    })
  }

  /**
   * 通知設置變化
   */
  notifySettingsChange(settings: any): void {
    this.broadcastEvent({
      type: 'settings_changed',
      instanceId: this.instanceId,
      timestamp: Date.now(),
      data: settings
    })
  }

  /**
   * 通知數據更新
   */
  notifyDataUpdate(type: string, data: any): void {
    this.broadcastEvent({
      type: 'data_updated',
      instanceId: this.instanceId,
      timestamp: Date.now(),
      data: { type, data }
    })
  }

  /**
   * 添加事件監聽器
   */
  addEventListener(type: MultiInstanceEventType, listener: (event: MultiInstanceEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  }

  /**
   * 移除事件監聽器
   */
  removeEventListener(type: MultiInstanceEventType, listener: (event: MultiInstanceEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 獲取所有活動實例
   */
  getActiveInstances(): InstanceState[] {
    const now = Date.now()
    return Array.from(this.instances.values()).filter(
      instance => now - instance.lastHeartbeat <= this.config.instanceTimeout
    )
  }

  /**
   * 獲取運行計時器的實例
   */
  getTimerInstances(): InstanceState[] {
    return this.getActiveInstances().filter(instance => instance.timerRunning)
  }

  /**
   * 檢查是否是主實例
   */
  isPrimaryInstance(): boolean {
    const activeInstances = this.getActiveInstances()
    if (activeInstances.length === 0) return true
    
    // 最早註冊的活動實例為主實例
    const primaryInstance = activeInstances.reduce((earliest, current) => 
      current.timestamp < earliest.timestamp ? current : earliest
    )
    
    return primaryInstance.id === this.instanceId
  }

  /**
   * 獲取實例統計信息
   */
  getInstanceStats() {
    const activeInstances = this.getActiveInstances()
    const timerInstances = this.getTimerInstances()
    
    return {
      totalInstances: activeInstances.length,
      activeInstances: activeInstances.filter(i => i.isActive).length,
      timerInstances: timerInstances.length,
      isPrimary: this.isPrimaryInstance(),
      resourceLocks: Array.from(this.resourceLocks.keys()),
      instanceId: this.instanceId
    }
  }

  /**
   * 獲取詳細實例信息
   */
  getInstanceDetails() {
    return {
      instances: Array.from(this.instances.values()),
      resourceLocks: Array.from(this.resourceLocks.entries()),
      config: this.config
    }
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // 釋放所有資源鎖
    for (const resource of this.resourceLocks.keys()) {
      this.releaseResourceLock(resource)
    }

    // 通知其他實例
    this.broadcastEvent({
      type: 'instance_removed',
      instanceId: this.instanceId,
      timestamp: Date.now(),
      data: { reason: 'cleanup' }
    })

    // 關閉廣播通道
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }

    console.log(`多實例管理器已清理，實例ID: ${this.instanceId}`)
  }
}

// 導出單例
export const multiInstanceManager = new MultiInstanceManager()

// 導出類型
export type {
  MultiInstanceConfig,
  ResourceLock
}



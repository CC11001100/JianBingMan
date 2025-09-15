/**
 * IndexedDB封装模块
 * 用于存储煎饼计时器的各种设置和数据
 */

interface PancakeSettings {
  /** 翻面时间间隔（秒） */
  flipInterval: number
  /** 自定义提示语 */
  customPrompt: string
  /** 语音音量 (0-1) */
  volume: number
  /** 是否启用振动 */
  vibrationEnabled: boolean
  /** 最后使用时间 */
  lastUsed: number
}

interface CalibrationData {
  /** 校准的时间（秒） */
  calibratedTime: number
  /** 校准时间戳 */
  calibratedAt: number
}

class StorageManager {
  private dbName = 'PancakeTimerDB'
  private version = 1
  private db: IDBDatabase | null = null

  private readonly STORES = {
    SETTINGS: 'settings',
    CALIBRATION: 'calibration',
    HISTORY: 'history'
  } as const

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建设置存储
        if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
          db.createObjectStore(this.STORES.SETTINGS, { keyPath: 'id' })
        }

        // 创建校准数据存储
        if (!db.objectStoreNames.contains(this.STORES.CALIBRATION)) {
          db.createObjectStore(this.STORES.CALIBRATION, { keyPath: 'id' })
        }

        // 创建历史记录存储
        if (!db.objectStoreNames.contains(this.STORES.HISTORY)) {
          const historyStore = db.createObjectStore(this.STORES.HISTORY, { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * 获取煎饼设置
   */
  async getSettings(): Promise<PancakeSettings> {
    await this.ensureConnection()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.SETTINGS], 'readonly')
      const store = transaction.objectStore(this.STORES.SETTINGS)
      const request = store.get('pancake_settings')

      request.onerror = () => reject(new Error('Failed to get settings'))
      
      request.onsuccess = () => {
        const defaultSettings: PancakeSettings = {
          flipInterval: 120, // 默认2分钟
          customPrompt: '该翻面了！',
          volume: 0.8,
          vibrationEnabled: true,
          lastUsed: Date.now()
        }

        resolve(request.result ? request.result.data : defaultSettings)
      }
    })
  }

  /**
   * 保存煎饼设置
   */
  async saveSettings(settings: PancakeSettings): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.SETTINGS], 'readwrite')
      const store = transaction.objectStore(this.STORES.SETTINGS)
      
      const settingsWithMeta = {
        id: 'pancake_settings',
        data: { ...settings, lastUsed: Date.now() }
      }

      const request = store.put(settingsWithMeta)

      request.onerror = () => reject(new Error('Failed to save settings'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取校准数据
   */
  async getCalibrationData(): Promise<CalibrationData | null> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CALIBRATION], 'readonly')
      const store = transaction.objectStore(this.STORES.CALIBRATION)
      const request = store.get('calibration_data')

      request.onerror = () => reject(new Error('Failed to get calibration data'))
      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null)
      }
    })
  }

  /**
   * 保存校准数据
   */
  async saveCalibrationData(calibrationData: CalibrationData): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CALIBRATION], 'readwrite')
      const store = transaction.objectStore(this.STORES.CALIBRATION)
      
      const dataWithMeta = {
        id: 'calibration_data',
        data: calibrationData
      }

      const request = store.put(dataWithMeta)

      request.onerror = () => reject(new Error('Failed to save calibration data'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 添加历史记录
   */
  async addHistoryRecord(duration: number, wasCalibration = false): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.HISTORY], 'readwrite')
      const store = transaction.objectStore(this.STORES.HISTORY)
      
      const record = {
        duration,
        wasCalibration,
        timestamp: Date.now()
      }

      const request = store.add(record)

      request.onerror = () => reject(new Error('Failed to add history record'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取历史记录（最近100条）
   */
  async getHistory(): Promise<Array<{ id: number; duration: number; wasCalibration: boolean; timestamp: number }>> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.HISTORY], 'readonly')
      const store = transaction.objectStore(this.STORES.HISTORY)
      const index = store.index('timestamp')
      
      const request = index.openCursor(null, 'prev') // 倒序
      const results: Array<{ id: number; duration: number; wasCalibration: boolean; timestamp: number }> = []

      request.onerror = () => reject(new Error('Failed to get history'))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor && results.length < 100) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  /**
   * 清空所有数据
   */
  async clearAllData(): Promise<void> {
    await this.ensureConnection()

    const stores = [this.STORES.SETTINGS, this.STORES.CALIBRATION, this.STORES.HISTORY]
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite')
      let completed = 0

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`))
        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }
      })
    })
  }

  /**
   * 确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      await this.init()
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 导出单例
export const storageManager = new StorageManager()
export type { PancakeSettings, CalibrationData }

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
  /** 语音语速 (0.1-10) */
  speechRate: number
  /** 语音音调 (0-2) */
  speechPitch: number
  /** 语音类型 ('male' | 'female' | 'auto') */
  voiceType: 'male' | 'female' | 'auto'
  /** 是否启用振动 */
  vibrationEnabled: boolean
  /** 是否启用语音 */
  speechEnabled: boolean
  /** 是否启用音效 */
  soundEffectsEnabled: boolean
  /** 音效类型 ('beep' | 'chime' | 'bell' | 'alarm') */
  soundEffectType: 'beep' | 'chime' | 'bell' | 'alarm'
  /** 自定义语音ID（如果为null则使用系统语音合成） */
  customVoiceId?: string | null
  /** 最后使用时间 */
  lastUsed: number
}

interface CalibrationData {
  /** 校准的时间（秒） */
  calibratedTime: number
  /** 校准时间戳 */
  calibratedAt: number
}

interface CustomVoiceRecord {
  /** 唯一标识符 */
  id: string
  /** 录音名称 */
  name: string
  /** 音频数据 */
  audioBlob: Blob
  /** 录音时长（秒） */
  duration: number
  /** 创建时间 */
  createdAt: number
  /** 最后使用时间 */
  lastUsed?: number
}

class StorageManager {
  private dbName = 'PancakeTimerDB'
  private version = 2 // 升级版本以支持自定义语音
  private db: IDBDatabase | null = null

  private readonly STORES = {
    SETTINGS: 'settings',
    CALIBRATION: 'calibration',
    HISTORY: 'history',
    CUSTOM_VOICES: 'custom_voices'
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

        // 创建自定义语音存储
        if (!db.objectStoreNames.contains(this.STORES.CUSTOM_VOICES)) {
          const voicesStore = db.createObjectStore(this.STORES.CUSTOM_VOICES, { 
            keyPath: 'id' 
          })
          voicesStore.createIndex('createdAt', 'createdAt', { unique: false })
          voicesStore.createIndex('lastUsed', 'lastUsed', { unique: false })
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
          flipInterval: 20, // 默认20秒
          customPrompt: '该翻面了！',
          volume: 0.8,
          speechRate: 1.0, // 正常语速
          speechPitch: 1.0, // 正常音调
          voiceType: 'auto', // 自动选择
          vibrationEnabled: true,
          speechEnabled: true,
          soundEffectsEnabled: true,
          soundEffectType: 'chime',
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
   * 保存自定义语音记录
   */
  async saveCustomVoice(voiceRecord: CustomVoiceRecord): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CUSTOM_VOICES], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_VOICES)
      
      const request = store.put(voiceRecord)

      request.onerror = () => reject(new Error('Failed to save custom voice'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取所有自定义语音记录
   */
  async getCustomVoices(): Promise<CustomVoiceRecord[]> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CUSTOM_VOICES], 'readonly')
      const store = transaction.objectStore(this.STORES.CUSTOM_VOICES)
      const index = store.index('createdAt')
      
      const request = index.openCursor(null, 'prev') // 按创建时间倒序
      const results: CustomVoiceRecord[] = []

      request.onerror = () => reject(new Error('Failed to get custom voices'))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  /**
   * 获取单个自定义语音记录
   */
  async getCustomVoice(id: string): Promise<CustomVoiceRecord | null> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CUSTOM_VOICES], 'readonly')
      const store = transaction.objectStore(this.STORES.CUSTOM_VOICES)
      const request = store.get(id)

      request.onerror = () => reject(new Error('Failed to get custom voice'))
      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * 删除自定义语音记录
   */
  async deleteCustomVoice(id: string): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CUSTOM_VOICES], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_VOICES)
      const request = store.delete(id)

      request.onerror = () => reject(new Error('Failed to delete custom voice'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 更新自定义语音的最后使用时间
   */
  async updateVoiceLastUsed(id: string): Promise<void> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CUSTOM_VOICES], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_VOICES)
      
      // 先获取记录
      const getRequest = store.get(id)
      
      getRequest.onerror = () => reject(new Error('Failed to get voice record'))
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          // 更新最后使用时间
          record.lastUsed = Date.now()
          
          const putRequest = store.put(record)
          putRequest.onerror = () => reject(new Error('Failed to update voice last used'))
          putRequest.onsuccess = () => resolve()
        } else {
          reject(new Error('Voice record not found'))
        }
      }
    })
  }

  /**
   * 清空所有数据
   */
  async clearAllData(): Promise<void> {
    await this.ensureConnection()

    const stores = [this.STORES.SETTINGS, this.STORES.CALIBRATION, this.STORES.HISTORY, this.STORES.CUSTOM_VOICES]
    
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
export type { PancakeSettings, CalibrationData, CustomVoiceRecord }

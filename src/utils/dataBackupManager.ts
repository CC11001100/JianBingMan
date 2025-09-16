/**
 * 數據備份和恢復管理器
 * 提供完整的用戶數據備份、導出、導入和恢復功能
 */

import { storageManager, type PancakeSettings, type CalibrationData, type CustomVoiceRecord } from './storage'

// 數據備份格式接口
interface BackupData {
  version: string
  timestamp: number
  deviceInfo: {
    userAgent: string
    platform: string
    language: string
    timezone: string
  }
  data: {
    settings: PancakeSettings | null
    calibration: CalibrationData | null
    history: Array<{ id: number; duration: number; wasCalibration: boolean; timestamp: number }>
    customVoices: Array<{
      id: string
      name: string
      audioData: string  // Base64 encoded audio
      duration: number
      createdAt: number
      lastUsed?: number
    }>
  }
  checksum: string
}

// 導入驗證結果
interface ImportValidationResult {
  isValid: boolean
  version: string
  errors: string[]
  warnings: string[]
  dataTypes: string[]
  totalSize: number
  recordCounts: {
    settings: number
    calibration: number
    history: number
    customVoices: number
  }
}

// 備份統計信息
interface BackupStats {
  totalSize: number
  dataTypes: number
  settings: boolean
  calibration: boolean
  historyRecords: number
  customVoices: number
  createdAt: number
}

class DataBackupManager {
  private readonly BACKUP_VERSION = '1.0.0'
  private readonly SUPPORTED_VERSIONS = ['1.0.0']
  
  /**
   * 創建完整數據備份
   */
  async createFullBackup(): Promise<BackupData> {
    try {
      console.log('開始創建完整數據備份...')
      
      // 並行獲取所有數據
      const [settings, calibration, history, customVoices] = await Promise.all([
        this.getSettingsData(),
        this.getCalibrationData(),
        this.getHistoryData(),
        this.getCustomVoicesData()
      ])

      // 創建設備信息
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      // 創建備份數據
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        deviceInfo,
        data: {
          settings,
          calibration,
          history,
          customVoices
        },
        checksum: ''  // 稍後計算
      }

      // 計算校驗和
      backupData.checksum = await this.calculateChecksum(backupData)

      console.log('數據備份創建成功:', {
        version: backupData.version,
        timestamp: backupData.timestamp,
        dataTypes: Object.keys(backupData.data).filter(key => 
          backupData.data[key as keyof typeof backupData.data] !== null
        ).length,
        totalRecords: this.countTotalRecords(backupData)
      })

      return backupData
    } catch (error) {
      console.error('創建數據備份失敗:', error)
      throw new Error(`備份創建失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  /**
   * 導出備份到文件
   */
  async exportBackupToFile(format: 'json' | 'encrypted' = 'json'): Promise<void> {
    try {
      const backupData = await this.createFullBackup()
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = JSON.stringify(backupData, null, 2)
        filename = `pancake-timer-backup-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        // 加密格式（簡單的Base64編碼，實際應用中應該使用真正的加密）
        content = btoa(JSON.stringify(backupData))
        filename = `pancake-timer-backup-${new Date().toISOString().split('T')[0]}.bak`
        mimeType = 'application/octet-stream'
      }

      // 創建並下載文件
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log(`備份文件已導出: ${filename}`)
    } catch (error) {
      console.error('導出備份文件失敗:', error)
      throw new Error(`導出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  /**
   * 驗證導入數據
   */
  async validateImportData(backupContent: string): Promise<ImportValidationResult> {
    const result: ImportValidationResult = {
      isValid: false,
      version: '',
      errors: [],
      warnings: [],
      dataTypes: [],
      totalSize: backupContent.length,
      recordCounts: {
        settings: 0,
        calibration: 0,
        history: 0,
        customVoices: 0
      }
    }

    try {
      // 嘗試解析 JSON
      let backupData: BackupData
      try {
        backupData = JSON.parse(backupContent)
      } catch (parseError) {
        // 嘗試 Base64 解碼
        try {
          const decoded = atob(backupContent)
          backupData = JSON.parse(decoded)
        } catch (decodeError) {
          result.errors.push('無效的備份文件格式：無法解析JSON或解碼數據')
          return result
        }
      }

      // 檢查基本結構
      if (!backupData.version) {
        result.errors.push('缺少版本信息')
      } else {
        result.version = backupData.version
        if (!this.SUPPORTED_VERSIONS.includes(backupData.version)) {
          result.errors.push(`不支持的備份版本: ${backupData.version}`)
        }
      }

      if (!backupData.timestamp) {
        result.errors.push('缺少時間戳')
      } else if (backupData.timestamp > Date.now()) {
        result.warnings.push('備份時間晚於當前時間')
      }

      if (!backupData.data) {
        result.errors.push('缺少數據內容')
        return result
      }

      // 驗證校驗和
      if (backupData.checksum) {
        const expectedChecksum = await this.calculateChecksum(backupData)
        if (expectedChecksum !== backupData.checksum) {
          result.warnings.push('校驗和不匹配，數據可能已損壞')
        }
      } else {
        result.warnings.push('缺少校驗和')
      }

      // 驗證各數據類型
      const { data } = backupData

      // 設置數據驗證
      if (data.settings) {
        if (this.validateSettings(data.settings)) {
          result.dataTypes.push('settings')
          result.recordCounts.settings = 1
        } else {
          result.errors.push('設置數據格式無效')
        }
      }

      // 校準數據驗證
      if (data.calibration) {
        if (this.validateCalibration(data.calibration)) {
          result.dataTypes.push('calibration')
          result.recordCounts.calibration = 1
        } else {
          result.errors.push('校準數據格式無效')
        }
      }

      // 歷史記錄驗證
      if (data.history && Array.isArray(data.history)) {
        const validHistoryRecords = data.history.filter(record => 
          this.validateHistoryRecord(record)
        )
        if (validHistoryRecords.length > 0) {
          result.dataTypes.push('history')
          result.recordCounts.history = validHistoryRecords.length
        }
        if (validHistoryRecords.length < data.history.length) {
          result.warnings.push(`${data.history.length - validHistoryRecords.length} 個歷史記錄格式無效，將被跳過`)
        }
      }

      // 自定義語音驗證
      if (data.customVoices && Array.isArray(data.customVoices)) {
        const validVoices = data.customVoices.filter(voice => 
          this.validateCustomVoice(voice)
        )
        if (validVoices.length > 0) {
          result.dataTypes.push('customVoices')
          result.recordCounts.customVoices = validVoices.length
        }
        if (validVoices.length < data.customVoices.length) {
          result.warnings.push(`${data.customVoices.length - validVoices.length} 個自定義語音格式無效，將被跳過`)
        }
      }

      result.isValid = result.errors.length === 0 && result.dataTypes.length > 0

      if (result.isValid) {
        console.log('數據驗證成功:', result)
      } else {
        console.warn('數據驗證失敗:', result.errors)
      }

      return result
    } catch (error) {
      result.errors.push(`驗證過程出錯: ${error instanceof Error ? error.message : '未知錯誤'}`)
      return result
    }
  }

  /**
   * 導入並恢復數據
   */
  async importAndRestoreData(
    backupContent: string, 
    options: {
      overwrite?: boolean
      mergeHistory?: boolean
      preserveCustomVoices?: boolean
    } = {}
  ): Promise<ImportValidationResult> {
    const {
      overwrite = false,
      mergeHistory = true,
      preserveCustomVoices = true
    } = options

    // 首先驗證數據
    const validation = await this.validateImportData(backupContent)
    if (!validation.isValid) {
      throw new Error(`導入數據無效: ${validation.errors.join(', ')}`)
    }

    try {
      // 解析備份數據
      let backupData: BackupData
      try {
        backupData = JSON.parse(backupContent)
      } catch {
        backupData = JSON.parse(atob(backupContent))
      }

      console.log('開始恢復數據...')

      // 創建備份當前數據（以防恢復失敗）
      const currentDataBackup = await this.createFullBackup()
      
      try {
        // 恢復設置數據
        if (backupData.data.settings && (overwrite || !await this.hasExistingSettings())) {
          await storageManager.saveSettings(backupData.data.settings)
          console.log('設置數據已恢復')
        }

        // 恢復校準數據
        if (backupData.data.calibration && (overwrite || !await this.hasExistingCalibration())) {
          await storageManager.saveCalibrationData(backupData.data.calibration)
          console.log('校準數據已恢復')
        }

        // 恢復歷史記錄
        if (backupData.data.history && backupData.data.history.length > 0) {
          if (!mergeHistory && overwrite) {
            // 清空現有歷史記錄
            await this.clearHistoryData()
          }
          
          // 添加歷史記錄
          for (const record of backupData.data.history) {
            if (this.validateHistoryRecord(record)) {
              await storageManager.addHistoryRecord(record.duration, record.wasCalibration)
            }
          }
          console.log(`${backupData.data.history.length} 個歷史記錄已恢復`)
        }

        // 恢復自定義語音
        if (backupData.data.customVoices && backupData.data.customVoices.length > 0) {
          if (!preserveCustomVoices && overwrite) {
            // 清空現有自定義語音
            await this.clearCustomVoicesData()
          }

          // 添加自定義語音
          for (const voiceData of backupData.data.customVoices) {
            if (this.validateCustomVoice(voiceData)) {
              try {
                // 將 Base64 音頻數據轉換回 Blob
                const audioData = atob(voiceData.audioData)
                const audioArray = new Uint8Array(audioData.length)
                for (let i = 0; i < audioData.length; i++) {
                  audioArray[i] = audioData.charCodeAt(i)
                }
                const audioBlob = new Blob([audioArray], { type: 'audio/webm' })

                const customVoice: CustomVoiceRecord = {
                  id: voiceData.id,
                  name: voiceData.name,
                  audioBlob,
                  duration: voiceData.duration,
                  createdAt: voiceData.createdAt,
                  lastUsed: voiceData.lastUsed
                }

                await storageManager.saveCustomVoice(customVoice)
              } catch (error) {
                console.warn(`恢復自定義語音失敗 ${voiceData.name}:`, error)
              }
            }
          }
          console.log(`${backupData.data.customVoices.length} 個自定義語音已恢復`)
        }

        console.log('數據恢復完成')
        return validation

      } catch (restoreError) {
        // 恢復失敗，回滾到備份數據
        console.error('數據恢復失敗，正在回滾...', restoreError)
        await this.restoreFromBackup(currentDataBackup)
        throw new Error(`恢復失敗並已回滾: ${restoreError instanceof Error ? restoreError.message : '未知錯誤'}`)
      }

    } catch (error) {
      console.error('導入數據失敗:', error)
      throw new Error(`導入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  /**
   * 獲取備份統計信息
   */
  async getBackupStats(): Promise<BackupStats> {
    try {
      const [settings, calibration, history, customVoices] = await Promise.all([
        this.getSettingsData(),
        this.getCalibrationData(),
        this.getHistoryData(),
        this.getCustomVoicesData()
      ])

      const stats: BackupStats = {
        totalSize: 0,
        dataTypes: 0,
        settings: settings !== null,
        calibration: calibration !== null,
        historyRecords: history.length,
        customVoices: customVoices.length,
        createdAt: Date.now()
      }

      // 計算數據類型數量
      if (stats.settings) stats.dataTypes++
      if (stats.calibration) stats.dataTypes++
      if (stats.historyRecords > 0) stats.dataTypes++
      if (stats.customVoices > 0) stats.dataTypes++

      // 估算總大小
      const estimatedSize = JSON.stringify({
        settings,
        calibration,
        history,
        customVoices
      }).length

      stats.totalSize = estimatedSize

      return stats
    } catch (error) {
      console.error('獲取備份統計失敗:', error)
      throw new Error(`統計計算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  /**
   * 清除所有數據
   */
  async clearAllData(): Promise<void> {
    try {
      console.log('開始清除所有數據...')
      await storageManager.clearAllData()
      console.log('所有數據已清除')
    } catch (error) {
      console.error('清除數據失敗:', error)
      throw new Error(`清除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }

  // ==================== 私有方法 ====================

  private async getSettingsData(): Promise<PancakeSettings | null> {
    try {
      return await storageManager.getSettings()
    } catch {
      return null
    }
  }

  private async getCalibrationData(): Promise<CalibrationData | null> {
    try {
      return await storageManager.getCalibrationData()
    } catch {
      return null
    }
  }

  private async getHistoryData(): Promise<Array<{ id: number; duration: number; wasCalibration: boolean; timestamp: number }>> {
    try {
      return await storageManager.getHistory()
    } catch {
      return []
    }
  }

  private async getCustomVoicesData(): Promise<Array<{
    id: string
    name: string
    audioData: string
    duration: number
    createdAt: number
    lastUsed?: number
  }>> {
    try {
      const voices = await storageManager.getCustomVoices()
      
      // 將 Blob 音頻數據轉換為 Base64
      const processedVoices = await Promise.all(
        voices.map(async (voice) => {
          try {
            const arrayBuffer = await voice.audioBlob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
            const audioData = btoa(binaryString)

            return {
              id: voice.id,
              name: voice.name,
              audioData,
              duration: voice.duration,
              createdAt: voice.createdAt,
              lastUsed: voice.lastUsed
            }
          } catch (error) {
            console.warn(`處理自定義語音失敗 ${voice.name}:`, error)
            return null
          }
        })
      )

      return processedVoices.filter((voice): voice is NonNullable<typeof voice> => voice !== null)
    } catch {
      return []
    }
  }

  private async calculateChecksum(data: Omit<BackupData, 'checksum'>): Promise<string> {
    try {
      const dataString = JSON.stringify(data)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(dataString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // 降級方案：使用簡單的哈希
      return btoa(JSON.stringify(data)).slice(0, 32)
    }
  }

  private countTotalRecords(backupData: BackupData): number {
    let total = 0
    if (backupData.data.settings) total++
    if (backupData.data.calibration) total++
    total += backupData.data.history.length
    total += backupData.data.customVoices.length
    return total
  }

  private validateSettings(settings: any): boolean {
    return (
      typeof settings === 'object' &&
      typeof settings.flipInterval === 'number' &&
      typeof settings.customPrompt === 'string' &&
      typeof settings.volume === 'number' &&
      typeof settings.speechRate === 'number' &&
      typeof settings.speechPitch === 'number' &&
      typeof settings.voiceType === 'string' &&
      typeof settings.vibrationEnabled === 'boolean' &&
      typeof settings.speechEnabled === 'boolean' &&
      typeof settings.soundEffectsEnabled === 'boolean' &&
      typeof settings.soundEffectType === 'string' &&
      typeof settings.notificationEnabled === 'boolean' &&
      typeof settings.lastUsed === 'number'
    )
  }

  private validateCalibration(calibration: any): boolean {
    return (
      typeof calibration === 'object' &&
      typeof calibration.calibratedTime === 'number' &&
      typeof calibration.calibratedAt === 'number'
    )
  }

  private validateHistoryRecord(record: any): boolean {
    return (
      typeof record === 'object' &&
      typeof record.duration === 'number' &&
      typeof record.wasCalibration === 'boolean' &&
      typeof record.timestamp === 'number'
    )
  }

  private validateCustomVoice(voice: any): boolean {
    return (
      typeof voice === 'object' &&
      typeof voice.id === 'string' &&
      typeof voice.name === 'string' &&
      typeof voice.audioData === 'string' &&
      typeof voice.duration === 'number' &&
      typeof voice.createdAt === 'number'
    )
  }

  private async hasExistingSettings(): Promise<boolean> {
    try {
      const settings = await storageManager.getSettings()
      return settings !== null
    } catch {
      return false
    }
  }

  private async hasExistingCalibration(): Promise<boolean> {
    try {
      const calibration = await storageManager.getCalibrationData()
      return calibration !== null
    } catch {
      return false
    }
  }

  private async clearHistoryData(): Promise<void> {
    // 由於 StorageManager 沒有單獨清除歷史的方法，這裡暫時跳過
    // 實際實現中應該添加專門的清除歷史方法
    console.warn('clearHistoryData: 功能暫未實現')
  }

  private async clearCustomVoicesData(): Promise<void> {
    try {
      const voices = await storageManager.getCustomVoices()
      for (const voice of voices) {
        await storageManager.deleteCustomVoice(voice.id)
      }
    } catch (error) {
      console.warn('清除自定義語音失敗:', error)
    }
  }

  private async restoreFromBackup(backupData: BackupData): Promise<void> {
    try {
      // 清除所有數據
      await this.clearAllData()
      
      // 恢復備份數據
      await this.importAndRestoreData(JSON.stringify(backupData), {
        overwrite: true,
        mergeHistory: false,
        preserveCustomVoices: false
      })
    } catch (error) {
      console.error('回滾失敗:', error)
      throw error
    }
  }
}

export const dataBackupManager = new DataBackupManager()
export type { BackupData, ImportValidationResult, BackupStats }



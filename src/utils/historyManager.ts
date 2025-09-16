/**
 * 歷史記錄管理模組
 * 提供歷史記錄的查詢、分析、導出和管理功能
 */

import { storageManager } from './storage'

export interface HistoryRecord {
  id: number
  duration: number
  wasCalibration: boolean
  timestamp: number
}

export interface HistoryFilter {
  startDate?: number
  endDate?: number
  durationType?: 'all' | 'calibration' | 'normal'
  minDuration?: number
  maxDuration?: number
}

export interface HistorySortOptions {
  field: 'timestamp' | 'duration'
  order: 'asc' | 'desc'
}

export interface HistoryStats {
  totalRecords: number
  calibrationRecords: number
  normalRecords: number
  averageDuration: number
  mostFrequentDuration: number
  totalCookingTime: number
  longestSession: number
  shortestSession: number
  recentActivity: {
    last7Days: number
    last30Days: number
    thisMonth: number
  }
  cookingHabits: {
    averageSessionsPerDay: number
    peakHours: number[]
    weekdayDistribution: number[]
  }
}

export interface OptimizationSuggestion {
  type: 'timing' | 'frequency' | 'consistency' | 'calibration'
  level: 'info' | 'suggestion' | 'warning'
  title: string
  description: string
  recommendation: string
}

class HistoryManager {
  /**
   * 獲取歷史記錄（支持分頁和篩選）
   */
  async getFilteredHistory(
    filter: HistoryFilter = {},
    sort: HistorySortOptions = { field: 'timestamp', order: 'desc' },
    limit = 100,
    offset = 0
  ): Promise<HistoryRecord[]> {
    try {
      const allHistory = await storageManager.getHistory()
      
      // 應用篩選條件
      let filteredHistory = allHistory.filter(record => {
        // 日期篩選
        if (filter.startDate && record.timestamp < filter.startDate) return false
        if (filter.endDate && record.timestamp > filter.endDate) return false
        
        // 記錄類型篩選
        if (filter.durationType === 'calibration' && !record.wasCalibration) return false
        if (filter.durationType === 'normal' && record.wasCalibration) return false
        
        // 持續時間篩選
        if (filter.minDuration && record.duration < filter.minDuration) return false
        if (filter.maxDuration && record.duration > filter.maxDuration) return false
        
        return true
      })

      // 應用排序
      filteredHistory.sort((a, b) => {
        const aValue = a[sort.field]
        const bValue = b[sort.field]
        
        if (sort.order === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      })

      // 應用分頁
      return filteredHistory.slice(offset, offset + limit)
    } catch (error) {
      console.error('獲取歷史記錄失敗:', error)
      return []
    }
  }

  /**
   * 計算歷史記錄統計信息
   */
  async calculateStatistics(): Promise<HistoryStats> {
    try {
      const allHistory = await storageManager.getHistory()
      
      if (allHistory.length === 0) {
        return {
          totalRecords: 0,
          calibrationRecords: 0,
          normalRecords: 0,
          averageDuration: 0,
          mostFrequentDuration: 0,
          totalCookingTime: 0,
          longestSession: 0,
          shortestSession: 0,
          recentActivity: { last7Days: 0, last30Days: 0, thisMonth: 0 },
          cookingHabits: { 
            averageSessionsPerDay: 0, 
            peakHours: [], 
            weekdayDistribution: [0, 0, 0, 0, 0, 0, 0] 
          }
        }
      }

      const now = Date.now()
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

      // 基本統計
      const totalRecords = allHistory.length
      const calibrationRecords = allHistory.filter(r => r.wasCalibration).length
      const normalRecords = totalRecords - calibrationRecords
      
      const durations = allHistory.map(r => r.duration)
      const totalCookingTime = durations.reduce((sum, d) => sum + d, 0)
      const averageDuration = Math.round(totalCookingTime / totalRecords)
      const longestSession = Math.max(...durations)
      const shortestSession = Math.min(...durations)

      // 最常用時間
      const durationCounts = durations.reduce((acc, duration) => {
        acc[duration] = (acc[duration] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      const mostFrequentDuration = parseInt(
        Object.entries(durationCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
      )

      // 最近活動統計
      const last7Days = allHistory.filter(r => r.timestamp >= sevenDaysAgo).length
      const last30Days = allHistory.filter(r => r.timestamp >= thirtyDaysAgo).length
      const thisMonth = allHistory.filter(r => r.timestamp >= thisMonthStart).length

      // 使用習慣分析
      const oldestRecord = Math.min(...allHistory.map(r => r.timestamp))
      const daysSinceFirst = Math.max(1, Math.ceil((now - oldestRecord) / (24 * 60 * 60 * 1000)))
      const averageSessionsPerDay = totalRecords / daysSinceFirst

      // 高峰時段分析（小時）
      const hourCounts = new Array(24).fill(0)
      allHistory.forEach(record => {
        const hour = new Date(record.timestamp).getHours()
        hourCounts[hour]++
      })
      const maxHourCount = Math.max(...hourCounts)
      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .filter(item => item.count >= maxHourCount * 0.8)
        .map(item => item.hour)

      // 工作日分佈分析（0=週日, 1=週一, ..., 6=週六）
      const weekdayDistribution = new Array(7).fill(0)
      allHistory.forEach(record => {
        const weekday = new Date(record.timestamp).getDay()
        weekdayDistribution[weekday]++
      })

      return {
        totalRecords,
        calibrationRecords,
        normalRecords,
        averageDuration,
        mostFrequentDuration,
        totalCookingTime,
        longestSession,
        shortestSession,
        recentActivity: { last7Days, last30Days, thisMonth },
        cookingHabits: { 
          averageSessionsPerDay: Math.round(averageSessionsPerDay * 100) / 100,
          peakHours,
          weekdayDistribution
        }
      }
    } catch (error) {
      console.error('計算統計信息失敗:', error)
      throw error
    }
  }

  /**
   * 生成優化建議
   */
  async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    try {
      const stats = await calculateStatistics()
      const allHistory = await storageManager.getHistory()
      const suggestions: OptimizationSuggestion[] = []

      // 校準建議
      if (stats.calibrationRecords === 0) {
        suggestions.push({
          type: 'calibration',
          level: 'suggestion',
          title: '建議進行時間校準',
          description: '您還沒有進行過時間校準',
          recommendation: '進行實際煎餅測試，校準出最適合您的翻面時間'
        })
      } else if (stats.calibrationRecords < 3) {
        suggestions.push({
          type: 'calibration',
          level: 'info',
          title: '可以進行更多校準',
          description: '多次校準可以獲得更準確的結果',
          recommendation: '在不同條件下進行多次校準測試'
        })
      }

      // 一致性分析
      if (stats.totalRecords >= 10) {
        const durations = allHistory.map(r => r.duration)
        const variance = this.calculateVariance(durations)
        const standardDeviation = Math.sqrt(variance)
        
        if (standardDeviation > stats.averageDuration * 0.3) {
          suggestions.push({
            type: 'consistency',
            level: 'warning',
            title: '計時時間變化較大',
            description: `您的計時時間變化較大（標準差：${Math.round(standardDeviation)}秒）`,
            recommendation: '建議固定一個合適的時間，培養穩定的烹飪習慣'
          })
        }
      }

      // 頻率建議
      if (stats.recentActivity.last7Days === 0) {
        suggestions.push({
          type: 'frequency',
          level: 'info',
          title: '最近沒有使用記錄',
          description: '您已經7天沒有使用計時器了',
          recommendation: '定期使用計時器可以培養良好的烹飪習慣'
        })
      } else if (stats.cookingHabits.averageSessionsPerDay > 5) {
        suggestions.push({
          type: 'frequency',
          level: 'info',
          title: '使用頻率很高',
          description: `您平均每天使用${stats.cookingHabits.averageSessionsPerDay}次`,
          recommendation: '您是煎餅達人！保持這個好習慣'
        })
      }

      // 時間建議
      if (stats.averageDuration < 10) {
        suggestions.push({
          type: 'timing',
          level: 'warning',
          title: '平均時間較短',
          description: '您的平均計時時間較短，可能會影響烹飪效果',
          recommendation: '建議適當延長時間，確保食物充分加熱'
        })
      } else if (stats.averageDuration > 120) {
        suggestions.push({
          type: 'timing',
          level: 'warning',
          title: '平均時間較長',
          description: '您的平均計時時間較長，可能會過度烹飪',
          recommendation: '建議適當縮短時間，避免食物燒焦'
        })
      }

      return suggestions
    } catch (error) {
      console.error('生成優化建議失敗:', error)
      return []
    }
  }

  /**
   * 導出歷史記錄為JSON格式
   */
  async exportToJSON(): Promise<string> {
    try {
      const allHistory = await storageManager.getHistory()
      const stats = await this.calculateStatistics()
      const suggestions = await this.generateOptimizationSuggestions()

      const exportData = {
        exportInfo: {
          timestamp: Date.now(),
          version: '1.0.0',
          totalRecords: allHistory.length
        },
        statistics: stats,
        suggestions,
        records: allHistory.map(record => ({
          ...record,
          date: new Date(record.timestamp).toISOString(),
          type: record.wasCalibration ? '校準' : '正常'
        }))
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('導出歷史記錄失敗:', error)
      throw error
    }
  }

  /**
   * 導出歷史記錄為CSV格式
   */
  async exportToCSV(): Promise<string> {
    try {
      const allHistory = await storageManager.getHistory()
      
      const headers = ['ID', '持續時間(秒)', '類型', '日期時間', '時間戳']
      const rows = allHistory.map(record => [
        record.id.toString(),
        record.duration.toString(),
        record.wasCalibration ? '校準' : '正常',
        new Date(record.timestamp).toLocaleString('zh-CN'),
        record.timestamp.toString()
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return csvContent
    } catch (error) {
      console.error('導出CSV失敗:', error)
      throw error
    }
  }

  /**
   * 清理舊的歷史記錄（保留最近的記錄）
   */
  async cleanupOldRecords(keepDays = 90): Promise<number> {
    try {
      const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000
      const allHistory = await storageManager.getHistory()
      
      // 由於當前存儲API不支持批量刪除，這裡僅返回需要清理的數量
      // 實際實現需要擴展存儲API
      const recordsToDelete = allHistory.filter(record => record.timestamp < cutoffTime)
      
      console.log(`發現${recordsToDelete.length}條舊記錄需要清理`)
      return recordsToDelete.length
    } catch (error) {
      console.error('清理舊記錄失敗:', error)
      return 0
    }
  }

  /**
   * 計算數值數組的方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length <= 1) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2))
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * 格式化時間顯示
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * 格式化日期顯示
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  /**
   * 獲取歷史記錄摘要
   */
  async getHistorySummary(): Promise<{
    todayCount: number
    weekCount: number
    monthCount: number
    totalTime: string
    averageTime: string
  }> {
    try {
      const allHistory = await storageManager.getHistory()
      const now = Date.now()
      
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      const weekStart = now - 7 * 24 * 60 * 60 * 1000
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

      const todayCount = allHistory.filter(r => r.timestamp >= todayStart).length
      const weekCount = allHistory.filter(r => r.timestamp >= weekStart).length
      const monthCount = allHistory.filter(r => r.timestamp >= monthStart).length

      const totalSeconds = allHistory.reduce((sum, r) => sum + r.duration, 0)
      const averageSeconds = allHistory.length > 0 ? Math.round(totalSeconds / allHistory.length) : 0

      return {
        todayCount,
        weekCount,
        monthCount,
        totalTime: this.formatDuration(totalSeconds),
        averageTime: this.formatDuration(averageSeconds)
      }
    } catch (error) {
      console.error('獲取歷史摘要失敗:', error)
      return {
        todayCount: 0,
        weekCount: 0,
        monthCount: 0,
        totalTime: '00:00',
        averageTime: '00:00'
      }
    }
  }
}

// 導出單例和類型
export const historyManager = new HistoryManager()

// 重新導出 calculateStatistics 函數，修復作用域問題
export async function calculateStatistics(): Promise<HistoryStats> {
  return historyManager.calculateStatistics()
}



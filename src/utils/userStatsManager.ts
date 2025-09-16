/**
 * 用戶使用統計管理器
 * 提供完整的用戶行為統計、數據分析和隱私保護功能
 */

import { storageManager, type PancakeSettings } from './storage'

// 用戶統計數據接口
export interface UserStatistics {
  // 基本使用統計
  usage: {
    totalSessions: number
    totalCookingTime: number // 總計時間(秒)
    averageSessionDuration: number
    sessionsToday: number
    sessionsThisWeek: number
    sessionsThisMonth: number
    longestStreak: number // 連續使用天數
    currentStreak: number
  }
  
  // 時間偏好統計
  timePreferences: {
    favoriteInterval: number // 最常用時間間隔
    intervalDistribution: Record<number, number> // 時間間隔分佈
    averageInterval: number
    mostUsedTimes: number[] // 一天中最常使用的時段(小時)
    weekdayUsage: number[] // 一週中每天的使用次數 [周一, 周二, ...]
  }
  
  // 功能偏好統計
  featureUsage: {
    speechEnabled: boolean
    vibrationEnabled: boolean
    soundEffectsEnabled: boolean
    notificationEnabled: boolean
    customVoiceUsage: number // 自定義語音使用次數
    calibrationCount: number // 校準次數
    settingsChangeCount: number // 設置更改次數
  }
  
  // 性能統計
  performance: {
    averageLoadTime: number
    errorCount: number
    crashCount: number
    memoryUsage: number // MB
    cacheHitRate: number // 緩存命中率
  }
  
  // 設備和環境統計
  environment: {
    browserInfo: {
      name: string
      version: string
      platform: string
    }
    screenResolution: string
    preferredLanguage: string
    timezone: string
    deviceType: 'mobile' | 'tablet' | 'desktop'
    installationType: 'browser' | 'pwa' | 'embedded'
  }
  
  // 隱私保護設置
  privacy: {
    dataCollectionEnabled: boolean
    anonymousMode: boolean
    dataRetentionDays: number
    allowAnalytics: boolean
    shareUsageData: boolean
  }
  
  // 統計元數據
  metadata: {
    firstUseDate: number
    lastUpdateDate: number
    statisticsVersion: string
    dataHash: string // 數據完整性校驗
  }
}

// 使用活動記錄
export interface UsageActivity {
  id: string
  timestamp: number
  activityType: 'session_start' | 'session_end' | 'timer_complete' | 'settings_change' | 'calibration' | 'error'
  details: {
    duration?: number
    settings?: Partial<PancakeSettings>
    errorMessage?: string
    feature?: string
    value?: any
  }
  sessionId: string
  userAgent?: string
}

// 統計報告接口
export interface StatsReport {
  summary: {
    period: string
    totalSessions: number
    totalTime: string
    efficiency: number // 使用效率評分
    improvements: string[]
  }
  
  trends: {
    usagePattern: 'increasing' | 'stable' | 'decreasing'
    peakUsageHours: number[]
    preferredDurations: number[]
    consistencyScore: number
  }
  
  insights: {
    topFeatures: string[]
    unusedFeatures: string[]
    optimizationSuggestions: string[]
    achievements: string[]
  }
  
  privacy: {
    dataPoints: number
    anonymized: boolean
    retentionPolicy: string
    exportAvailable: boolean
  }
}

class UserStatsManager {
  private readonly STATS_VERSION = '1.0.0'
  private readonly DEFAULT_RETENTION_DAYS = 365 // 一年
  private readonly PRIVACY_HASH_SALT = 'pancake-timer-privacy-2024'
  
  private currentSessionId: string = ''
  private sessionStartTime: number = 0
  private performanceMetrics: { loadTime: number; memoryUsage: number }[] = []
  
  constructor() {
    this.initializeSession()
    this.initializePerformanceMonitoring()
  }
  
  /**
   * 初始化會話
   */
  private initializeSession(): void {
    this.currentSessionId = this.generateSessionId()
    this.sessionStartTime = Date.now()
    
    // 記錄會話開始
    this.recordActivity('session_start', {}, this.currentSessionId)
  }
  
  /**
   * 初始化性能監控
   */
  private initializePerformanceMonitoring(): void {
    // 監控頁面加載時間
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      if (loadTime > 0) {
        this.performanceMetrics.push({
          loadTime,
          memoryUsage: this.getMemoryUsage()
        })
      }
    }
    
    // 監控內存使用
    setInterval(() => {
      this.performanceMetrics.push({
        loadTime: 0,
        memoryUsage: this.getMemoryUsage()
      })
      
      // 保持最近100個記錄
      if (this.performanceMetrics.length > 100) {
        this.performanceMetrics = this.performanceMetrics.slice(-100)
      }
    }, 30000) // 每30秒記錄一次
  }
  
  /**
   * 記錄用戶活動
   */
  async recordActivity(
    activityType: UsageActivity['activityType'],
    details: UsageActivity['details'],
    sessionId?: string
  ): Promise<void> {
    try {
      const activity: UsageActivity = {
        id: this.generateActivityId(),
        timestamp: Date.now(),
        activityType,
        details,
        sessionId: sessionId || this.currentSessionId,
        userAgent: navigator.userAgent
      }
      
      // 存儲活動記錄
      await this.storeActivity(activity)
      
      // 更新統計數據
      await this.updateStatistics(activity)
      
    } catch (error) {
      console.error('記錄用戶活動失敗:', error)
    }
  }
  
  /**
   * 記錄計時器完成
   */
  async recordTimerCompletion(duration: number, wasCalibration: boolean = false): Promise<void> {
    await this.recordActivity('timer_complete', {
      duration,
      feature: wasCalibration ? 'calibration' : 'normal_timer'
    })
  }
  
  /**
   * 記錄設置更改
   */
  async recordSettingsChange(oldSettings: PancakeSettings, newSettings: PancakeSettings): Promise<void> {
    const changes = this.getSettingsDiff(oldSettings, newSettings)
    await this.recordActivity('settings_change', {
      settings: changes
    })
  }
  
  /**
   * 記錄錯誤
   */
  async recordError(errorMessage: string, feature?: string): Promise<void> {
    await this.recordActivity('error', {
      errorMessage,
      feature
    })
  }
  
  /**
   * 獲取完整用戶統計
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const [activities, settings, history, customVoices] = await Promise.all([
        this.getStoredActivities(),
        storageManager.getSettings(),
        storageManager.getHistory(),
        storageManager.getCustomVoices()
      ])
      
      const stats: UserStatistics = {
        usage: await this.calculateUsageStats(activities, history),
        timePreferences: await this.calculateTimePreferences(history),
        featureUsage: await this.calculateFeatureUsage(activities, settings, customVoices),
        performance: await this.calculatePerformanceStats(activities),
        environment: this.getEnvironmentInfo(),
        privacy: await this.getPrivacySettings(),
        metadata: {
          firstUseDate: await this.getFirstUseDate(activities),
          lastUpdateDate: Date.now(),
          statisticsVersion: this.STATS_VERSION,
          dataHash: await this.calculateDataHash(activities)
        }
      }
      
      return stats
    } catch (error) {
      console.error('獲取用戶統計失敗:', error)
      throw new Error(`統計計算失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }
  
  /**
   * 生成統計報告
   */
  async generateStatsReport(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<StatsReport> {
    const stats = await this.getUserStatistics()
    const activities = await this.getStoredActivities()
    
    const periodStart = this.getPeriodStart(period)
    const filteredActivities = activities.filter(a => a.timestamp >= periodStart)
    
    return {
      summary: this.generateSummary(stats, filteredActivities, period),
      trends: this.analyzeTrends(stats, filteredActivities),
      insights: this.generateInsights(stats, filteredActivities),
      privacy: this.getPrivacyInfo(stats)
    }
  }
  
  /**
   * 清理舊數據 (隱私保護)
   */
  async cleanupOldData(retentionDays: number = this.DEFAULT_RETENTION_DAYS): Promise<void> {
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
      const activities = await this.getStoredActivities()
      
      const recentActivities = activities.filter(a => a.timestamp >= cutoffTime)
      await this.storeActivities(recentActivities)
      
      console.log(`已清理 ${activities.length - recentActivities.length} 條舊記錄`)
    } catch (error) {
      console.error('清理舊數據失敗:', error)
    }
  }
  
  /**
   * 導出統計數據 (隱私保護)
   */
  async exportStatistics(anonymize: boolean = true): Promise<string> {
    try {
      const stats = await this.getUserStatistics()
      
      if (anonymize) {
        // 匿名化處理
        stats.environment.browserInfo.version = this.anonymizeVersion(stats.environment.browserInfo.version)
        stats.metadata.dataHash = this.anonymizeHash(stats.metadata.dataHash)
        delete (stats as any).environment.browserInfo.userAgent
      }
      
      return JSON.stringify(stats, null, 2)
    } catch (error) {
      console.error('導出統計數據失敗:', error)
      throw new Error(`導出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }
  
  /**
   * 驗證數據完整性
   */
  async validateDataIntegrity(): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const result = { isValid: true, errors: [] as string[], warnings: [] as string[] }
    
    try {
      const activities = await this.getStoredActivities()
      const stats = await this.getUserStatistics()
      
      // 檢查數據一致性
      if (activities.length === 0 && stats.usage.totalSessions > 0) {
        result.errors.push('活動記錄與統計數據不一致')
        result.isValid = false
      }
      
      // 檢查時間戳有效性
      const invalidTimestamps = activities.filter(a => 
        a.timestamp > Date.now() || a.timestamp < new Date('2020-01-01').getTime()
      )
      if (invalidTimestamps.length > 0) {
        result.warnings.push(`發現 ${invalidTimestamps.length} 個無效時間戳`)
      }
      
      // 檢查數據哈希
      const calculatedHash = await this.calculateDataHash(activities)
      if (calculatedHash !== stats.metadata.dataHash) {
        result.warnings.push('數據哈希值不匹配，可能存在數據變更')
      }
      
      return result
    } catch (error) {
      result.errors.push(`數據驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
      result.isValid = false
      return result
    }
  }
  
  // ==================== 私有方法 ====================
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private async storeActivity(activity: UsageActivity): Promise<void> {
    try {
      const activities = await this.getStoredActivities()
      activities.push(activity)
      
      // 限制最大存儲數量 (性能考慮)
      const maxActivities = 10000
      if (activities.length > maxActivities) {
        activities.splice(0, activities.length - maxActivities)
      }
      
      await this.storeActivities(activities)
    } catch (error) {
      console.error('存儲活動記錄失敗:', error)
    }
  }
  
  private async getStoredActivities(): Promise<UsageActivity[]> {
    try {
      const stored = localStorage.getItem('user_activities')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('獲取活動記錄失敗:', error)
      return []
    }
  }
  
  private async storeActivities(activities: UsageActivity[]): Promise<void> {
    try {
      localStorage.setItem('user_activities', JSON.stringify(activities))
    } catch (error) {
      console.error('存儲活動記錄失敗:', error)
    }
  }
  
  private async updateStatistics(activity: UsageActivity): Promise<void> {
    // 這裡可以實現實時統計更新邏輯
    // 為了簡化，我們在 getUserStatistics() 中重新計算
  }
  
  private async calculateUsageStats(activities: UsageActivity[], history: any[]): Promise<UserStatistics['usage']> {
    const now = Date.now()
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    const weekStart = now - 7 * 24 * 60 * 60 * 1000
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    
    const timerActivities = activities.filter(a => a.activityType === 'timer_complete')
    const totalCookingTime = history.reduce((sum, record) => sum + record.duration, 0)
    
    return {
      totalSessions: timerActivities.length,
      totalCookingTime,
      averageSessionDuration: timerActivities.length > 0 ? Math.round(totalCookingTime / timerActivities.length) : 0,
      sessionsToday: timerActivities.filter(a => a.timestamp >= todayStart).length,
      sessionsThisWeek: timerActivities.filter(a => a.timestamp >= weekStart).length,
      sessionsThisMonth: timerActivities.filter(a => a.timestamp >= monthStart).length,
      longestStreak: await this.calculateLongestStreak(history),
      currentStreak: await this.calculateCurrentStreak(history)
    }
  }
  
  private async calculateTimePreferences(history: any[]): Promise<UserStatistics['timePreferences']> {
    if (history.length === 0) {
      return {
        favoriteInterval: 0,
        intervalDistribution: {},
        averageInterval: 0,
        mostUsedTimes: [],
        weekdayUsage: [0, 0, 0, 0, 0, 0, 0]
      }
    }
    
    const durations = history.map(r => r.duration)
    const intervalDistribution = durations.reduce((acc, duration) => {
      acc[duration] = (acc[duration] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const favoriteInterval = parseInt(
      Object.entries(intervalDistribution)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
    )
    
    const averageInterval = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    
    // 分析使用時段
    const hourCounts = new Array(24).fill(0)
    const weekdayUsage = new Array(7).fill(0)
    
    history.forEach(record => {
      const date = new Date(record.timestamp)
      const hour = date.getHours()
      const weekday = date.getDay()
      
      hourCounts[hour]++
      weekdayUsage[weekday]++
    })
    
    const mostUsedTimes = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour)
    
    return {
      favoriteInterval,
      intervalDistribution,
      averageInterval,
      mostUsedTimes,
      weekdayUsage
    }
  }
  
  private async calculateFeatureUsage(
    activities: UsageActivity[], 
    settings: any, 
    customVoices: any[]
  ): Promise<UserStatistics['featureUsage']> {
    const calibrationActivities = activities.filter(a => 
      a.activityType === 'timer_complete' && a.details.feature === 'calibration'
    )
    
    const settingsChanges = activities.filter(a => a.activityType === 'settings_change')
    
    const customVoiceUsage = activities.filter(a => 
      a.activityType === 'timer_complete' && settings.customVoiceId
    ).length
    
    return {
      speechEnabled: settings.speechEnabled || false,
      vibrationEnabled: settings.vibrationEnabled || false,
      soundEffectsEnabled: settings.soundEffectsEnabled || false,
      notificationEnabled: settings.notificationEnabled || false,
      customVoiceUsage,
      calibrationCount: calibrationActivities.length,
      settingsChangeCount: settingsChanges.length
    }
  }
  
  private async calculatePerformanceStats(activities: UsageActivity[]): Promise<UserStatistics['performance']> {
    const errorActivities = activities.filter(a => a.activityType === 'error')
    
    const avgLoadTime = this.performanceMetrics.length > 0 
      ? this.performanceMetrics.reduce((sum, m) => sum + m.loadTime, 0) / this.performanceMetrics.length
      : 0
      
    const avgMemoryUsage = this.performanceMetrics.length > 0
      ? this.performanceMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.performanceMetrics.length
      : 0
    
    return {
      averageLoadTime: Math.round(avgLoadTime),
      errorCount: errorActivities.length,
      crashCount: 0, // TODO: 實現崩潰檢測
      memoryUsage: Math.round(avgMemoryUsage),
      cacheHitRate: 0.95 // TODO: 實現緩存命中率計算
    }
  }
  
  private getEnvironmentInfo(): UserStatistics['environment'] {
    const browserInfo = this.getBrowserInfo()
    const deviceType = this.getDeviceType()
    
    return {
      browserInfo,
      screenResolution: `${screen.width}x${screen.height}`,
      preferredLanguage: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType,
      installationType: this.getInstallationType()
    }
  }
  
  private async getPrivacySettings(): Promise<UserStatistics['privacy']> {
    try {
      const stored = localStorage.getItem('privacy_settings')
      const defaultSettings = {
        dataCollectionEnabled: true,
        anonymousMode: false,
        dataRetentionDays: this.DEFAULT_RETENTION_DAYS,
        allowAnalytics: false,
        shareUsageData: false
      }
      
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    } catch (error) {
      return {
        dataCollectionEnabled: true,
        anonymousMode: false,
        dataRetentionDays: this.DEFAULT_RETENTION_DAYS,
        allowAnalytics: false,
        shareUsageData: false
      }
    }
  }
  
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      return Math.round((window.performance as any).memory.usedJSHeapSize / 1024 / 1024)
    }
    return 0
  }
  
  private getBrowserInfo() {
    const ua = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = 'Unknown'
    
    if (ua.includes('Chrome')) {
      browserName = 'Chrome'
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox'
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Safari')) {
      browserName = 'Safari'
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown'
    }
    
    return {
      name: browserName,
      version: browserVersion,
      platform: navigator.platform
    }
  }
  
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent
    if (/Mobi|Android/i.test(ua)) return 'mobile'
    if (/Tablet|iPad/i.test(ua)) return 'tablet'
    return 'desktop'
  }
  
  private getInstallationType(): 'browser' | 'pwa' | 'embedded' {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa'
    if (window.parent !== window) return 'embedded'
    return 'browser'
  }
  
  private async getFirstUseDate(activities: UsageActivity[]): Promise<number> {
    if (activities.length === 0) return Date.now()
    return Math.min(...activities.map(a => a.timestamp))
  }
  
  private async calculateDataHash(activities: UsageActivity[]): Promise<string> {
    try {
      const dataString = JSON.stringify(activities.map(a => ({
        type: a.activityType,
        timestamp: a.timestamp,
        sessionId: a.sessionId
      })))
      
      const encoder = new TextEncoder()
      const data = encoder.encode(dataString + this.PRIVACY_HASH_SALT)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
    } catch (error) {
      return btoa(activities.length.toString()).slice(0, 16)
    }
  }
  
  private getSettingsDiff(oldSettings: PancakeSettings, newSettings: PancakeSettings): Partial<PancakeSettings> {
    const diff: Partial<PancakeSettings> = {}
    
    Object.keys(newSettings).forEach(key => {
      const k = key as keyof PancakeSettings
      if (oldSettings[k] !== newSettings[k]) {
        diff[k] = newSettings[k]
      }
    })
    
    return diff
  }
  
  private async calculateLongestStreak(history: any[]): Promise<number> {
    if (history.length === 0) return 0
    
    const dates = [...new Set(
      history.map(r => new Date(r.timestamp).toDateString())
    )].sort()
    
    let longestStreak = 1
    let currentStreak = 1
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    return longestStreak
  }
  
  private async calculateCurrentStreak(history: any[]): Promise<number> {
    if (history.length === 0) return 0
    
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
    
    const uniqueDates = [...new Set(
      history.map(r => new Date(r.timestamp).toDateString())
    )].sort().reverse()
    
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0
    }
    
    let streak = 0
    let checkDate = new Date()
    
    for (const dateStr of uniqueDates) {
      const recordDate = new Date(dateStr)
      const expectedDate = new Date(checkDate)
      expectedDate.setHours(0, 0, 0, 0)
      recordDate.setHours(0, 0, 0, 0)
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }
  
  private getPeriodStart(period: 'day' | 'week' | 'month' | 'all'): number {
    const now = Date.now()
    
    switch (period) {
      case 'day':
        return new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      case 'week':
        return now - 7 * 24 * 60 * 60 * 1000
      case 'month':
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
      case 'all':
      default:
        return 0
    }
  }
  
  private generateSummary(stats: UserStatistics, activities: UsageActivity[], period: string): StatsReport['summary'] {
    const totalTime = this.formatDuration(stats.usage.totalCookingTime)
    const efficiency = this.calculateEfficiency(stats)
    
    return {
      period,
      totalSessions: stats.usage.totalSessions,
      totalTime,
      efficiency,
      improvements: this.generateImprovements(stats)
    }
  }
  
  private analyzeTrends(stats: UserStatistics, activities: UsageActivity[]): StatsReport['trends'] {
    return {
      usagePattern: this.determineUsagePattern(activities),
      peakUsageHours: stats.timePreferences.mostUsedTimes,
      preferredDurations: Object.keys(stats.timePreferences.intervalDistribution)
        .map(Number)
        .sort((a, b) => stats.timePreferences.intervalDistribution[b] - stats.timePreferences.intervalDistribution[a])
        .slice(0, 3),
      consistencyScore: this.calculateConsistencyScore(stats)
    }
  }
  
  private generateInsights(stats: UserStatistics, activities: UsageActivity[]): StatsReport['insights'] {
    return {
      topFeatures: this.getTopFeatures(stats),
      unusedFeatures: this.getUnusedFeatures(stats),
      optimizationSuggestions: this.generateOptimizationSuggestions(stats),
      achievements: this.getAchievements(stats)
    }
  }
  
  private getPrivacyInfo(stats: UserStatistics): StatsReport['privacy'] {
    return {
      dataPoints: stats.usage.totalSessions,
      anonymized: stats.privacy.anonymousMode,
      retentionPolicy: `${stats.privacy.dataRetentionDays} 天`,
      exportAvailable: true
    }
  }
  
  // 輔助方法
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}時${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }
  
  private calculateEfficiency(stats: UserStatistics): number {
    // 效率評分基於使用頻率、一致性等因素
    const frequencyScore = Math.min(stats.usage.currentStreak * 10, 100)
    const consistencyScore = this.calculateConsistencyScore(stats)
    const featureUsageScore = this.calculateFeatureUsageScore(stats)
    
    return Math.round((frequencyScore + consistencyScore + featureUsageScore) / 3)
  }
  
  private calculateConsistencyScore(stats: UserStatistics): number {
    const weekdayVariance = this.calculateVariance(stats.timePreferences.weekdayUsage)
    const maxVariance = Math.max(...stats.timePreferences.weekdayUsage) ** 2
    
    return maxVariance > 0 ? Math.round((1 - weekdayVariance / maxVariance) * 100) : 0
  }
  
  private calculateFeatureUsageScore(stats: UserStatistics): number {
    const features = stats.featureUsage
    const usedFeatures = [
      features.speechEnabled,
      features.vibrationEnabled,
      features.soundEffectsEnabled,
      features.notificationEnabled
    ].filter(Boolean).length
    
    return Math.round((usedFeatures / 4) * 100)
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
  
  private generateImprovements(stats: UserStatistics): string[] {
    const improvements: string[] = []
    
    if (stats.usage.currentStreak < 3) {
      improvements.push('建議保持連續使用習慣')
    }
    
    if (!stats.featureUsage.speechEnabled) {
      improvements.push('嘗試開啟語音提醒功能')
    }
    
    if (stats.timePreferences.intervalDistribution[stats.timePreferences.favoriteInterval] < 5) {
      improvements.push('建議進行時間校準以獲得更好體驗')
    }
    
    return improvements
  }
  
  private determineUsagePattern(activities: UsageActivity[]): 'increasing' | 'stable' | 'decreasing' {
    if (activities.length < 10) return 'stable'
    
    const recent = activities.slice(-5).length
    const earlier = activities.slice(-10, -5).length
    
    if (recent > earlier * 1.2) return 'increasing'
    if (recent < earlier * 0.8) return 'decreasing'
    return 'stable'
  }
  
  private getTopFeatures(stats: UserStatistics): string[] {
    const features = []
    
    if (stats.featureUsage.speechEnabled) features.push('語音提醒')
    if (stats.featureUsage.vibrationEnabled) features.push('振動提醒')
    if (stats.featureUsage.soundEffectsEnabled) features.push('音效提醒')
    if (stats.featureUsage.customVoiceUsage > 0) features.push('自定義語音')
    
    return features.slice(0, 3)
  }
  
  private getUnusedFeatures(stats: UserStatistics): string[] {
    const unused = []
    
    if (!stats.featureUsage.speechEnabled) unused.push('語音提醒')
    if (!stats.featureUsage.vibrationEnabled) unused.push('振動提醒')
    if (!stats.featureUsage.soundEffectsEnabled) unused.push('音效提醒')
    if (!stats.featureUsage.notificationEnabled) unused.push('桌面通知')
    if (stats.featureUsage.calibrationCount === 0) unused.push('時間校準')
    
    return unused
  }
  
  private generateOptimizationSuggestions(stats: UserStatistics): string[] {
    const suggestions = []
    
    if (stats.usage.averageSessionDuration < 15) {
      suggestions.push('考慮增加計時時間以獲得更好的烹飪效果')
    }
    
    if (stats.performance.memoryUsage > 50) {
      suggestions.push('建議清理瀏覽器緩存以提升性能')
    }
    
    if (stats.usage.currentStreak > 7) {
      suggestions.push('嘗試不同的計時時間以探索最佳烹飪時間')
    }
    
    return suggestions
  }
  
  private getAchievements(stats: UserStatistics): string[] {
    const achievements = []
    
    if (stats.usage.totalSessions >= 10) achievements.push('煎餅新手')
    if (stats.usage.totalSessions >= 50) achievements.push('煎餅達人')
    if (stats.usage.totalSessions >= 100) achievements.push('煎餅大師')
    if (stats.usage.longestStreak >= 7) achievements.push('連續使用一週')
    if (stats.usage.longestStreak >= 30) achievements.push('連續使用一個月')
    if (stats.featureUsage.calibrationCount >= 5) achievements.push('時間校準專家')
    
    return achievements
  }
  
  private anonymizeVersion(version: string): string {
    const parts = version.split('.')
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}.x`
    }
    return version
  }
  
  private anonymizeHash(hash: string): string {
    return hash.replace(/[a-f0-9]/g, (char, index) => 
      index % 3 === 0 ? char : 'x'
    )
  }
}

export const userStatsManager = new UserStatsManager()
export type { UserStatistics, UsageActivity, StatsReport }



/**
 * 用戶使用統計測試組件
 * 提供完整的用戶統計功能測試界面
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material'
import {
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  VolumeUp as VolumeUpIcon,
  Vibration as VibrationIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { userStatsManager, type UserStatistics, type StatsReport } from '../../utils/userStatsManager'
import './UserStatsTest.css'

const UserStatsTest: React.FC = () => {
  // 狀態管理
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 統計數據狀態
  const [userStats, setUserStats] = useState<UserStatistics | null>(null)
  const [statsReport, setStatsReport] = useState<StatsReport | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  
  // UI 狀態
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    dataCollectionEnabled: true,
    anonymousMode: false,
    dataRetentionDays: 365,
    allowAnalytics: false,
    shareUsageData: false
  })
  const [exportOptions, setExportOptions] = useState({
    anonymize: true,
    includePerfStats: true,
    includeActivities: false
  })

  /**
   * 載入用戶統計數據
   */
  const loadUserStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const stats = await userStatsManager.getUserStatistics()
      setUserStats(stats)
      
      console.log('用戶統計數據載入成功:', stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入統計數據失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 生成統計報告
   */
  const generateReport = async (period: 'day' | 'week' | 'month' | 'all' = 'week') => {
    setIsLoading(true)
    setError(null)

    try {
      const report = await userStatsManager.generateStatsReport(period)
      setStatsReport(report)
      setSuccess(`${period === 'all' ? '全部' : period === 'day' ? '今日' : period === 'week' ? '本週' : '本月'}統計報告生成成功`)
      
      console.log('統計報告生成成功:', report)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成統計報告失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 驗證數據完整性
   */
  const validateDataIntegrity = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await userStatsManager.validateDataIntegrity()
      setValidationResult(result)
      
      if (result.isValid) {
        setSuccess('數據完整性驗證通過')
      } else {
        setError(`數據驗證發現問題: ${result.errors.join(', ')}`)
      }
      
      console.log('數據完整性驗證結果:', result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '數據驗證失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 記錄測試活動
   */
  const recordTestActivity = async () => {
    try {
      await userStatsManager.recordTimerCompletion(20, false)
      await userStatsManager.recordActivity('settings_change', { feature: 'test' })
      
      setSuccess('測試活動記錄成功')
      await loadUserStats() // 重新載入統計數據
    } catch (err) {
      setError(err instanceof Error ? err.message : '記錄測試活動失敗')
    }
  }

  /**
   * 清理舊數據
   */
  const cleanupOldData = async () => {
    if (!window.confirm('確定要清理舊數據嗎？此操作不可撤銷。')) {
      return
    }

    setIsLoading(true)
    try {
      await userStatsManager.cleanupOldData(privacySettings.dataRetentionDays)
      setSuccess('舊數據清理成功')
      await loadUserStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理舊數據失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 導出統計數據
   */
  const exportStatistics = async () => {
    setIsLoading(true)
    try {
      const exportedData = await userStatsManager.exportStatistics(exportOptions.anonymize)
      
      // 創建下載文件
      const blob = new Blob([exportedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-statistics-${new Date().toISOString().split('T')[0]}.json`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess('統計數據導出成功')
      setExportDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '導出統計數據失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 更新隱私設置
   */
  const updatePrivacySettings = async () => {
    try {
      localStorage.setItem('privacy_settings', JSON.stringify(privacySettings))
      setSuccess('隱私設置更新成功')
      setPrivacyDialogOpen(false)
      await loadUserStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新隱私設置失敗')
    }
  }

  /**
   * 格式化時間
   */
  const formatDuration = (seconds: number): string => {
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

  /**
   * 格式化百分比
   */
  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`
  }

  /**
   * 渲染使用統計
   */
  const renderUsageStats = () => {
    if (!userStats) return null

    const { usage } = userStats

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            使用統計
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {usage.totalSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總計時次數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {formatDuration(usage.totalCookingTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總計時間
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {usage.currentStreak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  當前連續天數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {formatDuration(usage.averageSessionDuration)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均計時時間
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              今日: {usage.sessionsToday} 次 | 
              本週: {usage.sessionsThisWeek} 次 | 
              本月: {usage.sessionsThisMonth} 次 | 
              最長連續: {usage.longestStreak} 天
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  /**
   * 渲染時間偏好
   */
  const renderTimePreferences = () => {
    if (!userStats) return null

    const { timePreferences } = userStats

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            時間偏好
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>最愛計時時間</Typography>
              <Chip 
                label={`${timePreferences.favoriteInterval} 秒`} 
                color="primary" 
                size="medium"
              />
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>平均計時時間</Typography>
              <Chip 
                label={`${timePreferences.averageInterval} 秒`} 
                color="secondary" 
                size="medium"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>常用時段</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {timePreferences.mostUsedTimes.map((hour, index) => (
                  <Chip 
                    key={index}
                    label={`${hour}:00`} 
                    variant="outlined" 
                    size="small"
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>週使用分佈</Typography>
              <Box display="flex" gap={0.5}>
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <Tooltip key={index} title={`${day}: ${timePreferences.weekdayUsage[index]} 次`}>
                    <Box
                      sx={{
                        width: 30,
                        height: Math.max(4, timePreferences.weekdayUsage[index] * 2),
                        backgroundColor: 'primary.main',
                        opacity: 0.3 + (timePreferences.weekdayUsage[index] / Math.max(...timePreferences.weekdayUsage)) * 0.7,
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'center',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" color="white">
                        {day}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  /**
   * 渲染功能使用統計
   */
  const renderFeatureUsage = () => {
    if (!userStats) return null

    const { featureUsage } = userStats

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            功能使用統計
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Badge color={featureUsage.speechEnabled ? 'success' : 'default'}>
                      <VolumeUpIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="語音提醒" 
                    secondary={featureUsage.speechEnabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Badge color={featureUsage.vibrationEnabled ? 'success' : 'default'}>
                      <VibrationIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="振動提醒" 
                    secondary={featureUsage.vibrationEnabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Badge color={featureUsage.soundEffectsEnabled ? 'success' : 'default'}>
                      <VolumeUpIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="音效提醒" 
                    secondary={featureUsage.soundEffectsEnabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Badge color={featureUsage.notificationEnabled ? 'success' : 'default'}>
                      <NotificationsIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="桌面通知" 
                    secondary={featureUsage.notificationEnabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  自定義語音使用次數
                </Typography>
                <Typography variant="h6" color="primary">
                  {featureUsage.customVoiceUsage} 次
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  時間校準次數
                </Typography>
                <Typography variant="h6" color="secondary">
                  {featureUsage.calibrationCount} 次
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  設置更改次數
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {featureUsage.settingsChangeCount} 次
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  /**
   * 渲染性能統計
   */
  const renderPerformanceStats = () => {
    if (!userStats) return null

    const { performance } = userStats

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            性能統計
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="info.main">
                  {performance.averageLoadTime}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均載入時間
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main">
                  {performance.memoryUsage}MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  內存使用
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="error.main">
                  {performance.errorCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  錯誤次數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="success.main">
                  {formatPercentage(performance.cacheHitRate * 100)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  緩存命中率
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  /**
   * 渲染統計報告
   */
  const renderStatsReport = () => {
    if (!statsReport) return null

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            統計報告
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">摘要</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">期間: {statsReport.summary.period}</Typography>
                  <Typography variant="body2">總會話: {statsReport.summary.totalSessions}</Typography>
                  <Typography variant="body2">總時間: {statsReport.summary.totalTime}</Typography>
                  <Typography variant="body2">效率評分: {statsReport.summary.efficiency}%</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>改進建議:</Typography>
                  {statsReport.summary.improvements.map((improvement, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      • {improvement}
                    </Typography>
                  ))}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">趨勢分析</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">使用模式: {statsReport.trends.usagePattern}</Typography>
              <Typography variant="body2">高峰使用時段: {statsReport.trends.peakUsageHours.join(', ')}</Typography>
              <Typography variant="body2">偏好時長: {statsReport.trends.preferredDurations.join(', ')} 秒</Typography>
              <Typography variant="body2">一致性評分: {formatPercentage(statsReport.trends.consistencyScore)}</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">洞察分析</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" gutterBottom>熱門功能:</Typography>
                  {statsReport.insights.topFeatures.map((feature, index) => (
                    <Chip key={index} label={feature} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" gutterBottom>未使用功能:</Typography>
                  {statsReport.insights.unusedFeatures.map((feature, index) => (
                    <Chip key={index} label={feature} variant="outlined" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" gutterBottom>成就:</Typography>
                  {statsReport.insights.achievements.map((achievement, index) => (
                    <Chip key={index} label={achievement} color="success" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Grid>
              </Grid>
              
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>優化建議:</Typography>
                {statsReport.insights.optimizationSuggestions.map((suggestion, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    • {suggestion}
                  </Typography>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    )
  }

  /**
   * 渲染數據驗證結果
   */
  const renderValidationResult = () => {
    if (!validationResult) return null

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <VerifiedUserIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            數據完整性驗證
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {validationResult.isValid ? (
              <CheckCircleIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            <Typography variant="h6">
              {validationResult.isValid ? '驗證通過' : '驗證失敗'}
            </Typography>
          </Box>

          {validationResult.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">錯誤:</Typography>
              {validationResult.errors.map((error, index) => (
                <Typography key={index} variant="body2">• {error}</Typography>
              ))}
            </Alert>
          )}

          {validationResult.warnings.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2">警告:</Typography>
              {validationResult.warnings.map((warning, index) => (
                <Typography key={index} variant="body2">• {warning}</Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // 初始載入
  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  return (
    <Box className="user-stats-test" p={3}>
      <Typography variant="h4" gutterBottom>
        📊 用戶使用統計測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        驗證用戶使用統計功能，包括計時次數、使用時長、偏好設置等數據的收集和分析，測試統計數據的準確性和隱私保護。
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 操作按鈕區域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>測試操作</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={loadUserStats}
              disabled={isLoading}
              startIcon={<AnalyticsIcon />}
            >
              載入統計數據
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => generateReport('week')}
              disabled={isLoading}
              startIcon={<TrendingUpIcon />}
            >
              生成週報告
            </Button>
            
            <Button
              variant="outlined"
              onClick={validateDataIntegrity}
              disabled={isLoading}
              startIcon={<VerifiedUserIcon />}
            >
              驗證數據完整性
            </Button>
            
            <Button
              variant="outlined"
              onClick={recordTestActivity}
              disabled={isLoading}
              startIcon={<TimerIcon />}
            >
              記錄測試活動
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPrivacyDialogOpen(true)}
              startIcon={<SecurityIcon />}
            >
              隱私設置
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setExportDialogOpen(true)}
              startIcon={<DownloadIcon />}
            >
              導出數據
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              onClick={cleanupOldData}
              disabled={isLoading}
              startIcon={<DeleteIcon />}
            >
              清理舊數據
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 統計數據展示 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderUsageStats()}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {renderTimePreferences()}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {renderFeatureUsage()}
        </Grid>
        
        <Grid item xs={12}>
          {renderPerformanceStats()}
        </Grid>
        
        {statsReport && (
          <Grid item xs={12}>
            {renderStatsReport()}
          </Grid>
        )}
        
        {validationResult && (
          <Grid item xs={12}>
            {renderValidationResult()}
          </Grid>
        )}
      </Grid>

      {/* 隱私設置對話框 */}
      <Dialog 
        open={privacyDialogOpen} 
        onClose={() => setPrivacyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>隱私設置</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.dataCollectionEnabled}
                  onChange={(e) => setPrivacySettings(prev => ({
                    ...prev,
                    dataCollectionEnabled: e.target.checked
                  }))}
                />
              }
              label="啟用數據收集"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.anonymousMode}
                  onChange={(e) => setPrivacySettings(prev => ({
                    ...prev,
                    anonymousMode: e.target.checked
                  }))}
                />
              }
              label="匿名模式"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.allowAnalytics}
                  onChange={(e) => setPrivacySettings(prev => ({
                    ...prev,
                    allowAnalytics: e.target.checked
                  }))}
                />
              }
              label="允許分析統計"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={privacySettings.shareUsageData}
                  onChange={(e) => setPrivacySettings(prev => ({
                    ...prev,
                    shareUsageData: e.target.checked
                  }))}
                />
              }
              label="分享使用數據"
            />
            
            <TextField
              fullWidth
              type="number"
              label="數據保留天數"
              value={privacySettings.dataRetentionDays}
              onChange={(e) => setPrivacySettings(prev => ({
                ...prev,
                dataRetentionDays: parseInt(e.target.value) || 365
              }))}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyDialogOpen(false)}>取消</Button>
          <Button onClick={updatePrivacySettings} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 導出對話框 */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>導出統計數據</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.anonymize}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    anonymize: e.target.checked
                  }))}
                />
              }
              label="匿名化導出"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includePerfStats}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includePerfStats: e.target.checked
                  }))}
                />
              }
              label="包含性能統計"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeActivities}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeActivities: e.target.checked
                  }))}
                />
              }
              label="包含活動記錄"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>取消</Button>
          <Button onClick={exportStatistics} variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : '導出'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserStatsTest



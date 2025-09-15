import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Fab,
  Alert,
  Snackbar
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Lightbulb as LightbulbIcon,
  LightbulbOutlined as LightbulbOutlinedIcon
} from '@mui/icons-material'
import { storageManager, type PancakeSettings } from '../../utils/storage'
import { speechManager } from '../../utils/speechSynthesis'
import { wakeLockManager } from '../../utils/wakeLock'
import SettingsDialog from './SettingsDialog'
import CalibrationDialog from './CalibrationDialog'
import './PancakeTimer.css'

type TimerState = 'stopped' | 'running' | 'paused'

const PancakeTimer: React.FC = () => {
  // 状态管理
  const [timerState, setTimerState] = useState<TimerState>('stopped')
  const [remainingTime, setRemainingTime] = useState(20) // 默认20秒
  const [targetTime, setTargetTime] = useState(20)
  const [settings, setSettings] = useState<PancakeSettings | null>(null)
  
  // 对话框状态
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  
  // 提示状态
  const [alertMessage, setAlertMessage] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  
  // 屏幕常亮状态
  const [wakeLockSupported, setWakeLockSupported] = useState(false)
  const [wakeLockActive, setWakeLockActive] = useState(false)
  
  // 动画过渡状态
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const transitionStartTime = useRef<number | null>(null)
  const startProgress = useRef<number>(0)
  const endProgress = useRef<number>(0)

  // 初始化Wake Lock支持检测
  useEffect(() => {
    setWakeLockSupported(wakeLockManager.isSupported_())
    setWakeLockActive(wakeLockManager.isActive_())
  }, [])

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storageManager.getSettings()
        setSettings(savedSettings)
        setTargetTime(savedSettings.flipInterval)
        setRemainingTime(savedSettings.flipInterval)
        // 初始化动画进度
        setAnimatedProgress(0)
      } catch (error) {
        console.error('Failed to load settings:', error)
        showAlert('加载设置失败')
      }
    }

    loadSettings()
  }, [])

  // 管理屏幕常亮：计时器运行时保持屏幕常亮
  useEffect(() => {
    const manageWakeLock = async () => {
      if (!wakeLockSupported) return

      if (timerState === 'running') {
        // 计时器开始运行时请求屏幕常亮
        const success = await wakeLockManager.requestWakeLock()
        setWakeLockActive(success)
        if (success) {
          console.log('屏幕常亮已激活')
        }
      } else if (timerState === 'stopped') {
        // 计时器停止时释放屏幕常亮
        await wakeLockManager.releaseWakeLock()
        setWakeLockActive(false)
        console.log('屏幕常亮已释放')
      }
      // 暂停状态保持当前Wake Lock状态不变
    }

    manageWakeLock()
  }, [timerState, wakeLockSupported])

  // 组件卸载时清理Wake Lock
  useEffect(() => {
    return () => {
      wakeLockManager.releaseWakeLock()
    }
  }, [])

  // 计时器逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerState === 'running' && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // 时间到了，触发提醒
            handleTimerComplete()
            return targetTime // 重新开始计时
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerState, remainingTime, targetTime])

  // 平滑过渡动画
  useEffect(() => {
    let animationFrame: number | null = null
    
    if (isTransitioning && transitionStartTime.current) {
      const animate = () => {
        const elapsed = Date.now() - transitionStartTime.current!
        const duration = 500 // 500ms 过渡时间
        const progress = Math.min(elapsed / duration, 1)
        
        // 使用 easeInOutCubic 缓动函数
        const easeInOutCubic = (t: number) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        }
        
        const easedProgress = easeInOutCubic(progress)
        const currentAnimatedProgress = startProgress.current + 
          (endProgress.current - startProgress.current) * easedProgress
        
        setAnimatedProgress(currentAnimatedProgress)
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        } else {
          setIsTransitioning(false)
          transitionStartTime.current = null
        }
      }
      
      animationFrame = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isTransitioning])

  // 更新正常计时时的动画进度
  useEffect(() => {
    if (!isTransitioning && targetTime > 0) {
      const currentProgress = ((targetTime - remainingTime) / targetTime) * 100
      setAnimatedProgress(currentProgress)
    }
  }, [remainingTime, targetTime, isTransitioning])

  // 处理计时完成
  const handleTimerComplete = useCallback(async () => {
    if (!settings) return

    try {
      // 播放语音提醒
      await speechManager.quickAlert(settings.customPrompt, settings.volume)
      
      // 振动提醒
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([500, 200, 500])
      }

      // 显示提示
      showAlert('⏰ ' + settings.customPrompt)

      // 记录历史
      await storageManager.addHistoryRecord(targetTime)
    } catch (error) {
      console.error('Timer complete handler error:', error)
      showAlert('提醒功能出现问题')
    }
  }, [settings, targetTime])

  // 开始/暂停计时
  const toggleTimer = () => {
    if (timerState === 'stopped' || timerState === 'paused') {
      setTimerState('running')
    } else {
      setTimerState('paused')
    }
  }

  // 重置计时器（重新开始计时）
  const resetTimer = () => {
    setRemainingTime(targetTime)
    setTimerState('running')
  }

  // 调整时间（+5秒/-5秒）
  const adjustTime = (delta: number) => {
    if (timerState === 'running') {
      setRemainingTime(prev => Math.max(1, prev + delta))
    } else {
      const newTime = Math.max(10, targetTime + delta)
      setTargetTime(newTime)
      setRemainingTime(newTime)
      
      // 保存新的时间设置
      if (settings) {
        const updatedSettings = { ...settings, flipInterval: newTime }
        setSettings(updatedSettings)
        storageManager.saveSettings(updatedSettings)
      }
    }
  }

  // 处理设置更新
  const handleSettingsUpdate = (newSettings: PancakeSettings) => {
    setSettings(newSettings)
    const newTargetTime = newSettings.flipInterval
    const oldTargetTime = targetTime
    
    // 如果时间发生了变化，启动过渡动画
    if (newTargetTime !== oldTargetTime) {
      // 计算当前和目标进度
      const currentProgress = oldTargetTime > 0 ? ((oldTargetTime - remainingTime) / oldTargetTime) * 100 : 0
      
      let newRemainingTime = remainingTime
      let targetProgress = 0
      
      if (timerState === 'stopped') {
        // 计时器停止时，直接设置为新的时间
        newRemainingTime = newTargetTime
        targetProgress = 0
      } else if (timerState === 'running' || timerState === 'paused') {
        // 计时器运行或暂停时，按比例调整剩余时间
        const progressRatio = oldTargetTime > 0 ? (oldTargetTime - remainingTime) / oldTargetTime : 0
        newRemainingTime = Math.max(1, Math.round(newTargetTime * (1 - progressRatio)))
        targetProgress = ((newTargetTime - newRemainingTime) / newTargetTime) * 100
        
        console.log(`时间校准：${oldTargetTime}s -> ${newTargetTime}s，剩余时间：${remainingTime}s -> ${newRemainingTime}s，进度：${(progressRatio * 100).toFixed(1)}%`)
      }
      
      // 设置动画起始和结束值
      startProgress.current = currentProgress
      endProgress.current = targetProgress
      setAnimatedProgress(currentProgress)
      
      // 启动过渡动画
      setIsTransitioning(true)
      transitionStartTime.current = Date.now()
      
      // 更新时间
      setRemainingTime(newRemainingTime)
    }
    
    setTargetTime(newTargetTime)
  }

  // 处理校准完成
  const handleCalibrationComplete = (calibratedTime: number) => {
    const oldTargetTime = targetTime
    const wasRunning = timerState === 'running'
    
    const newSettings = settings ? { ...settings, flipInterval: calibratedTime } : {
      flipInterval: calibratedTime,
      customPrompt: '该翻面了！',
      volume: 0.8,
      vibrationEnabled: true,
      lastUsed: Date.now()
    }
    
    // 更新设置，这会触发时间和动画的同步更新
    handleSettingsUpdate(newSettings)
    storageManager.saveSettings(newSettings)
    
    // 提供详细的校准反馈
    const minutes = Math.floor(calibratedTime / 60)
    const seconds = calibratedTime % 60
    const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
    
    let alertText = `🎯 校准完成！新的翻面时间：${timeText}`
    
    if (wasRunning) {
      alertText += '\n⏱️ 当前计时已同步调整'
    }
    
    showAlert(alertText)
    
    console.log(`校准完成：${oldTargetTime}s -> ${calibratedTime}s，计时器状态：${timerState}`)
  }

  // 显示提示消息
  const showAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 使用动画进度百分比
  const displayProgress = animatedProgress

  if (!settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="pancake-timer">
      {/* 标题栏 */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, position: 'relative' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            🥞 煎饼侠
          </Typography>
          <Typography variant="body2" color="text.secondary">
            专业煎饼计时器
          </Typography>
        </Box>
        
        {/* 屏幕常亮状态指示器 */}
        {wakeLockSupported && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {wakeLockActive ? (
              <LightbulbIcon 
                sx={{ 
                  fontSize: 20, 
                  color: 'warning.main',
                  filter: 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.6))'
                }} 
              />
            ) : (
              <LightbulbOutlinedIcon 
                sx={{ 
                  fontSize: 20, 
                  color: 'text.disabled'
                }} 
              />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: wakeLockActive ? 'warning.main' : 'text.disabled',
                fontWeight: wakeLockActive ? 600 : 400
              }}
            >
              {wakeLockActive ? '常亮' : ''}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 主计时器显示 */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, textAlign: 'center', position: 'relative' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={displayProgress}
            size={200}
            thickness={4}
            sx={{ 
              color: timerState === 'running' ? 'primary.main' : 'grey.300',
              transform: 'rotate(-90deg)!',
              transition: 'color 0.3s ease-in-out',
              '& .MuiCircularProgress-circle': {
                transition: 'none' // 动画由 displayProgress 的平滑变化控制
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography 
              variant="h3" 
              component="div" 
              sx={{ 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                color: timerState === 'running' ? 'primary.main' : 'text.primary',
                transition: isTransitioning 
                  ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                  : 'color 0.3s ease-in-out',
                transform: isTransitioning ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {formatTime(remainingTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {timerState === 'running' ? '计时中...' : timerState === 'paused' ? '已暂停' : '准备开始'}
            </Typography>
          </Box>
        </Box>

        {/* 时间调整按钮 */}
        {timerState !== 'running' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <IconButton 
              onClick={() => adjustTime(-5)} 
              color="primary"
              size="large"
              sx={{ bgcolor: 'grey.100' }}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
              {formatTime(targetTime)}
            </Typography>
            <IconButton 
              onClick={() => adjustTime(5)} 
              color="primary"
              size="large"
              sx={{ bgcolor: 'grey.100' }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        )}

        {/* 运行时快速调整 */}
        {timerState === 'running' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => adjustTime(-5)}
              startIcon={<RemoveIcon />}
            >
              -5秒
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => adjustTime(5)}
              startIcon={<AddIcon />}
            >
              +5秒
            </Button>
          </Box>
        )}
      </Paper>

      {/* 控制按钮 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={toggleTimer}
          startIcon={timerState === 'running' ? <PauseIcon /> : <PlayIcon />}
          sx={{ flex: 1, py: 2 }}
        >
          {timerState === 'running' ? '暂停' : '开始'}
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          onClick={resetTimer}
          startIcon={<RefreshIcon />}
          sx={{ py: 2 }}
        >
          重置
        </Button>
      </Box>

      {/* 功能按钮 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setCalibrationOpen(true)}
          startIcon={<TimerIcon />}
          sx={{ flex: 1 }}
        >
          时间校准
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setSettingsOpen(true)}
          startIcon={<SettingsIcon />}
          sx={{ flex: 1 }}
        >
          设置
        </Button>
      </Box>

      {/* 重新开始悬浮按钮 */}
      {timerState === 'running' && (
        <Fab
          color="secondary"
          onClick={resetTimer}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <RefreshIcon />
        </Fab>
      )}

      {/* 设置对话框 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsUpdate={handleSettingsUpdate}
      />

      {/* 校准对话框 */}
      <CalibrationDialog
        open={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
        onCalibrationComplete={handleCalibrationComplete}
      />

      {/* 提示消息 */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={3000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default PancakeTimer

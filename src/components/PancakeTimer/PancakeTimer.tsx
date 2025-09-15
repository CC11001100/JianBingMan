import React, { useState, useEffect, useCallback } from 'react'
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
  Timer as TimerIcon
} from '@mui/icons-material'
import { storageManager, type PancakeSettings } from '../../utils/storage'
import { speechManager } from '../../utils/speechSynthesis'
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

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storageManager.getSettings()
        setSettings(savedSettings)
        setTargetTime(savedSettings.flipInterval)
        setRemainingTime(savedSettings.flipInterval)
      } catch (error) {
        console.error('Failed to load settings:', error)
        showAlert('加载设置失败')
      }
    }

    loadSettings()
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
    setTargetTime(newSettings.flipInterval)
    if (timerState === 'stopped') {
      setRemainingTime(newSettings.flipInterval)
    }
  }

  // 处理校准完成
  const handleCalibrationComplete = (calibratedTime: number) => {
    const newSettings = settings ? { ...settings, flipInterval: calibratedTime } : {
      flipInterval: calibratedTime,
      customPrompt: '该翻面了！',
      volume: 0.8,
      vibrationEnabled: true,
      lastUsed: Date.now()
    }
    
    handleSettingsUpdate(newSettings)
    storageManager.saveSettings(newSettings)
    showAlert(`校准完成！设置为 ${Math.floor(calibratedTime / 60)}分${calibratedTime % 60}秒`)
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

  // 计算进度百分比
  const progress = ((targetTime - remainingTime) / targetTime) * 100

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
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🥞 煎饼侠
        </Typography>
        <Typography variant="body2" color="text.secondary">
          专业煎饼计时器
        </Typography>
      </Paper>

      {/* 主计时器显示 */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, textAlign: 'center', position: 'relative' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={200}
            thickness={4}
            sx={{ 
              color: timerState === 'running' ? 'primary.main' : 'grey.300',
              transform: 'rotate(-90deg)!'
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
                color: timerState === 'running' ? 'primary.main' : 'text.primary'
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

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
  LightbulbOutlined as LightbulbOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material'
import { storageManager, type PancakeSettings } from '../../utils/storage'
import { speechManager } from '../../utils/speechSynthesis'
import { wakeLockManager } from '../../utils/wakeLock'
import { soundEffectsManager } from '../../utils/soundEffects'
import { notificationManager } from '../../utils/notification'
import { pageVisibilityManager } from '../../utils/pageVisibility'
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
  
  // 防止重复触发完成事件的标志位
  const hasTriggeredComplete = useRef<boolean>(false)
  
  // 桌面端交互状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [showKeyboardHint, setShowKeyboardHint] = useState(false)
  const keyboardHintTimer = useRef<number | null>(null)

  // 页面可见性状态
  const [isPageVisible, setIsPageVisible] = useState(true)
  const lastVisibilityTime = useRef<number>(Date.now())

  // 初始化Wake Lock支持检测
  useEffect(() => {
    setWakeLockSupported(wakeLockManager.isSupported_())
    setWakeLockActive(wakeLockManager.isActive_())
  }, [])

  // 页面可见性监听
  useEffect(() => {
    const handleVisibilityChange = (state: any) => {
      const now = Date.now()
      
      if (state.isVisible && !isPageVisible) {
        // 页面从隐藏变为可见
        setIsPageVisible(true)
        
        // 如果计时器正在运行，需要调整时间
        if (timerState === 'running') {
          const hiddenDuration = now - lastVisibilityTime.current
          console.log(`页面隐藏了 ${Math.round(hiddenDuration / 1000)} 秒`)
          
          // 调整剩余时间（减去隐藏期间的时间）
          setRemainingTime(prevTime => {
            const adjustedTime = Math.max(0, prevTime - Math.floor(hiddenDuration / 1000))
            console.log(`时间从 ${prevTime}s 调整为 ${adjustedTime}s`)
            return adjustedTime
          })
        }
      } else if (!state.isVisible && isPageVisible) {
        // 页面从可见变为隐藏
        setIsPageVisible(false)
        lastVisibilityTime.current = now
        console.log('页面已隐藏，记录时间点')
      }
    }

    pageVisibilityManager.addListener(handleVisibilityChange)

    return () => {
      pageVisibilityManager.removeListener(handleVisibilityChange)
    }
  }, [isPageVisible, timerState])

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storageManager.getSettings()
        setSettings(savedSettings)
        setTargetTime(savedSettings.flipInterval)
        setRemainingTime(savedSettings.flipInterval)
        // 初始化动画进度为0（满圈状态）
        setAnimatedProgress(0)
        setIsTransitioning(false)
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

  // 桌面端键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果焦点在输入框或对话框打开时，不处理快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      
      // 如果对话框打开，只处理ESC键
      if (settingsOpen || calibrationOpen) {
        if (event.key === 'Escape') {
          event.preventDefault()
          if (settingsOpen) setSettingsOpen(false)
          if (calibrationOpen) setCalibrationOpen(false)
          showAlert('对话框已关闭')
        }
        return
      }

      // 防止默认行为（如页面滚动）
      switch (event.key) {
        case ' ':
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault()
          break
      }

      // 处理快捷键
      switch (event.key) {
        case ' ': // 空格键：开始/暂停计时
          toggleTimer()
          showAlert(timerState === 'running' ? '计时器已暂停' : '计时器已开始')
          break
          
        case 'r':
        case 'R': // R键：重置计时器
          resetTimer()
          showAlert('计时器已重置')
          break
          
        case 'ArrowUp': // 上箭头：+5秒
          adjustTime(5)
          showAlert(`时间调整：+5秒`)
          break
          
        case 'ArrowDown': // 下箭头：-5秒
          adjustTime(-5)
          showAlert(`时间调整：-5秒`)
          break
          
        case 'ArrowRight': // 右箭头：+1秒
          adjustTime(1)
          showAlert(`时间调整：+1秒`)
          break
          
        case 'ArrowLeft': // 左箭头：-1秒
          adjustTime(-1)
          showAlert(`时间调整：-1秒`)
          break
          
        case 's':
        case 'S': // S键：打开设置
          setSettingsOpen(true)
          showAlert('打开设置面板')
          break
          
        case 'c':
        case 'C': // C键：打开校准
          setCalibrationOpen(true)
          showAlert('打开校准面板')
          break
          
        case '?': // ?键：显示快捷键帮助
          showAlert('快捷键：空格(开始/暂停) R(重置) ↑↓←→(调整时间) S(设置) C(校准) ESC(关闭)')
          break
      }
    }

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown)
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [timerState, settingsOpen, calibrationOpen, targetTime])

  // 桌面端右键菜单功能
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      // 只在桌面端显示右键菜单
      if (window.innerWidth < 768) return
      
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY })
    }

    const handleClick = () => {
      setContextMenu(null)
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  // 显示键盘提示
  const showKeyboardHints = () => {
    setShowKeyboardHint(true)
    if (keyboardHintTimer.current) {
      clearTimeout(keyboardHintTimer.current)
    }
    keyboardHintTimer.current = setTimeout(() => {
      setShowKeyboardHint(false)
    }, 5000)
  }

  // 右键菜单项处理
  const handleContextMenuAction = (action: string) => {
    setContextMenu(null)
    
    switch (action) {
      case 'toggle':
        toggleTimer()
        showAlert(timerState === 'running' ? '计时器已暂停' : '计时器已开始')
        break
      case 'reset':
        resetTimer()
        showAlert('计时器已重置')
        break
      case 'settings':
        setSettingsOpen(true)
        break
      case 'calibration':
        setCalibrationOpen(true)
        break
      case 'shortcuts':
        showKeyboardHints()
        break
      case 'add5':
        adjustTime(5)
        showAlert('时间+5秒')
        break
      case 'sub5':
        adjustTime(-5)
        showAlert('时间-5秒')
        break
    }
  }

  // 计时器逻辑（带页面可见性优化）
  useEffect(() => {
    let interval: number | null = null

    if (timerState === 'running' && remainingTime > 0) {
      // 开始新的计时周期时重置标志位
      hasTriggeredComplete.current = false
      
      // 根据页面可见性调整更新频率
      const updateInterval = isPageVisible ? 1000 : 5000 // 隐藏时每5秒更新一次

      interval = setInterval(() => {
        setRemainingTime(prev => {
          // 计算实际减少的时间
          const decrement = isPageVisible ? 1 : 5
          const newTime = prev - decrement

          if (newTime <= 0 && !hasTriggeredComplete.current) {
            // 时间到了，触发提醒（只触发一次）
            hasTriggeredComplete.current = true
            handleTimerComplete()
            // 重新开始计时时，同时重置动画进度
            setAnimatedProgress(0)
            setIsTransitioning(false)
            return targetTime // 重新开始计时
          }
          return Math.max(0, newTime) // 确保时间不会小于0
        })
      }, updateInterval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerState, remainingTime, targetTime, isPageVisible])

  // 平滑过渡动画（带页面可见性优化）
  useEffect(() => {
    let animationFrame: number | null = null
    
    if (isTransitioning && transitionStartTime.current && isPageVisible) {
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
    } else if (isTransitioning && !isPageVisible) {
      // 页面隐藏时跳过动画，直接设置最终状态
      setAnimatedProgress(endProgress.current)
      setIsTransitioning(false)
      transitionStartTime.current = null
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isTransitioning, isPageVisible])

  // 更新正常计时时的动画进度
  useEffect(() => {
    if (!isTransitioning && targetTime > 0) {
      const currentProgress = ((targetTime - remainingTime) / targetTime) * 100
      setAnimatedProgress(currentProgress)
    }
  }, [remainingTime, targetTime, isTransitioning])

  // 动态更新页面标题
  useEffect(() => {
    const defaultTitle = '煎饼侠 - 专业煎饼计时器'
    
    if (timerState === 'running' && remainingTime > 0) {
      // 计时中显示剩余时间
      document.title = `⏱️ ${formatTime(remainingTime)} - 煎饼侠`
    } else if (timerState === 'paused') {
      // 暂停中显示暂停状态
      document.title = `⏸️ 已暂停 ${formatTime(remainingTime)} - 煎饼侠`
    } else if (remainingTime === 0) {
      // 时间到了
      document.title = '🔔 时间到！- 煎饼侠'
    } else {
      // 停止状态显示默认标题
      document.title = defaultTitle
    }

    // 组件卸载时恢复默认标题
    return () => {
      if (timerState === 'stopped') {
        document.title = defaultTitle
      }
    }
  }, [timerState, remainingTime])

  // 处理计时完成
  const handleTimerComplete = useCallback(async () => {
    if (!settings) return

    try {
      // 并行播放音效和语音（提升用户体验）
      const promises: Promise<any>[] = []
      
      // 播放音效（如果启用）
      if (settings.soundEffectsEnabled) {
        promises.push(
          soundEffectsManager.playEffect(settings.soundEffectType, {
            volume: settings.volume * 0.6, // 音效音量稍低
            duration: 0.8
          })
        )
      }
      
      // 播放语音提醒（如果启用）
      if (settings.speechEnabled) {
        if (settings.customVoiceId) {
          // 使用自定义录制的语音
          promises.push(
            speechManager.speak('', {
              volume: settings.volume,
              customVoiceId: settings.customVoiceId
            })
          )
        } else {
          // 使用系统语音合成
          promises.push(
            speechManager.speakWithEnhancedSettings(
              settings.customPrompt,
              settings.volume,
              settings.speechRate,
              settings.speechPitch,
              settings.voiceType
            )
          )
        }
      }
      
      // 振动提醒
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([500, 200, 500])
      }

      // 桌面通知提醒
      if (settings.notificationEnabled) {
        promises.push(
          notificationManager.showFlipReminder(settings.customPrompt)
        )
      }

      // 等待音效和语音完成（但不阻塞其他操作）
      Promise.all(promises).catch(error => {
        console.warn('Audio alerts failed:', error)
      })

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
      // 重置完成标志位
      hasTriggeredComplete.current = false
      // 开始计时时，确保动画进度与当前时间同步
      if (!isTransitioning && targetTime > 0) {
        const currentProgress = ((targetTime - remainingTime) / targetTime) * 100
        setAnimatedProgress(currentProgress)
      }
    } else {
      setTimerState('paused')
    }
  }

  // 重置计时器（重新开始计时）
  const resetTimer = () => {
    setRemainingTime(targetTime)
    setTimerState('running')
    // 重置完成标志位
    hasTriggeredComplete.current = false
    // 重置动画进度，确保圈圈从满重新开始
    setAnimatedProgress(0)
    setIsTransitioning(false)
  }

  // 调整时间（+1秒/-1秒或+5秒/-5秒）
  const adjustTime = (delta: number) => {
    // 计算新的总时间（提醒周期）
    const newTargetTime = Math.max(1, targetTime + delta)
    
    if (timerState === 'running') {
      // 运行时：先调整总时间设置，然后直接调整当前剩余时间
      
      // 1. 更新提醒周期设置（以后的每次计时都使用新的周期）
      setTargetTime(newTargetTime)
      
      // 2. 直接调整当前剩余时间
      let newRemainingTime = remainingTime + delta
      
      // 3. 处理边界情况
      if (newRemainingTime <= 0) {
        // 如果剩余时间不够减，直接开启下一轮计时
        handleTimerComplete() // 触发当前轮完成
        newRemainingTime = newTargetTime // 重新开始新一轮
        // 重置完成标志位，允许新一轮的完成事件
        hasTriggeredComplete.current = false
      } else if (newRemainingTime > newTargetTime) {
        // 如果剩余时间超过了新的周期时间，限制在周期时间内
        newRemainingTime = newTargetTime
      }
      
      setRemainingTime(newRemainingTime)
      
      // 更新动画进度
      const newProgress = ((newTargetTime - newRemainingTime) / newTargetTime) * 100
      setAnimatedProgress(newProgress)
      setIsTransitioning(false)
      
      // 保存新的时间设置
      if (settings) {
        const updatedSettings = { ...settings, flipInterval: newTargetTime }
        setSettings(updatedSettings)
        storageManager.saveSettings(updatedSettings)
      }
      
      console.log(`时间调整：周期 ${targetTime}s -> ${newTargetTime}s，剩余时间 ${remainingTime}s -> ${newRemainingTime}s`)
    } else {
      // 停止状态下的调整逻辑保持不变
      setTargetTime(newTargetTime)
      setRemainingTime(newTargetTime)
      // 停止状态下调整时间，重置动画进度为0
      setAnimatedProgress(0)
      setIsTransitioning(false)
      
      // 保存新的时间设置
      if (settings) {
        const updatedSettings = { ...settings, flipInterval: newTargetTime }
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
    
    const newSettings: PancakeSettings = settings ? { 
      ...settings, 
      flipInterval: calibratedTime 
    } : {
      flipInterval: calibratedTime,
      customPrompt: '该翻面了！',
      volume: 0.8,
      speechRate: 1.0,
      speechPitch: 1.0,
      voiceType: 'auto',
      vibrationEnabled: true,
      speechEnabled: true,
      soundEffectsEnabled: true,
      soundEffectType: 'chime',
      notificationEnabled: true,
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
        
        {/* 状态指示器 */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {/* 页面可见性状态指示器 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPageVisible ? (
              <VisibilityIcon 
                sx={{ 
                  fontSize: 18, 
                  color: 'success.main'
                }} 
              />
            ) : (
              <VisibilityOffIcon 
                sx={{ 
                  fontSize: 18, 
                  color: 'text.disabled'
                }} 
              />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.65rem',
                color: isPageVisible ? 'success.main' : 'text.disabled',
                fontWeight: isPageVisible ? 600 : 400
              }}
            >
              {isPageVisible ? '可见' : '隐藏'}
            </Typography>
          </Box>

          {/* 屏幕常亮状态指示器 */}
          {wakeLockSupported && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {wakeLockActive ? (
                <LightbulbIcon 
                  sx={{ 
                    fontSize: 18, 
                    color: 'warning.main',
                    filter: 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.6))'
                  }} 
                />
              ) : (
                <LightbulbOutlinedIcon 
                  sx={{ 
                    fontSize: 18, 
                    color: 'text.disabled'
                  }} 
                />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem',
                  color: wakeLockActive ? 'warning.main' : 'text.disabled',
                  fontWeight: wakeLockActive ? 600 : 400
                }}
              >
                {wakeLockActive ? '常亮' : ''}
              </Typography>
            </Box>
          )}
        </Box>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <IconButton 
              onClick={() => adjustTime(-5)} 
              color="primary"
              size="large"
              sx={{ bgcolor: 'grey.100' }}
            >
              <RemoveIcon />
            </IconButton>
            <IconButton 
              onClick={() => adjustTime(-1)} 
              color="primary"
              size="small"
              sx={{ bgcolor: 'grey.100' }}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
              {formatTime(targetTime)}
            </Typography>
            <IconButton 
              onClick={() => adjustTime(1)} 
              color="primary"
              size="small"
              sx={{ bgcolor: 'grey.100' }}
            >
              <AddIcon />
            </IconButton>
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
              onClick={() => adjustTime(-1)}
              startIcon={<RemoveIcon />}
            >
              -1秒
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => adjustTime(1)}
              startIcon={<AddIcon />}
            >
              +1秒
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

      {/* 桌面端右键菜单 */}
      {contextMenu && (
        <div
          className="pancake-timer-context-menu"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 300)
          }}
        >
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('toggle')}
          >
            {timerState === 'running' ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
            {timerState === 'running' ? '暂停计时' : '开始计时'}
          </button>
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('reset')}
          >
            <RefreshIcon fontSize="small" />
            重置计时器
          </button>
          <div className="pancake-timer-context-menu-divider" />
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('add5')}
          >
            <AddIcon fontSize="small" />
            时间 +5秒
          </button>
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('sub5')}
          >
            <RemoveIcon fontSize="small" />
            时间 -5秒
          </button>
          <div className="pancake-timer-context-menu-divider" />
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('settings')}
          >
            <SettingsIcon fontSize="small" />
            打开设置
          </button>
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('calibration')}
          >
            <TimerIcon fontSize="small" />
            时间校准
          </button>
          <div className="pancake-timer-context-menu-divider" />
          <button
            className="pancake-timer-context-menu-item"
            onClick={() => handleContextMenuAction('shortcuts')}
          >
            ⌨️ 查看快捷键
          </button>
        </div>
      )}

      {/* 键盘快捷键提示 */}
      <div className={`pancake-timer-keyboard-hint ${showKeyboardHint ? 'show' : ''}`}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>键盘快捷键：</div>
        <div>空格: 开始/暂停 | R: 重置</div>
        <div>↑↓: ±5秒 | ←→: ±1秒</div>
        <div>S: 设置 | C: 校准 | ESC: 关闭</div>
        <div>?: 显示此帮助</div>
      </div>
    </Box>
  )
}

export default PancakeTimer

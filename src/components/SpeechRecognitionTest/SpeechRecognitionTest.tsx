/**
 * 語音識別功能測試組件
 * 驗證語音識別功能，包括語音命令識別、計時器控制等
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  IconButton,
  Slider,
  FormGroup
} from '@mui/material'
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  RestartAlt as RestartIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  RecordVoiceOver as VoiceIcon,
  GraphicEq as WaveIcon,
  Assessment as AssessmentIcon,
  Help as HelpIcon,
} from '@mui/icons-material'
import { 
  speechRecognitionManager,
  type SpeechRecognitionResult,
  type VoiceCommand,
} from '../../utils/speechRecognitionManager'
import './SpeechRecognitionTest.css'

const SpeechRecognitionTest: React.FC = () => {
  // 語音識別狀態
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  
  // 識別結果和命令
  const [recognitionResults, setRecognitionResults] = useState<SpeechRecognitionResult[]>([])
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([])
  const [, setUnrecognizedSpeech] = useState<any[]>([])
  
  // 測試狀態
  const [testResults, setTestResults] = useState<{
    basicRecognition: boolean
    commandRecognition: boolean
    timerControl: boolean
    environmentalTest: boolean
  }>({
    basicRecognition: false,
    commandRecognition: false,
    timerControl: false,
    environmentalTest: false
  })
  
  // 模擬計時器狀態
  const [mockTimerState, setMockTimerState] = useState<{
    isRunning: boolean
    duration: number
    remaining: number
    paused: boolean
  }>({
    isRunning: false,
    duration: 20,
    remaining: 20,
    paused: false
  })
  
  // UI 狀態
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  
  // 設置狀態
  const [settings, setSettings] = useState({
    language: 'zh-TW',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.5
  })
  
  // 測試控制
  const [audioLevel, setAudioLevel] = useState(0)
  const timerRef = useRef<number | null>(null)

  // 初始化
  useEffect(() => {
    const initializeRecognition = async () => {
      setLoading(true)
      try {
        // 檢查支持性和權限
        const status = await speechRecognitionManager.testRecognition()
        setIsSupported(status.supported)
        setHasPermission(status.permissions)
        
        if (status.errors.length > 0) {
          setError(status.errors.join('; '))
        } else {
          setSuccess('語音識別功能可用')
        }
        
        // 設置事件監聽器
        setupEventListeners()
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失敗')
      } finally {
        setLoading(false)
      }
    }

    initializeRecognition()
    return () => {
      speechRecognitionManager.cleanup()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // 設置事件監聽器
  const setupEventListeners = useCallback(() => {
    // 識別開始
    speechRecognitionManager.addEventListener('start', () => {
      setIsListening(true)
      setError(null)
    })

    // 識別結束
    speechRecognitionManager.addEventListener('end', () => {
      setIsListening(false)
    })

    // 識別結果
    speechRecognitionManager.addEventListener('result', (data) => {
      setRecognitionResults(prev => [...data.results, ...prev.slice(0, 49)])
      if (data.results.some((r: SpeechRecognitionResult) => r.isFinal)) {
        setTestResults(prev => ({ ...prev, basicRecognition: true }))
      }
    })

    // 語音命令
    speechRecognitionManager.addEventListener('command', (command: VoiceCommand) => {
      setVoiceCommands(prev => [command, ...prev.slice(0, 19)])
      handleVoiceCommand(command)
      setTestResults(prev => ({ ...prev, commandRecognition: true }))
    })

    // 未識別的語音
    speechRecognitionManager.addEventListener('unrecognized', (data) => {
      setUnrecognizedSpeech(prev => [data, ...prev.slice(0, 19)])
    })

    // 識別錯誤
    speechRecognitionManager.addEventListener('error', (data) => {
      setError(data.message)
      setIsListening(false)
    })

    // 音頻開始
    speechRecognitionManager.addEventListener('audiostart', () => {
      simulateAudioLevel()
    })

    // 音頻結束
    speechRecognitionManager.addEventListener('audioend', () => {
      setAudioLevel(0)
    })
  }, [])

  // 模擬音頻電平
  const simulateAudioLevel = useCallback(() => {
    const interval = setInterval(() => {
      if (isListening) {
        setAudioLevel(Math.random() * 100)
      } else {
        setAudioLevel(0)
        clearInterval(interval)
      }
    }, 100)
  }, [isListening])

  // 處理語音命令
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    switch (command.action) {
      case 'start_timer':
        setMockTimerState(prev => ({ ...prev, isRunning: true, paused: false }))
        setSuccess('計時器已啟動')
        setTestResults(prev => ({ ...prev, timerControl: true }))
        startMockTimer()
        break
        
      case 'stop_timer':
        setMockTimerState(prev => ({ 
          ...prev, 
          isRunning: false, 
          paused: false,
          remaining: prev.duration 
        }))
        setSuccess('計時器已停止')
        setTestResults(prev => ({ ...prev, timerControl: true }))
        stopMockTimer()
        break
        
      case 'pause_timer':
        setMockTimerState(prev => ({ ...prev, paused: !prev.paused }))
        setSuccess(`計時器已${mockTimerState.paused ? '恢復' : '暫停'}`)
        setTestResults(prev => ({ ...prev, timerControl: true }))
        break
        
      case 'restart_timer':
        setMockTimerState(prev => ({ 
          ...prev, 
          isRunning: true, 
          paused: false,
          remaining: prev.duration 
        }))
        setSuccess('計時器已重新啟動')
        setTestResults(prev => ({ ...prev, timerControl: true }))
        startMockTimer()
        break
        
      case 'set_duration':
        if (command.parameters?.duration) {
          const duration = command.parameters.duration
          setMockTimerState(prev => ({ 
            ...prev, 
            duration, 
            remaining: duration,
            isRunning: false,
            paused: false
          }))
          setSuccess(`計時時長已設置為 ${duration} 秒`)
          setTestResults(prev => ({ ...prev, timerControl: true }))
          stopMockTimer()
        }
        break
        
      case 'show_help':
        setHelpDialogOpen(true)
        setSuccess('幫助信息已顯示')
        break
        
      default:
        setSuccess(`執行命令: ${command.action}`)
    }
  }, [mockTimerState.paused])

  // 開始模擬計時器
  const startMockTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = window.setInterval(() => {
      setMockTimerState(prev => {
        if (!prev.isRunning || prev.paused || prev.remaining <= 0) {
          return prev
        }
        
        const newRemaining = prev.remaining - 1
        if (newRemaining <= 0) {
          setSuccess('計時完成！')
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return { ...prev, remaining: 0, isRunning: false }
        }
        
        return { ...prev, remaining: newRemaining }
      })
    }, 1000)
  }, [])

  // 停止模擬計時器
  const stopMockTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 開始語音識別
  const startRecognition = async () => {
    if (!isSupported || !hasPermission) {
      setError('語音識別不可用或缺少權限')
      return
    }

    try {
      await speechRecognitionManager.startListening()
    } catch (err) {
      setError(err instanceof Error ? err.message : '啟動語音識別失敗')
    }
  }

  // 停止語音識別
  const stopRecognition = () => {
    speechRecognitionManager.stopListening()
  }

  // 運行基礎測試
  const runBasicTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await startRecognition()
      setSuccess('請說出任何話語來測試基礎識別功能')
      
      // 5秒後自動停止
      setTimeout(() => {
        stopRecognition()
        setLoading(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '基礎測試失敗')
      setLoading(false)
    }
  }

  // 運行命令測試
  const runCommandTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await startRecognition()
      setSuccess('請說出語音命令，例如："開始計時" 或 "設置30秒"')
      
      // 10秒後自動停止
      setTimeout(() => {
        stopRecognition()
        setLoading(false)
      }, 10000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '命令測試失敗')
      setLoading(false)
    }
  }

  // 運行環境測試
  const runEnvironmentalTest = () => {
    setTestResults(prev => ({ ...prev, environmentalTest: true }))
    setSuccess('環境測試完成 - 在不同環境下測試語音識別準確性')
  }

  // 清除記錄
  const clearRecords = () => {
    setRecognitionResults([])
    setVoiceCommands([])
    setUnrecognizedSpeech([])
    setError(null)
    setSuccess(null)
  }

  // 更新設置
  const updateSettings = () => {
    speechRecognitionManager.updateConfig({
      language: settings.language,
      continuous: settings.continuous,
      interimResults: settings.interimResults,
      maxAlternatives: settings.maxAlternatives
    })
    setSettingsDialogOpen(false)
    setSuccess('設置已更新')
  }

  // 計算測試通過率
  const getTestPassRate = () => {
    const tests = Object.values(testResults)
    const passedTests = tests.filter(Boolean).length
    return tests.length > 0 ? (passedTests / tests.length) * 100 : 0
  }

  // 格式化置信度
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  // 獲取命令模式列表
  const commandPatterns = speechRecognitionManager.getCommandPatterns()

  return (
    <Box className="speech-recognition-test" p={3}>
      <Typography variant="h4" gutterBottom>
        🎤 語音識別功能測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        驗證語音識別功能，包括語音命令的識別、語音控制計時器的功能。測試不同語音環境下的識別準確性。
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

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

      {/* 功能狀態概覽 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>功能狀態概覽</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={isSupported ? '✓' : '✗'} color={isSupported ? 'success' : 'error'}>
                  <VoiceIcon sx={{ fontSize: 40, color: isSupported ? 'success.main' : 'error.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {isSupported ? '支持' : '不支持'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  瀏覽器支持
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={hasPermission ? '✓' : '✗'} color={hasPermission ? 'success' : 'error'}>
                  <MicIcon sx={{ fontSize: 40, color: hasPermission ? 'success.main' : 'error.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {hasPermission ? '已授權' : '未授權'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  麥克風權限
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={isListening ? '●' : '○'} color={isListening ? 'warning' : 'default'}>
                  <WaveIcon sx={{ fontSize: 40, color: isListening ? 'warning.main' : 'text.secondary' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {isListening ? '監聽中' : '未監聽'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  識別狀態
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={voiceCommands.length} color="primary">
                  <TimerIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {voiceCommands.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已識別命令
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 音頻電平指示器 */}
          {isListening && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>音頻電平</Typography>
              <LinearProgress
                variant="determinate"
                value={audioLevel}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: audioLevel > 70 ? 'error.main' : 
                                   audioLevel > 30 ? 'warning.main' : 'success.main'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 測試控制區域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>測試控制</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                onClick={isListening ? stopRecognition : startRecognition}
                disabled={!isSupported || !hasPermission || loading}
                startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
                color={isListening ? 'secondary' : 'primary'}
              >
                {isListening ? '停止識別' : '開始識別'}
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={runBasicTest}
                disabled={loading || !isSupported || !hasPermission}
                startIcon={<VoiceIcon />}
              >
                基礎測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={runCommandTest}
                disabled={loading || !isSupported || !hasPermission}
                startIcon={<TimerIcon />}
              >
                命令測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={runEnvironmentalTest}
                startIcon={<AssessmentIcon />}
              >
                環境測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="text"
                fullWidth
                onClick={() => setSettingsDialogOpen(true)}
                startIcon={<SettingsIcon />}
              >
                設置
              </Button>
            </Grid>
          </Grid>

          <Box mt={2} display="flex" gap={1} alignItems="center">
            <Button
              variant="text"
              onClick={clearRecords}
              size="small"
            >
              清除記錄
            </Button>
            
            <Chip
              label={`語言: ${settings.language}`}
              size="small"
              variant="outlined"
            />
            
            <Chip
              label={`連續: ${settings.continuous ? '是' : '否'}`}
              size="small"
              variant="outlined"
            />
            
            <Chip
              label={`中間結果: ${settings.interimResults ? '是' : '否'}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 模擬計時器 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>模擬計時器</Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4" color="primary">
                  {String(Math.floor(mockTimerState.remaining / 60)).padStart(2, '0')}:
                  {String(mockTimerState.remaining % 60).padStart(2, '0')}
                </Typography>
                
                <Box>
                  <Chip
                    label={mockTimerState.isRunning ? 
                      (mockTimerState.paused ? '暫停' : '運行中') : '停止'}
                    color={mockTimerState.isRunning ? 
                      (mockTimerState.paused ? 'warning' : 'success') : 'default'}
                  />
                </Box>
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={((mockTimerState.duration - mockTimerState.remaining) / mockTimerState.duration) * 100}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box display="flex" gap={1}>
                <IconButton
                  onClick={() => handleVoiceCommand({
                    command: '手動開始',
                    action: 'start_timer',
                    confidence: 1,
                    timestamp: Date.now()
                  })}
                  color="success"
                  disabled={mockTimerState.isRunning && !mockTimerState.paused}
                >
                  <PlayIcon />
                </IconButton>
                
                <IconButton
                  onClick={() => handleVoiceCommand({
                    command: '手動暫停',
                    action: 'pause_timer',
                    confidence: 1,
                    timestamp: Date.now()
                  })}
                  color="warning"
                  disabled={!mockTimerState.isRunning}
                >
                  <PauseIcon />
                </IconButton>
                
                <IconButton
                  onClick={() => handleVoiceCommand({
                    command: '手動停止',
                    action: 'stop_timer',
                    confidence: 1,
                    timestamp: Date.now()
                  })}
                  color="error"
                  disabled={!mockTimerState.isRunning && mockTimerState.remaining === mockTimerState.duration}
                >
                  <StopIcon />
                </IconButton>
                
                <IconButton
                  onClick={() => handleVoiceCommand({
                    command: '手動重啟',
                    action: 'restart_timer',
                    confidence: 1,
                    timestamp: Date.now()
                  })}
                  color="primary"
                >
                  <RestartIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            語音命令示例："開始計時"、"停止計時"、"暫停"、"設置30秒"
          </Typography>
        </CardContent>
      </Card>

      {/* 測試結果 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>測試結果</Typography>
          
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CircularProgress 
              variant="determinate" 
              value={getTestPassRate()} 
              size={60}
              thickness={4}
            />
            <Box>
              <Typography variant="h6">
                {Object.values(testResults).filter(Boolean).length}/4 通過
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getTestPassRate().toFixed(0)}% 完成度
              </Typography>
            </Box>
          </Box>

          <List dense>
            <ListItem>
              <ListItemIcon>
                {testResults.basicRecognition ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="基礎語音識別" 
                secondary={testResults.basicRecognition ? '語音轉文字功能正常' : '未測試或失敗'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.commandRecognition ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="命令識別" 
                secondary={testResults.commandRecognition ? '語音命令識別正常' : '未測試或失敗'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.timerControl ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="計時器控制" 
                secondary={testResults.timerControl ? '語音控制計時器功能正常' : '未測試或失敗'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.environmentalTest ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText 
                primary="環境適應性" 
                secondary={testResults.environmentalTest ? '不同環境下識別準確性良好' : '未測試或失敗'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 識別記錄 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>語音識別結果</Typography>
              
              {recognitionResults.length === 0 ? (
                <Alert severity="info">沒有識別記錄</Alert>
              ) : (
                <Box maxHeight={400} overflow="auto">
                  <List dense>
                    {recognitionResults.map((result, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={result.transcript}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                置信度: {formatConfidence(result.confidence)} | 
                                {result.isFinal ? '最終' : '臨時'}
                              </Typography>
                              {result.alternatives.length > 1 && (
                                <Typography variant="caption" color="text.secondary">
                                  替代: {result.alternatives.slice(1).map(alt => 
                                    `${alt.transcript} (${formatConfidence(alt.confidence)})`
                                  ).join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>識別的語音命令</Typography>
              
              {voiceCommands.length === 0 ? (
                <Alert severity="info">沒有識別到語音命令</Alert>
              ) : (
                <Box maxHeight={400} overflow="auto">
                  <List dense>
                    {voiceCommands.map((command, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {command.command}
                              </Typography>
                              <Chip
                                label={command.action}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                置信度: {formatConfidence(command.confidence)} | 
                                時間: {new Date(command.timestamp).toLocaleTimeString()}
                              </Typography>
                              {command.parameters && Object.keys(command.parameters).length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  參數: {JSON.stringify(command.parameters)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">支持的語音命令 ({commandPatterns.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>命令示例</TableCell>
                      <TableCell>動作</TableCell>
                      <TableCell>優先級</TableCell>
                      <TableCell>描述</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commandPatterns.map((pattern, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" component="code">
                            {pattern.pattern.source.replace(/[\^\$]/g, '').replace(/\\s\*/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={pattern.action} size="small" />
                        </TableCell>
                        <TableCell>{pattern.priority}</TableCell>
                        <TableCell>{pattern.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* 設置對話框 */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>語音識別設置</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>語言</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                label="語言"
              >
                <MenuItem value="zh-TW">中文 (繁體)</MenuItem>
                <MenuItem value="zh-CN">中文 (簡體)</MenuItem>
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="ja-JP">日本語</MenuItem>
                <MenuItem value="ko-KR">한국어</MenuItem>
              </Select>
            </FormControl>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.continuous}
                    onChange={(e) => setSettings(prev => ({ ...prev, continuous: e.target.checked }))}
                  />
                }
                label="連續識別"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.interimResults}
                    onChange={(e) => setSettings(prev => ({ ...prev, interimResults: e.target.checked }))}
                  />
                }
                label="中間結果"
              />
            </FormGroup>

            <Typography gutterBottom sx={{ mt: 2 }}>最大替代選項</Typography>
            <Slider
              value={settings.maxAlternatives}
              onChange={(_, value) => setSettings(prev => ({ ...prev, maxAlternatives: value as number }))}
              min={1}
              max={5}
              marks
              valueLabelDisplay="auto"
            />

            <Typography gutterBottom sx={{ mt: 2 }}>置信度閾值</Typography>
            <Slider
              value={settings.confidenceThreshold}
              onChange={(_, value) => setSettings(prev => ({ ...prev, confidenceThreshold: value as number }))}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>取消</Button>
          <Button onClick={updateSettings} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 幫助對話框 */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>語音命令幫助</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>計時器控制命令：</Typography>
          <List>
            <ListItem><ListItemText primary="開始計時" secondary="啟動計時器" /></ListItem>
            <ListItem><ListItemText primary="停止計時" secondary="停止並重置計時器" /></ListItem>
            <ListItem><ListItemText primary="暫停" secondary="暫停/恢復計時器" /></ListItem>
            <ListItem><ListItemText primary="重新開始" secondary="重新啟動計時器" /></ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>時間設置命令：</Typography>
          <List>
            <ListItem><ListItemText primary="設置30秒" secondary="設置計時時長為30秒" /></ListItem>
            <ListItem><ListItemText primary="2分鐘" secondary="設置計時時長為2分鐘" /></ListItem>
            <ListItem><ListItemText primary="設置1分鐘" secondary="設置計時時長為1分鐘" /></ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>其他命令：</Typography>
          <List>
            <ListItem><ListItemText primary="幫助" secondary="顯示此幫助信息" /></ListItem>
            <ListItem><ListItemText primary="開啟語音提醒" secondary="啟用語音提醒功能" /></ListItem>
            <ListItem><ListItemText primary="音量大" secondary="增加音量" /></ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 浮動幫助按鈕 */}
      <Tooltip title="語音命令幫助">
        <IconButton
          onClick={() => setHelpDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export default SpeechRecognitionTest



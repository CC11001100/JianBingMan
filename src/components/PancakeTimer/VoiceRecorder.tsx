import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider
} from '@mui/material'
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  // Add as AddIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material'
import { storageManager, type CustomVoiceRecord } from '../../utils/storage'
import './VoiceRecorder.css'

interface VoiceRecorderProps {
  onVoiceSelect?: (audioBlob: Blob | null, voiceId?: string | null) => void
  selectedVoiceId?: string | null
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceSelect,
  selectedVoiceId
}) => {
  // 录音状态
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 保存状态
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [voiceName, setVoiceName] = useState('')
  
  // 录音列表
  const [voiceRecords, setVoiceRecords] = useState<CustomVoiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // 错误状态
  const [error, setError] = useState<string>('')
  const [isSupported, setIsSupported] = useState(true)

  // refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  // const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // 检查录音支持
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        setIsSupported(supported)
        
        if (!supported) {
          setError('您的浏览器不支持录音功能')
        }
      } catch (err) {
        setIsSupported(false)
        setError('录音功能初始化失败')
      }
    }

    checkSupport()
    loadVoiceRecords()
  }, [])

  // 加载语音记录
  const loadVoiceRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const records = await storageManager.getCustomVoices()
      setVoiceRecords(records)
    } catch (err) {
      console.error('Failed to load voice records:', err)
      setError('加载语音记录失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('您的浏览器不支持录音功能')
      return
    }

    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // 设置事件监听
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      // 开始录音
      mediaRecorder.start(1000) // 每秒收集一次数据
      setIsRecording(true)
      setRecordingTime(0)

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Recording failed:', err)
      setError('录音失败，请检查麦克风权限')
    }
  }, [isSupported])

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }, [isRecording])

  // 播放录音
  const playRecording = useCallback(async (blob: Blob) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio

      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
      }
      audio.onerror = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
        setError('播放失败')
      }

      await audio.play()
    } catch (err) {
      console.error('Playback failed:', err)
      setError('播放失败')
    }
  }, [])

  // 停止播放
  const stopPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      setIsPlaying(false)
    }
  }, [])

  // 保存录音
  const saveRecording = useCallback(async () => {
    if (!audioBlob || !voiceName.trim()) return

    try {
      const newRecord: CustomVoiceRecord = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: voiceName.trim(),
        audioBlob,
        duration: recordingTime,
        createdAt: Date.now()
      }

      // 保存到IndexedDB
      await storageManager.saveCustomVoice(newRecord)

      // 重新加载列表
      await loadVoiceRecords()

      // 清理状态
      setAudioBlob(null)
      setVoiceName('')
      setSaveDialogOpen(false)
      setRecordingTime(0)

      // 自动选择新录音
      onVoiceSelect?.(audioBlob, newRecord.id)
    } catch (err) {
      console.error('Failed to save recording:', err)
      setError('保存录音失败')
    }
  }, [audioBlob, voiceName, recordingTime, loadVoiceRecords, onVoiceSelect])

  // 删除录音
  const deleteRecording = useCallback(async (id: string) => {
    try {
      // 从IndexedDB删除
      await storageManager.deleteCustomVoice(id)

      // 重新加载列表
      await loadVoiceRecords()

      // 如果删除的是当前选中的录音，清除选择
      if (selectedVoiceId === id) {
        onVoiceSelect?.(null, null)
      }
    } catch (err) {
      console.error('Failed to delete recording:', err)
      setError('删除录音失败')
    }
  }, [selectedVoiceId, onVoiceSelect, loadVoiceRecords])

  // 选择录音
  const selectVoice = useCallback((record: CustomVoiceRecord) => {
    onVoiceSelect?.(record.audioBlob, record.id)
  }, [onVoiceSelect])

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
    }
  }, [])

  if (!isSupported) {
    return (
      <Alert severity="error">
        您的浏览器不支持录音功能，请使用最新版本的Chrome、Firefox或Safari浏览器
      </Alert>
    )
  }

  return (
    <Box>
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 录音控制区域 */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MicIcon color="primary" />
            录制自定义语音
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isRecording ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={60} color="error" />
                  <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MicIcon sx={{ color: 'error.main', fontSize: 24 }} />
                  </Box>
                </Box>
                <Typography variant="h5" color="error" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  {formatTime(recordingTime)}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopRecording}
                  size="large"
                >
                  停止录音
                </Button>
              </Box>
            ) : (
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  开始录音
                </Button>
                <Typography variant="body2" color="text.secondary">
                  点击开始录制您的自定义提示语音
                </Typography>
              </Box>
            )}
          </Box>

          {/* 录音预览 */}
          {audioBlob && !isRecording && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                录音预览 ({formatTime(recordingTime)})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                  onClick={isPlaying ? stopPlayback : () => playRecording(audioBlob)}
                >
                  {isPlaying ? '停止' : '播放'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialogOpen(true)}
                >
                  保存
                </Button>
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  onClick={() => setAudioBlob(null)}
                >
                  重录
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 已保存的录音列表 */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolumeUpIcon color="primary" />
            我的录音 ({voiceRecords.length})
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : voiceRecords.length > 0 ? (
            <List>
              {voiceRecords.map((record, index) => (
                <React.Fragment key={record.id}>
                  <ListItem 
                    sx={{ 
                      border: selectedVoiceId === record.id ? 2 : 1,
                      borderColor: selectedVoiceId === record.id ? 'primary.main' : 'grey.300',
                      borderStyle: 'solid',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => selectVoice(record)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {record.name}
                          {selectedVoiceId === record.id && (
                            <Chip label="已选择" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            时长: {formatTime(record.duration)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            创建: {new Date(record.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          playRecording(record.audioBlob)
                        }}
                        sx={{ mr: 1 }}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRecording(record.id)
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < voiceRecords.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                还没有保存的录音，开始录制您的第一个自定义语音吧！
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 保存录音对话框 */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>保存录音</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="录音名称"
            fullWidth
            variant="outlined"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="例如：煎饼翻面提醒"
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            为您的录音起一个容易识别的名称
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={saveRecording} 
            variant="contained"
            disabled={!voiceName.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VoiceRecorder

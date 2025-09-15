import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  Divider
} from '@mui/material'
import {
  Close as CloseIcon,
  VolumeUp as VolumeIcon,
  Vibration as VibrationIcon
} from '@mui/icons-material'
import { storageManager, type PancakeSettings } from '../../utils/storage'
import { speechManager } from '../../utils/speechSynthesis'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: PancakeSettings
  onSettingsUpdate: (settings: PancakeSettings) => void
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onSettingsUpdate
}) => {
  const [localSettings, setLocalSettings] = useState<PancakeSettings>(settings)
  const [testingVoice, setTestingVoice] = useState(false)
  const [saveError, setSaveError] = useState('')

  // 同步外部设置到本地状态
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // 更新翻面时间
  const updateFlipInterval = (minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds
    setLocalSettings(prev => ({ ...prev, flipInterval: totalSeconds }))
  }

  // 获取分钟和秒数
  const getMinutesSeconds = () => {
    const minutes = Math.floor(localSettings.flipInterval / 60)
    const seconds = localSettings.flipInterval % 60
    return { minutes, seconds }
  }

  // 测试语音
  const testVoice = async () => {
    if (testingVoice) return
    
    setTestingVoice(true)
    try {
      await speechManager.speak(localSettings.customPrompt, { 
        volume: localSettings.volume 
      })
    } catch (error) {
      console.error('Voice test failed:', error)
    } finally {
      setTestingVoice(false)
    }
  }

  // 保存设置
  const handleSave = async () => {
    try {
      setSaveError('')
      
      // 验证设置
      if (localSettings.flipInterval < 10) {
        setSaveError('翻面时间不能少于10秒')
        return
      }
      
      if (!localSettings.customPrompt.trim()) {
        setSaveError('提示语不能为空')
        return
      }

      // 保存到存储
      await storageManager.saveSettings(localSettings)
      
      // 更新父组件
      onSettingsUpdate(localSettings)
      
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveError('保存设置失败，请重试')
    }
  }

  // 重置为默认设置
  const resetToDefaults = () => {
    const defaultSettings: PancakeSettings = {
      flipInterval: 120,
      customPrompt: '该翻面了！',
      volume: 0.8,
      vibrationEnabled: true,
      lastUsed: Date.now()
    }
    setLocalSettings(defaultSettings)
  }

  const { minutes, seconds } = getMinutesSeconds()

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">⚙️ 计时器设置</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        {/* 翻面时间设置 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🕐 翻面时间间隔
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="分钟"
              type="number"
              value={minutes}
              onChange={(e) => updateFlipInterval(parseInt(e.target.value) || 0, seconds)}
              inputProps={{ min: 0, max: 59 }}
              size="small"
              sx={{ width: 100 }}
            />
            <Typography>:</Typography>
            <TextField
              label="秒钟"
              type="number"
              value={seconds}
              onChange={(e) => updateFlipInterval(minutes, parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 59 }}
              size="small"
              sx={{ width: 100 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            当前设置：{Math.floor(localSettings.flipInterval / 60)}分{localSettings.flipInterval % 60}秒
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 自定义提示语 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🔊 语音提示语
          </Typography>
          <TextField
            fullWidth
            value={localSettings.customPrompt}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
            placeholder="输入自定义提示语..."
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Button 
            variant="outlined" 
            onClick={testVoice}
            disabled={testingVoice || !localSettings.customPrompt.trim()}
            startIcon={<VolumeIcon />}
            size="small"
          >
            {testingVoice ? '测试中...' : '测试语音'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 音量设置 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🔈 语音音量
          </Typography>
          <Slider
            value={localSettings.volume}
            onChange={(_, value) => setLocalSettings(prev => ({ ...prev, volume: value as number }))}
            min={0}
            max={1}
            step={0.1}
            marks={[
              { value: 0, label: '静音' },
              { value: 0.5, label: '50%' },
              { value: 1, label: '最大' }
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 振动设置 */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.vibrationEnabled}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  vibrationEnabled: e.target.checked 
                }))}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VibrationIcon />
                <Typography>启用振动提醒</Typography>
              </Box>
            }
          />
          {!('vibrate' in navigator) && (
            <Typography variant="body2" color="warning.main" sx={{ ml: 4 }}>
              当前设备不支持振动功能
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={resetToDefaults} color="inherit">
          恢复默认
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSave} variant="contained">
          保存设置
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SettingsDialog

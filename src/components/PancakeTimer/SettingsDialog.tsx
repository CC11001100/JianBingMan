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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid
} from '@mui/material'
import {
  Close as CloseIcon,
  VolumeUp as VolumeIcon,
  Vibration as VibrationIcon,
  Casino as DiceIcon
} from '@mui/icons-material'
import { storageManager, type PancakeSettings } from '../../utils/storage'
import { speechManager } from '../../utils/speechSynthesis'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: PancakeSettings
  onSettingsUpdate: (settings: PancakeSettings) => void
}

// 预设的有趣提示音选项
const PRESET_PROMPTS = [
  { label: '经典提醒', value: '该翻面了！', category: 'classic' },
  { label: '专业主厨', value: '主厨，您的煎饼需要翻面啦！', category: 'professional' },
  { label: '可爱萌系', value: '哎呀哎呀，小煎饼要翻个身了~', category: 'cute' },
  { label: '搞笑风格', value: '煎饼君：救命！我要被烤糊了！快翻我！', category: 'funny' },
  { label: '武侠风格', value: '江湖人称煎饼侠，此时不翻更待何时！', category: 'wuxia' },
  { label: '温馨提醒', value: '亲爱的，记得给煎饼翻个身哦~', category: 'warm' },
  { label: '紧急警报', value: '警报！警报！煎饼即将过熟，请立即翻面！', category: 'urgent' },
  { label: '诗意表达', value: '春花秋月何时了，煎饼翻面知多少', category: 'poetic' },
  { label: '科技感', value: '系统提示：煎饼翻转程序已激活，请执行翻面操作', category: 'tech' },
  { label: '方言版本', value: '哎呀妈呀，煎饼该翻过来咯！', category: 'dialect' },
  { label: '游戏风格', value: '叮！您的煎饼升级了！请翻面解锁下一关！', category: 'game' },
  { label: '正能量', value: '相信自己，您一定能煎出最棒的煎饼！现在翻面！', category: 'positive' }
]

// 按类别分组
const PROMPT_CATEGORIES = [
  { id: 'classic', name: '经典', color: 'primary' },
  { id: 'cute', name: '可爱', color: 'secondary' },
  { id: 'funny', name: '搞笑', color: 'warning' },
  { id: 'professional', name: '专业', color: 'info' },
  { id: 'wuxia', name: '武侠', color: 'error' },
  { id: 'warm', name: '温馨', color: 'success' },
  { id: 'urgent', name: '紧急', color: 'error' },
  { id: 'poetic', name: '诗意', color: 'secondary' },
  { id: 'tech', name: '科技', color: 'info' },
  { id: 'dialect', name: '方言', color: 'warning' },
  { id: 'game', name: '游戏', color: 'primary' },
  { id: 'positive', name: '正能量', color: 'success' }
] as const

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onSettingsUpdate
}) => {
  const [localSettings, setLocalSettings] = useState<PancakeSettings>(settings)
  const [testingVoice, setTestingVoice] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  // 选择预设提示音
  const selectPresetPrompt = (prompt: string) => {
    setLocalSettings(prev => ({ ...prev, customPrompt: prompt }))
  }

  // 随机选择提示音
  const selectRandomPrompt = () => {
    const randomPrompt = PRESET_PROMPTS[Math.floor(Math.random() * PRESET_PROMPTS.length)]
    selectPresetPrompt(randomPrompt.value)
  }

  // 获取过滤后的提示音列表
  const getFilteredPrompts = () => {
    if (selectedCategory === 'all') {
      return PRESET_PROMPTS
    }
    return PRESET_PROMPTS.filter(prompt => prompt.category === selectedCategory)
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

          {/* 预设提示音选择 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>类别筛选</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="类别筛选"
                >
                  <MenuItem value="all">全部</MenuItem>
                  {PROMPT_CATEGORIES.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                size="small"
                onClick={selectRandomPrompt}
                startIcon={<DiceIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                随机选择
              </Button>
            </Box>

            <Grid container spacing={1}>
              {getFilteredPrompts().map((preset, index) => {
                const category = PROMPT_CATEGORIES.find(cat => cat.id === preset.category)
                const isSelected = localSettings.customPrompt === preset.value
                
                return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Chip
                      label={preset.label}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={isSelected ? 'primary' : (category?.color as any) || 'default'}
                      onClick={() => selectPresetPrompt(preset.value)}
                      sx={{ 
                        width: '100%', 
                        justifyContent: 'flex-start',
                        '& .MuiChip-label': { 
                          padding: '8px 12px',
                          fontSize: '0.875rem'
                        },
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 1
                        }
                      }}
                    />
                  </Grid>
                )
              })}
            </Grid>
          </Box>

          {/* 自定义输入框 */}
          <TextField
            fullWidth
            value={localSettings.customPrompt}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
            placeholder="或输入自定义提示语..."
            multiline
            rows={2}
            sx={{ mb: 2 }}
            helperText="您可以选择上方预设选项，或输入自定义提示语"
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

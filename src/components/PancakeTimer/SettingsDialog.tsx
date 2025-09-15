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
import { soundEffectsManager } from '../../utils/soundEffects'
import VoiceRecorder from './VoiceRecorder'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: PancakeSettings
  onSettingsUpdate: (settings: PancakeSettings) => void
}

// 预设的有趣提示音选项
const PRESET_PROMPTS = [
  // 经典系列
  { label: '经典提醒', value: '该翻面了！', category: 'classic' },
  { label: '温和提醒', value: '小主人，该给煎饼翻个身啦~', category: 'classic' },
  { label: '简洁直接', value: '翻面时间到！', category: 'classic' },
  
  // 专业系列
  { label: '专业主厨', value: '主厨，您的煎饼需要翻面啦！', category: 'professional' },
  { label: '米其林风格', value: '尊敬的厨师，请精确翻转您的美味创作', category: 'professional' },
  { label: '法式料理', value: 'Chef，votre crêpe est prête à être retournée!', category: 'professional' },
  
  // 可爱萌系
  { label: '可爱萌系', value: '哎呀哎呀，小煎饼要翻个身了~', category: 'cute' },
  { label: '超萌提醒', value: '煎饼宝宝说：我想要翻个身身呀！', category: 'cute' },
  { label: '甜甜少女', value: '哇哦！煎饼酱要变身了呢~快来帮帮我吧！', category: 'cute' },
  { label: '软萌动物', value: '小熊饼饼要翻身啦，mua~', category: 'cute' },
  
  // 搞笑系列
  { label: '搞笑风格', value: '煎饼君：救命！我要被烤糊了！快翻我！', category: 'funny' },
  { label: '沙雕提醒', value: '兄弟们！我是煎饼！我在锅里很烫！救救孩子！', category: 'funny' },
  { label: '脱口秀', value: '各位观众，现在为您表演煎饼翻身术！', category: 'funny' },
  { label: '相声版', value: '甲：该翻面了。乙：翻哪面？甲：煎饼面！', category: 'funny' },
  
  // 武侠系列
  { label: '武侠风格', value: '江湖人称煎饼侠，此时不翻更待何时！', category: 'wuxia' },
  { label: '古龙风格', value: '翻面的时机只有一次，错过了，就再也没有了', category: 'wuxia' },
  { label: '金庸风格', value: '降龙十八掌第一式：翻饼神功！', category: 'wuxia' },
  { label: '剑客版', value: '一剑翻饼，快如闪电！', category: 'wuxia' },
  
  // 温馨系列
  { label: '温馨提醒', value: '亲爱的，记得给煎饼翻个身哦~', category: 'warm' },
  { label: '妈妈叮嘱', value: '宝贝，小心烫手，该翻煎饼啦！', category: 'warm' },
  { label: '恋人私语', value: '亲爱的，我们的爱情煎饼需要翻面了呢~', category: 'warm' },
  { label: '家的味道', value: '就像奶奶做的煎饼一样，现在该翻面咯！', category: 'warm' },
  
  // 紧急系列
  { label: '紧急警报', value: '警报！警报！煎饼即将过熟，请立即翻面！', category: 'urgent' },
  { label: '火警提醒', value: '注意！高温警告！煎饼需要立即翻面！', category: 'urgent' },
  { label: '倒计时', value: '3、2、1，翻面行动开始！', category: 'urgent' },
  { label: '军事风格', value: '收到！目标锁定！执行翻面任务！', category: 'urgent' },
  
  // 诗意系列
  { label: '诗意表达', value: '春花秋月何时了，煎饼翻面知多少', category: 'poetic' },
  { label: '李白版', value: '君不见，黄河之水天上来，煎饼翻面不复回', category: 'poetic' },
  { label: '杜甫版', value: '翻面时节雨纷纷，锅中煎饼欲断魂', category: 'poetic' },
  { label: '现代诗', value: '在时间的长河里，煎饼等待着翻身的那一刻', category: 'poetic' },
  
  // 科技系列
  { label: '科技感', value: '系统提示：煎饼翻转程序已激活，请执行翻面操作', category: 'tech' },
  { label: 'AI助手', value: '根据深度学习算法计算，最佳翻面时机已到达', category: 'tech' },
  { label: '机器人', value: '滴滴！智能煎饼系统检测到翻面信号', category: 'tech' },
  { label: '太空版', value: '地面控制中心呼叫，请执行煎饼翻转程序', category: 'tech' },
  
  // 方言系列
  { label: '方言版本', value: '哎呀妈呀，煎饼该翻过来咯！', category: 'dialect' },
  { label: '东北话', value: '老铁，这煎饼咋还不翻呢？快整一下！', category: 'dialect' },
  { label: '四川话', value: '哦豁！煎饼要翻身嘞，安逸得很！', category: 'dialect' },
  { label: '上海话', value: '阿拉煎饼要翻面了呀，快来呀！', category: 'dialect' },
  
  // 游戏系列
  { label: '游戏风格', value: '叮！您的煎饼升级了！请翻面解锁下一关！', category: 'game' },
  { label: 'RPG版', value: '获得成就：完美烘烤！现在使用翻面技能！', category: 'game' },
  { label: '吃鸡版', value: '落地成盒？不！落锅翻面！好运吃饼！', category: 'game' },
  { label: '王者版', value: '敌军还有30秒到达战场，请翻面迎敌！', category: 'game' },
  
  // 正能量系列
  { label: '正能量', value: '相信自己，您一定能煎出最棒的煎饼！现在翻面！', category: 'positive' },
  { label: '励志语录', value: '每一次翻面都是成长，每一次尝试都是进步！', category: 'positive' },
  { label: '心灵鸡汤', value: '生活就像煎饼，总要翻个面才能看到另一面的美好', category: 'positive' },
  { label: '加油鼓励', value: '你是最棒的煎饼师！现在展示你的翻面绝技吧！', category: 'positive' },
  
  // 新增：魔法系列
  { label: '哈利波特', value: '阿瓦达啃大瓜！不对，是翻面咒语：Flipicus Pancakus！', category: 'magic' },
  { label: '魔法少女', value: '以爱与正义的名义，我要翻转这个煎饼！', category: 'magic' },
  { label: '巫师版', value: '施展翻面魔法的时间到了，开始咏唱：翻！', category: 'magic' },
  
  // 新增：影视系列
  { label: '星球大战', value: '原力告诉我，翻面的时机到了，愿原力与你同在', category: 'movies' },
  { label: '变形金刚', value: '汽车人，变形！煎饼，翻面！', category: 'movies' },
  { label: '超级英雄', value: 'With great power comes great responsibility...翻面！', category: 'movies' },
  
  // 新增：动漫系列
  { label: '火影忍者', value: '忍法·煎饼翻面之术！', category: 'anime' },
  { label: '龙珠版', value: '龟派气功波！不对，是煎饼翻面波！', category: 'anime' },
  { label: '海贼王', value: '我是要成为煎饼王的男人！现在翻面！', category: 'anime' },
  
  // 新增：节日系列
  { label: '春节版', value: '恭喜发财，煎饼翻面！红红火火过大年！', category: 'festival' },
  { label: '圣诞节', value: 'Merry Christmas！圣诞老人说该翻面啦！', category: 'festival' },
  { label: '情人节', value: '爱就像煎饼，需要用心翻面才能完美！', category: 'festival' }
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
  { id: 'positive', name: '正能量', color: 'success' },
  { id: 'magic', name: '魔法', color: 'secondary' },
  { id: 'movies', name: '影视', color: 'primary' },
  { id: 'anime', name: '动漫', color: 'warning' },
  { id: 'festival', name: '节日', color: 'error' }
] as const

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onSettingsUpdate
}) => {
  const [localSettings, setLocalSettings] = useState<PancakeSettings>(settings)
  const [testingVoice, setTestingVoice] = useState(false)
  const [testingSoundEffect, setTestingSoundEffect] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [voiceMode, setVoiceMode] = useState<'system' | 'custom'>('system')
  // const [customVoiceBlob, setCustomVoiceBlob] = useState<Blob | null>(null)

  // 同步外部设置到本地状态
  useEffect(() => {
    setLocalSettings(settings)
    // 根据设置判断语音模式
    setVoiceMode(settings.customVoiceId ? 'custom' : 'system')
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

  // 处理自定义语音选择
  const handleCustomVoiceSelect = (_audioBlob: Blob | null, voiceId?: string | null) => {
    // setCustomVoiceBlob(audioBlob)
    setLocalSettings(prev => ({ ...prev, customVoiceId: voiceId || null }))
  }

  // 测试语音
  const testVoice = async () => {
    if (testingVoice) return
    
    setTestingVoice(true)
    try {
      if (voiceMode === 'custom' && localSettings.customVoiceId) {
        // 测试自定义语音
        await speechManager.speak('', {
          volume: localSettings.volume,
          customVoiceId: localSettings.customVoiceId
        })
      } else {
        // 测试系统语音合成
        await speechManager.speakWithEnhancedSettings(
          localSettings.customPrompt,
          localSettings.volume,
          localSettings.speechRate,
          localSettings.speechPitch,
          localSettings.voiceType
        )
      }
    } catch (error) {
      console.error('Voice test failed:', error)
    } finally {
      setTestingVoice(false)
    }
  }

  // 测试音效
  const testSoundEffect = async () => {
    if (testingSoundEffect) return
    
    setTestingSoundEffect(true)
    try {
      await soundEffectsManager.playEffect(localSettings.soundEffectType, {
        volume: localSettings.volume * 0.6,
        duration: 0.8
      })
    } catch (error) {
      console.error('Sound effect test failed:', error)
    } finally {
      setTestingSoundEffect(false)
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
      speechRate: 1.0,
      speechPitch: 1.0,
      voiceType: 'auto',
      vibrationEnabled: true,
      speechEnabled: true,
      soundEffectsEnabled: true,
      soundEffectType: 'chime',
      customVoiceId: null,
      lastUsed: Date.now()
    }
    setLocalSettings(defaultSettings)
    setVoiceMode('system')
    // setCustomVoiceBlob(null)
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

            <Box sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'grey.50'
            }}>
              <Grid container spacing={0.5}>
                {getFilteredPrompts().map((preset, index) => {
                  const category = PROMPT_CATEGORIES.find(cat => cat.id === preset.category)
                  const isSelected = localSettings.customPrompt === preset.value
                  
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2.4} xl={2} key={index}>
                      <Chip
                        label={preset.label}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : (category?.color as any) || 'default'}
                        onClick={() => selectPresetPrompt(preset.value)}
                        sx={{ 
                          width: '100%', 
                          justifyContent: 'flex-start',
                          minHeight: '28px',
                          height: 'auto',
                          '& .MuiChip-label': { 
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          },
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: 1,
                            zIndex: 1
                          }
                        }}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
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
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={testVoice}
              disabled={
                testingVoice || 
                !localSettings.speechEnabled ||
                (voiceMode === 'system' && !localSettings.customPrompt.trim()) ||
                (voiceMode === 'custom' && !localSettings.customVoiceId)
              }
              startIcon={<VolumeIcon />}
              size="small"
            >
              {testingVoice ? '测试中...' : `测试${voiceMode === 'custom' ? '自定义语音' : '语音合成'}`}
            </Button>
            
            {!speechManager.isSupported_() && (
              <Typography variant="body2" color="warning.main">
                ⚠️ 浏览器不支持语音合成
              </Typography>
            )}
            
            {!localSettings.speechEnabled && (
              <Typography variant="body2" color="text.secondary">
                💤 语音已禁用
              </Typography>
            )}
          </Box>
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

        {/* 语音设置 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🎵 语音设置
          </Typography>
          
          {/* 语音开关 */}
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.speechEnabled}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  speechEnabled: e.target.checked 
                }))}
              />
            }
            label="启用语音提醒"
            sx={{ mb: 2 }}
          />

          {localSettings.speechEnabled && (
            <>
              {/* 语音模式选择 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  语音模式
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant={voiceMode === 'system' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setVoiceMode('system')
                        setLocalSettings(prev => ({ ...prev, customVoiceId: null }))
                      }}
                      sx={{ py: 1 }}
                    >
                      系统语音合成
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant={voiceMode === 'custom' ? 'contained' : 'outlined'}
                      onClick={() => setVoiceMode('custom')}
                      sx={{ py: 1 }}
                    >
                      自定义录音
                    </Button>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {voiceMode === 'system' 
                    ? '使用系统语音合成播放提示语' 
                    : '使用您录制的自定义语音作为提醒'
                  }
                </Typography>
              </Box>

              {voiceMode === 'custom' ? (
                /* 自定义录音模式 */
                <Box sx={{ mb: 3 }}>
                  <VoiceRecorder
                    onVoiceSelect={handleCustomVoiceSelect}
                    selectedVoiceId={localSettings.customVoiceId}
                  />
                </Box>
              ) : (
                /* 系统语音模式 */
                <>
                  {/* 语速控制 */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      语速
                    </Typography>
                    <Slider
                      value={localSettings.speechRate}
                      onChange={(_, value) => setLocalSettings(prev => ({ 
                        ...prev, 
                        speechRate: value as number 
                      }))}
                      min={0.1}
                      max={3}
                      step={0.1}
                      marks={[
                        { value: 0.5, label: '慢' },
                        { value: 1, label: '正常' },
                        { value: 2, label: '快' },
                        { value: 3, label: '很快' }
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}x`}
                    />
                  </Box>

              {/* 音调控制 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  音调
                </Typography>
                <Slider
                  value={localSettings.speechPitch}
                  onChange={(_, value) => setLocalSettings(prev => ({ 
                    ...prev, 
                    speechPitch: value as number 
                  }))}
                  min={0.1}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '低' },
                    { value: 1, label: '正常' },
                    { value: 1.5, label: '高' },
                    { value: 2, label: '很高' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}`}
                />
              </Box>

              {/* 语音类型选择 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  语音类型
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={localSettings.voiceType}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      voiceType: e.target.value as 'male' | 'female' | 'auto'
                    }))}
                  >
                    <MenuItem value="auto">自动选择</MenuItem>
                    <MenuItem value="female">女声</MenuItem>
                    <MenuItem value="male">男声</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 语音风格快速预设 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  语音风格预设
                </Typography>
                <Grid container spacing={1}>
                  {speechManager.getVoiceStyles().map((style) => (
                    <Grid item xs={6} key={style.id}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => {
                          setLocalSettings(prev => ({
                            ...prev,
                            speechRate: style.settings.rate || 1.0,
                            speechPitch: style.settings.pitch || 1.0,
                            volume: style.settings.volume || 0.8
                          }))
                        }}
                        sx={{ 
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        {style.name}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  点击预设可快速应用对应的语速、音调和音量设置
                </Typography>
              </Box>
                </>
              )}
            </>
          )}
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

        <Divider sx={{ my: 2 }} />

        {/* 音效设置 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🔔 音效设置
          </Typography>
          
          {/* 音效开关 */}
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.soundEffectsEnabled}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  soundEffectsEnabled: e.target.checked 
                }))}
              />
            }
            label="启用音效提醒"
            sx={{ mb: 2 }}
          />

          {localSettings.soundEffectsEnabled && (
            <>
              {/* 音效类型选择 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  音效类型
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={localSettings.soundEffectType}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      soundEffectType: e.target.value as 'beep' | 'chime' | 'bell' | 'alarm'
                    }))}
                  >
                    {soundEffectsManager.getAvailableEffects().map((effect) => (
                      <MenuItem key={effect.type} value={effect.type}>
                        {effect.name} - {effect.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 音效测试 */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={testSoundEffect}
                  disabled={testingSoundEffect || !localSettings.soundEffectsEnabled}
                  startIcon={<VolumeIcon />}
                  size="small"
                >
                  {testingSoundEffect ? '测试中...' : '测试音效'}
                </Button>
                
                {!soundEffectsManager.isSupported_() && (
                  <Typography variant="body2" color="warning.main">
                    ⚠️ 浏览器不支持音效
                  </Typography>
                )}
              </Box>
            </>
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

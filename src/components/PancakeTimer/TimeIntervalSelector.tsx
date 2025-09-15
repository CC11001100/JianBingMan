import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Slider,
  TextField,
  IconButton,
  Button,
  ButtonGroup,
  Paper,
  Chip,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material'
import './TimeIntervalSelector.css'

interface TimeIntervalSelectorProps {
  /** 当前时间值（秒） */
  value: number
  /** 时间变化回调 */
  onChange: (seconds: number) => void
  /** 最小值（秒，默认10） */
  min?: number
  /** 最大值（秒，默认600） */
  max?: number
  /** 标签文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
}

// 预设的常用时间选项（秒）
const PRESET_TIMES = [
  { label: '30秒', value: 30 },
  { label: '1分钟', value: 60 },
  { label: '1.5分钟', value: 90 },
  { label: '2分钟', value: 120 },
  { label: '2.5分钟', value: 150 },
  { label: '3分钟', value: 180 },
  { label: '4分钟', value: 240 },
  { label: '5分钟', value: 300 },
  { label: '8分钟', value: 480 },
  { label: '10分钟', value: 600 }
]

const TimeIntervalSelector: React.FC<TimeIntervalSelectorProps> = ({
  value,
  onChange,
  min = 10,
  max = 600,
  label = "时间间隔",
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [inputMinutes, setInputMinutes] = useState(Math.floor(value / 60))
  const [inputSeconds, setInputSeconds] = useState(value % 60)
  const [isInputFocused, setIsInputFocused] = useState(false)

  // 同步外部值变化
  useEffect(() => {
    if (!isInputFocused) {
      setLocalValue(value)
      setInputMinutes(Math.floor(value / 60))
      setInputSeconds(value % 60)
    }
  }, [value, isInputFocused])

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) {
      return `${secs}秒`
    } else if (secs === 0) {
      return `${mins}分钟`
    } else {
      return `${mins}分${secs}秒`
    }
  }

  // 处理滑块变化
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const seconds = Array.isArray(newValue) ? newValue[0] : newValue
    const clampedValue = Math.max(min, Math.min(max, seconds))
    setLocalValue(clampedValue)
    setInputMinutes(Math.floor(clampedValue / 60))
    setInputSeconds(clampedValue % 60)
    onChange(clampedValue)
  }

  // 处理快速调整
  const handleQuickAdjust = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta))
    onChange(newValue)
  }

  // 处理输入框变化
  const handleInputChange = () => {
    const totalSeconds = inputMinutes * 60 + inputSeconds
    const clampedValue = Math.max(min, Math.min(max, totalSeconds))
    setLocalValue(clampedValue)
    onChange(clampedValue)
  }

  // 处理预设时间选择
  const handlePresetSelect = (presetValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, presetValue))
    onChange(clampedValue)
  }

  // 重置为默认值（2分钟）
  const handleReset = () => {
    const defaultValue = Math.max(min, Math.min(max, 120))
    onChange(defaultValue)
  }

  // 生成滑块标记
  const generateSliderMarks = () => {
    const marks = []
    
    // 添加最小值标记
    marks.push({ value: min, label: formatTime(min) })
    
    // 添加关键点标记
    const keyPoints = [30, 60, 120, 180, 300, 480, 600].filter(point => point >= min && point <= max)
    keyPoints.forEach(point => {
      if (point !== min && point !== max) {
        marks.push({ value: point, label: formatTime(point) })
      }
    })
    
    // 添加最大值标记
    if (max !== min) {
      marks.push({ value: max, label: formatTime(max) })
    }
    
    return marks.sort((a, b) => a.value - b.value)
  }

  return (
    <Box className="time-interval-selector">
      {/* 标题和当前值显示 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          🕐 {label}
        </Typography>
        <Chip 
          label={formatTime(value)} 
          color="primary" 
          variant="filled"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* 主要拖拉条 */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          拖动滑块调整时间
        </Typography>
        <Slider
          value={localValue}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={5}
          marks={generateSliderMarks()}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          disabled={disabled}
          sx={{
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              '&:before': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              },
            },
            '& .MuiSlider-track': {
              height: 6,
            },
            '& .MuiSlider-rail': {
              height: 6,
              opacity: 0.3,
            },
            '& .MuiSlider-mark': {
              height: 8,
              width: 2,
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
            },
          }}
        />
      </Paper>

      {/* 快速调整按钮组 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <ButtonGroup variant="outlined" disabled={disabled}>
          <Button
            onClick={() => handleQuickAdjust(-10)}
            startIcon={<RemoveIcon />}
            disabled={value <= min}
          >
            -10秒
          </Button>
          <Button
            onClick={() => handleQuickAdjust(-5)}
            startIcon={<RemoveIcon />}
            disabled={value <= min}
          >
            -5秒
          </Button>
          <Button
            onClick={() => handleQuickAdjust(5)}
            endIcon={<AddIcon />}
            disabled={value >= max}
          >
            +5秒
          </Button>
          <Button
            onClick={() => handleQuickAdjust(10)}
            endIcon={<AddIcon />}
            disabled={value >= max}
          >
            +10秒
          </Button>
        </ButtonGroup>
      </Box>

      {/* 精确输入框 */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          精确输入时间
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <TextField
            label="分钟"
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setIsInputFocused(false)
              handleInputChange()
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleInputChange()
                e.currentTarget.blur()
              }
            }}
            inputProps={{ min: 0, max: Math.floor(max / 60) }}
            size="small"
            sx={{ width: 80 }}
            disabled={disabled}
          />
          <Typography variant="h6" color="text.secondary">:</Typography>
          <TextField
            label="秒钟"
            type="number"
            value={inputSeconds}
            onChange={(e) => setInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setIsInputFocused(false)
              handleInputChange()
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleInputChange()
                e.currentTarget.blur()
              }
            }}
            inputProps={{ min: 0, max: 59 }}
            size="small"
            sx={{ width: 80 }}
            disabled={disabled}
          />
          <IconButton 
            onClick={handleReset}
            color="primary"
            size="small"
            title="重置为默认值"
            disabled={disabled}
          >
            <ResetIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* 预设时间快速选择 */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          常用时间预设
        </Typography>
        <Grid container spacing={1}>
          {PRESET_TIMES.filter(preset => preset.value >= min && preset.value <= max).map((preset) => (
            <Grid item xs={6} sm={4} md={3} key={preset.value}>
              <Chip
                label={preset.label}
                onClick={() => handlePresetSelect(preset.value)}
                variant={value === preset.value ? 'filled' : 'outlined'}
                color={value === preset.value ? 'primary' : 'default'}
                clickable
                disabled={disabled}
                sx={{
                  width: '100%',
                  justifyContent: 'center',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 1,
                  },
                  transition: 'all 0.2s'
                }}
              />
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          点击预设时间可快速设置
        </Typography>
      </Box>
    </Box>
  )
}

export default TimeIntervalSelector

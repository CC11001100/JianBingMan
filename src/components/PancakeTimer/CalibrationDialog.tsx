import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material'
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material'
import { storageManager } from '../../utils/storage'

interface CalibrationDialogProps {
  open: boolean
  onClose: () => void
  onCalibrationComplete: (calibratedTime: number) => void
}

type CalibrationStep = 'instruction' | 'timing' | 'result'

const CalibrationDialog: React.FC<CalibrationDialogProps> = ({
  open,
  onClose,
  onCalibrationComplete
}) => {
  const [currentStep, setCurrentStep] = useState<CalibrationStep>('instruction')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [calibratedTime, setCalibratedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // 重置状态
  const resetState = () => {
    setCurrentStep('instruction')
    setStartTime(null)
    setElapsedTime(0)
    setCalibratedTime(0)
    setIsRunning(false)
  }

  // 对话框关闭时重置
  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  // 计时逻辑
  useEffect(() => {
    let interval: number | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setElapsedTime(elapsed)
      }, 100) // 更高频率更新，显示更精确
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, startTime])

  // 开始校准计时
  const startCalibration = () => {
    setCurrentStep('timing')
    setStartTime(Date.now())
    setElapsedTime(0)
    setIsRunning(true)
  }

  // 停止校准计时
  const stopCalibration = async () => {
    if (!startTime) return

    setIsRunning(false)
    const finalTime = Math.floor((Date.now() - startTime) / 1000)
    setCalibratedTime(finalTime)
    setCurrentStep('result')

    // 保存校准数据
    try {
      await storageManager.saveCalibrationData({
        calibratedTime: finalTime,
        calibratedAt: Date.now()
      })
      
      // 添加校准历史记录
      await storageManager.addHistoryRecord(finalTime, true)
    } catch (error) {
      console.error('Failed to save calibration data:', error)
    }
  }

  // 确认使用校准结果
  const confirmCalibration = () => {
    onCalibrationComplete(calibratedTime)
    onClose()
  }

  // 重新校准
  const recalibrate = () => {
    resetState()
  }

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 步骤配置
  const steps = ['操作说明', '开始计时', '校准完成']
  const activeStep = currentStep === 'instruction' ? 0 : currentStep === 'timing' ? 1 : 2

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
        <Typography variant="h6">⏱️ 时间校准</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 步骤指示器 */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* 说明步骤 */}
        {currentStep === 'instruction' && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                📋 校准说明
              </Typography>
              <Typography variant="body2">
                通过实际煎饼操作来校准最佳翻面时间，让计时更准确。
              </Typography>
            </Alert>

            <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom color="primary">
                🥞 校准步骤：
              </Typography>
              <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">
                    <strong>准备煎饼：</strong>确保煎饼已经下锅，准备开始计时
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>开始计时：</strong>点击"开始计时"按钮，同时开始煎制
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>观察状态：</strong>密切观察煎饼状态，等待最佳翻面时机
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>停止计时：</strong>当需要翻面时，立即点击"停止计时"
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>保存设置：</strong>系统将自动保存这个时间作为标准
                  </Typography>
                </li>
              </Box>
            </Paper>
          </Box>
        )}

        {/* 计时步骤 */}
        {currentStep === 'timing' && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="primary">
              🔥 正在校准中...
            </Typography>
            
            <Paper elevation={2} sx={{ p: 4, mb: 3, bgcolor: 'primary.50' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress
                  size={120}
                  thickness={4}
                  sx={{ color: 'primary.main' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography 
                    variant="h4" 
                    component="div"
                    sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                  >
                    {formatTime(elapsedTime)}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" color="text.secondary">
                观察煎饼状态，在最佳翻面时机点击停止
              </Typography>
            </Paper>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                💡 提示：通常煎饼边缘微微翘起，底部呈金黄色时就是最佳翻面时机
              </Typography>
            </Alert>
          </Box>
        )}

        {/* 结果步骤 */}
        {currentStep === 'result' && (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom color="success.main">
                🎉 校准完成！
              </Typography>
            </Box>

            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'success.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                📊 校准结果
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold', mb: 1 }}>
                {formatTime(calibratedTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                这将成为您的标准翻面时间
              </Typography>
            </Paper>

            <Alert severity="success">
              <Typography variant="body2">
                ✅ 校准数据已保存，您可以随时重新校准以获得更准确的时间设置
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {currentStep === 'instruction' && (
          <>
            <Button onClick={onClose} color="inherit">
              取消
            </Button>
            <Button onClick={startCalibration} variant="contained" startIcon={<PlayIcon />}>
              开始校准
            </Button>
          </>
        )}

        {currentStep === 'timing' && (
          <>
            <Button onClick={onClose} color="inherit">
              取消校准
            </Button>
            <Button 
              onClick={stopCalibration} 
              variant="contained" 
              color="error"
              startIcon={<StopIcon />}
              size="large"
            >
              停止计时
            </Button>
          </>
        )}

        {currentStep === 'result' && (
          <>
            <Button onClick={recalibrate} color="inherit">
              重新校准
            </Button>
            <Button onClick={confirmCalibration} variant="contained" color="success">
              使用此设置
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationDialog

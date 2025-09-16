import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Language as LanguageIcon,
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { voiceCompatibilityTester, type VoiceCompatibilityReport } from '../../utils/voiceCompatibilityTest'
import './VoiceCompatibilityTest.css'

const VoiceCompatibilityTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [testReport, setTestReport] = useState<VoiceCompatibilityReport | null>(null)
  const [error, setError] = useState<string>('')

  // 運行兼容性測試
  const runTest = async () => {
    setIsRunning(true)
    setError('')
    
    try {
      const report = await voiceCompatibilityTester.runCompleteTest()
      setTestReport(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : '測試執行失敗')
    } finally {
      setIsRunning(false)
    }
  }

  // 獲取兼容性等級顏色
  const getCompatibilityColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'limited': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }

  // 獲取兼容性等級文本
  const getCompatibilityText = (rating: string) => {
    switch (rating) {
      case 'excellent': return '優秀'
      case 'good': return '良好'
      case 'limited': return '有限'
      case 'poor': return '較差'
      default: return '未知'
    }
  }

  // 渲染測試結果項
  const renderTestResult = (title: string, result: any, icon: React.ReactNode) => {
    const success = result?.success
    const message = result?.message || '未測試'
    
    return (
      <ListItem>
        <ListItemIcon>
          {success ? (
            <CheckCircleIcon color="success" />
          ) : (
            <ErrorIcon color="error" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              {icon}
              <Typography variant="subtitle2">{title}</Typography>
            </Box>
          }
          secondary={message}
        />
      </ListItem>
    )
  }

  // 自動運行測試
  useEffect(() => {
    runTest()
  }, [])

  return (
    <Box className="voice-compatibility-test" sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          語音兼容性測試
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          檢測當前瀏覽器和設備對語音功能的支持程度
        </Typography>

        {/* 控制按鈕 */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={runTest}
            disabled={isRunning}
            size="large"
          >
            {isRunning ? '測試進行中...' : '重新測試'}
          </Button>
        </Box>

        {/* 錯誤信息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 測試結果 */}
        {testReport && (
          <Box>
            {/* 瀏覽器信息 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {testReport.browserInfo.isMobile ? <SmartphoneIcon /> : <ComputerIcon />}
                  設備信息
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">瀏覽器</Typography>
                    <Typography variant="body1">
                      {testReport.browserInfo.name} {testReport.browserInfo.version}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">引擎</Typography>
                    <Typography variant="body1">{testReport.browserInfo.engine}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">操作系統</Typography>
                    <Typography variant="body1">{testReport.browserInfo.os}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">設備類型</Typography>
                    <Typography variant="body1">
                      {testReport.browserInfo.isMobile ? '移動設備' : '桌面設備'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 整體兼容性評級 */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>整體兼容性評級</Typography>
                <Chip
                  label={getCompatibilityText(testReport.overallCompatibility)}
                  color={getCompatibilityColor(testReport.overallCompatibility) as any}
                  size="medium"
                  sx={{ fontSize: '1.1rem', px: 2, py: 1 }}
                />
              </CardContent>
            </Card>

            {/* 詳細測試結果 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>功能支持詳情</Typography>
                <List>
                  {renderTestResult(
                    'Web Speech API',
                    testReport.webSpeechApi,
                    <VolumeUpIcon fontSize="small" />
                  )}
                  <Divider />
                  {renderTestResult(
                    'MediaRecorder API',
                    testReport.mediaRecorderApi,
                    <MicIcon fontSize="small" />
                  )}
                  <Divider />
                  {renderTestResult(
                    'Web Audio API',
                    testReport.webAudioApi,
                    <VolumeUpIcon fontSize="small" />
                  )}
                  <Divider />
                  {renderTestResult(
                    '音頻播放',
                    testReport.audioPlayback,
                    <VolumeUpIcon fontSize="small" />
                  )}
                  <Divider />
                  {renderTestResult(
                    '語音列表',
                    testReport.voicesList,
                    <LanguageIcon fontSize="small" />
                  )}
                  <Divider />
                  {renderTestResult(
                    '備用機制',
                    testReport.fallbackMechanisms,
                    <WarningIcon fontSize="small" />
                  )}
                </List>
              </CardContent>
            </Card>

            {/* 優化建議 */}
            {testReport.recommendations.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="primary" />
                    優化建議
                  </Typography>
                  <List>
                    {testReport.recommendations.map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* 詳細技術信息 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">詳細技術信息</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mt: 2 }}>
                  {/* Web Speech API 詳情 */}
                  {testReport.webSpeechApi.details && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Web Speech API</Typography>
                      <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                        {JSON.stringify(testReport.webSpeechApi.details, null, 2)}
                      </pre>
                    </Box>
                  )}

                  {/* MediaRecorder API 詳情 */}
                  {testReport.mediaRecorderApi.details && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>MediaRecorder API</Typography>
                      <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                        {JSON.stringify(testReport.mediaRecorderApi.details, null, 2)}
                      </pre>
                    </Box>
                  )}

                  {/* 語音列表詳情 */}
                  {testReport.voicesList.details && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>語音支持</Typography>
                      <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                        {JSON.stringify(testReport.voicesList.details, null, 2)}
                      </pre>
                    </Box>
                  )}

                  {/* 備用機制詳情 */}
                  {testReport.fallbackMechanisms.details && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>備用機制</Typography>
                      <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                        {JSON.stringify(testReport.fallbackMechanisms.details, null, 2)}
                      </pre>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* 載入狀態 */}
        {isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              正在進行兼容性測試，請稍候...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default VoiceCompatibilityTest



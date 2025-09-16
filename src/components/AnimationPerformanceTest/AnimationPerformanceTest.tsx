import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AssessmentIcon from '@mui/icons-material/Assessment'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  animationPerformanceTester,
  AnimationTestConfig,
  PerformanceReport,
  PerformanceMetrics,
  DeviceInfo
} from '../../utils/animationPerformanceTester'
import './AnimationPerformanceTest.css'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const AnimationPerformanceTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [results, setResults] = useState<PerformanceReport[]>([])
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [selectedTestType, setSelectedTestType] = useState<'individual' | 'batch'>('individual')
  const [autoOptimize, setAutoOptimize] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [generatedReport, setGeneratedReport] = useState('')
  
  const progressCircleRef = useRef<HTMLDivElement>(null)
  const loadingSpinnerRef = useRef<HTMLDivElement>(null)
  const buttonTransitionRef = useRef<HTMLDivElement>(null)
  const fadeInElementRef = useRef<HTMLDivElement>(null)
  const pulseElementRef = useRef<HTMLDivElement>(null)
  const scaleElementRef = useRef<HTMLDivElement>(null)
  const slideElementRef = useRef<HTMLDivElement>(null)
  const rotateElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const info = animationPerformanceTester.getDeviceInfo()
    setDeviceInfo(info)
  }, [])

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'success'
      case 'B': return 'info'
      case 'C': return 'warning'
      case 'D': case 'F': return 'error'
      default: return 'default'
    }
  }

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A': case 'B': return <CheckCircleIcon />
      case 'C': return <WarningIcon />
      case 'D': case 'F': return <WarningIcon />
      default: return <WarningIcon />
    }
  }

  // 創建測試配置
  const createTestConfigs = useCallback((): AnimationTestConfig[] => {
    return [
      {
        name: '圓形進度條動畫',
        description: '測試Material-UI CircularProgress組件的動畫性能',
        duration: 5000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (progressCircleRef.current) {
            progressCircleRef.current.style.display = 'block'
          }
        },
        cleanupAnimation: () => {
          if (progressCircleRef.current) {
            progressCircleRef.current.style.display = 'none'
          }
        }
      },
      {
        name: '載入旋轉動畫',
        description: '測試CSS keyframes旋轉動畫性能',
        duration: 4000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (loadingSpinnerRef.current) {
            loadingSpinnerRef.current.style.display = 'block'
            loadingSpinnerRef.current.classList.add('spin-animation')
          }
        },
        cleanupAnimation: () => {
          if (loadingSpinnerRef.current) {
            loadingSpinnerRef.current.style.display = 'none'
            loadingSpinnerRef.current.classList.remove('spin-animation')
          }
        }
      },
      {
        name: '按鈕過渡效果',
        description: '測試按鈕hover和active狀態的過渡動畫',
        duration: 3000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (buttonTransitionRef.current) {
            buttonTransitionRef.current.style.display = 'block'
            // 模擬連續的hover效果
            const button = buttonTransitionRef.current.querySelector('button')
            if (button) {
              let hoverState = false
              const interval = setInterval(() => {
                if (hoverState) {
                  button.classList.remove('hover-simulation')
                } else {
                  button.classList.add('hover-simulation')
                }
                hoverState = !hoverState
              }, 200)
              
              setTimeout(() => clearInterval(interval), 3000)
            }
          }
        },
        cleanupAnimation: () => {
          if (buttonTransitionRef.current) {
            buttonTransitionRef.current.style.display = 'none'
            const button = buttonTransitionRef.current.querySelector('button')
            if (button) {
              button.classList.remove('hover-simulation')
            }
          }
        }
      },
      {
        name: '淡入動畫',
        description: '測試opacity過渡動畫性能',
        duration: 3000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (fadeInElementRef.current) {
            fadeInElementRef.current.style.display = 'block'
            fadeInElementRef.current.classList.add('fade-animation')
          }
        },
        cleanupAnimation: () => {
          if (fadeInElementRef.current) {
            fadeInElementRef.current.style.display = 'none'
            fadeInElementRef.current.classList.remove('fade-animation')
          }
        }
      },
      {
        name: '脈衝動畫',
        description: '測試scale和opacity組合動畫性能',
        duration: 4000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (pulseElementRef.current) {
            pulseElementRef.current.style.display = 'block'
            pulseElementRef.current.classList.add('pulse-animation')
          }
        },
        cleanupAnimation: () => {
          if (pulseElementRef.current) {
            pulseElementRef.current.style.display = 'none'
            pulseElementRef.current.classList.remove('pulse-animation')
          }
        }
      },
      {
        name: '縮放動畫',
        description: '測試transform scale動畫性能',
        duration: 3000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (scaleElementRef.current) {
            scaleElementRef.current.style.display = 'block'
            scaleElementRef.current.classList.add('scale-animation')
          }
        },
        cleanupAnimation: () => {
          if (scaleElementRef.current) {
            scaleElementRef.current.style.display = 'none'
            scaleElementRef.current.classList.remove('scale-animation')
          }
        }
      },
      {
        name: '滑動動畫',
        description: '測試transform translate動畫性能',
        duration: 4000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (slideElementRef.current) {
            slideElementRef.current.style.display = 'block'
            slideElementRef.current.classList.add('slide-animation')
          }
        },
        cleanupAnimation: () => {
          if (slideElementRef.current) {
            slideElementRef.current.style.display = 'none'
            slideElementRef.current.classList.remove('slide-animation')
          }
        }
      },
      {
        name: '旋轉動畫',
        description: '測試transform rotate動畫性能',
        duration: 3000,
        expectedFPS: 60,
        setupAnimation: () => {
          if (rotateElementRef.current) {
            rotateElementRef.current.style.display = 'block'
            rotateElementRef.current.classList.add('rotate-animation')
          }
        },
        cleanupAnimation: () => {
          if (rotateElementRef.current) {
            rotateElementRef.current.style.display = 'none'
            rotateElementRef.current.classList.remove('rotate-animation')
          }
        }
      }
    ]
  }, [])

  const runIndividualTest = async (config: AnimationTestConfig) => {
    setIsLoading(true)
    setCurrentTest(config.name)
    
    try {
      const result = await animationPerformanceTester.runTest(config)
      setResults(prev => [...prev, result])
    } catch (error) {
      console.error('Test failed:', error)
    }
    
    setIsLoading(false)
    setCurrentTest(null)
  }

  const runBatchTests = async () => {
    setIsLoading(true)
    setCurrentTest('批次測試進行中')
    
    try {
      const configs = createTestConfigs()
      const batchResults = await animationPerformanceTester.runBatchTests(configs)
      setResults(prev => [...prev, ...batchResults])
    } catch (error) {
      console.error('Batch test failed:', error)
    }
    
    setIsLoading(false)
    setCurrentTest(null)
  }

  const clearResults = () => {
    setResults([])
  }

  const generateReport = () => {
    const report = animationPerformanceTester.generateReport(results)
    setGeneratedReport(report)
    setReportDialogOpen(true)
  }

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `animation-performance-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderMetricsTable = (metrics: PerformanceMetrics) => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>指標</TableCell>
            <TableCell align="right">數值</TableCell>
            <TableCell>單位</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>FPS (幀率)</TableCell>
            <TableCell align="right">{metrics.fps}</TableCell>
            <TableCell>fps</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>平均幀時間</TableCell>
            <TableCell align="right">{metrics.avgFrameTime}</TableCell>
            <TableCell>ms</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>最小幀時間</TableCell>
            <TableCell align="right">{metrics.minFrameTime}</TableCell>
            <TableCell>ms</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>最大幀時間</TableCell>
            <TableCell align="right">{metrics.maxFrameTime}</TableCell>
            <TableCell>ms</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>總幀數</TableCell>
            <TableCell align="right">{metrics.totalFrames}</TableCell>
            <TableCell>幀</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>丟失幀數</TableCell>
            <TableCell align="right">{metrics.droppedFrames}</TableCell>
            <TableCell>幀</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>卡頓幀數</TableCell>
            <TableCell align="right">{metrics.jankFrames}</TableCell>
            <TableCell>幀</TableCell>
          </TableRow>
          {metrics.memoryUsage && (
            <>
              <TableRow>
                <TableCell>已用內存</TableCell>
                <TableCell align="right">{Math.round(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024)}</TableCell>
                <TableCell>MB</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>內存使用率</TableCell>
                <TableCell align="right">{Math.round(metrics.memoryUsage.heapRatio * 100)}</TableCell>
                <TableCell>%</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderDeviceInfo = () => {
    if (!deviceInfo) return null

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            設備信息
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>平台:</strong> {deviceInfo.platform}
              </Typography>
              <Typography variant="body2">
                <strong>CPU核心:</strong> {deviceInfo.hardwareConcurrency}
              </Typography>
              <Typography variant="body2">
                <strong>內存:</strong> {deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory}GB` : '未知'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>像素比:</strong> {deviceInfo.pixelRatio}
              </Typography>
              <Typography variant="body2">
                <strong>屏幕尺寸:</strong> {deviceInfo.screenSize.width}x{deviceInfo.screenSize.height}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={deviceInfo.isLowEndDevice ? "低端設備" : "高性能設備"} 
                  color={deviceInfo.isLowEndDevice ? "warning" : "success"}
                  size="small"
                />
                <Chip 
                  label={deviceInfo.supportsGPU ? "GPU支持" : "無GPU支持"} 
                  color={deviceInfo.supportsGPU ? "success" : "error"}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box className="animation-performance-test" sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🎬 CSS動畫性能測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        測試和分析CSS動畫的性能表現，包括幀率、渲染時間、內存使用等指標。
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="測試控制" />
          <Tab label="測試結果" />
          <Tab label="性能分析" />
          <Tab label="設備信息" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  測試控制
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>測試類型</InputLabel>
                  <Select
                    value={selectedTestType}
                    label="測試類型"
                    onChange={(e) => setSelectedTestType(e.target.value as 'individual' | 'batch')}
                  >
                    <MenuItem value="individual">單項測試</MenuItem>
                    <MenuItem value="batch">批次測試</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoOptimize}
                      onChange={(e) => setAutoOptimize(e.target.checked)}
                    />
                  }
                  label="自動優化建議"
                />

                <Box sx={{ mt: 2 }}>
                  {selectedTestType === 'batch' ? (
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={runBatchTests}
                      disabled={isLoading}
                      fullWidth
                    >
                      {isLoading ? '執行中...' : '運行批次測試'}
                    </Button>
                  ) : (
                    <Grid container spacing={2}>
                      {createTestConfigs().map((config) => (
                        <Grid item xs={12} sm={6} key={config.name}>
                          <Button
                            variant="outlined"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => runIndividualTest(config)}
                            disabled={isLoading}
                            fullWidth
                            size="small"
                          >
                            {config.name}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={clearResults}
                    disabled={isLoading || results.length === 0}
                  >
                    清除結果
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={generateReport}
                    disabled={results.length === 0}
                  >
                    生成報告
                  </Button>
                </Box>

                {isLoading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {currentTest ? `正在測試: ${currentTest}` : '測試進行中...'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderDeviceInfo()}
          </Grid>
        </Grid>

        {/* 隱藏的動畫測試元素 */}
        <Box sx={{ position: 'absolute', top: -1000, left: -1000 }}>
          <div ref={progressCircleRef} style={{ display: 'none' }}>
            <CircularProgress size={60} />
          </div>
          
          <div ref={loadingSpinnerRef} className="loading-spinner" style={{ display: 'none' }}>
            <div className="spinner-circle"></div>
          </div>
          
          <div ref={buttonTransitionRef} style={{ display: 'none' }}>
            <Button variant="contained" className="test-button">
              測試按鈕
            </Button>
          </div>
          
          <div ref={fadeInElementRef} className="fade-test-element" style={{ display: 'none' }}>
            測試淡入動畫
          </div>
          
          <div ref={pulseElementRef} className="pulse-test-element" style={{ display: 'none' }}>
            脈衝動畫測試
          </div>
          
          <div ref={scaleElementRef} className="scale-test-element" style={{ display: 'none' }}>
            縮放動畫測試
          </div>
          
          <div ref={slideElementRef} className="slide-test-element" style={{ display: 'none' }}>
            滑動動畫測試
          </div>
          
          <div ref={rotateElementRef} className="rotate-test-element" style={{ display: 'none' }}>
            旋轉動畫測試
          </div>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {results.length === 0 ? (
          <Alert severity="info">
            還沒有測試結果，請先運行動畫性能測試。
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {results.map((result, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {result.testName}
                      </Typography>
                      <Chip
                        icon={getGradeIcon(result.grade)}
                        label={`等級: ${result.grade}`}
                        color={getGradeColor(result.grade)}
                      />
                    </Box>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>性能指標</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {renderMetricsTable(result.metrics)}
                      </AccordionDetails>
                    </Accordion>

                    {result.issues.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography color="error">
                            發現問題 ({result.issues.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {result.issues.map((issue, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <WarningIcon color="error" sx={{ mr: 1 }} />
                                <ListItemText primary={issue} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {result.recommendations.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography color="success">
                            優化建議 ({result.recommendations.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {result.recommendations.map((recommendation, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                <ListItemText primary={recommendation} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {results.length === 0 ? (
          <Alert severity="info">
            請先運行測試以查看性能分析。
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    性能總覽
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      平均FPS: {Math.round(results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      總測試數: {results.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      A級測試: {results.filter(r => r.grade === 'A').length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    問題統計
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      有問題的測試: {results.filter(r => r.issues.length > 0).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      總問題數: {results.reduce((sum, r) => sum + r.issues.length, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      總建議數: {results.reduce((sum, r) => sum + r.recommendations.length, 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderDeviceInfo()}
      </TabPanel>

      {/* 報告對話框 */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>動畫性能測試報告</DialogTitle>
        <DialogContent>
          <Box sx={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {generatedReport}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>關閉</Button>
          <Button onClick={downloadReport} variant="contained">下載報告</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AnimationPerformanceTest



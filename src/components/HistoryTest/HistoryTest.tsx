import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import {
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon
} from '@mui/icons-material'
import { 
  historyManager, 
  type HistoryRecord, 
  type HistoryStats, 
  type OptimizationSuggestion,
  type HistoryFilter,
  type HistorySortOptions
} from '../../utils/historyManager'
import { storageManager } from '../../utils/storage'
import './HistoryTest.css'

const HistoryTest: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 測試數據生成狀態
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false)
  const [testDataCount, setTestDataCount] = useState(50)

  // 歷史記錄狀態
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])

  // 篩選和排序狀態
  const [filter] = useState<HistoryFilter>({})
  const [sort] = useState<HistorySortOptions>({ field: 'timestamp', order: 'desc' })

  // 測試結果狀態
  const [testResults, setTestResults] = useState<{
    dataIntegrity: boolean
    timeAccuracy: boolean
    sortingFunctionality: boolean
    filteringFunctionality: boolean
    statisticsAccuracy: boolean
    exportFunctionality: boolean
    managementFeatures: boolean
  } | null>(null)

  /**
   * 生成測試數據
   */
  const generateTestData = async () => {
    setIsGeneratingTestData(true)
    setError('')

    try {

      // 清除現有數據
      await storageManager.clearAllData()

      // 生成測試記錄
      for (let i = 0; i < testDataCount; i++) {
        
        // 生成不同類型的持續時間
        let duration: number
        const rand = Math.random()
        if (rand < 0.1) {
          // 10% 校準記錄 (15-60秒)
          duration = Math.floor(Math.random() * 45) + 15
        } else if (rand < 0.6) {
          // 50% 常見時間 (15-30秒)
          duration = Math.floor(Math.random() * 15) + 15
        } else if (rand < 0.9) {
          // 30% 中等時間 (30-60秒)
          duration = Math.floor(Math.random() * 30) + 30
        } else {
          // 10% 長時間 (60-120秒)
          duration = Math.floor(Math.random() * 60) + 60
        }

        const wasCalibration = rand < 0.1 // 10% 為校準記錄

        // 添加到數據庫（需要暫時修改時間戳）
        await storageManager.addHistoryRecord(duration, wasCalibration)
      }

      console.log(`已生成${testDataCount}條測試數據`)
      await loadHistoryData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成測試數據失敗')
    } finally {
      setIsGeneratingTestData(false)
    }
  }

  /**
   * 加載歷史數據
   */
  const loadHistoryData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [records, stats, optimizations] = await Promise.all([
        historyManager.getFilteredHistory(filter, sort),
        historyManager.calculateStatistics(),
        historyManager.generateOptimizationSuggestions()
      ])

      setHistoryRecords(records)
      setHistoryStats(stats)
      setSuggestions(optimizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加載歷史數據失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 運行完整的功能測試
   */
  const runCompleteTest = async () => {
    setIsLoading(true)
    setError('')

    try {
      console.log('開始歷史記錄功能測試...')

      const results = {
        dataIntegrity: false,
        timeAccuracy: false,
        sortingFunctionality: false,
        filteringFunctionality: false,
        statisticsAccuracy: false,
        exportFunctionality: false,
        managementFeatures: false
      }

      // 1. 測試數據完整性
      console.log('測試數據完整性...')
      const testRecord = await storageManager.getHistory()
      if (testRecord.length > 0) {
        const record = testRecord[0]
        results.dataIntegrity = 
          typeof record.id === 'number' &&
          typeof record.duration === 'number' &&
          typeof record.wasCalibration === 'boolean' &&
          typeof record.timestamp === 'number'
      }

      // 2. 測試時間戳準確性
      console.log('測試時間戳準確性...')
      const now = Date.now()
      await storageManager.addHistoryRecord(20, false)
      const latestRecords = await storageManager.getHistory()
      if (latestRecords.length > 0) {
        const latestRecord = latestRecords[0]
        const timeDiff = Math.abs(latestRecord.timestamp - now)
        results.timeAccuracy = timeDiff < 5000 // 允許5秒誤差
      }

      // 3. 測試排序功能
      console.log('測試排序功能...')
      const sortedByTime = await historyManager.getFilteredHistory(
        {},
        { field: 'timestamp', order: 'desc' }
      )
      const sortedByDuration = await historyManager.getFilteredHistory(
        {},
        { field: 'duration', order: 'asc' }
      )
      
      let timeSort = true
      for (let i = 1; i < sortedByTime.length; i++) {
        if (sortedByTime[i].timestamp > sortedByTime[i-1].timestamp) {
          timeSort = false
          break
        }
      }

      let durationSort = true
      for (let i = 1; i < sortedByDuration.length; i++) {
        if (sortedByDuration[i].duration < sortedByDuration[i-1].duration) {
          durationSort = false
          break
        }
      }

      results.sortingFunctionality = timeSort && durationSort

      // 4. 測試篩選功能
      console.log('測試篩選功能...')
      const allRecords = await historyManager.getFilteredHistory()
      const calibrationOnly = await historyManager.getFilteredHistory({
        durationType: 'calibration'
      })
      const normalOnly = await historyManager.getFilteredHistory({
        durationType: 'normal'
      })

      results.filteringFunctionality = 
        calibrationOnly.every(r => r.wasCalibration) &&
        normalOnly.every(r => !r.wasCalibration) &&
        (calibrationOnly.length + normalOnly.length <= allRecords.length)

      // 5. 測試統計功能
      console.log('測試統計功能...')
      const stats = await historyManager.calculateStatistics()
      results.statisticsAccuracy = 
        typeof stats.totalRecords === 'number' &&
        typeof stats.averageDuration === 'number' &&
        stats.totalRecords >= 0 &&
        stats.averageDuration >= 0

      // 6. 測試導出功能
      console.log('測試導出功能...')
      try {
        const jsonExport = await historyManager.exportToJSON()
        const csvExport = await historyManager.exportToCSV()
        
        results.exportFunctionality = 
          jsonExport.length > 0 && 
          csvExport.length > 0 &&
          jsonExport.includes('exportInfo') &&
          csvExport.includes('ID,持續時間')
      } catch (exportError) {
        console.error('導出測試失敗:', exportError)
        results.exportFunctionality = false
      }

      // 7. 測試管理功能
      console.log('測試管理功能...')
      try {
        const summary = await historyManager.getHistorySummary()
        const cleanupCount = await historyManager.cleanupOldRecords(30)
        
        results.managementFeatures = 
          typeof summary.todayCount === 'number' &&
          typeof cleanupCount === 'number'
      } catch (managementError) {
        console.error('管理功能測試失敗:', managementError)
        results.managementFeatures = false
      }

      setTestResults(results)
      console.log('歷史記錄功能測試完成:', results)

    } catch (err) {
      setError(err instanceof Error ? err.message : '測試執行失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 導出歷史數據
   */
  const exportData = async (format: 'json' | 'csv') => {
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = await historyManager.exportToJSON()
        filename = `history-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        content = await historyManager.exportToCSV()
        filename = `history-export-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      }

      // 創建下載
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      setError(err instanceof Error ? err.message : '導出失敗')
    }
  }

  /**
   * 清除所有數據
   */
  const clearAllData = async () => {
    if (window.confirm('確定要清除所有歷史數據嗎？此操作不可撤銷。')) {
      try {
        await storageManager.clearAllData()
        await loadHistoryData()
      } catch (err) {
        setError(err instanceof Error ? err.message : '清除數據失敗')
      }
    }
  }

  // 渲染測試結果
  const renderTestResults = () => {
    if (!testResults) return null

    const testItems = [
      { key: 'dataIntegrity', name: '數據完整性', icon: <HistoryIcon /> },
      { key: 'timeAccuracy', name: '時間戳準確性', icon: <ScheduleIcon /> },
      { key: 'sortingFunctionality', name: '排序功能', icon: <TrendingUpIcon /> },
      { key: 'filteringFunctionality', name: '篩選功能', icon: <AssessmentIcon /> },
      { key: 'statisticsAccuracy', name: '統計準確性', icon: <AssessmentIcon /> },
      { key: 'exportFunctionality', name: '導出功能', icon: <DownloadIcon /> },
      { key: 'managementFeatures', name: '管理功能', icon: <TimerIcon /> }
    ]

    const passedTests = Object.values(testResults).filter(Boolean).length
    const totalTests = Object.keys(testResults).length

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            測試結果 ({passedTests}/{totalTests} 通過)
          </Typography>
          <List>
            {testItems.map(({ key, name, icon }) => (
              <ListItem key={key}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {icon}
                      <Typography variant="subtitle2">{name}</Typography>
                      <Chip
                        label={testResults[key as keyof typeof testResults] ? '通過' : '失敗'}
                        color={testResults[key as keyof typeof testResults] ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    )
  }

  // 渲染歷史記錄表格
  const renderHistoryTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>持續時間</TableCell>
            <TableCell>類型</TableCell>
            <TableCell>日期時間</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historyRecords.slice(0, 20).map(record => (
            <TableRow key={record.id}>
              <TableCell>{record.id}</TableCell>
              <TableCell>{historyManager.formatDuration(record.duration)}</TableCell>
              <TableCell>
                <Chip
                  label={record.wasCalibration ? '校準' : '正常'}
                  color={record.wasCalibration ? 'secondary' : 'primary'}
                  size="small"
                />
              </TableCell>
              <TableCell>{historyManager.formatDate(record.timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {historyRecords.length > 20 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            顯示前20條記錄，總共{historyRecords.length}條
          </Typography>
        </Box>
      )}
    </TableContainer>
  )

  // 渲染統計信息
  const renderStatistics = () => {
    if (!historyStats) return null

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>基本統計</Typography>
              <List>
                <ListItem>
                  <ListItemText primary="總記錄數" secondary={historyStats.totalRecords} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="校準記錄" secondary={historyStats.calibrationRecords} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="正常記錄" secondary={historyStats.normalRecords} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="平均時間" 
                    secondary={historyManager.formatDuration(historyStats.averageDuration)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="總計時間" 
                    secondary={historyManager.formatDuration(historyStats.totalCookingTime)} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>最近活動</Typography>
              <List>
                <ListItem>
                  <ListItemText primary="今天" secondary={`${historyStats.recentActivity.last7Days}次`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="最近7天" secondary={`${historyStats.recentActivity.last7Days}次`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="最近30天" secondary={`${historyStats.recentActivity.last30Days}次`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="本月" secondary={`${historyStats.recentActivity.thisMonth}次`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  // 渲染優化建議
  const renderSuggestions = () => (
    <List>
      {suggestions.map((suggestion, index) => (
        <ListItem key={index}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">{suggestion.title}</Typography>
                <Chip
                  label={suggestion.level}
                  color={
                    suggestion.level === 'warning' ? 'warning' :
                    suggestion.level === 'suggestion' ? 'info' : 'default'
                  }
                  size="small"
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {suggestion.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                  建議: {suggestion.recommendation}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  )

  // 組件加載時加載數據
  useEffect(() => {
    loadHistoryData()
  }, [])

  return (
    <Box className="history-test" sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          歷史記錄功能測試
        </Typography>
        
        {/* 控制按鈕 */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={runCompleteTest}
            disabled={isLoading}
          >
            運行完整測試
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadHistoryData}
            disabled={isLoading}
          >
            重新加載數據
          </Button>

          <TextField
            type="number"
            label="測試數據量"
            value={testDataCount}
            onChange={(e) => setTestDataCount(parseInt(e.target.value) || 50)}
            sx={{ width: 120 }}
            size="small"
          />

          <Button
            variant="outlined"
            onClick={generateTestData}
            disabled={isGeneratingTestData}
            startIcon={isGeneratingTestData ? <CircularProgress size={20} /> : undefined}
          >
            生成測試數據
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={clearAllData}
          >
            清除所有數據
          </Button>
        </Box>

        {/* 錯誤信息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 測試結果 */}
        {renderTestResults()}

        {/* 標籤頁 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="歷史記錄" />
            <Tab label="統計分析" />
            <Tab label="優化建議" />
            <Tab label="導出功能" />
          </Tabs>
        </Box>

        {/* 標籤頁內容 */}
        {currentTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              歷史記錄 ({historyRecords.length}條)
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderHistoryTable()
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>統計分析</Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderStatistics()
            )}
          </Box>
        )}

        {currentTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              優化建議 ({suggestions.length}條)
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : suggestions.length > 0 ? (
              renderSuggestions()
            ) : (
              <Typography variant="body2" color="text.secondary">
                暫無優化建議
              </Typography>
            )}
          </Box>
        )}

        {currentTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>導出功能</Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportData('json')}
                >
                  導出為JSON
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportData('csv')}
                >
                  導出為CSV
                </Button>
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              導出的文件包含所有歷史記錄、統計信息和優化建議
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default HistoryTest



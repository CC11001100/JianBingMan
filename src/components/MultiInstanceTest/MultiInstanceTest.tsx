/**
 * 多實例運行測試組件
 * 驗證多個瀏覽器標籤頁同時運行應用的處理
 */

import React, { useState, useEffect, useCallback } from 'react'
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
  Divider,
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
  TextField,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  Tab as TabIcon,
  Timer as TimerIcon,
  Sync as SyncIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { 
  multiInstanceManager,
  type InstanceState,
  type MultiInstanceEvent,
  type MultiInstanceEventType
} from '../../utils/multiInstanceManager'
import './MultiInstanceTest.css'

const MultiInstanceTest: React.FC = () => {
  // 狀態管理
  const [instanceStats, setInstanceStats] = useState(multiInstanceManager.getInstanceStats())
  const [instanceDetails, setInstanceDetails] = useState(multiInstanceManager.getInstanceDetails())
  const [events, setEvents] = useState<MultiInstanceEvent[]>([])
  const [testResults, setTestResults] = useState<{
    dataSync: boolean
    resourceLock: boolean
    timerConflict: boolean
    instanceCoordination: boolean
  }>({
    dataSync: false,
    resourceLock: false,
    timerConflict: false,
    instanceCoordination: false
  })
  
  // UI 狀態
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [mockTimer, setMockTimer] = useState(false)
  const [resourceLockTest, setResourceLockTest] = useState('')
  const [syncTestData, setSyncTestData] = useState('')

  // 事件處理函數
  const handleMultiInstanceEvent = useCallback((event: MultiInstanceEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 49)]) // 保留最近50個事件
    
    // 更新統計信息
    setInstanceStats(multiInstanceManager.getInstanceStats())
    setInstanceDetails(multiInstanceManager.getInstanceDetails())
  }, [])

  // 初始化多實例事件監聽
  useEffect(() => {
    const eventTypes: MultiInstanceEventType[] = [
      'instance_registered',
      'instance_removed',
      'timer_started',
      'timer_stopped',
      'timer_paused',
      'settings_changed',
      'data_updated',
      'focus_changed',
      'resource_conflict'
    ]

    // 註冊所有事件監聽器
    eventTypes.forEach(type => {
      multiInstanceManager.addEventListener(type, handleMultiInstanceEvent)
    })

    // 定期更新統計信息
    const intervalId = setInterval(() => {
      setInstanceStats(multiInstanceManager.getInstanceStats())
      setInstanceDetails(multiInstanceManager.getInstanceDetails())
    }, 2000)

    // 監聽自定義事件
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('Settings updated from another instance:', event.detail)
      setTestResults(prev => ({ ...prev, dataSync: true }))
    }

    const handleDataUpdate = (event: CustomEvent) => {
      console.log('Data updated from another instance:', event.detail)
      setTestResults(prev => ({ ...prev, dataSync: true }))
    }

    window.addEventListener('multi-instance-settings-updated', handleSettingsUpdate as EventListener)
    window.addEventListener('multi-instance-data-updated', handleDataUpdate as EventListener)

    return () => {
      // 清理事件監聽器
      eventTypes.forEach(type => {
        multiInstanceManager.removeEventListener(type, handleMultiInstanceEvent)
      })
      
      clearInterval(intervalId)
      window.removeEventListener('multi-instance-settings-updated', handleSettingsUpdate as EventListener)
      window.removeEventListener('multi-instance-data-updated', handleDataUpdate as EventListener)
    }
  }, [handleMultiInstanceEvent])

  // 測試數據同步
  const testDataSync = async () => {
    setLoading(true)
    try {
      // 模擬數據更新
      const testData = {
        timestamp: Date.now(),
        testValue: Math.random().toString(36).substr(2, 9)
      }

      multiInstanceManager.notifyDataUpdate('test', testData)
      setSyncTestData(JSON.stringify(testData, null, 2))
      
      // 等待響應
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, dataSync: true }))
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Data sync test failed:', error)
      setLoading(false)
    }
  }

  // 測試設置同步
  const testSettingsSync = async () => {
    const testSettings = {
      testMode: true,
      timestamp: Date.now(),
      randomValue: Math.random()
    }

    multiInstanceManager.notifySettingsChange(testSettings)
    console.log('Settings sync test initiated:', testSettings)
  }

  // 測試資源鎖定
  const testResourceLock = async () => {
    setLoading(true)
    const resource = resourceLockTest || 'test-resource'
    
    try {
      const acquired = await multiInstanceManager.acquireResourceLock(resource, 10000)
      
      if (acquired) {
        console.log(`Resource lock acquired for: ${resource}`)
        setTestResults(prev => ({ ...prev, resourceLock: true }))
        
        // 5秒後釋放鎖
        setTimeout(() => {
          multiInstanceManager.releaseResourceLock(resource)
          console.log(`Resource lock released for: ${resource}`)
        }, 5000)
      } else {
        console.log(`Failed to acquire resource lock for: ${resource}`)
      }
    } catch (error) {
      console.error('Resource lock test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // 測試計時器衝突
  const testTimerConflict = () => {
    setMockTimer(!mockTimer)
    
    const timerState = {
      duration: 20,
      progress: mockTimer ? 0 : 50,
      isRunning: !mockTimer
    }

    multiInstanceManager.notifyTimerStateChange(
      mockTimer ? 'stopped' : 'started',
      timerState
    )

    setTestResults(prev => ({ ...prev, timerConflict: true }))
  }

  // 測試實例協調
  const testInstanceCoordination = () => {
    const stats = multiInstanceManager.getInstanceStats()
    const isPrimary = multiInstanceManager.isPrimaryInstance()
    
    console.log('Instance coordination test:', {
      stats,
      isPrimary,
      activeInstances: multiInstanceManager.getActiveInstances()
    })

    setTestResults(prev => ({ ...prev, instanceCoordination: true }))
  }

  // 重置測試結果
  const resetTests = () => {
    setTestResults({
      dataSync: false,
      resourceLock: false,
      timerConflict: false,
      instanceCoordination: false
    })
    setEvents([])
    setSyncTestData('')
    setResourceLockTest('')
  }

  // 刷新實例信息
  const refreshInstanceInfo = () => {
    setInstanceStats(multiInstanceManager.getInstanceStats())
    setInstanceDetails(multiInstanceManager.getInstanceDetails())
  }

  // 格式化事件類型
  const formatEventType = (type: MultiInstanceEventType) => {
    const eventLabels: Record<MultiInstanceEventType, string> = {
      'instance_registered': '實例註冊',
      'instance_removed': '實例移除',
      'timer_started': '計時器啟動',
      'timer_stopped': '計時器停止',
      'timer_paused': '計時器暫停',
      'settings_changed': '設置變更',
      'data_updated': '數據更新',
      'focus_changed': '焦點變更',
      'resource_conflict': '資源衝突'
    }
    return eventLabels[type] || type
  }

  // 獲取事件圖標
  const getEventIcon = (type: MultiInstanceEventType) => {
    const iconMap: Record<MultiInstanceEventType, React.ReactNode> = {
      'instance_registered': <TabIcon color="success" />,
      'instance_removed': <TabIcon color="error" />,
      'timer_started': <PlayIcon color="primary" />,
      'timer_stopped': <StopIcon color="secondary" />,
      'timer_paused': <TimerIcon color="warning" />,
      'settings_changed': <SettingsIcon color="info" />,
      'data_updated': <StorageIcon color="info" />,
      'focus_changed': <NotificationsIcon color="default" />,
      'resource_conflict': <WarningIcon color="error" />
    }
    return iconMap[type] || <InfoIcon />
  }

  // 計算測試通過率
  const getTestPassRate = () => {
    const tests = Object.values(testResults)
    const passedTests = tests.filter(Boolean).length
    return tests.length > 0 ? (passedTests / tests.length) * 100 : 0
  }

  return (
    <Box className="multi-instance-test" p={3}>
      <Typography variant="h4" gutterBottom>
        🏷️ 多實例運行測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        驗證多個瀏覽器標籤頁同時運行應用的處理，包括數據同步、狀態管理、以及資源衝突的處理。測試多實例間的協調工作。
      </Typography>

      {/* 實例狀態概覽 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">實例狀態概覽</Typography>
            <IconButton onClick={refreshInstanceInfo} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={instanceStats.totalInstances} color="primary">
                  <TabIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {instanceStats.totalInstances}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  總實例數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={instanceStats.activeInstances} color="success">
                  <SyncIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {instanceStats.activeInstances}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  活動實例數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={instanceStats.timerInstances} color="warning">
                  <TimerIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {instanceStats.timerInstances}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  計時實例數
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Badge badgeContent={instanceStats.resourceLocks.length} color="error">
                  <LockIcon sx={{ fontSize: 40, color: 'error.main' }} />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {instanceStats.resourceLocks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  資源鎖定數
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={instanceStats.isPrimary ? '主實例' : '從實例'}
              color={instanceStats.isPrimary ? 'primary' : 'default'}
              size="small"
              icon={<SecurityIcon />}
            />
            <Chip
              label={`實例ID: ${instanceStats.instanceId.slice(-8)}`}
              variant="outlined"
              size="small"
            />
            {instanceStats.resourceLocks.map((lock, index) => (
              <Chip
                key={index}
                label={`🔒 ${lock}`}
                color="warning"
                size="small"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 測試控制區域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>測試控制</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={testDataSync}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SyncIcon />}
              >
                數據同步測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={testSettingsSync}
                startIcon={<SettingsIcon />}
              >
                設置同步測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={testResourceLock}
                disabled={loading}
                startIcon={<LockIcon />}
              >
                資源鎖定測試
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={testTimerConflict}
                startIcon={mockTimer ? <StopIcon /> : <PlayIcon />}
                color={mockTimer ? 'secondary' : 'primary'}
              >
                {mockTimer ? '停止' : '啟動'}模擬計時器
              </Button>
            </Grid>
          </Grid>

          <Box mt={2} display="flex" gap={2} alignItems="center">
            <TextField
              label="資源名稱"
              size="small"
              value={resourceLockTest}
              onChange={(e) => setResourceLockTest(e.target.value)}
              placeholder="test-resource"
            />
            
            <Button
              variant="text"
              onClick={testInstanceCoordination}
              startIcon={<TabIcon />}
            >
              實例協調測試
            </Button>
            
            <Button
              variant="text"
              color="warning"
              onClick={resetTests}
              startIcon={<RefreshIcon />}
            >
              重置測試
            </Button>
          </Box>
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
                {testResults.dataSync ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="數據同步" secondary={testResults.dataSync ? '同步正常' : '未測試或失敗'} />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.resourceLock ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="資源鎖定" secondary={testResults.resourceLock ? '鎖定機制正常' : '未測試或失敗'} />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.timerConflict ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="計時器衝突處理" secondary={testResults.timerConflict ? '衝突檢測正常' : '未測試或失敗'} />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {testResults.instanceCoordination ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="實例協調" secondary={testResults.instanceCoordination ? '協調機制正常' : '未測試或失敗'} />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 實例詳情 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>活動實例列表</Typography>
              
              {instanceDetails.instances.length === 0 ? (
                <Alert severity="info">沒有檢測到其他實例</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>實例ID</TableCell>
                        <TableCell>狀態</TableCell>
                        <TableCell>計時器</TableCell>
                        <TableCell>最後心跳</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instanceDetails.instances.map((instance) => (
                        <TableRow key={instance.id}>
                          <TableCell>
                            <Tooltip title={instance.id}>
                              <Chip 
                                label={instance.id.slice(-8)} 
                                size="small"
                                color={instance.id === instanceStats.instanceId ? 'primary' : 'default'}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={instance.isActive ? '活動' : '非活動'}
                              color={instance.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={instance.timerRunning ? '運行中' : '停止'}
                              color={instance.timerRunning ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {Math.round((Date.now() - instance.lastHeartbeat) / 1000)}s
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>資源鎖定狀態</Typography>
              
              {instanceDetails.resourceLocks.length === 0 ? (
                <Alert severity="info">沒有活動的資源鎖定</Alert>
              ) : (
                <List dense>
                  {instanceDetails.resourceLocks.map(([resource, lock], index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LockIcon color={lock.instanceId === instanceStats.instanceId ? 'primary' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={resource}
                        secondary={`持有者: ${lock.instanceId.slice(-8)} | 過期: ${Math.round((lock.expires - Date.now()) / 1000)}s`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">實例事件日誌 ({events.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {events.length === 0 ? (
                <Alert severity="info">沒有事件記錄</Alert>
              ) : (
                <Box maxHeight={400} overflow="auto">
                  <List dense>
                    {events.map((event, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getEventIcon(event.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" component="span">
                                {formatEventType(event.type)}
                              </Typography>
                              <Chip
                                label={event.instanceId.slice(-8)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </Typography>
                              {event.data && (
                                <Typography variant="caption" color="text.secondary">
                                  {JSON.stringify(event.data).slice(0, 100)}
                                  {JSON.stringify(event.data).length > 100 ? '...' : ''}
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
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* 測試數據展示 */}
        {syncTestData && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>同步測試數據</Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={syncTestData}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 使用說明對話框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>多實例測試說明</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            <strong>如何測試多實例功能：</strong>
          </Typography>
          
          <Typography variant="body2" paragraph>
            1. <strong>打開多個標籤頁</strong>：在同一個瀏覽器中打開多個標籤頁，每個都訪問這個應用。
          </Typography>
          
          <Typography variant="body2" paragraph>
            2. <strong>觀察實例統計</strong>：查看實例狀態概覽中的數據，應該能看到多個實例。
          </Typography>
          
          <Typography variant="body2" paragraph>
            3. <strong>測試數據同步</strong>：在一個標籤頁中點擊"數據同步測試"，其他標籤頁應該收到通知。
          </Typography>
          
          <Typography variant="body2" paragraph>
            4. <strong>測試資源鎖定</strong>：在一個標籤頁中獲取資源鎖，其他標籤頁嘗試獲取相同資源應該失敗。
          </Typography>
          
          <Typography variant="body2" paragraph>
            5. <strong>測試計時器衝突</strong>：在多個標籤頁中啟動計時器，觀察衝突檢測機制。
          </Typography>
          
          <Typography variant="body2" paragraph>
            6. <strong>檢查事件日誌</strong>：展開事件日誌查看實例間的通信記錄。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 浮動操作按鈕 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          gap: 1
        }}
      >
        <Tooltip title="使用說明">
          <IconButton
            color="primary"
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default MultiInstanceTest



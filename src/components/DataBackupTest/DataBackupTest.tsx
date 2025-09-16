/**
 * 數據備份和恢復測試組件
 * 提供完整的數據備份、導出、導入和恢復功能測試界面
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Mic as MicIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { dataBackupManager, type BackupData, type ImportValidationResult, type BackupStats } from '../../utils/dataBackupManager'
import './DataBackupTest.css'

const DataBackupTest: React.FC = () => {
  // 狀態管理
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null)
  const [lastBackupData, setLastBackupData] = useState<BackupData | null>(null)
  
  // 導入相關狀態
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null)
  const [importContent, setImportContent] = useState<string>('')
  const [importOptions, setImportOptions] = useState({
    overwrite: false,
    mergeHistory: true,
    preserveCustomVoices: true
  })

  // 檔案輸入引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 載入備份統計
   */
  const loadBackupStats = useCallback(async () => {
    try {
      const stats = await dataBackupManager.getBackupStats()
      setBackupStats(stats)
    } catch (err) {
      console.error('載入統計失敗:', err)
      setError(err instanceof Error ? err.message : '載入統計失敗')
    }
  }, [])

  /**
   * 創建完整備份
   */
  const handleCreateBackup = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const backupData = await dataBackupManager.createFullBackup()
      setLastBackupData(backupData)
      setSuccess(`備份創建成功！包含 ${Object.keys(backupData.data).filter(key => 
        backupData.data[key as keyof typeof backupData.data] !== null && 
        (Array.isArray(backupData.data[key as keyof typeof backupData.data]) ? 
          (backupData.data[key as keyof typeof backupData.data] as any[]).length > 0 : true)
      ).length} 種數據類型`)
      await loadBackupStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '創建備份失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 導出備份文件
   */
  const handleExportBackup = async (format: 'json' | 'encrypted') => {
    setIsLoading(true)
    setError(null)

    try {
      await dataBackupManager.exportBackupToFile(format)
      setSuccess(`備份已導出為 ${format.toUpperCase()} 格式`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '導出備份失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 處理文件選擇
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (content) {
        setImportContent(content)
        await validateImportContent(content)
        setImportDialogOpen(true)
      }
    }
    reader.onerror = () => {
      setError('讀取文件失敗')
    }
    reader.readAsText(file)

    // 清空文件輸入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 驗證導入內容
   */
  const validateImportContent = async (content: string) => {
    try {
      const validation = await dataBackupManager.validateImportData(content)
      setImportValidation(validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : '驗證導入數據失敗')
    }
  }

  /**
   * 執行數據導入
   */
  const handleImportData = async () => {
    if (!importContent) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await dataBackupManager.importAndRestoreData(importContent, importOptions)
      setSuccess(`數據導入成功！恢復了 ${result.dataTypes.length} 種數據類型`)
      setImportDialogOpen(false)
      setImportContent('')
      setImportValidation(null)
      await loadBackupStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '導入數據失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 清除所有數據
   */
  const handleClearAllData = async () => {
    if (!window.confirm('確定要清除所有數據嗎？此操作不可撤銷！\n\n建議在清除前先創建備份。')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await dataBackupManager.clearAllData()
      setSuccess('所有數據已清除')
      setBackupStats(null)
      setLastBackupData(null)
      await loadBackupStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '清除數據失敗')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * 格式化日期
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 渲染數據類型圖標
   */
  const renderDataTypeIcon = (type: string) => {
    switch (type) {
      case 'settings': return <SettingsIcon color="primary" />
      case 'calibration': return <TimelineIcon color="secondary" />
      case 'history': return <HistoryIcon color="info" />
      case 'customVoices': return <MicIcon color="success" />
      default: return <StorageIcon />
    }
  }

  /**
   * 渲染驗證結果
   */
  const renderValidationResult = () => {
    if (!importValidation) return null

    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {importValidation.isValid ? (
            <CheckCircleIcon color="success" />
          ) : (
            <ErrorIcon color="error" />
          )}
          <Typography variant="h6">
            {importValidation.isValid ? '驗證通過' : '驗證失敗'}
          </Typography>
        </Box>

        {/* 基本信息 */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">版本</Typography>
            <Typography variant="body1">{importValidation.version || '未知'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">文件大小</Typography>
            <Typography variant="body1">{formatFileSize(importValidation.totalSize)}</Typography>
          </Grid>
        </Grid>

        {/* 數據統計 */}
        <Typography variant="subtitle2" gutterBottom>數據統計</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>數據類型</TableCell>
                <TableCell align="right">記錄數</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SettingsIcon fontSize="small" />
                    設置
                  </Box>
                </TableCell>
                <TableCell align="right">{importValidation.recordCounts.settings}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimelineIcon fontSize="small" />
                    校準
                  </Box>
                </TableCell>
                <TableCell align="right">{importValidation.recordCounts.calibration}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <HistoryIcon fontSize="small" />
                    歷史記錄
                  </Box>
                </TableCell>
                <TableCell align="right">{importValidation.recordCounts.history}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MicIcon fontSize="small" />
                    自定義語音
                  </Box>
                </TableCell>
                <TableCell align="right">{importValidation.recordCounts.customVoices}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* 錯誤信息 */}
        {importValidation.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">錯誤：</Typography>
            <List dense>
              {importValidation.errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* 警告信息 */}
        {importValidation.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">警告：</Typography>
            <List dense>
              {importValidation.warnings.map((warning, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Box>
    )
  }

  // 初始載入
  React.useEffect(() => {
    loadBackupStats()
  }, [loadBackupStats])

  return (
    <Box className="data-backup-test" p={3}>
      <Typography variant="h4" gutterBottom>
        🗄️ 數據備份和恢復測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        測試用戶數據的完整備份、導出、導入和恢復功能，包括設置導出、數據導入以及跨設備同步的可能性。
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 當前數據狀態 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                當前數據狀態
              </Typography>
              
              {backupStats ? (
                <Box>
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">數據類型</Typography>
                      <Typography variant="h6">{backupStats.dataTypes}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">估算大小</Typography>
                      <Typography variant="h6">{formatFileSize(backupStats.totalSize)}</Typography>
                    </Grid>
                  </Grid>

                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {backupStats.settings && (
                      <Chip 
                        icon={<SettingsIcon />} 
                        label="設置" 
                        color="primary" 
                        size="small" 
                      />
                    )}
                    {backupStats.calibration && (
                      <Chip 
                        icon={<TimelineIcon />} 
                        label="校準" 
                        color="secondary" 
                        size="small" 
                      />
                    )}
                    {backupStats.historyRecords > 0 && (
                      <Chip 
                        icon={<HistoryIcon />} 
                        label={`歷史 (${backupStats.historyRecords})`} 
                        color="info" 
                        size="small" 
                      />
                    )}
                    {backupStats.customVoices > 0 && (
                      <Chip 
                        icon={<MicIcon />} 
                        label={`語音 (${backupStats.customVoices})`} 
                        color="success" 
                        size="small" 
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    統計時間：{formatDate(backupStats.createdAt)}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  載入中...
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={loadBackupStats}
                disabled={isLoading}
              >
                刷新統計
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 備份操作 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BackupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                創建備份
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                創建包含所有用戶數據的完整備份，包括設置、校準數據、歷史記錄和自定義語音。
              </Typography>
              
              {lastBackupData && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    最新備份：{formatDate(lastBackupData.timestamp)}
                    <br />
                    版本：{lastBackupData.version}
                    <br />
                    數據類型：{Object.keys(lastBackupData.data).filter(key => 
                      lastBackupData.data[key as keyof typeof lastBackupData.data] !== null
                    ).length} 種
                  </Typography>
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                onClick={handleCreateBackup}
                disabled={isLoading}
                startIcon={<BackupIcon />}
              >
                創建備份
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 導出功能 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DownloadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                導出備份
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                將備份數據導出為文件，支持 JSON 和加密格式。
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                onClick={() => handleExportBackup('json')}
                disabled={isLoading}
                startIcon={<DownloadIcon />}
                size="small"
              >
                JSON 格式
              </Button>
              <Button
                onClick={() => handleExportBackup('encrypted')}
                disabled={isLoading}
                startIcon={<DownloadIcon />}
                size="small"
              >
                加密格式
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 導入功能 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <UploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                導入恢復
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                從備份文件恢復數據，支持數據驗證和選擇性恢復。
              </Typography>
            </CardContent>
            <CardActions>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.bak"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                startIcon={<UploadIcon />}
                size="small"
              >
                選擇文件
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 危險操作 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                危險操作
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                清除所有數據。此操作不可撤銷，建議在操作前先創建備份。
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearAllData}
                disabled={isLoading}
                startIcon={<DeleteIcon />}
                size="small"
              >
                清除所有數據
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* 導入對話框 */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          導入數據備份
        </DialogTitle>
        <DialogContent>
          {renderValidationResult()}

          {importValidation?.isValid && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>導入選項</Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={importOptions.overwrite}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      overwrite: e.target.checked
                    }))}
                  />
                }
                label="覆蓋現有數據"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={importOptions.mergeHistory}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      mergeHistory: e.target.checked
                    }))}
                  />
                }
                label="合併歷史記錄"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={importOptions.preserveCustomVoices}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      preserveCustomVoices: e.target.checked
                    }))}
                  />
                }
                label="保留現有自定義語音"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleImportData}
            disabled={!importValidation?.isValid || isLoading}
            variant="contained"
            startIcon={<RestoreIcon />}
          >
            導入數據
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DataBackupTest



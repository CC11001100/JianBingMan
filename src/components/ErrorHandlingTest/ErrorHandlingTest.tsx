import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  NetworkWifi as NetworkIcon,
  Api as ApiIcon,
  BugReport as RuntimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { errorHandlingTester, type ErrorTestReport, type ErrorTestResult } from '../../utils/errorHandlingTest'
import './ErrorHandlingTest.css'

interface TestProgress {
  category: string
  completed: boolean
  progress: number
}

const ErrorHandlingTest: React.FC = () => {
  const [testReport, setTestReport] = useState<ErrorTestReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [testProgress, setTestProgress] = useState<TestProgress[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const [autoExpand, setAutoExpand] = useState(false)
  const [showPassedTests, setShowPassedTests] = useState(true)
  const [currentTestCategory, setCurrentTestCategory] = useState<string>('')

  // 测试类别配置
  const testCategories = [
    { id: 'storage', name: '存储错误', icon: <StorageIcon />, color: '#2196f3' },
    { id: 'network', name: '网络错误', icon: <NetworkIcon />, color: '#4caf50' },
    { id: 'permission', name: '权限错误', icon: <SecurityIcon />, color: '#ff9800' },
    { id: 'api', name: 'API错误', icon: <ApiIcon />, color: '#9c27b0' },
    { id: 'runtime', name: '运行时错误', icon: <RuntimeIcon />, color: '#f44336' }
  ]

  // 初始化测试进度
  useEffect(() => {
    const initialProgress = testCategories.map(category => ({
      category: category.id,
      completed: false,
      progress: 0
    }))
    setTestProgress(initialProgress)
  }, [])

  // 运行完整的错误处理测试
  const runCompleteTest = async () => {
    setIsRunning(true)
    setCurrentTestCategory('')
    setTestReport(null)
    
    // 重置进度
    setTestProgress(prev => prev.map(p => ({ ...p, completed: false, progress: 0 })))

    try {
      // 模拟测试进度更新
      for (const category of testCategories) {
        setCurrentTestCategory(category.name)
        
        // 更新当前类别进度
        setTestProgress(prev => prev.map(p => 
          p.category === category.id 
            ? { ...p, progress: 50 } 
            : p
        ))
        
        // 模拟测试时间
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 完成当前类别
        setTestProgress(prev => prev.map(p => 
          p.category === category.id 
            ? { ...p, completed: true, progress: 100 } 
            : p
        ))
      }

      // 运行实际测试
      const report = await errorHandlingTester.runCompleteErrorTest()
      setTestReport(report)

      // 自动展开失败的测试
      if (autoExpand) {
        const failedCategories = new Set(
          report.testResults
            .filter(test => !test.success)
            .map(test => test.category)
        )
        setExpandedCategories(failedCategories)
      }

    } catch (error) {
      console.error('测试执行失败:', error)
      // 创建错误报告
      const errorReport: ErrorTestReport = {
        timestamp: Date.now(),
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        testResults: [{
          testName: '测试执行异常',
          category: 'runtime',
          success: false,
          message: error instanceof Error ? error.message : '未知错误',
          errorDetails: error
        }],
        overallStability: 'poor',
        recommendations: ['测试执行出现异常，建议检查控制台错误信息'],
        errorPatterns: []
      }
      setTestReport(errorReport)
    } finally {
      setIsRunning(false)
      setCurrentTestCategory('')
    }
  }

  // 停止测试
  const stopTest = () => {
    setIsRunning(false)
    setCurrentTestCategory('')
    setTestProgress(prev => prev.map(p => ({ ...p, completed: false, progress: 0 })))
  }

  // 清除结果
  const clearResults = () => {
    setTestReport(null)
    setExpandedCategories(new Set())
    setExpandedTests(new Set())
    setTestProgress(prev => prev.map(p => ({ ...p, completed: false, progress: 0 })))
  }

  // 导出测试报告
  const exportReport = () => {
    if (!testReport) return

    const report = generateMarkdownReport(testReport)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-handling-test-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 生成Markdown报告
  const generateMarkdownReport = (report: ErrorTestReport): string => {
    const timestamp = new Date(report.timestamp).toLocaleString('zh-CN')
    
    let markdown = `# 煎饼侠 API错误处理测试报告\n\n`
    markdown += `**测试时间**: ${timestamp}\n`
    markdown += `**浏览器**: ${report.browserInfo.userAgent}\n`
    markdown += `**平台**: ${report.browserInfo.platform}\n`
    markdown += `**语言**: ${report.browserInfo.language}\n`
    markdown += `**整体稳定性**: ${report.overallStability.toUpperCase()}\n\n`

    // 测试统计
    const totalTests = report.testResults.length
    const passedTests = report.testResults.filter(test => test.success).length
    const failedTests = totalTests - passedTests
    const passRate = Math.round((passedTests / totalTests) * 100)

    markdown += `## 测试统计\n\n`
    markdown += `- **总测试数**: ${totalTests}\n`
    markdown += `- **通过测试**: ${passedTests}\n`
    markdown += `- **失败测试**: ${failedTests}\n`
    markdown += `- **通过率**: ${passRate}%\n\n`

    // 按类别分组测试结果
    markdown += `## 测试结果详情\n\n`
    
    for (const category of testCategories) {
      const categoryTests = report.testResults.filter(test => test.category === category.id)
      if (categoryTests.length === 0) continue

      const categoryPassed = categoryTests.filter(test => test.success).length
      const categoryTotal = categoryTests.length
      
      markdown += `### ${category.name}\n`
      markdown += `通过率: ${Math.round((categoryPassed / categoryTotal) * 100)}% (${categoryPassed}/${categoryTotal})\n\n`

      for (const test of categoryTests) {
        const icon = test.success ? '✅' : '❌'
        markdown += `#### ${icon} ${test.testName}\n`
        markdown += `- **状态**: ${test.success ? '通过' : '失败'}\n`
        markdown += `- **描述**: ${test.message}\n`
        
        if (test.fallbackActivated !== undefined) {
          markdown += `- **降级方案**: ${test.fallbackActivated ? '已激活' : '未激活'}\n`
        }
        
        if (test.recoverySuccessful !== undefined) {
          markdown += `- **恢复成功**: ${test.recoverySuccessful ? '是' : '否'}\n`
        }
        
        if (test.userGuidance) {
          markdown += `- **用户指导**: ${test.userGuidance}\n`
        }
        
        if (test.errorDetails) {
          markdown += `- **错误详情**: ${JSON.stringify(test.errorDetails)}\n`
        }
        
        markdown += `\n`
      }
    }

    // 优化建议
    if (report.recommendations.length > 0) {
      markdown += `## 优化建议\n\n`
      report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`
      })
      markdown += `\n`
    }

    // 错误模式分析
    if (report.errorPatterns.length > 0) {
      markdown += `## 错误模式分析\n\n`
      report.errorPatterns.forEach(pattern => {
        const severityIcon = pattern.severity === 'high' ? '🔴' : 
                           pattern.severity === 'medium' ? '🟡' : '🟢'
        markdown += `- ${severityIcon} **${pattern.category}**: 出现 ${pattern.frequency} 次错误 (${pattern.severity} 严重程度)\n`
      })
    }

    return markdown
  }

  // 切换类别展开状态
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // 切换测试展开状态
  const toggleTestExpansion = (testName: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testName)) {
        newSet.delete(testName)
      } else {
        newSet.add(testName)
      }
      return newSet
    })
  }

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    return testCategories.find(cat => cat.id === category)?.color || '#666'
  }

  // 获取类别图标
  const getCategoryIcon = (category: string) => {
    return testCategories.find(cat => cat.id === category)?.icon || <ErrorIcon />
  }

  // 获取稳定性颜色
  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'fair': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }

  // 过滤测试结果
  const getFilteredTests = (categoryTests: ErrorTestResult[]) => {
    if (showPassedTests) {
      return categoryTests
    }
    return categoryTests.filter(test => !test.success)
  }

  return (
    <Box className="error-handling-test" sx={{ p: 3 }}>
      {/* 标题 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ErrorIcon color="primary" />
        API错误处理测试
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        全面测试应用在各种错误和异常场景下的处理能力，包括存储错误、网络问题、权限拒绝、API故障和运行时异常。
      </Typography>

      {/* 控制面板 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runCompleteTest}
            disabled={isRunning}
          >
            运行完整测试
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={stopTest}
            disabled={!isRunning}
          >
            停止测试
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={clearResults}
            disabled={isRunning}
          >
            清除结果
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportReport}
            disabled={!testReport}
          >
            导出报告
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoExpand}
                onChange={(e) => setAutoExpand(e.target.checked)}
                disabled={isRunning}
              />
            }
            label="自动展开失败项"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showPassedTests}
                onChange={(e) => setShowPassedTests(e.target.checked)}
              />
            }
            label="显示通过的测试"
          />
        </Box>

        {/* 测试进度 */}
        {isRunning && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              测试进度: {currentTestCategory || '准备中...'}
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              {testProgress.map((progress) => {
                const category = testCategories.find(cat => cat.id === progress.category)
                return (
                  <Grid item xs={6} sm={2.4} key={progress.category}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        {React.cloneElement(category?.icon || <ErrorIcon />, {
                          sx: { color: progress.completed ? 'success.main' : 'text.secondary' }
                        })}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {category?.name}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress.progress} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* 测试结果概览 */}
      {testReport && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            测试结果概览
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {testReport.testResults.length}
                </Typography>
                <Typography variant="caption">总测试数</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {testReport.testResults.filter(test => test.success).length}
                </Typography>
                <Typography variant="caption">通过</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {testReport.testResults.filter(test => !test.success).length}
                </Typography>
                <Typography variant="caption">失败</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4">
                  {Math.round((testReport.testResults.filter(test => test.success).length / testReport.testResults.length) * 100)}%
                </Typography>
                <Typography variant="caption">通过率</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">
              整体稳定性:
            </Typography>
            <Chip
              label={testReport.overallStability.toUpperCase()}
              color={getStabilityColor(testReport.overallStability) as any}
              variant="filled"
            />
          </Box>

          {/* 优化建议 */}
          {testReport.recommendations.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">优化建议 ({testReport.recommendations.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {testReport.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Paper>
      )}

      {/* 测试详情 */}
      {testReport && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            测试详情
          </Typography>
          
          {testCategories.map((category) => {
            const categoryTests = testReport.testResults.filter(test => test.category === category.id)
            if (categoryTests.length === 0) return null

            const filteredTests = getFilteredTests(categoryTests)
            if (filteredTests.length === 0 && !showPassedTests) return null

            const passedCount = categoryTests.filter(test => test.success).length
            const totalCount = categoryTests.length
            const passRate = Math.round((passedCount / totalCount) * 100)

            return (
              <Accordion
                key={category.id}
                expanded={expandedCategories.has(category.id)}
                onChange={() => toggleCategoryExpansion(category.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {React.cloneElement(category.icon, {
                      sx: { color: category.color }
                    })}
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      {category.name}
                    </Typography>
                    <Chip
                      label={`${passedCount}/${totalCount}`}
                      size="small"
                      color={passRate === 100 ? 'success' : passRate >= 75 ? 'info' : passRate >= 50 ? 'warning' : 'error'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {passRate}%
                    </Typography>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  {filteredTests.map((test) => (
                    <Card key={test.testName} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleTestExpansion(test.testName)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {test.success ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                            <Typography variant="subtitle2">
                              {test.testName}
                            </Typography>
                            <Chip
                              label={test.success ? '通过' : '失败'}
                              size="small"
                              color={test.success ? 'success' : 'error'}
                            />
                          </Box>
                          
                          <IconButton size="small">
                            {expandedTests.has(test.testName) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {test.message}
                        </Typography>

                        <Collapse in={expandedTests.has(test.testName)}>
                          <Divider sx={{ my: 2 }} />
                          
                          <Grid container spacing={2}>
                            {test.fallbackActivated !== undefined && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                  降级方案:
                                </Typography>
                                <Typography variant="body2">
                                  {test.fallbackActivated ? '✅ 已激活' : '❌ 未激活'}
                                </Typography>
                              </Grid>
                            )}
                            
                            {test.recoverySuccessful !== undefined && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                  恢复成功:
                                </Typography>
                                <Typography variant="body2">
                                  {test.recoverySuccessful ? '✅ 是' : '❌ 否'}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          {test.userGuidance && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                <strong>用户指导:</strong> {test.userGuidance}
                              </Typography>
                            </Alert>
                          )}

                          {test.errorDetails && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                <strong>错误详情:</strong> {JSON.stringify(test.errorDetails)}
                              </Typography>
                            </Alert>
                          )}
                        </Collapse>
                      </CardContent>
                    </Card>
                  ))}
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Paper>
      )}

      {/* 无测试结果时的提示 */}
      {!testReport && !isRunning && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            还没有测试结果
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            点击"运行完整测试"开始API错误处理测试
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runCompleteTest}
          >
            开始测试
          </Button>
        </Paper>
      )}
    </Box>
  )
}

export default ErrorHandlingTest



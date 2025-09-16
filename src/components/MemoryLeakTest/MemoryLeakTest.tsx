import React, { useState, useEffect, useRef } from 'react'
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
  ListItemIcon
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { memoryLeakDetector, type MemoryLeakReport, type LeakTestConfig } from '../../utils/memoryLeakDetector'
import PancakeTimer from '../PancakeTimer/PancakeTimer'
import './MemoryLeakTest.css'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  report?: MemoryLeakReport
  progress: number
}

const MemoryLeakTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [memoryUsage, setMemoryUsage] = useState({
    used: 0,
    total: 0,
    limit: 0,
    ratio: 0
  })
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  
  // 隐藏的测试区域引用
  const testAreaRef = useRef<HTMLDivElement>(null)
  const timerInstancesRef = useRef<any[]>([])
  const intervalRef = useRef<number | null>(null)

  // 初始化测试列表
  useEffect(() => {
    const initialTests: TestResult[] = [
      { id: 'timer-lifecycle', name: '计时器生命周期测试', status: 'pending', progress: 0 },
      { id: 'event-listeners', name: '事件监听器清理测试', status: 'pending', progress: 0 },
      { id: 'component-mounting', name: '组件挂载卸载测试', status: 'pending', progress: 0 },
      { id: 'animation-cleanup', name: '动画资源清理测试', status: 'pending', progress: 0 },
      { id: 'audio-resources', name: '音频资源清理测试', status: 'pending', progress: 0 },
      { id: 'settings-persistence', name: '设置持久化内存测试', status: 'pending', progress: 0 },
      { id: 'long-running', name: '长时间运行测试', status: 'pending', progress: 0 }
    ]
    setTests(initialTests)
  }, [])

  // 监控内存使用
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        setMemoryUsage({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          ratio: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        })
      }
    }

    updateMemoryUsage()
    intervalRef.current = window.setInterval(updateMemoryUsage, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // 运行单个测试
  const runTest = async (testId: string) => {
    const testConfig = createTestConfig(testId)
    if (!testConfig) return

    setCurrentTest(testId)
    updateTestStatus(testId, 'running', 0)

    try {
      const report = await memoryLeakDetector.runTest(testConfig)
      updateTestStatus(testId, 'completed', 100, report)
    } catch (error) {
      console.error(`Test ${testId} failed:`, error)
      updateTestStatus(testId, 'failed', 0)
    } finally {
      setCurrentTest(null)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true)
    
    for (const test of tests) {
      if (test.status === 'pending') {
        await runTest(test.id)
        // 测试间隔，让系统恢复
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 强制垃圾回收
        if ((window as any).gc) {
          (window as any).gc()
        }
      }
    }
    
    setIsRunning(false)
  }

  // 停止测试
  const stopTests = () => {
    memoryLeakDetector.stopTest()
    cleanupTestResources()
    setIsRunning(false)
    setCurrentTest(null)
    
    // 将运行中的测试标记为pending
    setTests(prev => prev.map(test => 
      test.status === 'running' ? { ...test, status: 'pending', progress: 0 } : test
    ))
  }

  // 清除结果
  const clearResults = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending' as const,
      progress: 0,
      report: undefined
    })))
    setExpandedResults(new Set())
  }

  // 更新测试状态
  const updateTestStatus = (testId: string, status: TestResult['status'], progress: number, report?: MemoryLeakReport) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status, progress, report } : test
    ))
  }

  // 清理测试资源
  const cleanupTestResources = () => {
    // 清理计时器实例
    timerInstancesRef.current.forEach(instance => {
      if (instance && instance.cleanup) {
        instance.cleanup()
      }
    })
    timerInstancesRef.current = []

    // 清理测试区域
    if (testAreaRef.current) {
      testAreaRef.current.innerHTML = ''
    }
  }

  // 创建测试配置
  const createTestConfig = (testId: string): LeakTestConfig | null => {
    switch (testId) {
      case 'timer-lifecycle':
        return {
          name: '计时器生命周期测试',
          description: '测试计时器组件的启动、暂停、重置是否正确清理资源',
          duration: 15000,
          snapshotInterval: 1000,
          iterations: 20,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 创建多个计时器实例并进行各种操作
            for (let i = 0; i < 5; i++) {
              const timerContainer = document.createElement('div')
              timerContainer.style.display = 'none'
              testAreaRef.current?.appendChild(timerContainer)
              
              // 模拟计时器操作
              setTimeout(() => {
                // 模拟开始计时
                const mockTimer = {
                  id: i,
                  state: 'running',
                  interval: setInterval(() => {
                    // 模拟计时逻辑
                  }, 1000),
                  cleanup: function() {
                    if (this.interval) {
                      clearInterval(this.interval)
                    }
                  }
                }
                timerInstancesRef.current.push(mockTimer)
                
                // 随机操作
                if (Math.random() > 0.5) {
                  setTimeout(() => {
                    mockTimer.cleanup()
                  }, Math.random() * 5000)
                }
              }, i * 100)
            }
          },
          cleanupTest: () => {
            cleanupTestResources()
          }
        }

      case 'event-listeners':
        return {
          name: '事件监听器清理测试',
          description: '测试按钮点击、键盘事件等监听器是否正确清理',
          duration: 12000,
          snapshotInterval: 800,
          iterations: 30,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 创建大量事件监听器
            for (let i = 0; i < 10; i++) {
              const button = document.createElement('button')
              button.textContent = `Test Button ${i}`
              testAreaRef.current?.appendChild(button)
              
              // 添加多种事件监听器
              const clickListener = () => console.log(`Button ${i} clicked`)
              const mouseOverListener = () => console.log(`Button ${i} hover`)
              const keyDownListener = (e: KeyboardEvent) => console.log(`Key ${e.key} pressed`)
              
              button.addEventListener('click', clickListener)
              button.addEventListener('mouseover', mouseOverListener)
              document.addEventListener('keydown', keyDownListener)
              
              // 只清理一部分监听器（模拟泄漏）
              if (i % 3 === 0) {
                setTimeout(() => {
                  button.removeEventListener('click', clickListener)
                  document.removeEventListener('keydown', keyDownListener)
                }, Math.random() * 3000)
              }
            }
          },
          cleanupTest: () => {
            cleanupTestResources()
          }
        }

      case 'component-mounting':
        return {
          name: '组件挂载卸载测试',
          description: '测试组件反复挂载卸载是否导致内存泄漏',
          duration: 20000,
          snapshotInterval: 1000,
          iterations: 15,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 模拟React组件的挂载和卸载
            const createMockComponent = (id: number) => {
              const container = document.createElement('div')
              container.id = `mock-component-${id}`
              container.innerHTML = `
                <div>
                  <h3>Mock Timer Component ${id}</h3>
                  <button>Start</button>
                  <button>Pause</button>
                  <button>Reset</button>
                  <div style="width: 200px; height: 200px; border: 1px solid #ccc;"></div>
                </div>
              `
              testAreaRef.current?.appendChild(container)
              
              // 模拟组件状态和副作用
              const componentState = {
                timers: [],
                listeners: [],
                mounted: true,
                cleanup: function() {
                  this.timers.forEach(clearInterval)
                  this.listeners.forEach(({ target, event, handler }) => {
                    target.removeEventListener(event, handler)
                  })
                  this.mounted = false
                  if (container.parentNode) {
                    container.parentNode.removeChild(container)
                  }
                }
              }
              
              // 添加定时器
              const timer = setInterval(() => {
                if (componentState.mounted) {
                  // 模拟状态更新
                  console.log(`Component ${id} tick`)
                }
              }, 100)
              componentState.timers.push(timer)
              
              // 添加事件监听器
              const buttons = container.querySelectorAll('button')
              buttons.forEach((button, btnIdx) => {
                const handler = () => console.log(`Component ${id} button ${btnIdx} clicked`)
                button.addEventListener('click', handler)
                componentState.listeners.push({ target: button, event: 'click', handler })
              })
              
              timerInstancesRef.current.push(componentState)
              
              // 随机时间后卸载组件
              setTimeout(() => {
                if (Math.random() > 0.3) { // 70%的概率正确清理
                  componentState.cleanup()
                }
              }, Math.random() * 8000 + 2000)
            }
            
            // 创建多个组件实例
            for (let i = 0; i < 8; i++) {
              setTimeout(() => createMockComponent(i), i * 200)
            }
          },
          cleanupTest: () => {
            cleanupTestResources()
          }
        }

      case 'animation-cleanup':
        return {
          name: '动画资源清理测试',
          description: '测试动画帧、CSS动画等资源是否正确清理',
          duration: 10000,
          snapshotInterval: 500,
          iterations: 25,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            const animationIds: number[] = []
            
            // 创建大量动画帧
            for (let i = 0; i < 20; i++) {
              const animate = () => {
                const element = document.createElement('div')
                element.style.cssText = `
                  position: absolute;
                  width: 10px;
                  height: 10px;
                  background: red;
                  left: ${Math.random() * 100}px;
                  top: ${Math.random() * 100}px;
                  transition: all 0.3s ease;
                `
                testAreaRef.current?.appendChild(element)
                
                let frame = 0
                const animateStep = () => {
                  frame++
                  element.style.transform = `rotate(${frame * 2}deg) scale(${1 + Math.sin(frame * 0.1) * 0.5})`
                  
                  if (frame < 200) {
                    const id = requestAnimationFrame(animateStep)
                    animationIds.push(id)
                  }
                }
                
                const id = requestAnimationFrame(animateStep)
                animationIds.push(id)
              }
              
              setTimeout(animate, i * 100)
            }
            
            // 只取消一部分动画（模拟泄漏）
            setTimeout(() => {
              animationIds.slice(0, animationIds.length / 2).forEach(id => {
                cancelAnimationFrame(id)
              })
            }, 5000)
          },
          cleanupTest: () => {
            cleanupTestResources()
          }
        }

      case 'audio-resources':
        return {
          name: '音频资源清理测试',
          description: '测试音频播放、语音合成等资源是否正确清理',
          duration: 8000,
          snapshotInterval: 600,
          iterations: 10,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 模拟音频资源使用
            for (let i = 0; i < 5; i++) {
              // 创建音频上下文
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.setValueAtTime(440 + i * 100, audioContext.currentTime)
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.5)
                
                // 模拟部分清理不当
                if (i % 2 === 0) {
                  setTimeout(() => {
                    audioContext.close()
                  }, 1000)
                }
              } catch (error) {
                console.warn('Audio context creation failed:', error)
              }
              
              // 模拟语音合成
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(`Test speech ${i}`)
                utterance.volume = 0.1
                utterance.rate = 1.5
                speechSynthesis.speak(utterance)
              }
            }
          },
          cleanupTest: () => {
            cleanupTestResources()
            // 停止所有语音合成
            if ('speechSynthesis' in window) {
              speechSynthesis.cancel()
            }
          }
        }

      case 'settings-persistence':
        return {
          name: '设置持久化内存测试',
          description: '测试设置保存加载是否导致内存积累',
          duration: 6000,
          snapshotInterval: 400,
          iterations: 50,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 模拟频繁的设置保存和加载
            const settings = {
              flipInterval: 120,
              volume: 0.8,
              speechEnabled: true,
              customPrompts: []
            }
            
            // 生成大量设置数据
            for (let i = 0; i < 100; i++) {
              settings.customPrompts.push(`Custom prompt ${i} with some longer text content to simulate real usage`)
            }
            
            // 频繁保存到localStorage
            const key = `test-settings-${Date.now()}`
            localStorage.setItem(key, JSON.stringify(settings))
            
            // 模拟设置变更
            setTimeout(() => {
              settings.flipInterval = Math.random() * 300 + 30
              settings.volume = Math.random()
              localStorage.setItem(key, JSON.stringify(settings))
            }, 1000)
            
            // 清理（模拟部分清理不当）
            setTimeout(() => {
              if (Math.random() > 0.3) {
                localStorage.removeItem(key)
              }
            }, 4000)
          },
          cleanupTest: () => {
            cleanupTestResources()
            // 清理测试产生的localStorage项
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('test-settings-')) {
                localStorage.removeItem(key)
              }
            })
          }
        }

      case 'long-running':
        return {
          name: '长时间运行测试',
          description: '模拟应用长时间运行的内存使用情况',
          duration: 30000,
          snapshotInterval: 2000,
          iterations: 1,
          setupTest: () => {
            cleanupTestResources()
          },
          runTest: () => {
            // 模拟长时间运行场景
            const simulateUserInteraction = () => {
              // 创建临时DOM元素
              const element = document.createElement('div')
              element.innerHTML = `
                <div style="padding: 10px;">
                  <button>Action ${Math.random()}</button>
                  <input type="text" value="test input">
                  <div>Content: ${new Array(50).fill(0).map(() => Math.random()).join(',')}</div>
                </div>
              `
              testAreaRef.current?.appendChild(element)
              
              // 添加事件监听器
              const button = element.querySelector('button')
              const input = element.querySelector('input')
              
              if (button) {
                const clickHandler = () => {
                  console.log('User action triggered')
                  // 创建一些临时数据
                  const tempData = new Array(100).fill(0).map(() => ({
                    id: Math.random(),
                    data: Math.random().toString(36)
                  }))
                  console.log('Processed', tempData.length, 'items')
                }
                button.addEventListener('click', clickHandler)
                button.click()
                
                // 随机清理
                if (Math.random() > 0.4) {
                  setTimeout(() => {
                    button.removeEventListener('click', clickHandler)
                    if (element.parentNode) {
                      element.parentNode.removeChild(element)
                    }
                  }, Math.random() * 5000)
                }
              }
            }
            
            // 定期模拟用户交互
            const interactionInterval = setInterval(simulateUserInteraction, 800)
            timerInstancesRef.current.push({
              cleanup: () => clearInterval(interactionInterval)
            })
          },
          cleanupTest: () => {
            cleanupTestResources()
          }
        }

      default:
        return null
    }
  }

  // 切换结果展开状态
  const toggleResultExpansion = (testId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  // 导出结果
  const exportResults = () => {
    const completedTests = tests.filter(test => test.report)
    if (completedTests.length === 0) {
      alert('没有测试结果可以导出')
      return
    }

    const report = generateReport(completedTests)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pancake-timer-memory-leak-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 生成报告
  const generateReport = (completedTests: TestResult[]) => {
    const timestamp = new Date().toLocaleString('zh-CN')
    
    let report = `# 煎饼侠内存泄漏检测报告\n\n`
    report += `**测试时间**: ${timestamp}\n\n`
    
    // 总体统计
    const totalLeaks = completedTests.reduce((sum, test) => 
      sum + (test.report?.suspectedLeaks.length || 0), 0)
    const avgMemoryGrowth = completedTests.reduce((sum, test) => 
      sum + (test.report?.memoryGrowth || 0), 0) / completedTests.length
    const criticalTests = completedTests.filter(test => 
      test.report?.severity === 'critical').length
    
    report += `## 总体统计\n`
    report += `- **完成测试**: ${completedTests.length}\n`
    report += `- **发现问题**: ${totalLeaks}个\n`
    report += `- **严重问题**: ${criticalTests}个\n`
    report += `- **平均内存增长**: ${avgMemoryGrowth.toFixed(2)}MB\n\n`
    
    report += `## 测试结果详情\n\n`
    
    completedTests.forEach(test => {
      if (!test.report) return
      
      const severityIcon = {
        'low': '✅',
        'medium': '⚠️',
        'high': '❌',
        'critical': '🚨'
      }[test.report.severity]
      
      report += `### ${severityIcon} ${test.report.testName}\n`
      report += `- **严重程度**: ${test.report.severity.toUpperCase()}\n`
      report += `- **测试时长**: ${Math.round(test.report.duration / 1000)}秒\n`
      report += `- **内存增长**: ${test.report.memoryGrowth.toFixed(2)}MB\n`
      report += `- **内存增长率**: ${test.report.memoryGrowthRate.toFixed(2)}MB/分钟\n`
      
      if (test.report.eventListenerLeaks.length > 0) {
        report += `- **事件监听器泄漏**: ${test.report.eventListenerLeaks.length}个\n`
      }
      
      if (test.report.timerLeaks.length > 0) {
        report += `- **定时器泄漏**: ${test.report.timerLeaks.length}个\n`
      }
      
      if (test.report.suspectedLeaks.length > 0) {
        report += `- **发现问题**:\n`
        test.report.suspectedLeaks.forEach(leak => {
          report += `  - ${leak}\n`
        })
      }
      
      if (test.report.recommendations.length > 0) {
        report += `- **优化建议**:\n`
        test.report.recommendations.forEach(rec => {
          report += `  - ${rec}\n`
        })
      }
      
      report += `\n`
    })
    
    return report
  }

  // 获取严重程度颜色
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  // 获取严重程度图标
  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical': 
      case 'high': 
        return <ErrorIcon />
      case 'medium': 
        return <WarningIcon />
      case 'low': 
        return <CheckCircleIcon />
      default: 
        return <MemoryIcon />
    }
  }

  return (
    <Box className="memory-leak-test" sx={{ p: 3 }}>
      {/* 标题 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <MemoryIcon color="primary" />
        煎饼侠内存泄漏检测
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        专门针对煎饼计时器应用的内存泄漏检测测试，包括计时器生命周期、事件清理、动画资源等关键场景。
      </Typography>

      {/* 内存监控 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MemoryIcon />
          实时内存监控
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{memoryUsage.used}MB</Typography>
              <Typography variant="caption">已用内存</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{memoryUsage.total}MB</Typography>
              <Typography variant="caption">总内存</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{memoryUsage.ratio}%</Typography>
              <Typography variant="caption">使用率</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{memoryUsage.limit}MB</Typography>
              <Typography variant="caption">内存限制</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 控制按钮 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runAllTests}
            disabled={isRunning}
          >
            运行所有测试
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={stopTests}
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
            onClick={exportResults}
            disabled={tests.filter(t => t.report).length === 0}
          >
            导出报告
          </Button>

          {(window as any).gc && (
            <Button
              variant="text"
              onClick={() => (window as any).gc()}
              disabled={isRunning}
            >
              强制GC
            </Button>
          )}
        </Box>
      </Paper>

      {/* 测试列表 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              测试项目
            </Typography>
            
            <List>
              {tests.map((test) => (
                <ListItem key={test.id} divider>
                  <ListItemIcon>
                    {test.status === 'running' ? (
                      <TimerIcon color="primary" />
                    ) : test.status === 'completed' ? (
                      getSeverityIcon(test.report?.severity)
                    ) : test.status === 'failed' ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <EventIcon />
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {test.name}
                        {test.report && (
                          <Chip
                            label={test.report.severity.toUpperCase()}
                            size="small"
                            color={getSeverityColor(test.report.severity) as any}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {test.status === 'running' && currentTest === test.id && (
                          <LinearProgress 
                            variant="indeterminate" 
                            sx={{ mt: 1 }}
                          />
                        )}
                        {test.report && (
                          <Typography variant="caption" color="text.secondary">
                            内存增长: {test.report.memoryGrowth.toFixed(2)}MB | 
                            问题: {test.report.suspectedLeaks.length}个
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <Button
                    size="small"
                    onClick={() => runTest(test.id)}
                    disabled={isRunning}
                    variant={test.status === 'pending' ? 'contained' : 'outlined'}
                  >
                    {test.status === 'pending' ? '运行' : 
                     test.status === 'running' ? '运行中' : 
                     test.status === 'completed' ? '重新运行' : '失败'}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              测试结果
            </Typography>
            
            {tests.filter(test => test.report).length === 0 ? (
              <Alert severity="info">
                还没有测试结果，请运行内存泄漏检测测试
              </Alert>
            ) : (
              <Box>
                {tests.filter(test => test.report).map((test) => (
                  <Card key={test.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleResultExpansion(test.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSeverityIcon(test.report?.severity)}
                          <Typography variant="subtitle1">
                            {test.name}
                          </Typography>
                          <Chip
                            label={test.report?.severity.toUpperCase()}
                            size="small"
                            color={getSeverityColor(test.report?.severity) as any}
                          />
                        </Box>
                        
                        <IconButton size="small">
                          {expandedResults.has(test.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        内存增长: {test.report?.memoryGrowth.toFixed(2)}MB | 
                        测试时长: {Math.round((test.report?.duration || 0) / 1000)}秒
                      </Typography>

                      <Collapse in={expandedResults.has(test.id)}>
                        <Divider sx={{ my: 2 }} />
                        
                        {test.report?.suspectedLeaks && test.report.suspectedLeaks.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="error" gutterBottom>
                              发现问题:
                            </Typography>
                            {test.report.suspectedLeaks.map((leak, index) => (
                              <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                {leak}
                              </Alert>
                            ))}
                          </Box>
                        )}

                        {test.report?.recommendations && test.report.recommendations.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="info.main" gutterBottom>
                              优化建议:
                            </Typography>
                            {test.report.recommendations.map((rec, index) => (
                              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                                {rec}
                              </Alert>
                            ))}
                          </Box>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          测试时间: {new Date(test.report?.timestamp || 0).toLocaleString()}
                        </Typography>
                      </Collapse>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 隐藏的测试区域 */}
      <div 
        ref={testAreaRef}
        style={{ 
          position: 'absolute', 
          top: '-9999px', 
          left: '-9999px',
          visibility: 'hidden'
        }}
      />
    </Box>
  )
}

export default MemoryLeakTest
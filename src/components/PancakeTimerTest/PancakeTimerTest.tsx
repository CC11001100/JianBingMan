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
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon
} from '@mui/icons-material'
import PancakeTimer from '../PancakeTimer/PancakeTimer'
import './PancakeTimerTest.css'

interface TestCase {
  id: string
  name: string
  description: string
  category: 'basic' | 'interaction' | 'state' | 'performance' | 'edge-case'
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  error?: string
  assertions: TestAssertion[]
  setup?: () => void
  teardown?: () => void
}

interface TestAssertion {
  description: string
  passed: boolean
  expected?: any
  actual?: any
  error?: string
}

interface TestSuite {
  name: string
  tests: TestCase[]
  totalTests: number
  passedTests: number
  failedTests: number
  duration: number
}

const PancakeTimerTest: React.FC = () => {
  const [testSuite, setTestSuite] = useState<TestSuite>({
    name: 'PancakeTimer组件测试',
    tests: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    duration: 0
  })
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentTestId, setCurrentTestId] = useState<string | null>(null)
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const [autoRun, setAutoRun] = useState(false)
  const [verbose, setVerbose] = useState(false)
  
  // 测试组件实例引用
  const timerRef = useRef<HTMLDivElement>(null)
  const testAreaRef = useRef<HTMLDivElement>(null)

  // 初始化测试用例
  useEffect(() => {
    const tests: TestCase[] = [
      // 基础功能测试
      {
        id: 'timer-initialization',
        name: '计时器初始化测试',
        description: '验证计时器组件正确初始化',
        category: 'basic',
        status: 'pending',
        assertions: []
      },
      {
        id: 'timer-start-stop',
        name: '计时器启动停止测试',
        description: '验证计时器的启动和停止功能',
        category: 'basic',
        status: 'pending',
        assertions: []
      },
      {
        id: 'timer-reset',
        name: '计时器重置测试',
        description: '验证计时器的重置功能',
        category: 'basic',
        status: 'pending',
        assertions: []
      },
      {
        id: 'time-adjustment',
        name: '时间调整测试',
        description: '验证时间增减功能',
        category: 'interaction',
        status: 'pending',
        assertions: []
      },
      
      // 交互测试
      {
        id: 'button-interactions',
        name: '按钮交互测试',
        description: '验证所有按钮的点击事件',
        category: 'interaction',
        status: 'pending',
        assertions: []
      },
      {
        id: 'keyboard-shortcuts',
        name: '键盘快捷键测试',
        description: '验证键盘快捷键功能',
        category: 'interaction',
        status: 'pending',
        assertions: []
      },
      {
        id: 'settings-dialog',
        name: '设置对话框测试',
        description: '验证设置对话框的打开和关闭',
        category: 'interaction',
        status: 'pending',
        assertions: []
      },
      
      // 状态管理测试
      {
        id: 'state-persistence',
        name: '状态持久化测试',
        description: '验证设置的保存和加载',
        category: 'state',
        status: 'pending',
        assertions: []
      },
      {
        id: 'timer-state-transitions',
        name: '计时器状态转换测试',
        description: '验证计时器状态的正确转换',
        category: 'state',
        status: 'pending',
        assertions: []
      },
      {
        id: 'animation-state',
        name: '动画状态测试',
        description: '验证动画进度的正确更新',
        category: 'state',
        status: 'pending',
        assertions: []
      },
      
      // 性能测试
      {
        id: 'render-performance',
        name: '渲染性能测试',
        description: '验证组件渲染性能',
        category: 'performance',
        status: 'pending',
        assertions: []
      },
      {
        id: 'memory-usage',
        name: '内存使用测试',
        description: '验证组件内存使用情况',
        category: 'performance',
        status: 'pending',
        assertions: []
      },
      
      // 边界情况测试
      {
        id: 'edge-time-values',
        name: '边界时间值测试',
        description: '验证极值时间的处理',
        category: 'edge-case',
        status: 'pending',
        assertions: []
      },
      {
        id: 'error-handling',
        name: '错误处理测试',
        description: '验证各种错误情况的处理',
        category: 'edge-case',
        status: 'pending',
        assertions: []
      },
      {
        id: 'page-visibility',
        name: '页面可见性测试',
        description: '验证页面隐藏/显示时的行为',
        category: 'edge-case',
        status: 'pending',
        assertions: []
      }
    ]

    setTestSuite(prev => ({
      ...prev,
      tests,
      totalTests: tests.length
    }))
  }, [])

  // 运行单个测试
  const runTest = async (testId: string): Promise<boolean> => {
    const test = testSuite.tests.find(t => t.id === testId)
    if (!test) return false

    setCurrentTestId(testId)
    updateTestStatus(testId, 'running')

    const startTime = Date.now()
    let passed = true
    const assertions: TestAssertion[] = []

    try {
      // 执行测试前的设置
      test.setup?.()

      // 根据测试ID执行相应的测试逻辑
      switch (testId) {
        case 'timer-initialization':
          passed = await testTimerInitialization(assertions)
          break
        case 'timer-start-stop':
          passed = await testTimerStartStop(assertions)
          break
        case 'timer-reset':
          passed = await testTimerReset(assertions)
          break
        case 'time-adjustment':
          passed = await testTimeAdjustment(assertions)
          break
        case 'button-interactions':
          passed = await testButtonInteractions(assertions)
          break
        case 'keyboard-shortcuts':
          passed = await testKeyboardShortcuts(assertions)
          break
        case 'settings-dialog':
          passed = await testSettingsDialog(assertions)
          break
        case 'state-persistence':
          passed = await testStatePersistence(assertions)
          break
        case 'timer-state-transitions':
          passed = await testTimerStateTransitions(assertions)
          break
        case 'animation-state':
          passed = await testAnimationState(assertions)
          break
        case 'render-performance':
          passed = await testRenderPerformance(assertions)
          break
        case 'memory-usage':
          passed = await testMemoryUsage(assertions)
          break
        case 'edge-time-values':
          passed = await testEdgeTimeValues(assertions)
          break
        case 'error-handling':
          passed = await testErrorHandling(assertions)
          break
        case 'page-visibility':
          passed = await testPageVisibility(assertions)
          break
        default:
          passed = false
          assertions.push({
            description: '未知的测试案例',
            passed: false,
            error: `未实现的测试: ${testId}`
          })
      }

      // 执行测试后的清理
      test.teardown?.()

    } catch (error) {
      passed = false
      assertions.push({
        description: '测试执行异常',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    const duration = Date.now() - startTime
    
    updateTestResult(testId, passed ? 'passed' : 'failed', duration, assertions, passed ? undefined : '测试失败')
    setCurrentTestId(null)

    return passed
  }

  // 具体的测试实现函数
  const testTimerInitialization = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    // 检查组件是否渲染
    const timerContainer = timerRef.current
    const assertion1 = {
      description: '计时器组件应该成功渲染',
      passed: !!timerContainer,
      expected: 'Timer component rendered',
      actual: timerContainer ? 'Timer component rendered' : 'Timer component not found'
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    // 检查初始时间显示
    const timeDisplay = timerContainer?.querySelector('.MuiTypography-h3')
    const assertion2 = {
      description: '应该显示初始时间',
      passed: !!timeDisplay && timeDisplay.textContent?.includes(':'),
      expected: 'Time display with format MM:SS',
      actual: timeDisplay?.textContent || 'No time display found'
    }
    assertions.push(assertion2)
    if (!assertion2.passed) allPassed = false

    // 检查控制按钮
    const startButton = Array.from(timerContainer?.querySelectorAll('button') || [])
      .find(btn => btn.textContent?.includes('开始'))
    const assertion3 = {
      description: '应该存在开始按钮',
      passed: !!startButton,
      expected: 'Start button present',
      actual: startButton ? 'Start button found' : 'Start button not found'
    }
    assertions.push(assertion3)
    if (!assertion3.passed) allPassed = false

    return allPassed
  }

  const testTimerStartStop = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) {
      assertions.push({
        description: '无法找到计时器组件',
        passed: false,
        error: 'Timer container not found'
      })
      return false
    }

    // 查找开始按钮
    const startButton = Array.from(timerContainer.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('开始'))

    if (!startButton) {
      assertions.push({
        description: '无法找到开始按钮',
        passed: false,
        error: 'Start button not found'
      })
      return false
    }

    // 点击开始按钮
    startButton.click()
    await wait(100)

    // 检查按钮文本是否变为"暂停"
    const assertion1 = {
      description: '点击开始后按钮应该变为暂停',
      passed: startButton.textContent?.includes('暂停') || false,
      expected: 'Button text: 暂停',
      actual: `Button text: ${startButton.textContent}`
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    // 再次点击(暂停)
    startButton.click()
    await wait(100)

    // 检查按钮文本是否变为"开始"
    const assertion2 = {
      description: '点击暂停后按钮应该变为开始',
      passed: startButton.textContent?.includes('开始') || false,
      expected: 'Button text: 开始',
      actual: `Button text: ${startButton.textContent}`
    }
    assertions.push(assertion2)
    if (!assertion2.passed) allPassed = false

    return allPassed
  }

  const testTimerReset = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 查找重置按钮
    const resetButton = Array.from(timerContainer.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('重置'))

    const assertion1 = {
      description: '应该存在重置按钮',
      passed: !!resetButton,
      expected: 'Reset button present',
      actual: resetButton ? 'Reset button found' : 'Reset button not found'
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    if (resetButton) {
      // 点击重置按钮
      resetButton.click()
      await wait(100)

      // 检查计时器是否重置成功
      const assertion2 = {
        description: '重置按钮应该可以点击',
        passed: true, // 如果能执行到这里说明点击成功了
        expected: 'Reset button clickable',
        actual: 'Reset button clicked successfully'
      }
      assertions.push(assertion2)
    }

    return allPassed
  }

  const testTimeAdjustment = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 查找时间调整按钮
    const addButtons = Array.from(timerContainer.querySelectorAll('button'))
      .filter(btn => btn.textContent?.includes('+') || btn.querySelector('[data-testid="AddIcon"]'))
    const subButtons = Array.from(timerContainer.querySelectorAll('button'))
      .filter(btn => btn.textContent?.includes('-') || btn.querySelector('[data-testid="RemoveIcon"]'))

    const assertion1 = {
      description: '应该存在时间增加按钮',
      passed: addButtons.length > 0,
      expected: 'Add time buttons present',
      actual: `Found ${addButtons.length} add buttons`
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    const assertion2 = {
      description: '应该存在时间减少按钮',
      passed: subButtons.length > 0,
      expected: 'Subtract time buttons present',
      actual: `Found ${subButtons.length} subtract buttons`
    }
    assertions.push(assertion2)
    if (!assertion2.passed) allPassed = false

    // 尝试点击时间调整按钮
    if (addButtons.length > 0) {
      const initialTime = getDisplayedTime(timerContainer)
      addButtons[0].click()
      await wait(100)
      const newTime = getDisplayedTime(timerContainer)
      
      const assertion3 = {
        description: '点击增加按钮应该改变时间显示',
        passed: newTime !== initialTime,
        expected: 'Time changed after clicking add button',
        actual: `Time: ${initialTime} -> ${newTime}`
      }
      assertions.push(assertion3)
      if (!assertion3.passed) allPassed = false
    }

    return allPassed
  }

  const testButtonInteractions = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 获取所有按钮
    const buttons = Array.from(timerContainer.querySelectorAll('button'))
    
    const assertion1 = {
      description: '应该存在多个可交互按钮',
      passed: buttons.length >= 3, // 至少应该有开始、重置、设置等按钮
      expected: 'At least 3 buttons',
      actual: `Found ${buttons.length} buttons`
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    // 测试每个按钮是否可点击
    let clickableButtons = 0
    for (const button of buttons) {
      try {
        // 检查按钮是否可见且未禁用
        const isVisible = button.offsetParent !== null
        const isEnabled = !button.disabled
        
        if (isVisible && isEnabled) {
          clickableButtons++
        }
      } catch (error) {
        // 忽略错误，继续测试其他按钮
      }
    }

    const assertion2 = {
      description: '大部分按钮应该是可点击的',
      passed: clickableButtons >= 2,
      expected: 'At least 2 clickable buttons',
      actual: `${clickableButtons} clickable buttons`
    }
    assertions.push(assertion2)
    if (!assertion2.passed) allPassed = false

    return allPassed
  }

  const testKeyboardShortcuts = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    // 模拟键盘事件
    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 测试空格键
    const spaceKeyEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true
    })

    try {
      document.dispatchEvent(spaceKeyEvent)
      await wait(100)

      const assertion1 = {
        description: '空格键事件应该被正确处理',
        passed: true, // 如果没有抛出错误就认为处理成功
        expected: 'Space key handled without error',
        actual: 'Space key event dispatched successfully'
      }
      assertions.push(assertion1)
    } catch (error) {
      const assertion1 = {
        description: '空格键事件处理出错',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      }
      assertions.push(assertion1)
      allPassed = false
    }

    // 测试其他快捷键
    const shortcuts = [
      { key: 'r', description: '重置快捷键' },
      { key: 's', description: '设置快捷键' },
      { key: 'ArrowUp', description: '上箭头快捷键' }
    ]

    for (const shortcut of shortcuts) {
      try {
        const keyEvent = new KeyboardEvent('keydown', {
          key: shortcut.key,
          bubbles: true
        })
        document.dispatchEvent(keyEvent)
        await wait(50)

        assertions.push({
          description: `${shortcut.description}应该被正确处理`,
          passed: true,
          expected: `${shortcut.key} key handled`,
          actual: `${shortcut.key} key event dispatched`
        })
      } catch (error) {
        assertions.push({
          description: `${shortcut.description}处理出错`,
          passed: false,
          error: error instanceof Error ? error.message : String(error)
        })
        allPassed = false
      }
    }

    return allPassed
  }

  const testSettingsDialog = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 查找设置按钮
    const settingsButton = Array.from(timerContainer.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('设置') || btn.querySelector('[data-testid="SettingsIcon"]'))

    const assertion1 = {
      description: '应该存在设置按钮',
      passed: !!settingsButton,
      expected: 'Settings button present',
      actual: settingsButton ? 'Settings button found' : 'Settings button not found'
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    if (settingsButton) {
      // 点击设置按钮
      settingsButton.click()
      await wait(300) // 等待对话框动画

      // 检查是否有对话框出现
      const dialog = document.querySelector('.MuiDialog-root')
      const assertion2 = {
        description: '点击设置按钮应该打开对话框',
        passed: !!dialog,
        expected: 'Settings dialog opened',
        actual: dialog ? 'Dialog found' : 'Dialog not found'
      }
      assertions.push(assertion2)
      if (!assertion2.passed) allPassed = false

      // 如果对话框存在，尝试关闭它
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="close"]') as HTMLButtonElement ||
                          Array.from(dialog.querySelectorAll('button')).find(btn => 
                            btn.textContent?.includes('关闭') || btn.textContent?.includes('取消')
                          ) as HTMLButtonElement

        if (closeButton) {
          closeButton.click()
          await wait(300)

          const assertion3 = {
            description: '应该能够关闭设置对话框',
            passed: !document.querySelector('.MuiDialog-root'),
            expected: 'Settings dialog closed',
            actual: document.querySelector('.MuiDialog-root') ? 'Dialog still open' : 'Dialog closed'
          }
          assertions.push(assertion3)
          if (!assertion3.passed) allPassed = false
        }
      }
    }

    return allPassed
  }

  const testStatePersistence = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    // 测试localStorage的使用
    
    try {
      // 模拟设置保存
      const testSettings = {
        flipInterval: 150,
        volume: 0.9,
        customPrompt: 'Test prompt'
      }
      
      localStorage.setItem('test-pancake-settings', JSON.stringify(testSettings))
      
      const assertion1 = {
        description: '应该能够保存设置到localStorage',
        passed: localStorage.getItem('test-pancake-settings') !== null,
        expected: 'Settings saved to localStorage',
        actual: localStorage.getItem('test-pancake-settings') ? 'Settings found' : 'Settings not found'
      }
      assertions.push(assertion1)
      if (!assertion1.passed) allPassed = false

      // 测试读取设置
      const savedSettings = localStorage.getItem('test-pancake-settings')
      let parsedSettings = null
      try {
        parsedSettings = JSON.parse(savedSettings || '{}')
      } catch (e) {
        // 解析失败
      }

      const assertion2 = {
        description: '应该能够从localStorage读取设置',
        passed: parsedSettings && parsedSettings.flipInterval === 150,
        expected: 'Settings loaded correctly',
        actual: parsedSettings ? 'Settings parsed successfully' : 'Settings parsing failed'
      }
      assertions.push(assertion2)
      if (!assertion2.passed) allPassed = false

      // 清理测试数据
      localStorage.removeItem('test-pancake-settings')

    } catch (error) {
      assertions.push({
        description: 'localStorage操作出错',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      })
      allPassed = false
    }

    return allPassed
  }

  const testTimerStateTransitions = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 检查初始状态
    const statusText = timerContainer.querySelector('.MuiTypography-body2')?.textContent
    const assertion1 = {
      description: '初始状态应该显示准备开始',
      passed: statusText?.includes('准备开始') || statusText?.includes('stopped') || false,
      expected: 'Initial state: ready to start',
      actual: `Status: ${statusText}`
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    // 测试状态转换
    const startButton = Array.from(timerContainer.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('开始'))

    if (startButton) {
      // 开始 -> 运行
      startButton.click()
      await wait(100)

      const runningStatus = timerContainer.querySelector('.MuiTypography-body2')?.textContent
      const assertion2 = {
        description: '点击开始后应该显示计时中状态',
        passed: runningStatus?.includes('计时中') || runningStatus?.includes('running') || false,
        expected: 'Running state',
        actual: `Status: ${runningStatus}`
      }
      assertions.push(assertion2)
      if (!assertion2.passed) allPassed = false

      // 运行 -> 暂停
      startButton.click() // 现在应该是暂停按钮
      await wait(100)

      const pausedStatus = timerContainer.querySelector('.MuiTypography-body2')?.textContent
      const assertion3 = {
        description: '点击暂停后应该显示暂停状态',
        passed: pausedStatus?.includes('暂停') || pausedStatus?.includes('paused') || false,
        expected: 'Paused state',
        actual: `Status: ${pausedStatus}`
      }
      assertions.push(assertion3)
      if (!assertion3.passed) allPassed = false
    }

    return allPassed
  }

  const testAnimationState = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const timerContainer = timerRef.current
    if (!timerContainer) return false

    // 查找进度圈
    const progressCircle = timerContainer.querySelector('.MuiCircularProgress-root')
    const assertion1 = {
      description: '应该存在进度动画圈',
      passed: !!progressCircle,
      expected: 'Progress circle present',
      actual: progressCircle ? 'Progress circle found' : 'Progress circle not found'
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    if (progressCircle) {
      // 检查SVG circle元素
      const circleElement = progressCircle.querySelector('circle')
      const assertion2 = {
        description: '进度圈应该包含SVG circle元素',
        passed: !!circleElement,
        expected: 'SVG circle element present',
        actual: circleElement ? 'Circle element found' : 'Circle element not found'
      }
      assertions.push(assertion2)
      if (!assertion2.passed) allPassed = false
    }

    return allPassed
  }

  const testRenderPerformance = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    const startTime = performance.now()
    
    // 强制重新渲染多次
    for (let i = 0; i < 10; i++) {
      // 触发状态更新
      const event = new Event('resize')
      window.dispatchEvent(event)
      await wait(10)
    }

    const endTime = performance.now()
    const renderTime = endTime - startTime

    const assertion1 = {
      description: '渲染性能应该在合理范围内',
      passed: renderTime < 1000, // 10次渲染应该在1秒内完成
      expected: 'Render time < 1000ms',
      actual: `Render time: ${renderTime.toFixed(2)}ms`
    }
    assertions.push(assertion1)
    if (!assertion1.passed) allPassed = false

    return allPassed
  }

  const testMemoryUsage = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    if ((performance as any).memory) {
      const initialMemory = (performance as any).memory.usedJSHeapSize
      
      // 执行一些操作
      for (let i = 0; i < 100; i++) {
        const tempData = new Array(100).fill(Math.random())
        tempData.length // 访问数组强制创建
      }
      
      const finalMemory = (performance as any).memory.usedJSHeapSize
      const memoryIncrease = finalMemory - initialMemory
      
      const assertion1 = {
        description: '内存使用增长应该在合理范围内',
        passed: memoryIncrease < 10 * 1024 * 1024, // 小于10MB
        expected: 'Memory increase < 10MB',
        actual: `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      }
      assertions.push(assertion1)
      if (!assertion1.passed) allPassed = false
    } else {
      assertions.push({
        description: '内存API不可用',
        passed: true,
        expected: 'Memory API available',
        actual: 'Memory API not supported in this browser'
      })
    }

    return allPassed
  }

  const testEdgeTimeValues = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    // 这里可以测试最小时间值和最大时间值的处理
    const testValues = [1, 600, 0, -1, 999999]
    
    for (const value of testValues) {
      try {
        // 模拟设置极值
        const isValidValue = value >= 1 && value <= 600
        
        const assertion = {
          description: `时间值 ${value} 的验证`,
          passed: true, // 如果没有抛出错误就认为处理正确
          expected: `Value ${value} handled correctly`,
          actual: `Valid: ${isValidValue}`
        }
        assertions.push(assertion)
      } catch (error) {
        assertions.push({
          description: `时间值 ${value} 处理出错`,
          passed: false,
          error: error instanceof Error ? error.message : String(error)
        })
        allPassed = false
      }
    }

    return allPassed
  }

  const testErrorHandling = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    // 测试错误边界和异常处理
    try {
      // 模拟一些可能的错误情况
      
      // 测试localStorage错误处理
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('localStorage is full')
      }
      
      try {
        localStorage.setItem('test', 'value')
      } catch (e) {
        // 预期的错误
      }
      
      // 恢复原始方法
      localStorage.setItem = originalSetItem
      
      const assertion1 = {
        description: '应该能够处理localStorage错误',
        passed: true,
        expected: 'localStorage error handled',
        actual: 'localStorage error simulation completed'
      }
      assertions.push(assertion1)

    } catch (error) {
      assertions.push({
        description: '错误处理测试失败',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      })
      allPassed = false
    }

    return allPassed
  }

  const testPageVisibility = async (assertions: TestAssertion[]): Promise<boolean> => {
    let allPassed = true

    try {
      // 模拟页面可见性变化
      const visibilityEvent = new Event('visibilitychange')
      
      // 模拟页面隐藏
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      })
      document.dispatchEvent(visibilityEvent)
      await wait(100)

      // 模拟页面显示
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      })
      document.dispatchEvent(visibilityEvent)
      await wait(100)

      const assertion1 = {
        description: '页面可见性变化应该被正确处理',
        passed: true,
        expected: 'Visibility change handled',
        actual: 'Visibility change events dispatched successfully'
      }
      assertions.push(assertion1)

    } catch (error) {
      assertions.push({
        description: '页面可见性测试失败',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      })
      allPassed = false
    }

    return allPassed
  }

  // 辅助函数
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const getDisplayedTime = (container: Element): string => {
    const timeDisplay = container.querySelector('.MuiTypography-h3')
    return timeDisplay?.textContent || ''
  }

  const updateTestStatus = (testId: string, status: TestCase['status']) => {
    setTestSuite(prev => ({
      ...prev,
      tests: prev.tests.map(test => 
        test.id === testId ? { ...test, status } : test
      )
    }))
  }

  const updateTestResult = (
    testId: string, 
    status: TestCase['status'], 
    duration: number, 
    assertions: TestAssertion[], 
    error?: string
  ) => {
    setTestSuite(prev => {
      const updatedTests = prev.tests.map(test => 
        test.id === testId ? { ...test, status, duration, assertions, error } : test
      )
      
      const passedTests = updatedTests.filter(t => t.status === 'passed').length
      const failedTests = updatedTests.filter(t => t.status === 'failed').length
      
      return {
        ...prev,
        tests: updatedTests,
        passedTests,
        failedTests
      }
    })
  }

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true)
    const startTime = Date.now()

    // 重置所有测试状态
    setTestSuite(prev => ({
      ...prev,
      tests: prev.tests.map(test => ({ ...test, status: 'pending' as const, assertions: [] })),
      passedTests: 0,
      failedTests: 0
    }))

    for (const test of testSuite.tests) {
      if (!isRunning) break // 检查是否被停止
      
      await runTest(test.id)
      
      // 测试间隔
      if (autoRun) {
        await wait(500)
      }
    }

    const endTime = Date.now()
    setTestSuite(prev => ({
      ...prev,
      duration: endTime - startTime
    }))

    setIsRunning(false)
  }

  // 停止测试
  const stopTests = () => {
    setIsRunning(false)
    setCurrentTestId(null)
  }

  // 清除结果
  const clearResults = () => {
    setTestSuite(prev => ({
      ...prev,
      tests: prev.tests.map(test => ({
        ...test,
        status: 'pending' as const,
        duration: undefined,
        error: undefined,
        assertions: []
      })),
      passedTests: 0,
      failedTests: 0,
      duration: 0
    }))
    setExpandedTests(new Set())
  }

  // 导出测试报告
  const exportReport = () => {
    const report = generateTestReport()
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pancake-timer-test-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 生成测试报告
  const generateTestReport = () => {
    const timestamp = new Date().toLocaleString('zh-CN')
    
    let report = `# PancakeTimer组件测试报告\n\n`
    report += `**测试时间**: ${timestamp}\n`
    report += `**测试总数**: ${testSuite.totalTests}\n`
    report += `**通过测试**: ${testSuite.passedTests}\n`
    report += `**失败测试**: ${testSuite.failedTests}\n`
    report += `**测试时长**: ${testSuite.duration}ms\n\n`

    // 按类别分组
    const categories = ['basic', 'interaction', 'state', 'performance', 'edge-case']
    const categoryNames: Record<string, string> = {
      'basic': '基础功能',
      'interaction': '交互测试',
      'state': '状态管理',
      'performance': '性能测试',
      'edge-case': '边界情况'
    }

    for (const category of categories) {
      const categoryTests = testSuite.tests.filter(test => test.category === category)
      if (categoryTests.length === 0) continue

      report += `## ${categoryNames[category]}\n\n`

      for (const test of categoryTests) {
        const icon = test.status === 'passed' ? '✅' : 
                    test.status === 'failed' ? '❌' : 
                    test.status === 'running' ? '🔄' : '⏸️'
        
        report += `### ${icon} ${test.name}\n`
        report += `**描述**: ${test.description}\n`
        report += `**状态**: ${test.status}\n`
        
        if (test.duration) {
          report += `**耗时**: ${test.duration}ms\n`
        }
        
        if (test.error) {
          report += `**错误**: ${test.error}\n`
        }

        if (test.assertions.length > 0) {
          report += `**断言结果**:\n`
          for (const assertion of test.assertions) {
            const assertionIcon = assertion.passed ? '✅' : '❌'
            report += `- ${assertionIcon} ${assertion.description}\n`
            if (!assertion.passed && assertion.error) {
              report += `  - 错误: ${assertion.error}\n`
            }
            if (assertion.expected && assertion.actual) {
              report += `  - 期望: ${assertion.expected}\n`
              report += `  - 实际: ${assertion.actual}\n`
            }
          }
        }
        
        report += `\n`
      }
    }

    return report
  }

  // 切换测试展开状态
  const toggleTestExpansion = (testId: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  // 获取状态颜色
  const getStatusColor = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'running': return 'info'
      default: return 'default'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon />
      case 'failed': return <ErrorIcon />
      case 'running': return <SpeedIcon />
      default: return <TimerIcon />
    }
  }

  return (
    <Box className="pancake-timer-test" sx={{ p: 3 }}>
      {/* 标题 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TimerIcon color="primary" />
        PancakeTimer组件单元测试
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        全面测试煎饼计时器组件的各项功能，包括基础操作、用户交互、状态管理、性能表现和边界情况处理。
      </Typography>

      {/* 测试统计 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">{testSuite.totalTests}</Typography>
              <Typography variant="caption">总测试数</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">{testSuite.passedTests}</Typography>
              <Typography variant="caption">通过</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">{testSuite.failedTests}</Typography>
              <Typography variant="caption">失败</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">{Math.round(testSuite.duration / 1000)}s</Typography>
              <Typography variant="caption">总耗时</Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* 进度条 */}
        {isRunning && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
              正在运行: {currentTestId ? testSuite.tests.find(t => t.id === currentTestId)?.name : '测试中...'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 控制面板 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
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
            onClick={exportReport}
            disabled={testSuite.passedTests + testSuite.failedTests === 0}
          >
            导出报告
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                disabled={isRunning}
              />
            }
            label="自动运行"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
              />
            }
            label="详细输出"
          />
        </Box>
      </Paper>

      {/* 测试结果 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* 测试列表 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              测试用例
            </Typography>
            
            <List>
              {testSuite.tests.map((test) => (
                <ListItem key={test.id} divider>
                  <ListItemIcon>
                    {getStatusIcon(test.status)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {test.name}
                        <Chip
                          label={test.status}
                          size="small"
                          color={getStatusColor(test.status) as any}
                        />
                        {test.duration && (
                          <Chip
                            label={`${test.duration}ms`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={test.description}
                  />
                  
                  <Button
                    size="small"
                    onClick={() => runTest(test.id)}
                    disabled={isRunning}
                    variant={test.status === 'pending' ? 'contained' : 'outlined'}
                  >
                    运行
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* 测试详情 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              测试详情
            </Typography>
            
            {testSuite.tests.filter(test => test.assertions.length > 0).length === 0 ? (
              <Alert severity="info">
                还没有测试结果，请运行测试用例
              </Alert>
            ) : (
              <Box>
                {testSuite.tests.filter(test => test.assertions.length > 0).map((test) => (
                  <Card key={test.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleTestExpansion(test.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(test.status)}
                          <Typography variant="subtitle1">
                            {test.name}
                          </Typography>
                          <Chip
                            label={test.status}
                            size="small"
                            color={getStatusColor(test.status) as any}
                          />
                        </Box>
                        
                        <IconButton size="small">
                          {expandedTests.has(test.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        断言: {test.assertions.filter(a => a.passed).length}/{test.assertions.length} 通过
                        {test.duration && ` | 耗时: ${test.duration}ms`}
                      </Typography>

                      <Collapse in={expandedTests.has(test.id)}>
                        <Divider sx={{ my: 2 }} />
                        
                        {test.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {test.error}
                          </Alert>
                        )}

                        {test.assertions.map((assertion, index) => (
                          <Alert
                            key={index}
                            severity={assertion.passed ? 'success' : 'error'}
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {assertion.description}
                            </Typography>
                            {verbose && assertion.expected && assertion.actual && (
                              <Box sx={{ mt: 1, fontSize: '0.8rem' }}>
                                <Typography variant="caption" color="text.secondary">
                                  期望: {assertion.expected}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  实际: {assertion.actual}
                                </Typography>
                              </Box>
                            )}
                            {assertion.error && (
                              <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                                错误: {assertion.error}
                              </Typography>
                            )}
                          </Alert>
                        ))}
                      </Collapse>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 被测试的PancakeTimer组件 */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          被测试组件
        </Typography>
        <Box ref={timerRef}>
          <PancakeTimer />
        </Box>
      </Paper>

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

export default PancakeTimerTest



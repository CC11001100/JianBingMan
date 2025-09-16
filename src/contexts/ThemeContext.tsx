/**
 * 主題管理上下文
 * 提供主題切換功能和主題狀態管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Theme, createTheme } from '@mui/material/styles'

// 主題類型定義
export type ThemeMode = 'light' | 'dark' | 'auto'

// 主題上下文類型
interface ThemeContextType {
  themeMode: ThemeMode
  actualTheme: 'light' | 'dark'
  muiTheme: Theme
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

// 創建主題上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 自定義Hook來使用主題上下文
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 創建亮色主題
const createLightTheme = (): Theme => createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff6b35',
      light: '#ff8f5a',
      dark: '#e55722',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    divider: '#e0e0e0',
    action: {
      active: '#ff6b35',
      hover: 'rgba(255, 107, 53, 0.04)',
      selected: 'rgba(255, 107, 53, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'border-color 0.3s ease',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
})

// 創建暗色主題
const createDarkTheme = (): Theme => createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff8a65',
      light: '#ffbb93',
      dark: '#e65100',
      contrastText: '#000000',
    },
    secondary: {
      main: '#66bb6a',
      light: '#98ee99',
      dark: '#338a3e',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
    divider: '#424242',
    action: {
      active: '#ff8a65',
      hover: 'rgba(255, 138, 101, 0.08)',
      selected: 'rgba(255, 138, 101, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1.1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'border-color 0.3s ease',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
})

// 主題提供者組件屬性
interface ThemeProviderProps {
  children: ReactNode
}

// 檢測系統主題偏好
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// 從localStorage獲取保存的主題設置
const getSavedThemeMode = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('themeMode')
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      return saved as ThemeMode
    }
  }
  return 'auto'
}

// 主題提供者組件
export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getSavedThemeMode)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)

  // 計算實際使用的主題
  const actualTheme = themeMode === 'auto' ? systemTheme : themeMode

  // 創建Material-UI主題
  const muiTheme = actualTheme === 'dark' ? createDarkTheme() : createLightTheme()

  // 設置主題模式並保存到localStorage
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('themeMode', mode)
    
    // 更新HTML元素的data屬性，供CSS使用
    document.documentElement.setAttribute('data-theme', mode === 'auto' ? systemTheme : mode)
    
    // 更新meta主題顏色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const themeColor = (mode === 'auto' ? systemTheme : mode) === 'dark' ? '#1e1e1e' : '#ff6b35'
      metaThemeColor.setAttribute('content', themeColor)
    }
  }

  // 切換主題（在light和dark間切換，不包括auto）
  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark')
    } else if (themeMode === 'dark') {
      setThemeMode('light')
    } else {
      // 如果當前是auto模式，則切換到與系統相反的主題
      setThemeMode(systemTheme === 'light' ? 'dark' : 'light')
    }
  }

  // 監聽系統主題變化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // 設置初始主題屬性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', actualTheme)
    
    // 更新meta主題顏色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const themeColor = actualTheme === 'dark' ? '#1e1e1e' : '#ff6b35'
      metaThemeColor.setAttribute('content', themeColor)
    }
  }, [actualTheme])

  const contextValue: ThemeContextType = {
    themeMode,
    actualTheme,
    muiTheme,
    setThemeMode,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export default CustomThemeProvider



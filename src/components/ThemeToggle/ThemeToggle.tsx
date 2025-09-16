/**
 * 主題切換按鈕組件
 * 提供主題切換的UI控制
 */

import React, { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Box,
  Typography
} from '@mui/material'
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  SettingsBrightness as AutoModeIcon,
  Palette as PaletteIcon
} from '@mui/icons-material'
import { useTheme, ThemeMode } from '../../contexts/ThemeContext'
import './ThemeToggle.css'

interface ThemeToggleProps {
  /** 顯示模式：icon-only(僅圖標) | menu(菜單模式) | toggle(切換按鈕) */
  variant?: 'icon-only' | 'menu' | 'toggle'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 顯示標籤 */
  showLabel?: boolean
  /** 是否顯示當前主題指示器 */
  showIndicator?: boolean
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'menu',
  size = 'medium',
  showLabel = false,
  showIndicator = true
}) => {
  const { themeMode, actualTheme, setThemeMode, toggleTheme } = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  // 獲取當前主題的圖標
  const getCurrentThemeIcon = () => {
    switch (actualTheme) {
      case 'dark':
        return <DarkModeIcon />
      case 'light':
        return <LightModeIcon />
      default:
        return <LightModeIcon />
    }
  }


  // 獲取主題模式的標籤
  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'dark':
        return '暗色主題'
      case 'light':
        return '亮色主題'
      case 'auto':
        return '跟隨系統'
      default:
        return '亮色主題'
    }
  }

  // 獲取當前主題的描述
  const getCurrentThemeDescription = () => {
    if (themeMode === 'auto') {
      return `跟隨系統 (當前: ${actualTheme === 'dark' ? '暗色' : '亮色'})`
    }
    return getThemeModeLabel(themeMode)
  }

  // 處理菜單點擊
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  // 處理菜單關閉
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // 處理主題選擇
  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode)
    handleMenuClose()
  }

  // 圖標模式
  if (variant === 'icon-only') {
    return (
      <Tooltip title={getCurrentThemeDescription()}>
        <IconButton
          onClick={toggleTheme}
          size={size}
          className={`theme-toggle theme-toggle-${actualTheme}`}
          aria-label="切換主題"
        >
          {showIndicator ? (
            <Badge
              color="primary"
              variant="dot"
              invisible={themeMode === 'auto'}
            >
              {getCurrentThemeIcon()}
            </Badge>
          ) : (
            getCurrentThemeIcon()
          )}
        </IconButton>
      </Tooltip>
    )
  }

  // 切換按鈕模式
  if (variant === 'toggle') {
    return (
      <Box className={`theme-toggle-container theme-toggle-${actualTheme}`}>
        <Tooltip title={getCurrentThemeDescription()}>
          <IconButton
            onClick={toggleTheme}
            size={size}
            className="theme-toggle-button"
            aria-label="切換主題"
          >
            {getCurrentThemeIcon()}
          </IconButton>
        </Tooltip>
        {showLabel && (
          <Typography variant="caption" className="theme-toggle-label">
            {getThemeModeLabel(themeMode)}
          </Typography>
        )}
      </Box>
    )
  }

  // 菜單模式（默認）
  return (
    <>
      <Tooltip title="主題設置">
        <IconButton
          onClick={handleMenuClick}
          size={size}
          className={`theme-toggle theme-toggle-${actualTheme}`}
          aria-label="主題設置"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {showIndicator ? (
            <Badge
              color="secondary"
              variant="dot"
              invisible={themeMode === 'light'}
            >
              <PaletteIcon />
            </Badge>
          ) : (
            <PaletteIcon />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          className: 'theme-menu-paper'
        }}
      >
        <MenuItem
          onClick={() => handleThemeSelect('light')}
          selected={themeMode === 'light'}
          className="theme-menu-item"
        >
          <ListItemIcon>
            <LightModeIcon />
          </ListItemIcon>
          <ListItemText primary="亮色主題" />
        </MenuItem>

        <MenuItem
          onClick={() => handleThemeSelect('dark')}
          selected={themeMode === 'dark'}
          className="theme-menu-item"
        >
          <ListItemIcon>
            <DarkModeIcon />
          </ListItemIcon>
          <ListItemText primary="暗色主題" />
        </MenuItem>

        <MenuItem
          onClick={() => handleThemeSelect('auto')}
          selected={themeMode === 'auto'}
          className="theme-menu-item"
        >
          <ListItemIcon>
            <AutoModeIcon />
          </ListItemIcon>
          <ListItemText 
            primary="跟隨系統" 
            secondary={themeMode === 'auto' ? `當前: ${actualTheme === 'dark' ? '暗色' : '亮色'}` : undefined}
          />
        </MenuItem>
      </Menu>
    </>
  )
}

export default ThemeToggle



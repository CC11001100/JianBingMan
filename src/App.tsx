import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container, Box, AppBar, Toolbar, Typography } from '@mui/material'
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext'
import PancakeTimer from './components/PancakeTimer/PancakeTimer'
import ThemeToggle from './components/ThemeToggle/ThemeToggle'

// 應用主內容組件
function AppContent() {
  const { muiTheme } = useTheme()

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      
      {/* 頂部導航欄 */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px !important' }}>
          <Typography 
            variant="h6" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #ff6b35 30%, #4caf50 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            煎餅俠
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle 
              variant="menu" 
              size="medium" 
              showIndicator={true}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* 主要內容區域 */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: { xs: 1, sm: 2 },
          paddingTop: { xs: 2, sm: 3 },
        }}
      >
        <PancakeTimer />
      </Container>

      {/* 底部主題切換 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          display: { xs: 'block', sm: 'none' }
        }}
      >
        <ThemeToggle 
          variant="toggle" 
          size="small" 
          showLabel={false}
          showIndicator={true}
        />
      </Box>
    </ThemeProvider>
  )
}

function App() {
  return (
    <CustomThemeProvider>
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s ease',
      }}>
        <AppContent />
      </Box>
    </CustomThemeProvider>
  )
}

export default App

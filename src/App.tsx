import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container } from '@mui/material'
import PancakeTimer from './components/PancakeTimer/PancakeTimer'

// 创建主题，适配移动端
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35',
      light: '#ff8f5a',
      dark: '#e55722',
    },
    secondary: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
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
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container 
        maxWidth="sm" 
        sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: { xs: 1, sm: 2 },
        }}
      >
        <PancakeTimer />
      </Container>
    </ThemeProvider>
  )
}

export default App

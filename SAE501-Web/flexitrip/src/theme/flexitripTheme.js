import { createTheme } from '@mui/material/styles';

export const flexitripTheme = createTheme({
  palette: {
    primary: {
      main: '#2eb378',
      light: '#5cd499',
      dark: '#26a366',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5bbcea',
      light: '#8dd0f3',
      dark: '#3a9dd4',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#393839',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    warning: {
      main: '#F97316',
      light: '#fb923c',
      dark: '#ea580c',
    },
    error: {
      main: '#EF4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Stem Extra Light", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#393839',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#393839',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#393839',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#393839',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#393839',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#6b7280',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(46, 179, 120, 0.25)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(46, 179, 120, 0.3)',
          },
        },
        containedPrimary: {
          backgroundColor: '#2eb378',
          '&:hover': {
            backgroundColor: '#26a366',
          },
        },
        containedSecondary: {
          backgroundColor: '#5bbcea',
          '&:hover': {
            backgroundColor: '#3a9dd4',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#5bbcea',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2eb378',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

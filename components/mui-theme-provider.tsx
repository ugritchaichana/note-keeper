'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, PaletteMode } from '@mui/material';

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by waiting for client mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Dark-only app: force MUI to dark once mounted to avoid flicker
  const mode = 'dark' as PaletteMode;

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: { mode: mounted ? mode : 'dark' },
        shape: { borderRadius: 8 },
        typography: {
          fontFamily:
            'var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif',
        },
        components: {
          MuiPaper: { defaultProps: { elevation: 0 } },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', borderRadius: 8 },
            },
          },
          MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
        },
      }),
    [mode, mounted]
  );

  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

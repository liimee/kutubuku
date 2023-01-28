import { createTheme, CssBaseline, ThemeProvider, Toolbar } from "@mui/material";
import { SessionProvider } from "next-auth/react"
import TopBar from '@/utils/appbar';

import '../styles/globals.css';
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return <ThemeProvider theme={createTheme({
    palette: {
      primary: {
        main: '#935d1d'
      },
      secondary: {
        main: '#8d931d'
      }
    }
  })}>
    <CssBaseline />
    <SessionProvider>
      {router.pathname != '/books/[id]/read' &&
        <>
          <TopBar />
          <Toolbar />
        </>
      }
      <Component {...pageProps} />
    </SessionProvider>
  </ThemeProvider>
}
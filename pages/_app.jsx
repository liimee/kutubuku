import { createTheme, CssBaseline, ThemeProvider, Toolbar } from "@mui/material";
import { SessionProvider } from "next-auth/react"
import TopBar from '@/utils/appbar';

import '../styles/globals.css';
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    window.navigator.serviceWorker.controller?.postMessage({
      do: 'downloadIfNotExist',
      thing: '/pdf.worker.min.js',
      name: 'others'
    })
  }, []);

  return <ThemeProvider theme={createTheme({
    palette: {
      primary: {
        main: '#935d1d'
      },
      secondary: {
        main: '#8d931d'
      },
      background: {
        default: '#FFF8E9'
      }
    }
  })}>
    <Head>
      <meta name="application-name" content="kutubuku" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="kutubuku" />
      <meta name="description" content="Your ebook server that barely works" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    </Head>
    <CssBaseline />
    <SessionProvider>
      {router.pathname != '/books/[id]/read' ?
        <>
          <TopBar />
          <Toolbar />
        </>
        :
        <style jsx global>
          {
            `
            body {
              background-color: #fff !important;
            }

            #__next {
              overflow: hidden;
            }
            `
          }
        </style>
      }
      <Component {...pageProps} />
    </SessionProvider>
  </ThemeProvider>
}
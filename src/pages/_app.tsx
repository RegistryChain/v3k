import { lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { NextPage } from 'next'
import type { AppProps } from 'next/app'
import React, { ReactElement, ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createGlobalStyle, keyframes, ThemeProvider } from 'styled-components'

import { ThorinGlobalStyles, lightTheme as thorinLightTheme } from '@ensdomains/thorin'

import { Notifications } from '@app/components/Notifications'
import { TransactionStoreProvider } from '@app/hooks/transactions/TransactionStoreContext'
import { Basic } from '@app/layouts/Basic'
import { TransactionFlowProvider } from '@app/transaction-flow/TransactionFlowProvider'
import { setupAnalytics } from '@app/utils/analytics'
import { BreakpointProvider } from '@app/utils/BreakpointProvider'
import { QueryProviders } from '@app/utils/query/providers'
import { SyncDroppedTransaction } from '@app/utils/SyncProvider/SyncDroppedTransaction'
import { SyncProvider } from '@app/utils/SyncProvider/SyncProvider'

import i18n from '../i18n'

import '../styles.css'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material'
import Script from 'next/script'

const rainbowKitTheme: Theme = {
  ...lightTheme({
    accentColor: thorinLightTheme.colors.accent,
    borderRadius: 'medium',
  }),
  fonts: {
    body: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  },
}

const anim = keyframes`
  0% {
    opacity: 1;
  }

  0%, 99% {
    pointer-events: auto;
  }

  100% {
    opacity: 0.5;
    pointer-events: none;
  }
`

const GlobalStyle = createGlobalStyle`
html, body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}
  *,
  ::before,
  ::after {
    font-family: Satoshi,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      sans-serif;
  }

  body, .min-safe {
    min-height: 100vh;
    /* stylelint-disable-next-line value-no-vendor-prefix */
    @supports (-webkit-touch-callout: none) {
      /* stylelint-disable-next-line value-no-vendor-prefix */
      min-height: -webkit-fill-available;
    }
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    box-sizing: border-box;
    font-feature-settings: "ss01" on, "ss03" on;
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -moz-font-feature-settings: "ss01" on, "ss03" on;
  }

  .cacheable-component > div:last-of-type > div > * {
    transition: opacity 0.15s ease-in-out;
    opacity: 1;
  }

  .cacheable-component-cached > div:last-of-type > div > * {
    opacity: 0.5;
    pointer-events: none;
    animation: ${anim} 0.25s ease-in-out 0.5s backwards;

    &.transaction-loader {
      opacity: 1;
      pointer-events: auto;
      animation: none;
    }
  }
`

const breakpoints = {
  xs: '(min-width: 360px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
}

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}



const theme = {
  ...thorinLightTheme,
  colors: {
    ...thorinLightTheme.colors,
    text: '#000000',
    accent: '#6a24d6',
  }
}

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#6a24d6',
    },
  },
});

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-3Y0HCJQYDM`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          console.log('Executing google analytics...')
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-3Y0HCJQYDM', {
        page_path: window.location.pathname,
      });
    `,
        }}
      />
      <I18nextProvider i18n={i18n}>
        <QueryProviders>
          <RainbowKitProvider theme={rainbowKitTheme}>
            <TransactionStoreProvider>
              <MuiThemeProvider theme={muiTheme}>
                <ThemeProvider theme={theme}>
                  <BreakpointProvider queries={breakpoints}>
                    <GlobalStyle />
                    <SyncProvider>
                      <TransactionFlowProvider>
                        <SyncDroppedTransaction>
                          <Notifications />
                          {/* <TestnetWarning /> */}
                          <Basic>{getLayout(<Component {...pageProps} />)}</Basic>
                        </SyncDroppedTransaction>
                      </TransactionFlowProvider>
                    </SyncProvider>
                  </BreakpointProvider>
                </ThemeProvider>
              </MuiThemeProvider>
            </TransactionStoreProvider>
          </RainbowKitProvider>
        </QueryProviders>
      </I18nextProvider>
    </>)
}

export default MyApp

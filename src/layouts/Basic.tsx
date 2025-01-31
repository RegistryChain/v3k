import { createContext, useEffect, useState } from 'react'
import { useErrorBoundary, withErrorBoundary } from 'react-use-error-boundary'
import styled, { css } from 'styled-components'
import { useAccount, useSwitchChain } from 'wagmi'

import { mq } from '@ensdomains/thorin'

import ErrorScreen from '@app/components/@atoms/ErrorScreen'
import { getSupportedChainById } from '@app/constants/chains'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { IS_DEV_ENVIRONMENT } from '@app/utils/constants'

import { Navigation } from './Navigation'

const Container = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-gap: ${theme.space['4']};
    gap: ${theme.space['4']};
    flex-direction: column;
    align-items: stretch;
    @supports (-webkit-touch-callout: none) {
      // hack for iOS/iPadOS Safari
      // width should always be 100% - total padding
      width: calc(100% - calc(var(--padding-size) * 2));
      box-sizing: content-box;
    }
    ${mq.sm.min(css`
      --padding-size: ${theme.space['8']};
      gap: ${theme.space['6']};
      flex-gap: ${theme.space['6']};
    `)}
  `,
)

const ContentWrapper = styled.div(
  ({ theme }) => css`
    max-width: 85vw;
    margin: 0 auto;
    width: 100%;
    align-self: center;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
  `,
)

const BottomPlaceholder = styled.div(
  ({ theme }) => css`
    height: ${theme.space['14']};
    ${mq.sm.min(css`
      height: ${theme.space['12']};
    `)}
  `,
)

const shouldSwitchChain = ({
  isConnected,
  hasProgrammaticChainSwitching,
  isPending,
  isError,
  chainId,
}: {
  isConnected: boolean
  hasProgrammaticChainSwitching: boolean
  isPending: boolean
  isError: boolean
  chainId?: number
}) =>
  isConnected &&
  hasProgrammaticChainSwitching &&
  !isPending &&
  !isError &&
  !getSupportedChainById(chainId)

export const Basic = withErrorBoundary(({ children }: { children: React.ReactNode }) => {
  const { chainId, connector, isConnected } = useAccount()
  const hasProgrammaticChainSwitching = Boolean(connector?.switchChain)
  const { switchChain, isPending, isError } = useSwitchChain()

  const router = useRouterWithHistory()
  const [error] = useErrorBoundary()

  useEffect(() => {
    // Do not initialise with uid and email without implementing identity verification first
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      shouldSwitchChain({ isConnected, hasProgrammaticChainSwitching, isPending, isError, chainId })
    ) {
      switchChain({ chainId: 11155111 })
    }
  }, [isConnected, hasProgrammaticChainSwitching, isPending, isError, chainId, switchChain])

  useEffect(() => {
    if (
      isConnected &&
      !getSupportedChainById(chainId) &&
      router.pathname !== '/unsupportedNetwork'
    ) {
      router.push('/unsupportedNetwork')
    }
  }, [isConnected, chainId, router])

  return (
    // <LayoutContext.Provider value={{ testMode }}>

    <Container className="min-safe">
      <Navigation />
      <ContentWrapper>
        {error ? <ErrorScreen errorType="application-error" /> : children}
      </ContentWrapper>
      <BottomPlaceholder />
    </Container>
    // </LayoutContext.Provider>
  )
})

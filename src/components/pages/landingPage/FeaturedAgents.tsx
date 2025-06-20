'use client';

import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'
import { mq, Spinner, Button } from '@ensdomains/thorin'

import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import SubgraphResults from '@app/components/SubgraphQuery'
import { getEntitiesList, logFrontendError } from '@app/hooks/useExecuteWriteToResolver'
import { getPublicClient } from '@app/utils/utils'
import { ErrorModal } from '@app/components/ErrorModal'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { useWallets } from '@privy-io/react-auth'
import { Address } from 'viem'

const GradientTitle = styled.h1(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingTwo};
    text-align: left;
    width:100%;
    padding-left: 16px;
    font-weight: 800;
    color: ${theme.colors.accent};
    margin: 0;

    ${mq.sm.min(css`
      font-size: ${theme.fontSizes.headingOne};
    `)}
  `,
)

const SubtitleWrapper = styled.div(
  ({ theme }) => css`
    max-width: calc(${theme.space['72']} * 2 - ${theme.space['4']});
    line-height: 150%;
    text-align: center;
    margin-bottom: ${theme.space['3']};
  `,
)

const EmptyState = styled.div`
  text-align: center;
  margin-top: 2rem;
  color: #666;
`

const RetryButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`

const FeaturedAgents = ({ recipientAverages }: any) => {
  console.log('Render from FeaturedAgents.tsx')

  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const [subgraphResults, setSubgraphResults] = useState<any>(null)
  const publicClient = useMemo(() => getPublicClient(), [])
  const breakpoints = useBreakpoint()

  const getAgents = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const entities = await getEntitiesList({
        registrar: 'ai',
        nameSubstring: '',
        page: 0,
        sortDirection: 'desc',
        sortType: 'birthdate',
        limit: 6,
        address,
        params: { avatar: 'https', "v3k__featured": 'true' },
      })

      setAgents(
        entities.map((x: any) => ({
          ...x,
          description: x?.description?.slice(0, 50) || "" + (x?.description?.length >= 50 ? '...' : ''),
        })),
      )
    } catch (error) {
      logFrontendError({
        error,
        message: "1 - Failed to fetch featured agents in FeaturedAgents",
        functionName: 'getAgents',
        address,
        args: {},
      })
      console.error('Error fetching agents:', error)
      setErrorMessage('There was a problem loading the featured agents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      if (
        agents.find((x: any) => !x.rating && x.rating !== 0) &&
        Object.keys(recipientAverages)?.length > 0
      ) {
        setAgents((a: any) =>
          a.map((x: any) => ({
            ...x,
            rating: recipientAverages["0X" + x.nodehash?.toUpperCase()?.slice(-40)] || 0,
          })),
        )
      }
    } catch (err) {
      logFrontendError({
        error: err,
        message: "2 - Failed to map ratings in FeaturedAgents",
        functionName: 'useEffect',
        address,
        args: { address, recipientAverages },
      })
    }
  }, [agents, recipientAverages])


  useEffect(() => {
    getAgents()
  }, [subgraphResults])

  return (
    <>
      <GradientTitle>Featured Agents</GradientTitle>
      <SubtitleWrapper />

      {errorMessage && (
        <>
          <ErrorModal
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            breakpoints={breakpoints}
          />
          <RetryButtonWrapper>
            <Button onClick={getAgents} size="small">Retry</Button>
          </RetryButtonWrapper>
        </>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Spinner color="accent" size="large" />
        </div>
      ) : (
        <>
          {agents.length === 0 && !errorMessage && (
            <EmptyState>No featured agents found. Please check back later.</EmptyState>
          )}
          {agents.length > 0 && (
            <>
              <SubgraphResults
                tokenAddress={agents.map((x: any) => x.address)}
                onResults={setSubgraphResults}
              />
              <AgentGrid connectedIsAdmin={false} boxes={agents} onRate={() => null} />
            </>
          )}
        </>
      )}
    </>
  )
}

export default FeaturedAgents

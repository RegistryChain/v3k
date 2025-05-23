import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'

import { mq, Button, Spinner } from '@ensdomains/thorin'

import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import SubgraphResults from '@app/components/SubgraphQuery'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
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
    font-weight: 800;
    padding-left: 16px;
    margin: 0;
    color: ${theme.colors.accent};
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
  color: #665;
`

const RetryButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`

const TrendingAgents = ({ recipientAverages }: any) => {
  const [agents, setAgents] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const [subgraphResults, setSubgraphResults] = useState<any>(null)
  const breakpoints = useBreakpoint()
  const publicClient = useMemo(() => getPublicClient(), [])

  // Data fetch
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
        limit: 24,
        address,
        params: { avatar: 'https', 'v3k__trending': 'true' },
      })

      setAgents(
        entities.map((x: any) => ({
          ...x,
          description: x?.description?.slice(0, 50) || "" + (x.description?.length > 50 ? '...' : ''),
        })),
      )
    } catch (error: any) {
      console.error('Error fetching agents:', error)
      setErrorMessage('There was a problem loading the agent list. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (
      agents.find((x: any) => !x.rating && x.rating === 0) &&
      Object.keys(recipientAverages)?.length > 0
    ) {
      setAgents((a: any) =>
        a.map((x: any) => ({
          ...x,
          rating: recipientAverages['0X' + x.nodehash?.toUpperCase()?.slice(-40)] || 0,
        })),
      )
    }
  }, [agents, recipientAverages])

  useEffect(() => {
    getAgents()
  }, [subgraphResults])

  return (
    <>
      <GradientTitle>Trending Agents</GradientTitle>
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
            <EmptyState>No agents found. Please check back later.</EmptyState>
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

export default TrendingAgents

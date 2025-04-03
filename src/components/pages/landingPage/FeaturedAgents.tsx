// pages/FeaturedAgents.tsx
import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

import { mq } from '@ensdomains/thorin'

import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import SubgraphResults from '@app/components/SubgraphQuery'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { getContractInstance, getPublicClient, getWalletClient } from '@app/utils/utils'

import contractAddressesObj from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'

const GradientTitle = styled.h1(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingTwo};
    text-align: center;
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

const FeaturedAgents = ({ recipientAverages }: any) => {
  const [agents, setAgents] = useState<any>([])
  const { address } = useAccount()
  const [wallet, setWallet] = useState<any>(null)
  const [subgraphResults, setSubgraphResults] = useState<any>(null)
  const publicClient = useMemo(() => getPublicClient(), [])

  // Wallet initialization
  useEffect(() => {
    if (address && !wallet) {
      try {
        setWallet(getWalletClient(address))
      } catch (err) {
        console.error('Error setting wallet:', err)
      }
    }
  }, [address])


  // Data fetching
  const getAgents = async () => {
    try {
      // We only want agents with an imageURL, a name, a twitter
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
          // rating: ratings[x.address] || 0,
          description: x.description?.slice(0, 50) + (x.description?.length > 50 ? '...' : ''),
        })),
      )
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }


  useEffect(() => {
    if (agents.find((x: any) => !x.rating && x.rating !== 0) && Object.keys(recipientAverages)?.length > 0) {

      setAgents((a: any) => {
        return [...a.map((x: any) => {
          return { ...x, rating: recipientAverages["0X" + x.nodehash?.toUpperCase()?.slice(-40)] || 0 }
        })
        ]
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

      <SubgraphResults
        tokenAddress={agents.map((x: any) => x.address)}
        onResults={setSubgraphResults}
      />
      <AgentGrid connectedIsAdmin={false} boxes={agents} onRate={() => null} />
    </>
  )
}

export default FeaturedAgents

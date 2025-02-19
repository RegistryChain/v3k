// pages/LandingPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import SubgraphResults from '@app/components/SubgraphQuery'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { getContractInstance, getPublicClient, getWalletClient } from '@app/utils/utils'

import contractAddressesObj from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'

const LandingPage = () => {
  const [agents, setAgents] = useState([])
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

  // Token operations
  const sendStars = async (to: Address, amount: number) => {
    if (!wallet || !address) return

    try {
      const starTokenContract: any = getContractInstance(wallet, 'starToken')
      const bal = await starTokenContract.read.balanceOf([address])

      if (bal === 0n) {
        await mintOrimmoTokens()
      }

      const tx = await starTokenContract.write.transfer([to, amount * 10 ** 18])
      await publicClient?.waitForTransactionReceipt({ hash: tx })
    } catch (err) {
      console.log('error sending stars', err)
    }
  }

  const repTokenBalance = async (addressesToCheck: Address[], res: any) => {
    const contract = {
      address: contractAddressesObj.starToken,
      abi: l1abi,
    }

    const results = await publicClient.multicall({
      contracts: addressesToCheck.map((x) => ({
        ...contract,
        functionName: 'getSenderRatingsListForTarget',
        args: [x],
      })) as any[],
    })

    return results.reduce((acc: Record<Address, number>, x: any, idx: number) => {
      const ratingScore =
        x?.result?.[1]?.reduce((sum: number, rating: bigint) => sum + Number(rating), 0) || 0
      acc[addressesToCheck[idx]] = ratingScore / (x?.result?.[1]?.length || 1) / 1e18
      return acc
    }, {})
  }

  const mintOrimmoTokens = async () => {
    if (!address || !wallet) return

    try {
      const orimmoController: any = getContractInstance(wallet, 'orimmoController')
      const tx = await orimmoController.write.mintFromFaucet([])
      await publicClient?.waitForTransactionReceipt({ hash: tx })
    } catch (err) {
      console.log('mint error', err)
    }
  }

  // Data fetching
  const getAgents = async () => {
    try {
      const entities = await getEntitiesList({
        registrar: 'AI',
        nameSubstring: '',
        page: 0,
        sortDirection: 'desc',
        sortType: 'creationDate',
      })

      const ratings = await repTokenBalance(
        entities.map((x: any) => x.address),
        subgraphResults,
      )

      setAgents(
        entities.map((x: any) => ({
          ...x,
          rating: ratings[x.address] || 0,
          description: x.description?.slice(0, 50) + (x.description?.length > 50 ? '...' : ''),
        })),
      )
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  useEffect(() => {
    getAgents()
  }, [subgraphResults])

  return (
    <>
      <SubgraphResults
        tokenAddress={agents.map((x: any) => x.address)}
        onResults={setSubgraphResults}
      />
      <AgentGrid boxes={agents} onRate={(addr: Address, val: number) => sendStars(addr, val)} />
    </>
  )
}

export default LandingPage

import { useMemo } from 'react'
import { Address, createPublicClient, getContract, http, parseAbi, zeroAddress } from 'viem'
import { base, bsc, sepolia } from 'viem/chains'

import contractAddresses from '@app/constants/contractAddresses.json'

export const useVerificationStatus = () => {
  const basePublicClient = useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(),
      }),
    [],
  )

  const binancePublicClient = useMemo(
    () =>
      createPublicClient({
        chain: bsc,
        transport: http(),
      }),
    [],
  )

  const getVerificationStatus = async (_ownerAddress: string): Promise<string[]> => {
    const coinbaseContract = getContract({
      address: contractAddresses.BaseCoinbaseIndexer as Address,
      abi: parseAbi(['function getAttestationUid(address,bytes32) view returns (bytes32)']),
      client: basePublicClient,
    })

    const binanceContract = getContract({
      address: contractAddresses.BinanceMainnetContract as Address,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      client: binancePublicClient,
    })

    let attestationUid: any = zeroAddress
    try {
      attestationUid = await coinbaseContract.read.getAttestationUid([
        _ownerAddress as Address,
        contractAddresses.BaseCoinbaseAccountVerifiedSchema as any,
      ])
    } catch (e: any) {
      console.log('failed coinbase?' + e.message)
    }

    const isCoinbaseVerified = BigInt(attestationUid) !== 0n

    let balance: any = 0
    try {
      balance = await binanceContract.read.balanceOf([_ownerAddress as Address])
    } catch (e) {
      console.log(e)
    }
    const isBinanceVerified = balance !== 0

    const statuses: string[] = []
    if (isCoinbaseVerified) {
      statuses.push('Coinbase')
    }
    if (isBinanceVerified) {
      statuses.push('Binance')
    }

    return statuses
  }

  return { getVerificationStatus }
}

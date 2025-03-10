import { useMemo, useState } from "react"
import contractAddressesObj from '../constants/contractAddresses.json'
import { Address, createPublicClient, getContract, http } from "viem"
import { infuraUrl } from "@app/utils/query/wagmi"
import { sepolia } from 'viem/chains'

const RepTokenABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'getSenderRatingsListForTarget',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const BasicABI = [
  {
    inputs: [],
    name: 'mintFromFaucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'faucetMinted',
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const useGetRating = () => {
  const [rating, setRating] = useState<any>(0)

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const getRating = async (address: string) => {
    if (!address) return
    const rate = await repTokenBalance(address)
    setRating(rate)
  }

  const repTokenBalance = async (addressToCheck: any) => {
    const contract = getContract({
      address: contractAddressesObj.starToken as any,
      abi: RepTokenABI,
      client: publicClient,
    })

    const result: any = await contract.read.getSenderRatingsListForTarget([addressToCheck])
    let ratingScore = 0
    result?.[1]?.forEach((rating: any) => (ratingScore += Number(rating)))
    ratingScore /= result?.[1]?.length
    ratingScore = ratingScore / 1000000000000000000 || 0
    return ratingScore
  }

  const mintOrimmoTokens = async (address: string, wallet: any) => {
    if (address && wallet) {
      try {
        const orimmoController: any = getContract({
          abi: BasicABI,
          address: contractAddressesObj.orimmoController as Address,
          client: wallet,
        })

        const tx = await orimmoController.write.mintFromFaucet([])
        const txReceipt = await publicClient?.waitForTransactionReceipt({
          hash: tx,
        })
      } catch (err) {
        console.log('mint err', err)
      }
    }
  }

  const sendStars = async (address: string, to: string, amount: any, wallet: any) => {
    try {
      const contract: any = getContract({
        address: contractAddressesObj.starToken as Address,
        abi: RepTokenABI,
        client: wallet,
      })

      const bal = await contract.read.balanceOf([address])
      console.log('user balance', address, bal)
      if (bal === 0n) {
        await mintOrimmoTokens(address, wallet)
      }

      const tx = await contract.write.transfer([to, amount * 10 ** 18])
      await publicClient?.waitForTransactionReceipt({
        hash: tx,
      })
    } catch (err) {
      console.log('error sending stars', err)
    }
    return
  }

  return { rating, getRating, sendStars }
}
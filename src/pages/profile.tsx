import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useEffect, useMemo, useState } from 'react'
import { createPublicClient, createWalletClient, custom, http, namehash } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { ErrorModal } from '@app/components/ErrorModal'
import ProfileContent from '@app/components/pages/profile/[name]/Profile'
import {
  executeWriteToResolver,
  getRecordData,
  useRecordData,
} from '@app/hooks/useExecuteWriteToResolver'
import { useInitial } from '@app/hooks/useInitial'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddresses from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'

const contractAddressesObj: any = contractAddresses

export default function Page() {
  const router = useRouterWithHistory()
  const domain = router.query.name as string
  const isSelf = router.query.connected === 'true'
  const tld = '.entity.id'
  const [records, setRecords] = useState<any>({})
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [wallet, setWallet] = useState<any>(null)
  const [owner, setOwner] = useState('')

  const breakpoints = useBreakpoint()
  const { openConnectModal } = useConnectModal()

  const initial = useInitial()

  const { address, isConnected } = useAccount()
  const publicClient: any = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const { data: fields, loading, error, refetch } = useRecordData({ domain, wallet, publicClient })

  const claimEntity = async () => {
    await openConnect()
    try {
      if (address) {
        const formationPrep: any = {
          functionName: 'transfer',
          args: [namehash(normalize(records?.domain || domain)), address],
          abi: l1abi,
          address: contractAddressesObj['DatabaseResolver'],
        }
        let registrarAddress = contractAddressesObj['ai' + tld]
        const formationCallback: any = {
          functionName: 'registerEntityWithOffchain',
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes',
                  name: 'responseBytes',
                  type: 'bytes',
                },
                {
                  internalType: 'bytes',
                  name: 'extraData',
                  type: 'bytes',
                },
              ],
              name: 'registerEntityWithOffchain',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: registrarAddress,
          args: [],
        }

        const registerChaserTx = await executeWriteToResolver(
          wallet,
          formationPrep,
          formationCallback,
        )
        const transactionRes = await publicClient?.waitForTransactionReceipt({
          hash: registerChaserTx,
        })
      }
    } catch (err: any) {
      console.log(err.message)
      if (err.message !== 'Cannot convert undefined to a BigInt') {
        setErrorMessage(err.message)
      }
    }
  }

  const openConnect = async () => {
    if (openConnectModal && !address) await openConnectModal()
  }

  useEffect(() => {
    if (fields) {
      const fieldsOverride: any = fields
      fieldsOverride.partners = fieldsOverride.partners?.filter(
        (partner: any) => partner?.wallet__address || partner?.name,
      )
      setRecords(fieldsOverride)
    }
  }, [fields])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && !wallet) {
      const newWallet = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum, {
          retryCount: 0,
        }),
        account: address,
      })
      setWallet(newWallet)
    } else {
      console.error('Ethereum object not found on window')
    }
  }, [address])

  useEffect(() => {
    openConnect()
  }, [isConnected])

  const isLoading = initial || !router.isReady

  return (
    <>
      <ErrorModal
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
      />
      <ProfileContent
        {...{
          isSelf,
          isLoading,
          domain,
          router,
          address,
          owner,
          setOwner,
          claimEntity,
          loadingRecords: loading,
          records,
          setRecords,
          getRecords: refetch,
          setErrorMessage,
          wallet,
          setWallet,
        }}
      />
    </>
  )
}

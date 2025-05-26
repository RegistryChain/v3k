import { useEffect, useMemo, useState } from 'react'
import { Address, createPublicClient, createWalletClient, custom, http, isAddress, isAddressEqual, namehash } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { ErrorModal } from '@app/components/ErrorModal'
import ProfileContent from '@app/components/pages/profile/[name]/Profile'
import {
  executeWriteToResolver,
  getResolverAddress,
  useRecordData,
} from '@app/hooks/useExecuteWriteToResolver'
import { useInitial } from '@app/hooks/useInitial'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddresses from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'
import { useConnectOrCreateWallet, useWallets } from '@privy-io/react-auth'

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
  const { connectOrCreateWallet } = useConnectOrCreateWallet();

  const initial = useInitial()

  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const publicClient: any = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const { data: fields, loading, error, refetch } = useRecordData({ entityid: domain, wallet, publicClient })

  const claimEntity = async (newOwner: any = address) => {
    await openConnect()
    try {
      const resolverAddress = await getResolverAddress(publicClient, normalize(records?.entityid || domain))
      if (address && isAddressEqual(resolverAddress, contractAddressesObj['DatabaseResolver'])) {
        const formationPrep: any = {
          functionName: 'transfer',
          args: [namehash(normalize(records?.entityid || domain)), newOwner],
          abi: l1abi,
          address: resolverAddress,
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
    if (!address) connectOrCreateWallet();
  }

  useEffect(() => {
    if (fields) {
      const fieldsOverride: any = fields
      fieldsOverride.partners = fieldsOverride.partners?.filter(
        (partner: any) => partner?.walletaddress || partner?.name || partner?.entityid,
      )
      setRecords(fieldsOverride)
    }
  }, [fields])

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

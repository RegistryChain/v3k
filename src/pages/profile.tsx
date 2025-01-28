import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'
import { namehash } from 'viem'
import { useAccount } from 'wagmi'

import Claims from '@app/components/claims/Claims'
import { ErrorModal } from '@app/components/ErrorModal'
import ProfileContent from '@app/components/pages/profile/[name]/Profile'
import { getRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { useInitial } from '@app/hooks/useInitial'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

export default function Page() {
  const router = useRouterWithHistory()
  const domain = router.query.name as string
  const isSelf = router.query.connected === 'true'
  const [isClaiming, setIsClaiming] = useState('')
  const [records, setRecords] = useState<any>({})
  const [errorMessage, setErrorMessage] = useState<string>('')
  const breakpoints = useBreakpoint()
  const { openConnectModal } = useConnectModal()

  const initial = useInitial()

  const { address, isConnected } = useAccount()

  const claimEntity = async (nodeHash: any) => {
    await openConnect()
    if (address) {
      setIsClaiming(nodeHash)
    }
  }

  const openConnect = async () => {
    if (openConnectModal && !address) await openConnectModal()
  }

  const getRecords = async () => {
    const fields = await getRecordData({ domain })
    fields.partners = fields.partners.filter(
      (partner: any) => partner?.wallet__address?.setValue || partner?.name?.setValue,
    )
    setRecords(fields)
  }

  useEffect(() => {
    openConnect()
  }, [isConnected])

  const isLoading = initial || !router.isReady

  let claimModal = null
  if (isClaiming) {
    claimModal = (
      <Claims
        domain={domain}
        address={address}
        setIsClaiming={setIsClaiming}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
        records={records}
        setRecords={setRecords}
        getRecords={getRecords}
      />
    )
  }

  return (
    <>
      {claimModal}
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
          claimEntity,
          isClaiming,
          records,
          setRecords,
          getRecords,
        }}
      />
    </>
  )
}

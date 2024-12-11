import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useEffect } from 'react'
import type { Hex } from 'viem'
import { useAccount } from 'wagmi'

import ProfileContent from '@app/components/pages/profile/[name]/Profile'
import { useDotBoxAvailabilityOffchain } from '@app/hooks/dotbox/useDotBoxAvailabilityOffchain'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useInitial } from '@app/hooks/useInitial'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'

export default function Page() {
  const router = useRouterWithHistory()
  const name = router.query.name as string
  const isSelf = router.query.connected === 'true'
  const { openConnectModal } = useConnectModal()

  const initial = useInitial()

  const { address, isConnected } = useAccount()

  const openConnect = async () => {
    if (openConnectModal && !address) await openConnectModal()
  }

  useEffect(() => {
    openConnect()
  }, [isConnected])

  const isLoading = initial || !router.isReady

  return (
    <ProfileContent
      {...{
        isSelf,
        isLoading,
        name,
        router,
        address,
      }}
    />
  )
}

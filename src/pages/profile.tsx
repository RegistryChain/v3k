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
  const _name = router.query.name as string
  const isSelf = router.query.connected === 'true'
  const isViewingExpired = router.query.expired === 'true'
  const { openConnectModal } = useConnectModal()

  const initial = useInitial()

  const { address, isConnected } = useAccount()

  const dotBoxResult = useDotBoxAvailabilityOffchain({
    name: _name,
  })

  const openConnect = async () => {
    if (openConnectModal && !address) await openConnectModal()
  }

  useEffect(() => {
    openConnect()
  }, [isConnected])

  const primary = usePrimaryName({ address: address as Hex })

  const name = isSelf && primary.data?.name ? primary.data.name : _name

  const isLoading = primary.isLoading || initial || !router.isReady || dotBoxResult.isLoading

  if (isViewingExpired) {
    router.push(`/profile/${name}`)
    return null
  }

  return (
    <ProfileContent
      {...{
        isSelf,
        isLoading,
        name,
      }}
    />
  )
}

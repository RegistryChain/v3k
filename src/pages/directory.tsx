import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'
import { SubnameListView } from '@app/components/pages/directory/SubnameListView'
import { useWallets } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { Address } from 'viem'

export default function Page() {
  const { t } = useTranslation('names')
  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address

  return (
    <SubnameListView address={address} />
  )
}
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'
import { SubnameListView } from '@app/components/pages/directory/SubnameListView'

export default function Page() {
  const { t } = useTranslation('names')
  const { address, isConnecting, isReconnecting } = useAccount()

  return (
    <SubnameListView address={address} />
  )
}
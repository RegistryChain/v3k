import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'
import { SubnameListView } from '@app/components/pages/directory/SubnameListView'
import { useWallets } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { Address } from 'viem'
import Head from 'next/head'

const Container = styled.div(
  () => css`
    flex-grow: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    max-width: 85vw;
    margin: 0 auto;
    width: 100%;
    align-self: center;
  `,
)
export default function Page() {
  const { t } = useTranslation('names')
  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address

  return (<>
    <Head>
      <title>Agent Directory</title>
    </Head>
    <Container>
      <SubnameListView address={address} />
    </Container>
  </>
  )
}
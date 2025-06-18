import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo } from 'react'
import { createPublicClient, http, zeroAddress } from 'viem'
import { sepolia } from 'viem/chains'
import { Content } from '@app/layouts/Content'
import { useWallets } from '@privy-io/react-auth'
import { useResolvedIdentifier } from '@app/hooks/useResolvedIdentifier'
import { useRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { PrimarySection } from '@app/components/pages/profile/settings/PrimarySection'
import DeveloperAgents from '@app/components/pages/profile/settings/DeveloperAgents'
import { HistoryBox } from '@app/components/HistoryBox'
import { LoadingContainer, SpinnerRow } from '@app/components/@molecules/ScrollBoxWithSpinner'
import { Heading } from '@ensdomains/thorin'
import styled from 'styled-components'
import { usePathname } from 'next/navigation'

const OtherWrapper = styled.div`
  grid-area: other;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  gap: 1rem;
`

export default function Page() {
    const { t } = useTranslation('developer')
    const { wallets } = useWallets()
    const pn = usePathname()
    const rawIdentifier = pn?.split('/')?.[2] || undefined as string | undefined
    const publicClient: any = useMemo(
        () => createPublicClient({ chain: sepolia, transport: http('/api/infura/sepolia') }),
        [],
    )

    const { primaryName, owner, loading } = useResolvedIdentifier(rawIdentifier, publicClient)
    const { data: record, loading: recordLoading } = useRecordData({ entityid: primaryName, publicClient })
    useEffect(() => {
        const EMAIL_SUBMITTED_KEY = 'v3k_user_email_submitted'
        const email = localStorage.getItem(EMAIL_SUBMITTED_KEY)
        const address = wallets?.[0]?.address
        if (email && address && !localStorage.getItem(`${EMAIL_SUBMITTED_KEY}-${address}`)) {
            localStorage.setItem(`${EMAIL_SUBMITTED_KEY}-${address}`, email)
        }
    }, [wallets])

    if (loading || recordLoading || !primaryName) {
        return (
            <LoadingContainer>
                <Heading>{t('loading', { ns: 'common' })}</Heading>
                <SpinnerRow />
            </LoadingContainer>
        )
    }

    return (
        <Content singleColumnContent title={t('title')}>
            {{
                trailing: (
                    <OtherWrapper>
                        <PrimarySection address={owner} record={record} primary={{ data: { name: primaryName } }} />
                        <DeveloperAgents address={owner} record={record} />
                        <HistoryBox record={record} />
                    </OtherWrapper>
                ),
            }}
        </Content>
    )
}

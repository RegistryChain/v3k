import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { http, useAccount } from 'wagmi'

import { DevSection } from '@app/components/pages/profile/settings/DevSection'
import { TransactionSection } from '@app/components/pages/profile/settings/TransactionSection/TransactionSection'
import { useSubgraphMeta } from '@app/hooks/ensjs/subgraph/useSubgraphMeta'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { Content } from '@app/layouts/Content'
import { IS_DEV_ENVIRONMENT } from '@app/utils/constants'
import { PrimarySection } from '@app/components/pages/profile/settings/PrimarySection'
import DeveloperAgents from '@app/components/pages/profile/settings/DeveloperAgents'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { infuraUrl } from '@app/utils/query/wagmi'
import { sepolia } from 'viem/chains'
import { createPublicClient } from 'viem'
import { useMemo } from 'react'
import { HistoryBox } from '@app/components/HistoryBox'

const OtherWrapper = styled.div(
    ({ theme }) => css`
    grid-area: other;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: ${theme.space['3']};
    flex-gap: ${theme.space['3']};
  `,
)

export default function Page() {
    const { t } = useTranslation('developer')
    const { address, isConnecting, isReconnecting } = useAccount()
    const router = useRouterWithHistory()

    const publicClient: any = useMemo(
        () =>
            createPublicClient({
                chain: sepolia,
                transport: http(infuraUrl('sepolia')),
            }),
        [],
    )

    const entity = router.query.entity as string
    const primary = usePrimaryName({ address: entity })
    const { data: record, loading, error, refetch } = useRecordData({ domain: primary.data?.name, publicClient })

    const subgraphMeta = useSubgraphMeta()

    const isLoading = !router.isReady || isConnecting || isReconnecting || subgraphMeta.isLoading

    useProtectedRoute('/', isLoading ? true : address)
    return (
        <Content singleColumnContent title={t('title')}>
            {{
                trailing: (
                    <OtherWrapper>
                        <PrimarySection address={entity} record={record} primary={primary} />
                        <DeveloperAgents address={entity} record={record} />
                        <HistoryBox record={record} />
                    </OtherWrapper>
                ),
            }}
        </Content>
    )
}

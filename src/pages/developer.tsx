import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { http, useAccount } from 'wagmi'
import { isAddress, zeroAddress } from 'viem'
import { useEffect, useMemo, useState } from 'react'
import { useSubgraphMeta } from '@app/hooks/ensjs/subgraph/useSubgraphMeta'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { Content } from '@app/layouts/Content'
import { IS_DEV_ENVIRONMENT } from '@app/utils/constants'
import { PrimarySection } from '@app/components/pages/profile/settings/PrimarySection'
import DeveloperAgents from '@app/components/pages/profile/settings/DeveloperAgents'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { handleEmail, useRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { infuraUrl } from '@app/utils/query/wagmi'
import { sepolia } from 'viem/chains'
import { createPublicClient, namehash } from 'viem'
import { HistoryBox } from '@app/components/HistoryBox'
import { checkOwner } from '@app/hooks/useCheckOwner'
import { LoadingContainer, SpinnerRow } from '@app/components/@molecules/ScrollBoxWithSpinner'
import { Heading } from '@ensdomains/thorin'
import EmailModal from '@app/components/pages/profile/EmailModal'

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
    const [owner, setOwner] = useState<any>(zeroAddress)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const EMAIL_SUBMITTED_KEY = 'v3k_user_email_submitted'

    const router = useRouterWithHistory()

    const publicClient: any = useMemo(
        () =>
            createPublicClient({
                chain: sepolia,
                transport: http(infuraUrl('sepolia')),
            }),
        [],
    )

    const entity = router.query.entity as any
    const primary = usePrimaryName({ address: owner })
    // Should be record of the primary name
    const { data: record, loading, error, refetch }: any = useRecordData({ entityid: primary?.data?.name ?? entity, publicClient })

    const getOwnerAddress = async () => {
        if (isAddress(entity)) {
            setOwner(entity)
        } else if (record) {
            const onChainOwner: any = await checkOwner(publicClient, namehash(entity))
            const recordOwner: any = record?.owner as any
            if (
                isAddress(recordOwner) &&
                recordOwner !== zeroAddress &&
                (!onChainOwner || onChainOwner === zeroAddress)
            ) {
                setOwner(recordOwner)
            } else {
                setOwner(onChainOwner)
            }
        }
    }

    useEffect(() => {
        if (primary?.data?.name && primary?.data?.name !== entity) {
            router.push("/developer/" + primary?.data?.name)
        }
    }, [primary])

    useEffect(() => {
        getOwnerAddress()
    }, [entity, record])

    const subgraphMeta = useSubgraphMeta()

    const isLoading = !router.isReady || isConnecting || isReconnecting || subgraphMeta.isLoading

    useProtectedRoute('/', isLoading ? true : address)

    useEffect(() => {
        const hasSubmittedEmail = localStorage.getItem(EMAIL_SUBMITTED_KEY)
        const hasSubmittedEmailConnectedAddress = localStorage.getItem(EMAIL_SUBMITTED_KEY + '-' + address)

        if (!hasSubmittedEmail) {
            setShowEmailModal(true)
        }

        if (hasSubmittedEmail && !hasSubmittedEmailConnectedAddress) {
            pushEmailToList(hasSubmittedEmail)
        }
    }, [address])

    const pushEmailToList = async (email: any) => {
        // Send email and connected account to DB
        localStorage.setItem(EMAIL_SUBMITTED_KEY + '-' + address, email)
        // direct/handleEmail/email=michaeltest@gmail.com&address=0x456.json
        await handleEmail({ email, address })

    }


    return (
        <>
            <EmailModal
                isOpen={showEmailModal && isAddress(address as any) && address !== zeroAddress}
                onClose={() => setShowEmailModal(false)}
                onSubmit={(email) => {
                    localStorage.setItem(EMAIL_SUBMITTED_KEY, email)

                    pushEmailToList(email)
                    setShowEmailModal(false)
                }}
            />
            <Content singleColumnContent title={t('title')}>

                {{
                    trailing: (
                        <OtherWrapper>
                            {isAddress(owner) && owner !== zeroAddress ? <>
                                <PrimarySection address={owner} record={record} primary={primary} />
                                <DeveloperAgents address={owner} record={record} />
                                <HistoryBox record={record} />
                            </> :
                                <LoadingContainer>
                                    <Heading>{t('loading', { ns: 'common' })}</Heading>
                                    <SpinnerRow />
                                </LoadingContainer>
                            }
                        </OtherWrapper>
                    ),
                }}
            </Content>
        </>
    )
}

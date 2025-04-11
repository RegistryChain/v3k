import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, Card, CrossSVG, mq, PersonPlusSVG, Skeleton, Tooltip, Typography } from '@ensdomains/thorin'

import { AvatarWithLink } from '@app/components/@molecules/AvatarWithLink/AvatarWithLink'
import { DisabledButtonWithTooltip } from '@app/components/@molecules/DisabledButtonWithTooltip'
import { useAccountSafely } from '@app/hooks/account/useAccountSafely'
import { useBasicName } from '@app/hooks/useBasicName'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { useHasGraphError } from '@app/utils/SyncProvider/SyncProvider'
import { useGetRating } from '@app/hooks/useGetRating'
import StarRating from '@app/components/StarRating'
import Coinbase from '../../../../assets/Coinbase.svg'

import { useEffect, useState } from 'react'
import { isAddress, zeroAddress } from 'viem'
import { useVerificationStatus } from '@app/hooks/useVerificationStatus'

const SkeletonFiller = styled.div(
  ({ theme }) => css`
    width: ${theme.space.full};
    border-radius: ${theme.radii['2xLarge']};
  `,
)

const NoNameContainer = styled.div(({ theme }) => [
  css`
    display: grid;
    grid:
      'title title' auto
      'description description' auto
      'button button' auto
      / 1fr 1fr;
    grid-row-gap: ${theme.space['4']};
  `,
  mq.sm.min(css`
    grid:
      'title button' auto
      'description description' auto
      / 1fr 1fr;
  `),
])

const NoNameTitle = styled(Typography)(({ theme }) => [
  css`
    grid-area: title;
  `,
  mq.sm.min(css`
    line-height: ${theme.space['10']};
  `),
])

const NoNameButton = styled(Button)(() => [
  css`
    grid-area: button;
  `,
  mq.sm.min(css`
    width: fit-content;
    justify-self: end;
  `),
])

const NoNameDisabledButtonContainer = styled.div(() => [
  css`
    grid-area: button;
  `,
  mq.sm.min(css`
    width: fit-content;
    justify-self: end;
  `),
])

const NoNameDescription = styled(Typography)(
  () => css`
    grid-area: description;
  `,
)

const PrimaryNameContainer = styled.div(({ theme }) => [
  css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.space['4']};
  `,
  mq.sm.min(css`
    flex-direction: row;
    gap: ${theme.space['6']};
  `),
])

const PrimaryNameInfo = styled.div(() => [
  css`
    display: flex;
    width: 100%;
    position: relative;
    flex-direction: column;
    align-items: center;
    flex: 1;
    overflow: hidden;
    > div {
      width: 100%;
      text-align: center;
    }
  `,
  mq.sm.min(css`
    align-items: flex-start;
    > div {
      text-align: left;
    }
  `),
])

const AvatarContainer = styled.div(({ theme }) => [
  css`
    width: ${theme.space['26']};
    height: ${theme.space['26']};
  `,
  mq.sm.min(css`
    order: -1;
  `),
])

const ActionsContainer = styled.div(({ theme }) => [
  css`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: ${theme.space['2']};
  `,
  mq.sm.min(css`
    flex-direction: column-reverse;
    width: ${theme.space['40']};
  `),
])

export const PrimarySection = ({ address, primary, record }: any) => {
  const { t } = useTranslation('developer')

  const { address: connectedAddress } = useAccountSafely()
  const { usePreparedDataInput } = useTransactionFlow()
  const showSelectPrimaryNameInput = usePreparedDataInput('SelectPrimaryName')
  const showResetPrimaryNameInput = usePreparedDataInput('ResetPrimaryName')
  const [verifications, setVerifications] = useState<any>([])
  const { getVerificationStatus } = useVerificationStatus()

  const { recipientAverages } = useGetRating(record?.nodehash || null)


  const { truncatedName, isLoading: basicLoading } = useBasicName({
    name: primary.data?.name,
    normalised: true,
  })

  const { data: hasGraphError, isLoading: hasGraphErrorLoading } = useHasGraphError()

  const isLoading = basicLoading || primary.isLoading

  const changePrimary = async () => {
    showSelectPrimaryNameInput(`changePrimary-${address}`, {
      address: address!,
    })
  }

  const resetPrimary = () => {
    if (!address) return
    showResetPrimaryNameInput(`resetPrimary-${address}`, {
      name: primary.data?.name!,
      address,
    })
  }

  const getVerifications = async () => {
    const vers = await getVerificationStatus(address)
    setVerifications(vers)
  }

  useEffect(() => {
    if (isAddress(address) && address !== zeroAddress) {
      getVerifications()
    }
  }, [address])

  return (
    <Skeleton loading={isLoading} as={SkeletonFiller as any}>
      <Card>
        {primary.data?.name ? (
          <PrimaryNameContainer data-testid="primary-name-section">
            <PrimaryNameInfo>
              <Typography fontVariant="bodyBold" color="grey">
                {t('section.primary.title')}
              </Typography>
              <Typography data-testid="primary-name-label" fontVariant="headingTwo" ellipsis>
                {truncatedName}
              </Typography>
              <Typography fontVariant="body">
                {(record?.description || "")}
              </Typography>
              <StarRating
                rating={recipientAverages["0X" + record?.nodehash?.toUpperCase()?.slice(-40)]}
                onRate={() => null}
              />
            </PrimaryNameInfo>
            <AvatarContainer>
              <AvatarWithLink name={primary.data?.name} label="primary name avatar" />
            </AvatarContainer>
            <ActionsContainer>
              {connectedAddress !== address ? (null
              ) : (
                <>
                  <Button
                    data-testid="reset-primary-name-button"
                    prefix={<CrossSVG />}
                    colorStyle="redSecondary"
                    disabled={hasGraphErrorLoading}
                    loading={hasGraphErrorLoading}
                    onClick={resetPrimary}
                  >
                    {t('action.remove', { ns: 'common' })}
                  </Button>
                  <Button
                    data-testid="change-primary-name-button"
                    prefix={<PersonPlusSVG />}
                    disabled={hasGraphErrorLoading}
                    loading={hasGraphErrorLoading}
                    onClick={changePrimary}
                  >
                    {t('action.change', { ns: 'common' })}
                  </Button>
                </>
              )}
            </ActionsContainer>
          </PrimaryNameContainer>
        ) : (
          <NoNameContainer data-testid="no-primary-name-section">
            <NoNameTitle fontVariant="headingFour">{t('section.primary.title')}</NoNameTitle>
            {hasGraphError ? (
              null
            ) : (
              <>
                <NoNameButton
                  data-testid="set-primary-name-button"
                  size="small"
                  prefix={<PersonPlusSVG />}
                  loading={hasGraphErrorLoading}
                  disabled={hasGraphErrorLoading}
                  onClick={changePrimary}
                >
                  {t('section.primary.choosePrimaryName')}
                </NoNameButton>
              </>
            )}
            <NoNameDescription>{t('section.primary.noNameDescription')}</NoNameDescription>
          </NoNameContainer>
        )}

        {
          record ? (
            <div>
              <dl>
                <div style={{ display: "flex", margin: "6px 0", gap: "8px" }}>
                  <dt>
                    <Typography weight='bold'>Address:</Typography>
                  </dt>
                  <dd style={{ height: "24px", display: "flex" }}>
                    <a href={"https://etherscan.io/address/" + record.address} >{record.address}</a>
                    {verifications.includes("Coinbase") ? <div style={{ marginLeft: "6px", marginTop: "2px" }}><Tooltip content={"Developer has Coinbase KYC attestation"}><div><Coinbase height={20} width={20} /></div></Tooltip></div> : null}
                  </dd>
                </div>
                <div style={{ display: "flex", margin: "6px 0", gap: "8px" }}>
                  <dt>
                    <Typography weight='bold'>Website:</Typography>
                  </dt>
                  <dd>
                    <a href={record.url} >{record.url}</a>
                  </dd>
                </div>
                {record.legalentity__type || record.keywords?.length > 0 ?
                  <div style={{ display: "flex", margin: "6px 0", gap: "8px" }}>
                    <dt>
                      <Typography weight='bold'>Entity Type:</Typography>
                    </dt>
                    <dd>
                      {record.legalentity__type || record.keywords}
                    </dd>
                  </div> : null}
                <div style={{ display: "flex", margin: "6px 0", gap: "8px" }}>
                  <dt>
                    <Typography weight='bold'>Location:</Typography>
                  </dt>
                  <dd>
                    {record.location}
                  </dd>
                </div>
              </dl>
            </div>) : null
        }
      </Card>

    </Skeleton>
  )
}

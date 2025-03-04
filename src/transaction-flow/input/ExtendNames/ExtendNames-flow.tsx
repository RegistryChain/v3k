import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePreviousDistinct } from 'react-use'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { parseEther } from 'viem'
import { useAccount, useBalance, useEnsAvatar } from 'wagmi'

import { Avatar, Button, CurrencyToggle, Dialog, Helper, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import { Invoice, InvoiceItem } from '@app/components/@atoms/Invoice/Invoice'
import { PlusMinusControl } from '@app/components/@atoms/PlusMinusControl/PlusMinusControl'
import { RegistrationTimeComparisonBanner } from '@app/components/@atoms/RegistrationTimeComparisonBanner/RegistrationTimeComparisonBanner'
import { StyledName } from '@app/components/@atoms/StyledName/StyledName'
import { DateSelection } from '@app/components/@molecules/DateSelection/DateSelection'
import { useEstimateGasWithStateOverride } from '@app/hooks/chain/useEstimateGasWithStateOverride'
import { useExpiry } from '@app/hooks/ensjs/public/useExpiry'
import { usePrice } from '@app/hooks/ensjs/public/usePrice'
import { createTransactionItem } from '@app/transaction-flow/transaction'
import { TransactionDialogPassthrough } from '@app/transaction-flow/types'
import { ensAvatarConfig } from '@app/utils/query/ipfsGateway'
import { ONE_DAY, ONE_YEAR, secondsToYears, yearsToSeconds } from '@app/utils/time'
import useUserConfig from '@app/utils/useUserConfig'
import { deriveYearlyFee, formatDuration } from '@app/utils/utils'

import { ShortExpiry } from '../../../components/@atoms/ExpiryComponents/ExpiryComponents'
import GasDisplay from '../../../components/@atoms/GasDisplay'

type View = 'name-list' | 'no-ownership-warning' | 'registration'

const PlusMinusWrapper = styled.div(
  () => css`
    width: 100%;
    overflow: hidden;
    display: flex;
  `,
)

const OptionBar = styled(CacheableComponent)(
  () => css`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
)

const NamesListItemContainer = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${theme.space['2']};
    height: ${theme.space['16']};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.radii.full};
    padding: ${theme.space['2']};
    padding-right: ${theme.space['5']};
  `,
)

const NamesListItemAvatarWrapper = styled.div(
  ({ theme }) => css`
    position: relative;
    width: ${theme.space['12']};
    height: ${theme.space['12']};
  `,
)

const NamesListItemContent = styled.div(
  () => css`
    flex: 1;
    position: relative;
    overflow: hidden;
  `,
)

const NamesListItemTitle = styled.div(
  ({ theme }) => css`
    font-size: ${theme.space['5.5']};
    background: 'red';
  `,
)

const NamesListItemSubtitle = styled.div(
  ({ theme }) => css`
    font-weight: ${theme.fontWeights.normal};
    font-size: ${theme.space['3.5']};
    line-height: 1.43;
    color: ${theme.colors.textTertiary};
  `,
)

const GasEstimationCacheableComponent = styled(CacheableComponent)(
  ({ theme }) => css`
    width: 100%;
    gap: ${theme.space['4']};
    display: flex;
    flex-direction: column;
  `,
)

const CenteredMessage = styled(Typography)(
  () => css`
    text-align: center;
  `,
)

const NamesListItem = ({ name }: { name: string }) => {
  const { data: avatar } = useEnsAvatar({ ...ensAvatarConfig, name })
  const { data: expiry, isLoading: isExpiryLoading } = useExpiry({ name })

  if (isExpiryLoading) return null
  return (
    <NamesListItemContainer>
      <NamesListItemAvatarWrapper>
        <Avatar src={avatar as any} label={name} />
      </NamesListItemAvatarWrapper>
      <NamesListItemContent>
        <NamesListItemTitle>
          <StyledName name={name} />
        </NamesListItemTitle>
        {expiry?.expiry && (
          <NamesListItemSubtitle>
            <ShortExpiry expiry={expiry.expiry.date} textOnly />
          </NamesListItemSubtitle>
        )}
      </NamesListItemContent>
    </NamesListItemContainer>
  )
}

const NamesListContainer = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${theme.space['2']};
  `,
)

type NamesListProps = {
  names: string[]
}

const NamesList = ({ names }: NamesListProps) => {
  return (
    <NamesListContainer data-testid="extend-names-names-list">
      {names.map((name) => (
        <NamesListItem key={name} name={name} />
      ))}
    </NamesListContainer>
  )
}

type Data = {
  names: string[]
  isSelf?: boolean
}

export type Props = {
  data: Data
} & TransactionDialogPassthrough

const minSeconds = ONE_DAY

const ExtendNames = ({ data: { names, isSelf }, dispatch, onDismiss }: Props) => {
  const { t } = useTranslation(['transactionFlow', 'common'])

  const { address } = useAccount()
  const { data: balance } = useBalance({
    address,
  })

  const flow: View[] = useMemo(
    () =>
      match([names.length, isSelf])
        .with([P.when((length) => length > 1), true], () => ['name-list', 'registration'] as View[])
        .with(
          [P.when((length) => length > 1), P._],
          () => ['no-ownership-warning', 'name-list', 'registration'] as View[],
        )
        .with([P._, true], () => ['registration'] as View[])
        .otherwise(() => ['no-ownership-warning', 'registration'] as View[]),
    [names.length, isSelf],
  )
  const [viewIdx, setViewIdx] = useState(0)
  const incrementView = () => setViewIdx(() => Math.min(flow.length - 1, viewIdx + 1))
  const decrementView = () => (viewIdx <= 0 ? onDismiss() : setViewIdx(viewIdx - 1))
  const view = flow[viewIdx]

  const [seconds, setSeconds] = useState(ONE_YEAR)

  const years = secondsToYears(seconds)

  const { userConfig, setCurrency } = useUserConfig()
  const currencyDisplay = userConfig.currency === 'fiat' ? userConfig.fiat : 'eth'

  const { data: priceData, isLoading: isPriceLoading } = usePrice({
    nameOrNames: names,
    duration: seconds,
  })

  const totalRentFee = priceData ? priceData.base + priceData.premium : 0n
  const yearlyFee = priceData?.base ? deriveYearlyFee({ duration: seconds, price: priceData }) : 0n
  const previousYearlyFee = usePreviousDistinct(yearlyFee) || 0n
  const unsafeDisplayYearlyFee = yearlyFee !== 0n ? yearlyFee : previousYearlyFee
  const isShowingPreviousYearlyFee = yearlyFee === 0n && previousYearlyFee > 0n

  const transactions = [
    createTransactionItem('extendNames', { names, duration: seconds, rentPrice: totalRentFee! }),
  ]

  const {
    data: { gasEstimate: estimatedGasLimit, gasCost: transactionFee },
    error: estimateGasLimitError,
    isLoading: isEstimateGasLoading,
    gasPrice,
  } = useEstimateGasWithStateOverride({
    transactions: [
      {
        name: 'extendNames',
        data: {
          duration: seconds,
          names,
          rentPrice: totalRentFee!,
        },
        stateOverride: [
          {
            address: address!,
            // the value will only be used if totalRentFee is defined, dw
            balance: totalRentFee ? totalRentFee + parseEther('10') : 0n,
          },
        ],
      },
    ],
    enabled: !!totalRentFee,
  })

  const previousTransactionFee = usePreviousDistinct(transactionFee) || 0n

  const unsafeDisplayTransactionFee =
    transactionFee !== 0n ? transactionFee : previousTransactionFee
  const isShowingPreviousTransactionFee = transactionFee === 0n && previousTransactionFee > 0n

  const items: InvoiceItem[] = [
    {
      label: t('input.extendNames.invoice.extension', {
        time: formatDuration(seconds, t),
      }),
      value: totalRentFee,
      bufferPercentage: 102n,
    },
    {
      label: t('input.extendNames.invoice.transaction'),
      value: transactionFee,
    },
  ]

  const { title, alert } = match(view)
    .with('no-ownership-warning', () => ({
      title: t('input.extendNames.ownershipWarning.title', { count: names.length }),
      alert: 'warning' as const,
    }))
    .otherwise(() => ({
      title: t('input.extendNames.title', { count: names.length }),
      alert: undefined,
    }))

  const trailingButtonProps = match(view)
    .with('name-list', () => ({
      onClick: incrementView,
      children: t('action.next', { ns: 'common' }),
    }))
    .with('no-ownership-warning', () => ({
      onClick: incrementView,
      children: t('action.understand', { ns: 'common' }),
    }))
    .otherwise(() => ({
      disabled: !!estimateGasLimitError,
      onClick: () => {
        if (!totalRentFee) return
        dispatch({ name: 'setTransactions', payload: transactions })
        dispatch({ name: 'setFlowStage', payload: 'transaction' })
      },
      children: t('action.next', { ns: 'common' }),
    }))

  const { data: expiryData } = useExpiry({ enabled: names.length > 1, name: names[0] })

  return (
    <>
      <Dialog.Heading title={title} alert={alert} />
      <Dialog.Content data-testid="extend-names-modal">
        {match(view)
          .with('name-list', () => <NamesList names={names} />)
          .with('no-ownership-warning', () => (
            <CenteredMessage>
              {t('input.extendNames.ownershipWarning.description', { count: names.length })}
            </CenteredMessage>
          ))
          .otherwise(() => (
            <>
              <PlusMinusWrapper>
                {names.length === 1 ? (
                  <DateSelection
                    {...{ seconds, setSeconds }}
                    name={names[0]}
                    minSeconds={minSeconds}
                    mode="extend"
                    expiry={Number(expiryData?.expiry.value)}
                  />
                ) : (
                  <PlusMinusControl
                    minValue={1}
                    value={years}
                    onChange={(e) => {
                      const newYears = parseInt(e.target.value)
                      if (!Number.isNaN(newYears)) setSeconds(yearsToSeconds(newYears))
                    }}
                  />
                )}
              </PlusMinusWrapper>
              <OptionBar $isCached={isPriceLoading}>
                <GasDisplay gasPrice={gasPrice} />
                <CurrencyToggle
                  size="small"
                  checked={userConfig.currency === 'fiat'}
                  onChange={(e) => setCurrency(e.target.checked ? 'fiat' : 'eth')}
                  data-testid="extend-names-currency-toggle"
                />
              </OptionBar>
              <GasEstimationCacheableComponent
                $isCached={
                  isEstimateGasLoading ||
                  isShowingPreviousTransactionFee ||
                  isShowingPreviousYearlyFee
                }
              >
                <Invoice items={items} unit={currencyDisplay} totalLabel="Estimated total" />
                {(!!estimateGasLimitError ||
                  (!!estimatedGasLimit &&
                    !!balance?.value &&
                    balance.value < estimatedGasLimit)) && (
                  <Helper type="warning">{t('input.extendNames.gasLimitError')}</Helper>
                )}
                {!!unsafeDisplayYearlyFee && !!unsafeDisplayTransactionFee && (
                  <RegistrationTimeComparisonBanner
                    yearlyFee={unsafeDisplayYearlyFee}
                    transactionFee={unsafeDisplayTransactionFee}
                    message={t('input.extendNames.bannerMsg')}
                  />
                )}
              </GasEstimationCacheableComponent>
            </>
          ))}
      </Dialog.Content>
      <Dialog.Footer
        leading={
          <Button colorStyle="accentSecondary" onClick={decrementView}>
            {t(viewIdx === 0 ? 'action.cancel' : 'action.back', { ns: 'common' })}
          </Button>
        }
        trailing={
          <Button
            {...trailingButtonProps}
            data-testid="extend-names-confirm"
            disabled={isEstimateGasLoading}
          />
        }
      />
    </>
  )
}

export default ExtendNames

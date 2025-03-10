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
import { StyledName } from '@app/components/@atoms/StyledName/StyledName'
import { DateSelection } from '@app/components/@molecules/DateSelection/DateSelection'
import { useEstimateGasWithStateOverride } from '@app/hooks/chain/useEstimateGasWithStateOverride'
import { useExpiry } from '@app/hooks/ensjs/public/useExpiry'
import { usePrice } from '@app/hooks/ensjs/public/usePrice'
import { useEthPrice } from '@app/hooks/useEthPrice'
import { createTransactionItem } from '@app/transaction-flow/transaction'
import { TransactionDialogPassthrough } from '@app/transaction-flow/types'
import { CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE } from '@app/utils/constants'
import { ensAvatarConfig } from '@app/utils/query/ipfsGateway'
import { ONE_DAY, ONE_YEAR, secondsToYears, yearsToSeconds } from '@app/utils/time'
import useUserConfig from '@app/utils/useUserConfig'

import { ShortExpiry } from '../../../components/@atoms/ExpiryComponents/ExpiryComponents'
import GasDisplay from '../../../components/@atoms/GasDisplay'
import { SearchViewLoadingView } from '../SendName/views/SearchView/views/SearchViewLoadingView'
import { validateExtendNamesDuration } from './utils/validateExtendNamesDuration'

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
    background: red;
  `,
)

const NamesListItemSubtitle = styled.div(
  ({ theme }) => css`
    font-weight: ${theme.fontWeights.normal};
    font-size: ${theme.space['3.5']};
    line-height: 1.43;
    color: ${theme.colors.grey};
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
      <NamesListItemAvatarWrapper></NamesListItemAvatarWrapper>
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
  seconds?: number
  isSelf?: boolean
}

export type Props = {
  data: Data
} & TransactionDialogPassthrough

const minSeconds = ONE_DAY

const ExtendNames = ({
  data: { seconds: defaultSeconds, names, isSelf },
  dispatch,
  onDismiss,
}: Props) => {
  return
}

export default ExtendNames

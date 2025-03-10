import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { labelhash, namehash } from 'viem'

import { GetOwnerReturnType, GetWrapperDataReturnType } from '@ensdomains/ensjs/public'
import { mq, Tag, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import { Outlink } from '@app/components/Outlink'
import RecordItem from '@app/components/RecordItem'
import { useChainName } from '@app/hooks/chain/useChainName'
import { useContractAddress } from '@app/hooks/chain/useContractAddress'
import { NameWrapperState } from '@app/hooks/fuses/useFusesStates'
import { Profile } from '@app/types'
import { checkETH2LDFromName, makeEtherscanLink } from '@app/utils/utils'

import { TabWrapper } from '../../../../TabWrapper'
import UnwrapButton from './UnwrapButton'
import WrapButton from './WrapButton'

type Props = {
  name: string
  isWrapped: boolean
  canBeWrapped: boolean
  ownerData?: GetOwnerReturnType
  wrapperData?: GetWrapperDataReturnType
  profile: Profile | undefined
}

const Container = styled(TabWrapper)(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;

    & > div {
      padding: ${theme.space['4']};
      border-bottom: 1px solid ${theme.colors.border};
    }

    & > div:last-of-type {
      border-bottom: none;
    }

    ${mq.sm.min(css`
      & > div {
        padding: ${theme.space['4']} ${theme.space['6']};
      }

      & > div:first-of-type {
        padding: ${theme.space['6']};
      }
    `)}
  `,
)

const HeaderContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    & > div:first-of-type {
      font-size: ${theme.fontSizes.headingFour};
      font-weight: ${theme.fontWeights.bold};
    }
  `,
)

const IdsContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: ${theme.space['4']};

    ${mq.sm.min(css`
      gap: ${theme.space['2']};
    `)}
  `,
)

const ItemsContainer = styled(CacheableComponent)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${theme.space['4']};

    overflow: hidden;

    ${mq.sm.min(css`
      flex-direction: row;
    `)}
  `,
)

const getFuseStateFromWrapperData = (wrapperData?: GetWrapperDataReturnType): NameWrapperState =>
  match(wrapperData)
    .with(P.nullish, () => 'unwrapped' as const)
    .with({ fuses: { child: { CANNOT_UNWRAP: true } } }, () => 'locked' as const)
    .with({ fuses: { parent: { PARENT_CANNOT_CONTROL: true } } }, () => 'emancipated' as const)
    .otherwise(() => 'wrapped')

const Token = ({ name, isWrapped, canBeWrapped, ownerData, wrapperData, profile }: Props) => {
  const { t } = useTranslation('profile')

  const networkName = useChainName()
  const nameWrapperAddress = useContractAddress({ contract: 'ensNameWrapper' })
  const registrarAddress = useContractAddress({ contract: 'ensBaseRegistrarImplementation' })

  const status: NameWrapperState = getFuseStateFromWrapperData(wrapperData)
  const is2ldEth = checkETH2LDFromName(name)

  const hex = isWrapped ? namehash(name) : labelhash(name.split('.')[0])
  const tokenId = BigInt(hex).toString(10)

  const contractAddress = isWrapped ? nameWrapperAddress : registrarAddress

  const hasToken = is2ldEth || isWrapped

  return (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">{t('tabs.metadata.token.label')}</Typography>
        {hasToken ? (
          <Outlink
            data-testid="etherscan-nft-link"
            href={makeEtherscanLink(`${contractAddress}/${tokenId}`, networkName, 'nft')}
          >
            {t('etherscan', { ns: 'common' })}
          </Outlink>
        ) : (
          <Tag colorStyle="greySecondary">{t('tabs.metadata.token.noToken')}</Tag>
        )}
      </HeaderContainer>
      {hasToken && (
        <ItemsContainer data-testid="token-ids">
          <IdsContainer>
            <RecordItem itemKey={t('tabs.metadata.token.hex')} value={hex} type="text" />
            <RecordItem itemKey={t('tabs.metadata.token.decimal')} value={tokenId} type="text" />
          </IdsContainer>
        </ItemsContainer>
      )}
      <ItemsContainer>
        <RecordItem
          itemKey={t('tabs.metadata.token.wrapper')}
          value={t(`tabs.metadata.token.status.${status}`)}
          type="text"
        />
        {isWrapped ? (
          <UnwrapButton name={name} ownerData={ownerData} status={status} />
        ) : (
          <WrapButton
            name={name}
            ownerData={ownerData}
            profile={profile}
            canBeWrapped={canBeWrapped}
          />
        )}
      </ItemsContainer>
    </Container>
  )
}

export default Token
